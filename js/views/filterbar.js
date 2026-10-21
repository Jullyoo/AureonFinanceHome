(function (Aureon) {
  'use strict';

  const { $, toggle, setOptions } = Aureon.dom;
  const { store, router, filters: periodFilters, toast } = Aureon;

  function syncVisibility() {
    const mode = $('#periodMode').value;
    toggle($('#monthWrap'), mode !== 'month');
    toggle($('#yearWrap'), mode !== 'year');
    toggle($('#dateWrap'), mode !== 'custom');
  }

  function apply() {
    store.update(
      (state) => {
        Object.assign(state.filters, {
          mode: $('#periodMode').value,
          month: $('#monthFilter').value,
          year: $('#yearFilter').value,
          day: $('#dateFilter').value,
        });
      },
      { persist: false },
    );
    toast('Período atualizado');
  }

  function init() {
    $('#periodMode').addEventListener('change', syncVisibility);
    $('#applyFilters').addEventListener('click', apply);
  }

  function render() {
    const { filters, transactions } = store.get();
    const years = periodFilters.availableYears(transactions);
    if (!years.includes(filters.year)) years.unshift(filters.year);

    setOptions($('#yearFilter'), years, filters.year);
    $('#periodMode').value = filters.mode;
    $('#monthFilter').value = filters.month;
    $('#dateFilter').value = filters.day;
    syncVisibility();
    toggle($('.filterbar'), router.current() === 'profile');
  }

  Aureon.views.filterbar = Object.freeze({ init, render });
})(window.Aureon);
