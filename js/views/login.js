(function (Aureon) {
  'use strict';

  const { $, toggle } = Aureon.dom;
  const { store, repo, router, avatar, toast } = Aureon;
  const { greeting, capitalize } = Aureon.utils;

  const FOCUS_DELAY_MS = 80;

  function preview(name) {
    const clean = capitalize(name.trim());
    avatar.apply($('#loginAvatar'), { nome: clean, foto: '' });
    $('#loginGreeting').textContent = `${greeting()}, ${clean || '…'}`;
  }

  function render() {
    const needsName = !store.get().profile.nome;
    const screen = $('#loginScreen');
    const wasHidden = screen.classList.contains('hidden');

    toggle(screen, !needsName);
    $('.app-shell').inert = needsName;

    if (needsName && wasHidden) {
      $('#loginName').value = '';
      preview('');
      setTimeout(() => $('#loginName').focus(), FOCUS_DELAY_MS);
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    const name = capitalize($('#loginName').value.trim());
    if (!name) return;

    router.go('overview');
    repo.profile.update({ nome: name });
    toast(`Bem-vindo(a), ${name}!`);
  }

  function init() {
    $('#loginForm').addEventListener('submit', onSubmit);
    $('#loginName').addEventListener('input', (event) => preview(event.target.value));
  }

  Aureon.views.login = Object.freeze({ init, render });
})(window.Aureon);
