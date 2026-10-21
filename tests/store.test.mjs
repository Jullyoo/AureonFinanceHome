import test from 'node:test';
import assert from 'node:assert';
import { loadAureon, fakeStorage } from './helpers/load-aureon.mjs';

const KEY = 'aureon-home-finance-v2';
const demoTx = (extra = {}) => ({
  id: 1,
  descricao: 'Salário',
  tipo: 'Entrada',
  categoria: 'Renda',
  valor: 4200,
  status: 'Confirmado',
  data: '2026-10-01T15:00:00.000Z',
  obs: 'Dado fictício de demonstração',
  ...extra,
});
const realTx = {
  id: 2,
  descricao: 'Mercado',
  tipo: 'Saída',
  categoria: 'Alimentação',
  valor: 80,
  status: 'Confirmado',
  data: '2026-10-02',
  obs: '',
};

test('primeira abertura: tudo vazio e perfil sem nome', () => {
  const { Aureon } = loadAureon();
  const s = Aureon.store.init();
  assert.deepEqual([s.transactions.length, s.goals.length, s.investments.length], [0, 0, 0]);
  assert.strictEqual(s.profile.nome, '');
});

test('dados de demonstração de versões antigas são removidos uma única vez', () => {
  const old = {
    version: 3,
    transactions: [demoTx(), realTx],
    goals: [
      { nome: 'Honda Civic', alvo: 55000, atual: 1 },
      { nome: 'Minha meta', alvo: 100, atual: 1 },
    ],
    investments: [
      { ativo: 'Tesouro Selic', valor: 1500 },
      { ativo: 'Meu CDB', valor: 10 },
    ],
    profile: { nome: 'Ana' },
  };
  const { Aureon, storage } = loadAureon({ storage: fakeStorage({ [KEY]: JSON.stringify(old) }) });
  const s = Aureon.store.init();
  assert.deepEqual(
    s.transactions.map((t) => t.descricao),
    ['Mercado'],
  );
  assert.deepEqual(
    s.goals.map((g) => g.nome),
    ['Minha meta'],
  );
  assert.deepEqual(
    s.investments.map((i) => i.ativo),
    ['Meu CDB'],
  );
  assert.strictEqual(s.profile.nome, 'Ana');

  Aureon.store.save();
  assert.strictEqual(JSON.parse(storage.getItem(KEY)).version, 4);
  s.transactions.push({ ...realTx, id: 'x', obs: 'Dado fictício de demonstração', data: new Date(2026, 9, 3) });
  Aureon.store.save();
  const again = loadAureon({ storage }).Aureon.store.init();
  assert.strictEqual(again.transactions.length, 2);
});

test('replace troca as três coleções de uma vez (inclusive para vazio)', () => {
  const { Aureon } = loadAureon();
  Aureon.store.init();
  Aureon.repo.replace({
    transactions: [
      {
        id: 'a',
        descricao: 'x',
        tipo: 'Saída',
        valor: 1,
        status: 'Confirmado',
        categoria: 'Outros',
        data: new Date(2026, 9, 5),
      },
    ],
    goals: [{ id: 'g', nome: 'M', atual: 0, alvo: 1 }],
    investments: [],
  });
  assert.strictEqual(Aureon.store.get().goals.length, 1);
  assert.strictEqual(Aureon.store.get().filters.month, '2026-10');
  Aureon.repo.replace({ transactions: [], goals: [], investments: [] });
  assert.strictEqual(Aureon.store.get().goals.length, 0);
});
