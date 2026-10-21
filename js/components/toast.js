(function (Aureon) {
  'use strict';

  const { $ } = Aureon.dom;
  const VISIBLE_MS = 3600;
  let timer;

  function show(message) {
    const element = $('#toast');
    element.textContent = message;
    element.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => element.classList.remove('show'), VISIBLE_MS);
  }

  Aureon.toast = show;
})(window.Aureon);
