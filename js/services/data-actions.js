(function (Aureon) {
  'use strict';

  const { excel, backup, repo, store } = Aureon;

  const hasData = () => {
    const { transactions, goals, investments } = store.get();
    return transactions.length + goals.length + investments.length > 0;
  };

  const readExcel = (file) => excel.read(file);

  function applyExcel(result, fileName) {
    const warnings = result.warnings.map((warning) => ` ⚠ ${warning}`).join('');
    repo.replace(
      { transactions: result.transactions, goals: result.goals, investments: result.investments },
      { notice: `Importado de “${fileName}”: ${result.notes.join(' · ')}.${warnings}` },
    );
    return result.warnings.length ? 'Planilha importada, com avisos' : 'Planilha importada com sucesso';
  }

  function exportExcel() {
    const skipped = excel.write(store.get());
    return skipped
      ? `Excel exportado. ${skipped} imagem(ns) enviada(s) do computador não vão na planilha.`
      : 'Arquivo Excel exportado';
  }

  function exportBackup() {
    backup.exportFile(store.get());
    return 'Backup salvo. Guarde o arquivo em um lugar seguro.';
  }

  async function importBackup(file) {
    const data = await backup.readFile(file);
    repo.replace(data, { notice: `Backup “${file.name}” restaurado.` });
    return 'Backup restaurado com sucesso';
  }

  function clearAll() {
    repo.replace({ transactions: [], goals: [], investments: [] }, { resetMode: true });
    return 'Tudo limpo. Importe uma planilha para recomeçar.';
  }

  Aureon.dataActions = Object.freeze({
    hasData,
    readExcel,
    applyExcel,
    exportExcel,
    exportBackup,
    importBackup,
    clearAll,
  });
})(window.Aureon);
