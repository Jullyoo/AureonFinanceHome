(function (Aureon) {
  'use strict';

  const { types, status, months } = Aureon.config;
  const { pad2, clamp, percentOf, fold } = Aureon.utils;
  const { filters: periodFilters } = Aureon;

  const isActive = (transaction) => !/cancel/i.test(transaction.status);
  const sumBy = (list, type) => list.filter((t) => t.tipo === type).reduce((total, t) => total + t.valor, 0);

  function summarize(list) {
    const active = list.filter(isActive);
    const income = sumBy(active, types.income);
    const expense = sumBy(active, types.expense);
    const balance = income - expense;
    return { income, expense, balance, savingsRate: percentOf(balance, income) };
  }

  function expensesByCategory(list) {
    const groups = new Map();
    list
      .filter(isActive)
      .filter((t) => t.tipo === types.expense)
      .forEach((t) => {
        const key = fold(t.categoria);
        const group = groups.get(key) || { name: t.categoria, value: 0 };
        group.value += t.valor;
        groups.set(key, group);
      });
    return [...groups.values()].sort((a, b) => b.value - a.value).map((group) => [group.name, group.value]);
  }

  function buckets(mode, filters, active) {
    if (mode === 'month') {
      const [year, month] = filters.month.split('-').map(Number);
      const days = new Date(year, month, 0).getDate();
      return { labels: Array.from({ length: days }, (_, i) => pad2(i + 1)), keyOf: (d) => pad2(d.getDate()) };
    }
    if (mode === 'year') return { labels: [...months], keyOf: (d) => months[d.getMonth()] };
    if (mode === 'custom') return { labels: ['Dia'], keyOf: () => 'Dia' };

    const monthsPresent = [
      ...new Set(active.map((t) => `${t.data.getFullYear()}-${pad2(t.data.getMonth() + 1)}`)),
    ].sort();
    return {
      labels: monthsPresent.map((key) => `${key.slice(5)}/${key.slice(2, 4)}`),
      keyOf: (d) => `${pad2(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`,
    };
  }

  function flowSeries(list, filters) {
    const active = list.filter(isActive);
    const { labels, keyOf } = buckets(periodFilters.effectiveMode(filters), filters, active);
    const index = new Map(labels.map((label, i) => [label, i]));
    const income = labels.map(() => 0);
    const expense = labels.map(() => 0);

    active.forEach((t) => {
      const i = index.get(keyOf(t.data));
      if (i === undefined) return;
      (t.tipo === types.income ? income : expense)[i] += t.valor;
    });
    return { labels, income, expense };
  }

  function budget(expense, profile) {
    const limit = Number(profile.limiteGastos) || 0;
    const percent = percentOf(expense, limit);
    const level = !limit ? 'off' : percent >= 100 ? 'over' : percent >= 80 ? 'warn' : 'ok';
    return { limit, percent, level, over: Math.max(0, expense - limit) };
  }

  function goalProgress(goal) {
    const percent = clamp(percentOf(goal.atual, goal.alvo), 0, 100);
    const remaining = Math.max(0, goal.alvo - goal.atual);
    return { percent, remaining, done: goal.alvo > 0 && remaining === 0 };
  }

  function goalTotals(goals) {
    const current = goals.reduce((total, g) => total + g.atual, 0);
    const target = goals.reduce((total, g) => total + g.alvo, 0);
    return { current, target, left: Math.max(0, target - current) };
  }

  const projectedValue = (inv, monthsAhead) =>
    inv.valor * Math.pow(1 + (inv.cdi / 100) * (inv.pct / 100), monthsAhead / 12);

  function investmentTotals(investments) {
    const total = investments.reduce((sum, i) => sum + i.valor, 0);
    const future = investments.reduce((sum, i) => sum + projectedValue(i, 12), 0);
    return { total, future, yearlyYield: future - total };
  }

  function activeEnd({ income, expense }) {
    for (let i = income.length - 1; i >= 0; i -= 1) if (income[i] || expense[i]) return i + 1;
    return income.length;
  }

  function sparkline(values, size, end = values.length) {
    const tail = values.slice(Math.max(0, end - size), end);
    const padded = [...Array(Math.max(0, size - tail.length)).fill(0), ...tail];
    const peak = Math.max(...padded, 0);
    return padded.map((v) => (peak ? Math.max(0.08, v / peak) : 0.08));
  }

  Aureon.finance = Object.freeze({
    isActive,
    sumBy,
    summarize,
    expensesByCategory,
    flowSeries,
    budget,
    goalProgress,
    goalTotals,
    projectedValue,
    investmentTotals,
    activeEnd,
    sparkline,
  });
})(window.Aureon);
