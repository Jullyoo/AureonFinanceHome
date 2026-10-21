(function (Aureon) {
  'use strict';

  const { store, schema, filters } = Aureon;
  const { uid } = Aureon.utils;

  const sameId = (a, b) => String(a) === String(b);

  function collection(name) {
    const find = (id) => store.get()[name].find((item) => sameId(item.id, id));

    return {
      find,
      add(item) {
        const created = { ...item, id: uid() };
        store.update((state) => state[name].push(created));
        return created;
      },
      update(id, changes) {
        store.update((state) => {
          state[name] = state[name].map((item) =>
            sameId(item.id, id) ? { ...item, ...(typeof changes === 'function' ? changes(item) : changes) } : item,
          );
        });
      },
      remove(id) {
        store.update((state) => {
          state[name] = state[name].filter((item) => !sameId(item.id, id));
        });
      },
    };
  }

  const profile = {
    update(changes) {
      store.update((state) => {
        state.profile = schema.restoreProfile({ ...state.profile, ...changes });
      });
    },
  };

  function replace(data, { notice = '', resetMode = false } = {}) {
    store.update((state) => {
      ['transactions', 'goals', 'investments', 'profile'].forEach((key) => {
        if (data[key]) state[key] = data[key];
      });
      state.ui.notice = notice;
      filters.alignToData(state, { resetMode });
    });
  }

  function setNotice(notice) {
    store.update(
      (state) => {
        state.ui.notice = notice;
      },
      { persist: false },
    );
  }

  Aureon.repo = Object.freeze({
    transactions: collection('transactions'),
    goals: collection('goals'),
    investments: collection('investments'),
    profile,
    replace,
    setNotice,
  });
})(window.Aureon);
