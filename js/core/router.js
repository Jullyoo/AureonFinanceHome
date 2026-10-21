(function (Aureon) {
  'use strict';

  const { $, $$ } = Aureon.dom;
  const { events } = Aureon;

  const VIEWS = Object.keys(Aureon.config.pages);
  let current = 'overview';

  const fromHash = () => {
    const name = location.hash.slice(1);
    return VIEWS.includes(name) ? name : 'overview';
  };

  function show(view) {
    current = view;
    $$('.nav-item').forEach((button) => {
      const active = button.dataset.view === view;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    $$('.view').forEach((section) => section.classList.toggle('active', section.id === `view-${view}`));
    window.scrollTo({ top: 0 });
    events.emit('router:change', view);
  }

  function go(view) {
    if (location.hash === `#${view}`) show(view);
    else location.hash = view;
  }

  function start() {
    window.addEventListener('hashchange', () => show(fromHash()));
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-view], [data-goto]');
      if (trigger) go(trigger.dataset.view || trigger.dataset.goto);
    });
    show(fromHash());
  }

  Aureon.router = Object.freeze({ start, go, current: () => current });
})(window.Aureon);
