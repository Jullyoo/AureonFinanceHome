import test from 'node:test';
import assert from 'node:assert';
import { loadAureon } from './helpers/load-aureon.mjs';

const { Aureon } = loadAureon();
const v = Aureon.vocabulary;

test('Saída: todas as grafias (acento, caixa, espaços)', () => {
  ['Saída', 'Saida', 'SAIDA', 'saida', 'SAÍDA', 'saída', '  saída  ', 'Saídas', 'saidas'].forEach((text) =>
    assert.strictEqual(v.transactionType(text), 'Saída', JSON.stringify(text)),
  );
});

test('Entrada: todas as grafias', () => {
  ['Entrada', 'ENTRADA', 'entrada', ' Entrada ', 'Entradas'].forEach((text) =>
    assert.strictEqual(v.transactionType(text), 'Entrada', JSON.stringify(text)),
  );
});

test('sinônimos comuns', () => {
  [
    'Despesa',
    'DESPESA',
    'Débito',
    'DEBITO',
    'Gasto',
    'Pagamento',
    'Compra',
    'Saque',
    'S',
    '-',
    'Cartão de crédito',
  ].forEach((text) => assert.strictEqual(v.transactionType(text), 'Saída', JSON.stringify(text)));
  ['Receita', 'RECEITA', 'Crédito', 'credito', 'Salário', 'Rendimento', 'Depósito', 'Provento', 'E', '+'].forEach(
    (text) => assert.strictEqual(v.transactionType(text), 'Entrada', JSON.stringify(text)),
  );
});

test('texto desconhecido ou vazio devolve null (e não adivinha)', () => {
  ['', '   ', 'xpto', 'Fixa', 'Variável'].forEach((text) =>
    assert.strictEqual(v.transactionType(text), null, JSON.stringify(text)),
  );
});

test('status, prioridade e recorrência', () => {
  assert.strictEqual(v.transactionStatus('CANCELADO'), 'Cancelado');
  assert.strictEqual(v.transactionStatus('pendente'), 'Pendente');
  assert.strictEqual(v.transactionStatus('Pago'), 'Confirmado');
  assert.strictEqual(v.transactionStatus(''), 'Confirmado');
  assert.strictEqual(v.priority('ALTA'), 'Alta');
  assert.strictEqual(v.priority('media'), 'Média');
  assert.strictEqual(v.priority('baixa'), 'Baixa');
  assert.strictEqual(v.priority(''), 'Média');
  assert.strictEqual(v.recurring('SIM'), 'Sim');
  assert.strictEqual(v.recurring('nao'), 'Não');
});

test('categoria, pagamento e conta com caixa/acento normalizados', () => {
  assert.strictEqual(v.category('ALIMENTACAO'), 'Alimentação');
  assert.strictEqual(v.category('alimentação'), 'Alimentação');
  assert.strictEqual(v.category('MERCADO EXTRA'), 'Mercado extra');
  assert.strictEqual(v.category(''), 'Outros');
  assert.strictEqual(v.payment('pix'), 'PIX');
  assert.strictEqual(v.payment('DEBITO AUTOMATICO'), 'Débito automático');
  assert.strictEqual(v.account('nubank'), 'Nubank');
  assert.strictEqual(v.account(''), 'Não informada');
});
