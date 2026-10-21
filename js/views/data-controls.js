(function (Aureon) {
  'use strict';

  const { $ } = Aureon.dom;
  const { dataActions, modal, toast } = Aureon;

  const CONFIRMATIONS = {
    'clear-all': {
      title: 'Apagar todos os dados?',
      message:
        'Todas as transações, metas e investimentos serão removidos deste navegador. Exporte um backup antes se quiser guardar.',
      confirmLabel: 'Apagar tudo',
    },
  };

  const ACTIONS = {
    'export-excel': () => dataActions.exportExcel(),
    'export-backup': () => dataActions.exportBackup(),
    'clear-all': () => dataActions.clearAll(),
    'pick-excel': () => $('#excelFile').click(),
    'pick-backup': () => $('#backupFile').click(),
  };

  async function run(task) {
    try {
      const message = await task();
      if (message) toast(message);
    } catch (error) {
      toast(`Não foi possível concluir: ${error.message}`);
    }
  }

  async function onAction(event) {
    const trigger = event.target.closest('[data-data-action]');
    if (!trigger) return;

    const name = trigger.dataset.dataAction;
    const confirmation = CONFIRMATIONS[name];
    if (confirmation && !(await modal.confirm({ ...confirmation, danger: name === 'clear-all' }))) return;
    run(ACTIONS[name]);
  }

  async function importExcel(file) {
    const result = await dataActions.readExcel(file);
    if (dataActions.hasData()) {
      const { transactions, goals, investments } = Aureon.store.get();
      const confirmed = await modal.confirm({
        title: 'Substituir os dados atuais?',
        message:
          `Hoje há ${transactions.length} transações, ${goals.length} metas e ${investments.length} investimentos. ` +
          `Eles serão trocados pelo conteúdo da planilha “${file.name}” (${result.notes.join(', ')}). ` +
          'Se quiser guardar os dados atuais, baixe um backup antes.',
        confirmLabel: 'Substituir',
        danger: false,
      });
      if (!confirmed) return null;
    }
    return dataActions.applyExcel(result, file.name);
  }

  const onFilePicked = (handler) => (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (file) run(() => handler(file));
  };

  function init() {
    document.addEventListener('click', onAction);
    $('#excelFile').addEventListener('change', onFilePicked(importExcel));
    $('#backupFile').addEventListener('change', onFilePicked(dataActions.importBackup));
  }

  Aureon.views.dataControls = Object.freeze({ init });
})(window.Aureon);
