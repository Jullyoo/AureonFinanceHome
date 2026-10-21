(function (Aureon) {
  'use strict';

  const { store, router, events, modal, toast, filters, views } = Aureon;

  const SCREENS = {
    overview: views.overview,
    transactions: views.transactions,
    goals: views.goals,
    investments: views.investments,
    profile: views.profile,
  };

  function render() {
    views.shell.render();
    views.login.render();
    views.filterbar.render();
    SCREENS[router.current()].render();
  }

  function start() {
    const state = store.init();
    filters.alignToData(state);
    store.save();

    modal.init();
    views.shell.init();
    views.filterbar.init();
    views.transactions.init();
    views.goals.init();
    views.investments.init();
    views.profile.init();
    views.login.init();
    views.dataControls.init();

    events.on('store:change', render);
    events.on('router:change', render);
    events.on('store:storage-error', () => toast('Armazenamento cheio. Remova imagens grandes ou exporte seus dados.'));

    router.start();
  }

  start();
})(window.Aureon);
