(function (Aureon) {
  'use strict';

  const { pick, moneyNum, parseDate, iso, uid } = Aureon.utils;
  const { types, defaultCdi } = Aureon.config;
  const vocabulary = Aureon.vocabulary;

  const HEADERS = {
    date: ['Data', 'Data da transação', 'Data da transacao'],
    description: ['Descricao', 'Descrição', 'Lançamento', 'Transação', 'Histórico'],
    type: [
      'Tipo',
      'Natureza',
      'Entrada/Saída',
      'Entrada ou Saída',
      'Tipo de lançamento',
      'Tipo de transação',
      'Tipo de movimentação',
      'Débito/Crédito',
      'Crédito/Débito',
    ],
    amount: ['Valor', 'Valor (R$)', 'Valor_R$', 'Montante', 'Quantia'],
    incomeColumn: ['Entrada', 'Entradas', 'Receita', 'Receitas', 'Crédito'],
    expenseColumn: ['Saída', 'Saídas', 'Despesa', 'Despesas', 'Débito'],
  };

  const SAMPLE_LIMIT = 3;
  const isBlankRow = (row) => Object.values(row).every((cell) => String(cell).trim() === '');
  const plural = (n, singular, pluralForm) => `${n} ${n === 1 ? singular : pluralForm}`;

  function transactions(rows) {
    const hasTypeColumn = rows.some((row) => pick(row, ...HEADERS.type) !== '');
    const signedAmount = (row) => moneyNum(pick(row, ...HEADERS.amount));
    const signedLayout = !hasTypeColumn && rows.some((row) => signedAmount(row) < 0);

    const unrecognized = new Map();
    let skippedWithoutDate = 0;
    let zeroValue = 0;

    const items = [];
    rows.forEach((row, index) => {
      if (isBlankRow(row)) return;

      const date = parseDate(pick(row, ...HEADERS.date));
      if (!date) {
        skippedWithoutDate += 1;
        return;
      }

      const rawType = pick(row, ...HEADERS.type);
      let amount = signedAmount(row);
      let type = vocabulary.transactionType(rawType);

      const incomeCell = moneyNum(pick(row, ...HEADERS.incomeColumn));
      const expenseCell = moneyNum(pick(row, ...HEADERS.expenseColumn));
      if (pick(row, ...HEADERS.amount) === '' && (incomeCell || expenseCell)) {
        amount = incomeCell || expenseCell;
        type = type || (incomeCell ? types.income : types.expense);
      }

      if (!type) {
        if (amount < 0) type = types.expense;
        else if (signedLayout) type = types.income;
        else {
          type = types.expense;
          const label = String(rawType).trim() || '(vazio)';
          unrecognized.set(label, (unrecognized.get(label) || 0) + 1);
        }
      }
      if (amount === 0) zeroValue += 1;

      items.push({
        id: uid(),
        codigo: pick(row, 'ID') || index + 1,
        descricao: String(pick(row, ...HEADERS.description) || 'Sem descrição').trim(),
        tipo: type,
        categoria: vocabulary.category(pick(row, 'Categoria')),
        subcategoria: String(pick(row, 'Subcategoria')),
        conta: vocabulary.account(pick(row, 'Conta_Origem', 'Conta', 'Origem', 'Conta origem')),
        pagamento: vocabulary.payment(
          pick(row, 'Meio_Pagamento', 'Meio de pagamento', 'Pagamento', 'Forma de pagamento'),
        ),
        instituicao: String(pick(row, 'Instituicao', 'Instituição', 'Banco')),
        valor: Math.abs(amount),
        status: vocabulary.transactionStatus(pick(row, 'Status')),
        data: date,
        recorrente: vocabulary.recurring(pick(row, 'Recorrente')),
        obs: String(pick(row, 'Observacoes', 'Observações')),
      });
    });

    const warnings = [];
    const unrecognizedCount = [...unrecognized.values()].reduce((sum, n) => sum + n, 0);
    if (unrecognizedCount) {
      const samples = [...unrecognized.keys()]
        .slice(0, SAMPLE_LIMIT)
        .map((label) => `“${label}”`)
        .join(', ');
      warnings.push(
        `${plural(unrecognizedCount, 'lançamento ficou', 'lançamentos ficaram')} sem tipo reconhecido (${samples}) e ` +
          `${unrecognizedCount === 1 ? 'foi tratado' : 'foram tratados'} como Saída. Use Entrada ou Saída na coluna Tipo.`,
      );
    }
    if (skippedWithoutDate) {
      warnings.push(
        `${plural(skippedWithoutDate, 'linha sem data válida foi ignorada', 'linhas sem data válida foram ignoradas')}.`,
      );
    }
    if (zeroValue) {
      warnings.push(
        `${plural(zeroValue, 'lançamento está', 'lançamentos estão')} com valor zero ou ilegível (confira a coluna Valor).`,
      );
    }
    return { items, warnings };
  }

  function goals(rows) {
    const items = rows
      .map((row) => ({
        id: uid(),
        nome: String(pick(row, 'Meta', 'Nome', 'Objetivo')).trim(),
        atual: moneyNum(pick(row, 'Valor_Atual', 'Valor Atual', 'Atual', 'Guardado')),
        alvo: moneyNum(pick(row, 'Valor_Alvo', 'Valor Alvo', 'Alvo', 'Valor da meta')),
        prazo: iso(parseDate(pick(row, 'Data_Alvo', 'Data Alvo', 'Prazo'))),
        prioridade: vocabulary.priority(pick(row, 'Prioridade')),
        imagem: String(pick(row, 'Imagem_URL', 'Imagem URL', 'Imagem', 'Foto')).trim(),
        obs: String(pick(row, 'Observacoes', 'Observações')),
      }))
      .filter((goal) => goal.nome && goal.alvo > 0);
    return { items, warnings: [] };
  }

  function investments(rows) {
    const items = rows
      .map((row) => ({
        id: uid(),
        ativo: String(pick(row, 'Ativo', 'Investimento', 'Nome')).trim(),
        instituicao: String(pick(row, 'Instituicao', 'Instituição', 'Banco')),
        tipo: String(pick(row, 'Tipo') || 'CDB'),
        valor: moneyNum(pick(row, 'Valor_Investido', 'Valor Investido', 'Valor')),
        pct: moneyNum(pick(row, 'Taxa_Anual_%_CDI', 'Taxa Anual % CDI', 'Percentual do CDI', '% do CDI')) || 100,
        cdi: moneyNum(pick(row, 'CDI_Anual_%', 'CDI Anual %', 'CDI')) || defaultCdi,
        liquidez: String(pick(row, 'Liquidez') || 'Não informada'),
        aplicacao: iso(parseDate(pick(row, 'Data_Aplicacao', 'Data Aplicacao', 'Data de aplicação'))),
        vencimento: iso(parseDate(pick(row, 'Vencimento'))),
        obs: String(pick(row, 'Observacoes', 'Observações')),
      }))
      .filter((investment) => investment.ativo && investment.valor >= 0);
    return { items, warnings: [] };
  }

  Aureon.normalizers = Object.freeze({ transactions, goals, investments });
})(window.Aureon);
