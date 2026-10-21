(function (Aureon) {
  'use strict';

  const { iso, compareText, fold } = Aureon.utils;

  function effectiveMode(filters) {
    if (filters.mode === 'month' && filters.month) return 'month';
    if (filters.mode === 'year' && filters.year) return 'year';
    if (filters.mode === 'custom' && filters.day) return 'custom';
    return 'all';
  }

  function inPeriod(transaction, filters) {
    if (!transaction.data) return false;
    switch (effectiveMode(filters)) {
      case 'month':
        return iso(transaction.data).startsWith(filters.month);
      case 'year':
        return String(transaction.data.getFullYear()) === filters.year;
      case 'custom':
        return iso(transaction.data) === filters.day;
      default:
        return true;
    }
  }

  const byPeriod = (transactions, filters) => transactions.filter((t) => inPeriod(t, filters));

  function bySearch(transactions, filters) {
    const term = fold(filters.search);
    return transactions.filter((t) => {
      if (filters.type !== 'all' && t.tipo !== filters.type) return false;
      if (!term) return true;
      return fold([t.descricao, t.categoria, t.conta, t.pagamento, t.instituicao, t.tipo].join(' ')).includes(term);
    });
  }

  function sorted(transactions, { key, dir }) {
    const factor = dir === 'asc' ? 1 : -1;
    const compare =
      {
        data: (a, b) => a.data - b.data,
        valor: (a, b) => a.valor - b.valor,
      }[key] || ((a, b) => compareText(a[key], b[key]));
    return [...transactions].sort((a, b) => compare(a, b) * factor);
  }

  const latestDate = (transactions) =>
    transactions.reduce((latest, t) => (t.data && (!latest || t.data > latest) ? t.data : latest), null);

  const availableYears = (transactions) =>
    [...new Set(transactions.filter((t) => t.data).map((t) => String(t.data.getFullYear())))].sort().reverse();

  function alignToData(state, { resetMode = false } = {}) {
    const last = latestDate(state.transactions) || new Date();
    state.filters.month = iso(last).slice(0, 7);
    state.filters.day = iso(last);
    state.filters.year = String(last.getFullYear());
    if (resetMode) state.filters.mode = 'month';
  }

  Aureon.filters = Object.freeze({
    effectiveMode,
    byPeriod,
    bySearch,
    sorted,
    latestDate,
    availableYears,
    alignToData,
  });
})(window.Aureon);
