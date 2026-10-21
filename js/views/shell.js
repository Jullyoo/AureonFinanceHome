(function (Aureon) {
  'use strict';

  const { $, toggle } = Aureon.dom;
  const { store, repo, router, avatar, config } = Aureon;
  const { greeting } = Aureon.utils;

  const TITLE_REFRESH_MS = 60 * 1000;

  function init() {
    $('#privacyToggle').addEventListener('click', () => {
      repo.profile.update({ privacidade: !store.get().profile.privacidade });
    });
    $('#dismissNotice').addEventListener('click', () => repo.setNotice(''));
    setInterval(() => renderTitle(store.get().profile), TITLE_REFRESH_MS);
  }

  function renderTitle(profile) {
    const view = router.current();
    const fixedTitle = config.pages[view];
    $('#pageTitleText').textContent = fixedTitle ?? `${greeting()}, ${profile.nome}`;
    toggle($('#pageWave'), view !== 'overview');
  }

  function renderPrivacy(profile) {
    const button = $('#privacyToggle');
    document.body.classList.toggle('privacy-on', profile.privacidade);
    button.setAttribute('aria-pressed', String(profile.privacidade));
    button.textContent = profile.privacidade ? '○' : '◉';
    const label = profile.privacidade ? 'Mostrar valores' : 'Ocultar valores';
    button.title = label;
    button.setAttribute('aria-label', label);
  }

  function render() {
    const { profile, ui } = store.get();
    avatar.apply($('#sidebarAvatar'), profile);
    avatar.apply($('#topAvatar'), profile);
    $('#sidebarName').textContent = profile.nome;
    renderTitle(profile);
    renderPrivacy(profile);

    $('#importNoticeText').textContent = ui.notice;
    toggle($('#importNotice'), !ui.notice);
  }

  Aureon.views.shell = Object.freeze({ init, render });
})(window.Aureon);
