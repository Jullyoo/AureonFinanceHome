import test from 'node:test';
import assert from 'node:assert';
import { loadAureon } from './helpers/load-aureon.mjs';

const { Aureon } = loadAureon();
const { finance, filters } = Aureon;

const tx = (tipo, valor, extra = {}) => ({
  tipo,
  valor,
  status: 'Confirmado',
  categoria: 'Outros',
  data: new Date(2026, 9, 10),
  ...extra,
});

test('summarize ignora canceladas e calcula taxa de economia', () => {
  const s = finance.summarize([tx('Entrada', 1000), tx('Saída', 250), tx('Saída', 999, { status: 'Cancelado' })]);
  assert.strictEqual(s.income, 1000);
  assert.strictEqual(s.expense, 250);
  assert.strictEqual(s.balance, 750);
  assert.strictEqual(s.savingsRate, 75);
});

test('categorias iguais com caixa/acento diferentes viram uma só fatia', () => {
  const list = [
    tx('Saída', 10, { categoria: 'Alimentação' }),
    tx('Saída', 20, { categoria: 'ALIMENTACAO' }),
    tx('Saída', 5, { categoria: 'Lazer' }),
  ];
  assert.deepEqual(finance.expensesByCategory(list), [
    ['Alimentação', 30],
    ['Lazer', 5],
  ]);
});

test('flowSeries por mês usa um ponto por dia', () => {
  const f = { mode: 'month', month: '2026-10', year: '', day: '' };
  const s = finance.flowSeries([tx('Entrada', 100), tx('Saída', 40)], f);
  assert.strictEqual(s.labels.length, 31);
  assert.strictEqual(s.income[9], 100);
  assert.strictEqual(s.expense[9], 40);
});

test('filtros: período, busca sem acento e ordenação', () => {
  const list = [
    tx('Saída', 10, { descricao: 'Mercado', data: new Date(2026, 8, 30) }),
    tx('Saída', 30, { descricao: 'Café', data: new Date(2026, 9, 2) }),
    tx('Entrada', 50, { descricao: 'Salário', data: new Date(2026, 9, 1) }),
  ];
  const f = { mode: 'month', month: '2026-10', year: '', day: '', search: '', type: 'all' };
  assert.strictEqual(filters.byPeriod(list, f).length, 2);
  assert.strictEqual(filters.bySearch(list, { ...f, search: 'CAFE' }).length, 1);
  assert.strictEqual(filters.bySearch(list, { ...f, search: 'saida' }).length, 2, 'busca encontra pelo tipo');
  assert.strictEqual(filters.bySearch(list, { ...f, type: 'Entrada' }).length, 1);
  assert.deepEqual(
    filters.sorted(list, { key: 'valor', dir: 'desc' }).map((t) => t.valor),
    [50, 30, 10],
  );
});

test('orçamento, metas e investimentos', () => {
  assert.strictEqual(finance.budget(850, { limiteGastos: 1000 }).level, 'warn');
  assert.strictEqual(finance.budget(1200, { limiteGastos: 1000 }).level, 'over');
  assert.strictEqual(finance.budget(10, { limiteGastos: 0 }).level, 'off');
  const p = finance.goalProgress({ atual: 500, alvo: 1000 });
  assert.strictEqual(p.percent, 50);
  assert.strictEqual(p.remaining, 500);
  assert.strictEqual(finance.goalProgress({ atual: 2000, alvo: 1000 }).done, true);
  const total = finance.investmentTotals([{ valor: 1000, pct: 100, cdi: 10 }]);
  assert.strictEqual(Math.round(total.future), 1100);
});
