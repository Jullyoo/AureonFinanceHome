(function (Aureon) {
  'use strict';

  const { initialOf } = Aureon.utils;

  function apply(element, profile) {
    if (profile.foto) {
      element.style.backgroundImage = `url("${profile.foto}")`;
      element.textContent = '';
    } else {
      element.style.backgroundImage = '';
      element.textContent = initialOf(profile.nome);
    }
  }

  Aureon.avatar = Object.freeze({ apply });
})(window.Aureon);
