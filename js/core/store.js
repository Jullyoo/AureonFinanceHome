(function (Aureon) {
  'use strict';

  const { persistence, schema, events } = Aureon;

  let state = null;

  const defaultFilters = () => ({
    mode: 'month',
    month: '',
    year: '',
    day: '',
    search: '',
    type: 'all',
    sort: { key: 'data', dir: 'desc' },
  });

  const LEGACY_DEMO = {
    note: 'Dado fictício de demonstração',
    goals: [
      ['Óculos novo', 2000],
      ['Honda Civic', 55000],
      ['Reserva de emergência', 10000],
    ],
    investments: [
      ['CDB Liquidez Diária', 5000],
      ['CDB 110% CDI', 2500],
      ['Tesouro Selic', 1500],
    ],
  };

  function stripLegacyDemo(saved) {
    const matches = (pairs, name, amount) => pairs.some(([n, a]) => n === name && a === amount);
    return {
      ...saved,
      transactions: saved.transactions?.filter((t) => t.obs !== LEGACY_DEMO.note) ?? null,
      goals: saved.goals?.filter((g) => !matches(LEGACY_DEMO.goals, g.nome, g.alvo)) ?? null,
      investments: saved.investments?.filter((i) => !matches(LEGACY_DEMO.investments, i.ativo, i.valor)) ?? null,
    };
  }

  function init() {
    let saved = schema.restore(persistence.load());
    if (saved.version < 4) saved = stripLegacyDemo(saved);

    state = {
      transactions: saved.transactions ?? [],
      goals: saved.goals ?? [],
      investments: saved.investments ?? [],
      profile: saved.profile ?? schema.defaultProfile(),
      filters: defaultFilters(),
      ui: { notice: '' },
    };
    return state;
  }

  const get = () => state;

  function save() {
    if (!persistence.save(schema.serialize(state))) events.emit('store:storage-error');
  }

  function update(mutator, { persist = true } = {}) {
    mutator(state);
    if (persist) save();
    events.emit('store:change', state);
  }

  Aureon.store = Object.freeze({ init, get, update, save, defaultFilters });
})(window.Aureon);
