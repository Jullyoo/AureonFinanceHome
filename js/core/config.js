(function (Aureon) {
  'use strict';

  Aureon.config = Object.freeze({
    types: Object.freeze({ income: 'Entrada', expense: 'Saída' }),

    status: Object.freeze({
      confirmed: 'Confirmado',
      pending: 'Pendente',
      cancelled: 'Cancelado',
    }),

    defaultCdi: 14.65,
    storageQuotaChars: 5000000,

    months: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    priorities: ['Alta', 'Média', 'Baixa'],

    paymentMethods: [
      'PIX',
      'Crédito',
      'Débito',
      'Débito automático',
      'Transferência',
      'Dinheiro',
      'Boleto',
      'Rendimento',
      'Outro',
    ],
    defaultCategories: [
      'Renda',
      'Renda extra',
      'Investimentos',
      'Moradia',
      'Alimentação',
      'Transporte',
      'Saúde',
      'Lazer',
      'Assinaturas',
      'Educação',
      'Outros',
    ],

    pages: Object.freeze({
      overview: null,
      transactions: 'Suas movimentações',
      goals: 'Metas com propósito',
      investments: 'Seu patrimônio em construção',
      profile: 'Seu perfil',
    }),

    goalIcons: [
      { pattern: /carro|civic|moto|veículo|lancer/, icon: '🚘' },
      { pattern: /óculos|saúde|dent/, icon: '👓' },
      { pattern: /viagem|viajar|férias/, icon: '✈️' },
      { pattern: /casa|imóvel|apartamento/, icon: '🏡' },
      { pattern: /reserva|emergência/, icon: '🌱' },
      { pattern: /pc|computador|notebook|setup/, icon: '💻' },
    ],
    defaultGoalIcon: '✦',

    limits: Object.freeze({
      recentTransactions: 5,
      goalPreview: 3,
      categoryChart: 7,
      categoryLegend: 5,
      investmentChartLines: 5,
      miniBars: 7,
    }),
  });
})(window.Aureon);
