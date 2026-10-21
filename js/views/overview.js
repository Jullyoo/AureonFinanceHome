(function (Aureon) {
  'use strict';

  const { $, clone, slots, mount, emptyState, toggle } = Aureon.dom;
  const { store, filters: periodFilters, finance, charts, motion, config } = Aureon;
  const { brl, shortBRL, dateText, clamp } = Aureon.utils;
  const { types, limits } = config;

  const BALANCE_CAPTIONS = {
    all: 'Todo o histórico importado',
    custom: 'Resultado do dia selecionado',
    month: 'Entradas menos saídas no período',
    year: 'Entradas menos saídas no período',
  };

  function renderBars(selector, values) {
    const bars = values.map((value) => {
      const bar = document.createElement('span');
      bar.style.height = `${Math.round(value * 100)}%`;
      return bar;
    });
    mount($(selector), bars);
  }

  function renderKpis(summary, series, filters, profile) {
    motion.countTo($('#balanceValue'), summary.balance, brl);
    motion.countTo($('#incomeValue'), summary.income, brl);
    motion.countTo($('#expenseValue'), summary.expense, brl);
    motion.countTo($('#savingsValue'), Math.round(summary.savingsRate), (n) => `${Math.round(n)}%`);

    $('#savingsProgress').style.width = `${clamp(summary.savingsRate, 0, 100)}%`;
    $('#balanceCaption').textContent = BALANCE_CAPTIONS[periodFilters.effectiveMode(filters)];
    $('#savingsCaption').textContent =
      profile.metaEconomia > 0
        ? `Quanto da entrada ficou com você · meta de ${profile.metaEconomia}%`
        : 'Quanto da entrada ficou com você';

    const end = finance.activeEnd(series);
    renderBars('#incomeBars', finance.sparkline(series.income, limits.miniBars, end));
    renderBars('#expenseBars', finance.sparkline(series.expense, limits.miniBars, end));
  }

  function renderCategories(list, totalExpense) {
    const entries = finance.expensesByCategory(list);
    charts.categories('categoryChart', entries.slice(0, limits.categoryChart));
    $('#donutTotal').textContent = shortBRL(totalExpense);

    const colors = charts.palette();
    const rows = entries.slice(0, limits.categoryLegend).map(([name, value], index) => {
      const row = clone('tpl-legend-row');
      const s = slots(row);
      s.dot.style.background = colors[index];
      s.name.textContent = name;
      s.value.textContent = brl(value);
      return row;
    });
    mount($('#categoryLegend'), rows.length ? rows : [emptyState('Sem saídas neste período.')]);
  }

  function renderRecent(list) {
    const recent = [...list].sort((a, b) => b.data - a.data).slice(0, limits.recentTransactions);
    const rows = recent.map((transaction) => {
      const isIncome = transaction.tipo === types.income;
      const row = clone('tpl-recent-row');
      const s = slots(row);
      s.icon.textContent = isIncome ? '↙' : '↗';
      s.name.textContent = transaction.descricao;
      s.meta.textContent = `${transaction.categoria} · ${dateText(transaction.data)}`;
      s.value.textContent = `${isIncome ? '+' : '−'} ${brl(transaction.valor)}`;
      s.value.classList.add(isIncome ? 'in' : 'out');
      return row;
    });
    mount($('#recentTransactions'), rows.length ? rows : [emptyState('Nenhuma movimentação nesse período.')]);
  }

  function renderGoalPreview(goals) {
    const items = goals.slice(0, limits.goalPreview).map((goal) => {
      const { percent } = finance.goalProgress(goal);
      const item = clone('tpl-goal-mini');
      const s = slots(item);
      s.name.textContent = goal.nome;
      s.percent.textContent = `${percent.toFixed(0)}%`;
      s.bar.style.width = `${percent}%`;
      s.amounts.textContent = `${brl(goal.atual)} de ${brl(goal.alvo)}`;
      return item;
    });
    mount($('#goalPreview'), items.length ? items : [emptyState('Crie sua primeira meta.')]);
  }

  function renderBudgetNotice(expense, filters, profile) {
    const notice = $('#budgetNotice');
    const budget = finance.budget(expense, profile);
    const visible =
      periodFilters.effectiveMode(filters) === 'month' && (budget.level === 'warn' || budget.level === 'over');
    toggle(notice, !visible);
    if (!visible) return;

    notice.classList.toggle('notice-danger', budget.level === 'over');
    notice.classList.toggle('notice-warning', budget.level === 'warn');
    notice.textContent =
      budget.level === 'over'
        ? `Limite mensal ultrapassado em ${brl(budget.over)} (${brl(expense)} de ${brl(budget.limit)}).`
        : `Atenção: você já usou ${Math.round(budget.percent)}% do limite mensal de gastos (${brl(expense)} de ${brl(budget.limit)}).`;
  }

  function render() {
    const { transactions, goals, investments, filters, profile } = store.get();
    toggle($('#onboarding'), transactions.length + goals.length + investments.length > 0);
    const list = periodFilters.byPeriod(transactions, filters);
    const summary = finance.summarize(list);
    const series = finance.flowSeries(list, filters);

    renderKpis(summary, series, filters, profile);
    charts.flow('flowChart', series);
    renderCategories(list, summary.expense);
    renderRecent(list);
    renderGoalPreview(goals);
    renderBudgetNotice(summary.expense, filters, profile);
  }

  Aureon.views.overview = Object.freeze({ render });
})(window.Aureon);
