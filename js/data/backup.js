(function (Aureon) {
  'use strict';

  const { schema } = Aureon;
  const { download } = Aureon.dom;

  function exportFile(state) {
    const payload = { app: 'aureon-home-finance', exportedAt: new Date().toISOString(), ...schema.serialize(state) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const stamp = new Date().toISOString().slice(0, 10);
    download(`Aureon_Backup_${stamp}.json`, blob);
  }

  async function readFile(file) {
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch (error) {
      throw new Error('O arquivo não é um JSON válido.');
    }
    if (parsed?.app !== 'aureon-home-finance') throw new Error('Este arquivo não parece ser um backup do Aureon.');

    const data = schema.restore(parsed);
    if (!data.transactions && !data.goals && !data.investments) throw new Error('O backup está vazio.');
    return data;
  }

  Aureon.backup = Object.freeze({ exportFile, readFile });
})(window.Aureon);
