import test from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadAureon, workbookFile, rootDir } from './helpers/load-aureon.mjs';

const { Aureon, XLSX, toSandboxBuffer } = loadAureon();
const TX = [
  ['Data', 'Descricao', 'Tipo', 'Valor'],
  ['2026-10-01', 'a', 'Entrada', 100],
  ['2026-10-02', 'b', 'SAIDA', 40],
];

test('planilha modelo: as três abas vêm do mesmo arquivo', async () => {
  const buffer = readFileSync(resolve(rootDir, 'assets/Aureon_Home_Finance_Modelo.xlsx'));
  const file = { name: 'modelo.xlsx', arrayBuffer: async () => toSandboxBuffer(buffer) };
  const result = await Aureon.excel.read(file);
  assert.strictEqual(result.transactions.length, 19);
  assert.strictEqual(result.goals.length, 3);
  assert.strictEqual(result.investments.length, 3);
  assert.deepEqual(result.warnings, []);
  const income = result.transactions.filter((t) => t.tipo === 'Entrada').reduce((s, t) => s + t.valor, 0);
  const expense = result.transactions.filter((t) => t.tipo === 'Saída').reduce((s, t) => s + t.valor, 0);
  assert.ok(income > 0 && expense > 0);
});

test('aba ausente = lista vazia (nunca dados de outra origem)', async () => {
  const result = await Aureon.excel.read(workbookFile(XLSX, { Transacoes: TX }));
  assert.strictEqual(result.transactions.length, 2);
  assert.deepEqual(result.goals, []);
  assert.deepEqual(result.investments, []);
  assert.ok(result.notes.some((n) => /sem aba de metas/.test(n)));
});

test('nomes de aba flexíveis e aba "Leia-me" na frente', async () => {
  const sheets = {
    'Leia-me': [['Instruções'], ['Preencha as abas']],
    Transações: TX,
    METAS: [
      ['Meta', 'Valor_Alvo', 'Valor_Atual'],
      ['Viagem', 1000, 10],
    ],
    Investimentos: [
      ['Ativo', 'Valor_Investido'],
      ['CDB', 500],
    ],
  };
  const result = await Aureon.excel.read(workbookFile(XLSX, sheets));
  assert.strictEqual(result.transactions.length, 2);
  assert.strictEqual(result.goals.length, 1);
  assert.strictEqual(result.investments.length, 1);
});

test('aba de metas sem linhas válidas gera aviso e lista vazia', async () => {
  const result = await Aureon.excel.read(
    workbookFile(XLSX, {
      Transacoes: TX,
      Metas: [
        ['Meta', 'Valor_Alvo'],
        ['', ''],
      ],
    }),
  );
  assert.deepEqual(result.goals, []);
  assert.ok(result.warnings.some((w) => /Metas/.test(w) && /Meta e Valor_Alvo/.test(w)));
});

test('sem transações válidas: erro claro', async () => {
  await assert.rejects(
    () =>
      Aureon.excel.read(
        workbookFile(XLSX, {
          Transacoes: [
            ['Data', 'Valor'],
            ['x', 'y'],
          ],
        }),
      ),
    /Não encontrei transações/,
  );
});

test('datas como número serial do Excel', async () => {
  const sheets = {
    Transacoes: [
      ['Data', 'Tipo', 'Valor'],
      [46312, 'Saída', 10],
    ],
  }; // 2026-10-17
  const [t] = (await Aureon.excel.read(workbookFile(XLSX, sheets))).transactions;
  assert.strictEqual(Aureon.utils.iso(t.data), '2026-10-17');
});
