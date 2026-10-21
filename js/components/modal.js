(function (Aureon) {
  'use strict';

  const { $, $$ } = Aureon.dom;
  const FOCUS_DELAY_MS = 60;

  const openStack = [];

  function open(id, { focus } = {}) {
    const modal = document.getElementById(id);
    modal.classList.remove('hidden');
    openStack.push({ modal, returnTo: document.activeElement });
    const target = focus ? $(focus, modal) : null;
    if (target) setTimeout(() => target.focus(), FOCUS_DELAY_MS);
  }

  function close(id) {
    const modal = document.getElementById(id);
    modal.classList.add('hidden');
    const index = openStack.findIndex((entry) => entry.modal === modal);
    if (index === -1) return;
    const [{ returnTo }] = openStack.splice(index, 1);
    returnTo?.focus?.();
  }

  const closeTop = () => {
    const top = openStack[openStack.length - 1];
    if (top) top.modal.id === 'confirmModal' ? $('#confirmCancel').click() : close(top.modal.id);
  };

  function confirm({ title, message, confirmLabel = 'Excluir', danger = true }) {
    $('#confirmTitle').textContent = title;
    $('#confirmMessage').textContent = message;
    const ok = $('#confirmOk');
    ok.textContent = confirmLabel;
    ok.classList.toggle('apply-btn-danger', danger);

    return new Promise((resolve) => {
      const finish = (answer) => {
        ok.removeEventListener('click', onOk);
        $('#confirmCancel').removeEventListener('click', onCancel);
        close('confirmModal');
        resolve(answer);
      };
      const onOk = () => finish(true);
      const onCancel = () => finish(false);
      ok.addEventListener('click', onOk);
      $('#confirmCancel').addEventListener('click', onCancel);
      open('confirmModal', { focus: '#confirmCancel' });
    });
  }

  function init() {
    $$('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) closeTop();
      });
    });
    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-close-modal]')) closeTop();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeTop();
    });
  }

  Aureon.modal = Object.freeze({ init, open, close, confirm });
})(window.Aureon);
