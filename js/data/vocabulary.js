(function (Aureon) {
  'use strict';

  const { fold, capitalize } = Aureon.utils;
  const { types, status, paymentMethods, defaultCategories } = Aureon.config;

  const words = (list) => new RegExp(list.join('|'));

  const INCOME_EXACT = new Set(['e', 'r', '+', 'in']);
  const EXPENSE_EXACT = new Set(['s', 'd', '-', 'out']);

  const EXPENSE_WORDS = words([
    'saida',
    'saiu',
    'despesa',
    'gasto',
    'debito',
    'pagamento',
    'compra',
    'retirada',
    'saque',
    'custo',
    'cartao',
    'expense',
    'outcome',
  ]);
  const INCOME_WORDS = words([
    'entrada',
    'receita',
    'ganho',
    'recebi',
    'provento',
    'rendimento',
    'renda',
    'salario',
    'deposito',
    'credito',
    'lucro',
    'reembolso',
    'income',
  ]);

  function transactionType(raw) {
    const text = fold(raw);
    if (!text) return null;
    if (EXPENSE_EXACT.has(text)) return types.expense;
    if (INCOME_EXACT.has(text)) return types.income;
    if (EXPENSE_WORDS.test(text)) return types.expense;
    if (INCOME_WORDS.test(text)) return types.income;
    return null;
  }

  function transactionStatus(raw) {
    const text = fold(raw);
    if (!text) return status.confirmed;
    if (/cancel|estorn/.test(text)) return status.cancelled;
    if (/pend|agend|previst|aberto|aguard/.test(text)) return status.pending;
    if (/confirm|pago|paga|recebid|efetiv|conclu|liquid/.test(text)) return status.confirmed;
    return smartCase(raw);
  }

  const recurring = (raw) => (/^(s|sim|yes|y|true|1|x)$/.test(fold(raw)) ? 'Sim' : 'Não');

  function priority(raw) {
    const text = fold(raw);
    if (/alta|high|urgente/.test(text)) return 'Alta';
    if (/baix|low/.test(text)) return 'Baixa';
    return 'Média';
  }

  function smartCase(raw) {
    const text = String(raw ?? '').trim();
    if (!text) return '';
    const allUpper = text === text.toUpperCase() && text !== text.toLowerCase() && text.length > 3;
    if (allUpper) return capitalize(text.toLowerCase());
    return text === text.toLowerCase() ? capitalize(text) : text;
  }

  const canonical = (list, raw) => list.find((item) => fold(item) === fold(raw)) ?? null;

  const category = (raw) => canonical(defaultCategories, raw) ?? (smartCase(raw) || 'Outros');
  const payment = (raw) => canonical(paymentMethods, raw) ?? (smartCase(raw) || 'Outro');
  const account = (raw) => smartCase(raw) || 'Não informada';

  Aureon.vocabulary = Object.freeze({
    transactionType,
    transactionStatus,
    recurring,
    priority,
    smartCase,
    category,
    payment,
    account,
  });
})(window.Aureon);
