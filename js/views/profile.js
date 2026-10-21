(function (Aureon) {
  'use strict';

  const { $, clone, slots, mount, fillForm, readForm } = Aureon.dom;
  const { store, repo, finance, persistence, avatar, media, toast, config } = Aureon;
  const { brl, dateText, clamp, percentOf, capitalize } = Aureon.utils;

  const AVATAR_SIZE = 256;

  function buildStat(label, value) {
    const stat = clone('tpl-profile-stat');
    const s = slots(stat);
    s.label.textContent = label;
    s.value.textContent = value;
    return stat;
  }

  function renderSummary({ transactions, goals, investments }) {
    const dates = transactions.map((t) => t.data).sort((a, b) => a - b);
    const reached = goals.filter((goal) => finance.goalProgress(goal).done).length;
    const invested = finance.investmentTotals(investments).total;

    $('#profileSince').textContent = dates.length ? `Registros desde ${dateText(dates[0])}` : 'Ainda sem registros';
    mount($('#profileStats'), [
      buildStat('Transações', String(transactions.length)),
      buildStat('Metas (alcançadas)', `${goals.length} (${reached})`),
      buildStat('Investimentos', String(investments.length)),
      buildStat('Patrimônio investido', brl(invested)),
    ]);
  }

  function renderStorage() {
    const used = persistence.usage();
    const percent = clamp(percentOf(used, config.storageQuotaChars), 0, 100);
    $('#storageText').textContent =
      `${(used / 1024).toFixed(0)} KB de ~${(config.storageQuotaChars / 1000000).toFixed(0)} MB`;
    $('#storageBar').style.width = `${Math.max(percent, 1)}%`;
  }

  function render() {
    const state = store.get();
    const { profile } = state;

    avatar.apply($('#profileAvatar'), profile);
    $('#profileName').textContent = profile.nome;
    $('#removePhoto').classList.toggle('hidden', !profile.foto);
    fillForm($('#profileForm'), {
      nome: profile.nome,
      metaEconomia: profile.metaEconomia,
      limiteGastos: profile.limiteGastos,
      cdiPadrao: profile.cdiPadrao,
    });

    renderSummary(state);
    renderStorage();
  }

  function onSubmit(event) {
    event.preventDefault();
    const values = readForm(event.target);
    repo.profile.update({
      nome: capitalize(values.nome.trim()),
      metaEconomia: clamp(Number(values.metaEconomia) || 0, 0, 100),
      limiteGastos: Math.max(0, Number(values.limiteGastos) || 0),
      cdiPadrao: Number(values.cdiPadrao) || config.defaultCdi,
    });
    toast('Perfil atualizado');
  }

  async function onPhotoPicked(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      repo.profile.update({ foto: await media.fromFile(file, { maxEdge: AVATAR_SIZE, quality: 0.85, square: true }) });
      toast('Foto atualizada');
    } catch (error) {
      toast(error.message);
    }
  }

  function init() {
    $('#profileForm').addEventListener('submit', onSubmit);
    $('#profilePhotoInput').addEventListener('change', onPhotoPicked);
    $('#logoutBtn').addEventListener('click', () => repo.profile.update({ nome: '', foto: '' }));
    $('#removePhoto').addEventListener('click', () => {
      repo.profile.update({ foto: '' });
      toast('Foto removida');
    });
  }

  Aureon.views.profile = Object.freeze({ init, render });
})(window.Aureon);
