(function (Aureon) {
  'use strict';

  const { keyOf, pick, iso } = Aureon.utils;
  const { normalizers } = Aureon;

  async function read(file) {
    const buffer = await file.arrayBuffer();
    const book = XLSX.read(buffer, { type: 'array' });
    const rowsOf = (name) => XLSX.utils.sheet_to_json(book.Sheets[name], { defval: '' });
    const findSheet = (pattern) => book.SheetNames.find((name) => pattern.test(keyOf(name)));

    const transactionSheet =
      findSheet(/transa|lancamento|movimenta/) ||
      book.SheetNames.find((name) => {
        const first = rowsOf(name)[0];
        return first && pick(first, 'Data', 'Data da transação') !== '' && pick(first, 'Valor', 'Valor (R$)') !== '';
      }) ||
      book.SheetNames[0];

    const parsedTransactions = normalizers.transactions(rowsOf(transactionSheet));
    if (!parsedTransactions.items.length) {
      throw new Error(`Não encontrei transações com Data e Valor na aba “${transactionSheet}”. Confira os cabeçalhos.`);
    }

    const notes = [`${parsedTransactions.items.length} transações`];
    const warnings = [...parsedTransactions.warnings];

    function optionalSheet(pattern, label, normalize, emptyHint) {
      const sheet = findSheet(pattern);
      if (!sheet) {
        notes.push(`sem aba de ${label}`);
        return [];
      }
      const { items, warnings: sheetWarnings } = normalize(rowsOf(sheet));
      warnings.push(...sheetWarnings);
      if (items.length) notes.push(`${items.length} ${label.toLowerCase()}`);
      else warnings.push(`A aba “${sheet}” não tem linhas válidas (${emptyHint}).`);
      return items;
    }

    const goals = optionalSheet(
      /meta|objetiv|sonho/,
      'metas',
      normalizers.goals,
      'confira as colunas Meta e Valor_Alvo',
    );
    const investments = optionalSheet(
      /investimento|carteira|aplicac/,
      'investimentos',
      normalizers.investments,
      'confira as colunas Ativo e Valor_Investido',
    );

    return { transactions: parsedTransactions.items, goals, investments, notes, warnings };
  }

  function write(state) {
    const book = XLSX.utils.book_new();

    const transactions = state.transactions.map((t) => ({
      ID: t.codigo,
      Data: iso(t.data),
      Descricao: t.descricao,
      Tipo: t.tipo,
      Categoria: t.categoria,
      Subcategoria: t.subcategoria,
      Conta_Origem: t.conta,
      Meio_Pagamento: t.pagamento,
      Instituicao: t.instituicao,
      Valor: t.valor,
      Status: t.status,
      Recorrente: t.recorrente,
      Observacoes: t.obs,
    }));

    const goals = state.goals.map((g) => ({
      Meta: g.nome,
      Valor_Atual: g.atual,
      Valor_Alvo: g.alvo,
      Data_Alvo: g.prazo || '',
      Prioridade: g.prioridade,
      Observacoes: g.obs || '',
      Imagem_URL: g.imagem && !g.imagem.startsWith('data:') ? g.imagem : '',
    }));

    const investments = state.investments.map((i) => ({
      Ativo: i.ativo,
      Instituicao: i.instituicao,
      Tipo: i.tipo,
      Valor_Investido: i.valor,
      'Taxa_Anual_%_CDI': i.pct,
      'CDI_Anual_%': i.cdi,
      Data_Aplicacao: i.aplicacao || '',
      Vencimento: i.vencimento,
      Liquidez: i.liquidez,
      Observacoes: i.obs || '',
    }));

    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(transactions), 'Transacoes');
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(goals), 'Metas');
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(investments), 'Investimentos');
    XLSX.writeFile(book, 'Aureon_Home_Finance_Exportado.xlsx');

    return state.goals.filter((g) => g.imagem?.startsWith('data:')).length;
  }

  Aureon.excel = Object.freeze({ read, write });
})(window.Aureon);
