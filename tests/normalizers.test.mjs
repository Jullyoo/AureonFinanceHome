import test from 'node:test';
import assert from 'node:assert';
import { loadAureon } from './helpers/load-aureon.mjs';

const { Aureon } = loadAureon();
const { normalizers } = Aureon;

const rows = (header, ...lines) =>
  lines.map((line) => Object.fromEntries(header.map((name, i) => [name, line[i] ?? ''])));
const summary = ({ items }) => items.map((t) => [t.tipo, t.valor]);

test('coluna Tipo: Saída/Entrada em qualquer grafia', () => {
  const data = rows(
    ['Data', 'Descricao', 'Tipo', 'Valor'],
    ['2026-10-01', 'a', 'Entrada', 1000],
    ['2026-10-02', 'b', 'Saída', 100],
    ['2026-10-02', 'c', 'Saida', 100],
    ['2026-10-02', 'd', 'SAIDA', 100],
    ['2026-10-02', 'e', 'saida', 100],
    ['2026-10-03', 'f', 'ENTRADA', 50],
    ['2026-10-03', 'g', 'entrada', 50],
  );
  const { items, warnings } = normalizers.transactions(data);
  assert.deepEqual(summary({ items }), [
    ['Entrada', 1000],
    ['Saída', 100],
    ['Saída', 100],
    ['Saída', 100],
    ['Saída', 100],
    ['Entrada', 50],
    ['Entrada', 50],
  ]);
  assert.deepEqual(warnings, []);
});

test('valores contábeis negativos viram saída com valor correto', () => {
  const data = rows(
    ['Data', 'Tipo', 'Valor'],
    ['2026-10-05', 'Saída', '(7,50)'],
    ['2026-10-05', 'Saída', '-R$ 5,00'],
    ['2026-10-05', 'saida', 12],
  );
  assert.deepEqual(summary(normalizers.transactions(data)), [
    ['Saída', 7.5],
    ['Saída', 5],
    ['Saída', 12],
  ]);
});

test('sem coluna Tipo: valor negativo = saída, positivo = entrada', () => {
  const data = rows(
    ['Data', 'Descrição', 'Valor'],
    ['2026-10-01', 'salario', 3000],
    ['2026-10-02', 'mercado', -250.5],
    ['2026-10-03', 'extra', '1.000,00'],
  );
  const { items, warnings } = normalizers.transactions(data);
  assert.deepEqual(summary({ items }), [
    ['Entrada', 3000],
    ['Saída', 250.5],
    ['Entrada', 1000],
  ]);
  assert.deepEqual(warnings, []);
});

test('colunas separadas Entrada e Saída', () => {
  const data = rows(
    ['Data', 'Descrição', 'Entrada', 'Saída'],
    ['2026-10-01', 'salario', 3000, ''],
    ['2026-10-02', 'mercado', '', 250],
    ['2026-10-03', 'x', '', '(40,00)'],
  );
  assert.deepEqual(summary(normalizers.transactions(data)), [
    ['Entrada', 3000],
    ['Saída', 250],
    ['Saída', 40],
  ]);
});

test('tipo não reconhecido vira Saída, mas com aviso explícito', () => {
  const data = rows(
    ['Data', 'Tipo', 'Valor'],
    ['2026-10-01', 'Entrada', 100],
    ['2026-10-02', 'xpto', 10],
    ['2026-10-03', 'xpto', 10],
    ['2026-10-04', 'Fixa', 5],
  );
  const { items, warnings } = normalizers.transactions(data);
  assert.deepEqual(
    items.map((t) => t.tipo),
    ['Entrada', 'Saída', 'Saída', 'Saída'],
  );
  assert.strictEqual(warnings.length, 1);
  assert.match(warnings[0], /3 lançamentos ficaram sem tipo reconhecido/);
  assert.match(warnings[0], /“xpto”/);
});

test('avisa linhas sem data e valores zerados; ignora linhas totalmente vazias', () => {
  const data = rows(
    ['Data', 'Tipo', 'Valor'],
    ['2026-10-01', 'Saída', 'abc'],
    ['sem data', 'Saída', 10],
    ['', '', ''],
    ['2026-10-02', 'Saída', 10],
  );
  const { items, warnings } = normalizers.transactions(data);
  assert.strictEqual(items.length, 2);
  assert.ok(warnings.some((w) => /1 linha sem data válida foi ignorada/.test(w)));
  assert.ok(warnings.some((w) => /1 lançamento está com valor zero/.test(w)));
});

test('cabeçalhos livres: acento, caixa, underscore e espaços', () => {
  const data = rows(
    ['DATA', 'DESCRIÇÃO', 'TIPO', 'VALOR (R$)', 'MEIO PAGAMENTO', 'STATUS'],
    ['01/10/2026', 'Teste', 'SAIDA', 'R$ 10,00', 'pix', 'PENDENTE'],
  );
  const [t] = normalizers.transactions(data).items;
  assert.strictEqual(t.tipo, 'Saída');
  assert.strictEqual(t.valor, 10);
  assert.strictEqual(t.pagamento, 'PIX');
  assert.strictEqual(t.status, 'Pendente');
});

test('metas e investimentos com prioridade/tipos normalizados', () => {
  const goals = normalizers.goals(
    rows(
      ['Meta', 'Valor_Atual', 'Valor_Alvo', 'Data_Alvo', 'Prioridade'],
      ['Viagem', 100, 1000, '2027-01-10', 'ALTA'],
      ['sem alvo', 1, 0, '', 'baixa'],
    ),
  );
  assert.strictEqual(goals.items.length, 1);
  assert.strictEqual(goals.items[0].prioridade, 'Alta');
  assert.strictEqual(goals.items[0].prazo, '2027-01-10');
  const inv = normalizers.investments(rows(['Ativo', 'Valor_Investido', 'Taxa_Anual_%_CDI'], ['CDB', 1000, 110]));
  assert.strictEqual(inv.items[0].pct, 110);
  assert.strictEqual(inv.items[0].cdi, 14.65);
});
