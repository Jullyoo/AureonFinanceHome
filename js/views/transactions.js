(function (Aureon) {
  'use strict';

  const { $, $$, clone, slots, mount, emptyRow, readForm, fillForm, setOptions } = Aureon.dom;
  const { store, repo, filters: periodFilters, finance, modal, toast, config } = Aureon;
  const { brl, dateText, iso, compareText } = Aureon.utils;
  const { types, status } = config;

  const DEFAULT_SORT_DIR = { data: 'desc', valor: 'desc' };

  function buildRow(transaction) {
    const isIncome = transaction.tipo === types.income;
    const row = clone('tpl-tx-row');
    const s = slots(row);
    row.dataset.id = transaction.id;
    s.description.textContent = transaction.descricao;
    s.category.textContent = transaction.categoria;
    s.date.textContent = dateText(transaction.data);
    s.account.textContent = transaction.conta;
    s.payment.textContent = transaction.pagamento;
    s.status.textContent = transaction.status;
    s.status.classList.toggle('pending', /pend/i.test(transaction.status));
    s.value.textContent = `${isIncome ? '+' : '−'} ${brl(transaction.valor)}`;
    s.value.classList.add(isIncome ? 'in' : 'out');
    return row;
  }

  function renderSortHeaders(sort) {
    $$('th[data-sort]').forEach((header) => {
      const active = header.dataset.sort === sort.key;
      if (active) header.setAttribute('aria-sort', sort.dir === 'asc' ? 'ascending' : 'descending');
      else header.removeAttribute('aria-sort');
    });
  }

  function render() {
    const { transactions, filters } = store.get();
    const list = periodFilters.sorted(
      periodFilters.bySearch(periodFilters.byPeriod(transactions, filters), filters),
      filters.sort,
    );

    if ($('#transactionSearch').value !== filters.search) $('#transactionSearch').value = filters.search;
    $('#typeFilter').value = filters.type;
    renderSortHeaders(filters.sort);

    mount(
      $('#transactionsBody'),
      list.length
        ? list.map(buildRow)
        : [
            emptyRow(
              transactions.length
                ? 'Nenhuma transação encontrada.'
                : 'Nenhuma transação ainda. Importe sua planilha Excel ou use “Nova transação”.',
            ),
          ],
    );
    $('#tableFooter').textContent =
      `${list.length} movimentação(ões) · Total de entradas ${brl(finance.sumBy(list, types.income))} · Total de saídas ${brl(finance.sumBy(list, types.expense))}`;
  }

  function uniqueValues(transactions, field, extras = []) {
    return [...new Set([...extras, ...transactions.map((t) => t[field]).filter(Boolean)])].sort(compareText);
  }

  function openForm(transaction) {
    const form = $('#transactionForm');
    const { transactions } = store.get();
    const isEdit = Boolean(transaction);

    form.reset();
    setOptions($('#transactionStatus'), Object.values(status), transaction?.status || status.confirmed);
    setOptions($('#categoryOptions'), uniqueValues(transactions, 'categoria', config.defaultCategories));
    setOptions($('#accountOptions'), uniqueValues(transactions, 'conta'));
    const payments = uniqueValues(transactions, 'pagamento', config.paymentMethods);
    setOptions($('#transactionPayment'), payments, transaction?.pagamento || 'PIX');

    fillForm(form, {
      id: transaction?.id ?? '',
      descricao: transaction?.descricao ?? '',
      tipo: transaction?.tipo ?? types.expense,
      valor: transaction?.valor ?? '',
      data: iso(transaction?.data ?? new Date()),
      categoria: transaction?.categoria ?? '',
      conta: transaction?.conta ?? '',
    });

    $('#transactionModalEyebrow').textContent = isEdit ? 'EDITAR REGISTRO' : 'NOVO REGISTRO';
    $('#transactionModalTitle').textContent = isEdit ? 'Editar transação' : 'Nova transação';
    modal.open('transactionModal', { focus: '#transactionForm [name=descricao]' });
  }

  function onSubmit(event) {
    event.preventDefault();
    const values = readForm(event.target);
    const [year, month, day] = values.data.split('-').map(Number);

    const fields = {
      descricao: values.descricao.trim() || 'Sem descrição',
      tipo: values.tipo,
      valor: Math.abs(Number(values.valor)),
      data: new Date(year, month - 1, day),
      status: values.status,
      categoria: values.categoria.trim() || 'Outros',
      pagamento: values.pagamento,
      conta: values.conta.trim() || 'Não informada',
    };

    if (values.id) repo.transactions.update(values.id, fields);
    else
      repo.transactions.add({ codigo: '', subcategoria: '', instituicao: '', recorrente: 'Não', obs: '', ...fields });

    modal.close('transactionModal');
    toast(values.id ? 'Transação atualizada' : 'Transação adicionada');
  }

  async function onRowAction(event) {
    const button = event.target.closest('[data-action]');
    const row = event.target.closest('tr[data-id]');
    if (!button || !row) return;

    const transaction = repo.transactions.find(row.dataset.id);
    if (!transaction) return;

    if (button.dataset.action === 'edit') return openForm(transaction);

    const confirmed = await modal.confirm({
      title: 'Excluir transação?',
      message: `“${transaction.descricao}” (${brl(transaction.valor)}) será removida. Essa ação não pode ser desfeita.`,
    });
    if (!confirmed) return;
    repo.transactions.remove(transaction.id);
    toast('Transação excluída');
  }

  function onSort(event) {
    const header = event.target.closest('th[data-sort]');
    if (!header) return;
    const key = header.dataset.sort;
    store.update(
      (state) => {
        const current = state.filters.sort;
        state.filters.sort =
          current.key === key
            ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
            : { key, dir: DEFAULT_SORT_DIR[key] || 'asc' };
      },
      { persist: false },
    );
  }

  const setFilter = (field) => (event) =>
    store.update(
      (state) => {
        state.filters[field] = event.target.value;
      },
      { persist: false },
    );

  function init() {
    $('#transactionSearch').addEventListener('input', setFilter('search'));
    $('#typeFilter').addEventListener('change', setFilter('type'));
    $('#addTransactionBtn').addEventListener('click', () => openForm());
    $('#transactionForm').addEventListener('submit', onSubmit);
    $('#transactionsBody').addEventListener('click', onRowAction);
    $('thead').addEventListener('click', onSort);
  }

  Aureon.views.transactions = Object.freeze({ init, render });
})(window.Aureon);
