import test from 'node:test';
import assert from 'node:assert';
import { loadAureon } from './helpers/load-aureon.mjs';

const { Aureon } = loadAureon();
const { greeting, moneyNum, parseDate, iso, fold, keyOf, imageSrc, capitalize } = Aureon.utils;

test('saudação: limites inclusivos 12:00 e 18:00', () => {
  const at = (h, m) => greeting(new Date(2026, 9, 16, h, m, 59));
  assert.strictEqual(at(0, 0), 'Bom dia');
  assert.strictEqual(at(11, 59), 'Bom dia');
  assert.strictEqual(at(12, 0), 'Bom dia');
  assert.strictEqual(at(12, 1), 'Boa tarde');
  assert.strictEqual(at(18, 0), 'Boa tarde');
  assert.strictEqual(at(18, 1), 'Boa noite');
  assert.strictEqual(at(23, 59), 'Boa noite');
});

test('moneyNum: formatos pt-BR e sinais', () => {
  const cases = [
    ['R$ 1.234,56', 1234.56],
    ['1.500', 1500],
    ['12,5', 12.5],
    ['-5,00', -5],
    ['-R$ 5,00', -5],
    ['5,00-', -5],
    ['(7,50)', -7.5],
    ['(R$ 1.000,00)', -1000],
    ['−5', -5],
    ['-1.500', -1500],
    ['', 0],
    ['abc', 0],
  ];
  cases.forEach(([input, expected]) =>
    assert.strictEqual(moneyNum(input), expected, `moneyNum(${JSON.stringify(input)})`),
  );
  assert.strictEqual(moneyNum(42.5), 42.5);
  assert.strictEqual(moneyNum(-3), -3);
});

test('parseDate: datas sem hora são locais (não voltam um dia)', () => {
  assert.strictEqual(iso(parseDate('2026-10-01')), '2026-10-01');
  assert.strictEqual(iso(parseDate('01/10/2026')), '2026-10-01');
  assert.strictEqual(iso(parseDate(new Date(2026, 9, 1, 23, 59))), '2026-10-01');
  assert.strictEqual(parseDate('texto'), null);
  assert.strictEqual(parseDate(''), null);
});

test('fold e keyOf ignoram caixa, acento e espaços', () => {
  assert.strictEqual(fold('  SAÍDA '), 'saida');
  assert.strictEqual(keyOf('Valor (R$)'), 'valorr');
  assert.strictEqual(keyOf('Conta_Origem'), keyOf('conta origem'));
});

test('imageSrc: Drive, Dropbox e barras do Windows', () => {
  assert.strictEqual(
    imageSrc('https://drive.google.com/file/d/ABC_123/view?usp=sharing'),
    'https://drive.google.com/thumbnail?id=ABC_123&sz=w1200',
  );
  assert.strictEqual(imageSrc('https://www.dropbox.com/s/x/a.jpg?dl=0'), 'https://www.dropbox.com/s/x/a.jpg?raw=1');
  assert.strictEqual(imageSrc('img\\civic.jpg'), 'img/civic.jpg');
  assert.strictEqual(imageSrc('https://i.imgur.com/a.jpg'), 'https://i.imgur.com/a.jpg');
});

test('capitalize só mexe na primeira letra', () => {
  assert.strictEqual(capitalize('maria silva'), 'Maria silva');
  assert.strictEqual(capitalize(''), '');
});
