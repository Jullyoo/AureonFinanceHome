(function (Aureon) {
  'use strict';

  const { $, clone, slots, mount, emptyState, readForm, fillForm } = Aureon.dom;
  const { store, repo, finance, charts, modal, toast, config } = Aureon;
  const { brl } = Aureon.utils;

  const PROJECTION_MONTHS = 12;

  function buildHolding(investment) {
    const holding = clone('tpl-holding');
    const s = slots(holding);
    holding.dataset.id = investment.id;
    s.name.textContent = investment.ativo;
    s.meta.textContent = `${investment.instituicao} · ${investment.liquidez || investment.tipo} · ${Number(investment.pct) || 100}% do CDI`;
    s.value.textContent = brl(investment.valor);
    return holding;
  }

  function render() {
    const { investments } = store.get();
    const totals = finance.investmentTotals(investments);

    $('#investedTotal').textContent = brl(totals.total);
    $('#annualYield').textContent = brl(totals.yearlyYield);
    $('#futureTotal').textContent = brl(totals.future);

    const labels = Array.from({ length: PROJECTION_MONTHS + 1 }, (_, month) => (month === 0 ? 'Hoje' : `${month}m`));
    const series = investments.slice(0, config.limits.investmentChartLines).map((investment) => ({
      label: investment.ativo,
      data: labels.map((_, month) => finance.projectedValue(investment, month)),
    }));
    charts.projection('investmentChart', labels, series);

    const holdings = investments.map(buildHolding);
    mount(
      $('#holdingsList'),
      holdings.length
        ? holdings
        : [emptyState('Nenhum investimento cadastrado. Adicione um ou importe a aba Investimentos.')],
    );
  }

  function openForm(investment) {
    const form = $('#investmentForm');
    const { profile } = store.get();
    const isEdit = Boolean(investment);

    form.reset();
    fillForm(form, {
      id: investment?.id ?? '',
      ativo: investment?.ativo ?? '',
      instituicao: investment?.instituicao ?? '',
      tipo: investment?.tipo ?? '',
      valor: investment?.valor ?? '',
      pct: investment?.pct ?? 100,
      cdi: investment?.cdi ?? profile.cdiPadrao,
      vencimento: investment?.vencimento ?? '',
      liquidez: investment?.liquidez ?? '',
    });

    $('#investmentModalEyebrow').textContent = isEdit ? 'EDITAR ATIVO' : 'NOVO ATIVO';
    $('#investmentModalTitle').textContent = isEdit ? 'Editar investimento' : 'Novo investimento';
    modal.open('investmentModal', { focus: '#investmentForm [name=ativo]' });
  }

  function onSubmit(event) {
    event.preventDefault();
    const values = readForm(event.target);

    const fields = {
      ativo: values.ativo.trim(),
      instituicao: values.instituicao.trim(),
      tipo: values.tipo.trim() || 'CDB',
      valor: Number(values.valor) || 0,
      pct: Number(values.pct) || 100,
      cdi: Number(values.cdi) || config.defaultCdi,
      vencimento: values.vencimento,
      liquidez: values.liquidez.trim() || 'Não informada',
    };

    if (values.id) repo.investments.update(values.id, fields);
    else repo.investments.add({ aplicacao: '', obs: '', ...fields });

    modal.close('investmentModal');
    toast(values.id ? 'Investimento atualizado' : 'Investimento adicionado');
  }

  async function onHoldingAction(event) {
    const button = event.target.closest('[data-action]');
    const holding = event.target.closest('.holding');
    if (!button || !holding) return;

    const investment = repo.investments.find(holding.dataset.id);
    if (!investment) return;

    if (button.dataset.action === 'edit') return openForm(investment);

    const confirmed = await modal.confirm({
      title: 'Excluir investimento?',
      message: `“${investment.ativo}” será removido da carteira. Essa ação não pode ser desfeita.`,
    });
    if (!confirmed) return;
    repo.investments.remove(investment.id);
    toast('Investimento removido');
  }

  function init() {
    $('#addInvestmentBtn').addEventListener('click', () => openForm());
    $('#investmentForm').addEventListener('submit', onSubmit);
    $('#holdingsList').addEventListener('click', onHoldingAction);
  }

  Aureon.views.investments = Object.freeze({ init, render });
})(window.Aureon);
