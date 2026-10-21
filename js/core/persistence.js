(function (Aureon) {
  'use strict';

  const KEY = 'aureon-home-finance-v2';

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (error) {
      return null;
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.warn('Não foi possível persistir os dados no navegador.', error);
      return false;
    }
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  function usage() {
    try {
      return (localStorage.getItem(KEY) || '').length;
    } catch (error) {
      return 0;
    }
  }

  Aureon.persistence = Object.freeze({ load, save, clear, usage });
})(window.Aureon);
