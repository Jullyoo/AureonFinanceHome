(function (Aureon) {
  'use strict';

  const { uid, iso, parseDate } = Aureon.utils;
  const { defaultCdi } = Aureon.config;

  const VERSION = 4;

  const defaultProfile = () => ({
    nome: '',
    foto: '',
    metaEconomia: 20,
    limiteGastos: 0,
    cdiPadrao: defaultCdi,
    privacidade: false,
  });

  function withIds(items) {
    const seen = new Set();
    return items.map((item) => {
      let id = item.id;
      if (id === undefined || id === null || id === '' || seen.has(String(id))) id = uid();
      seen.add(String(id));
      return { ...item, id };
    });
  }

  const text = (value, fallback = '') => (value === undefined || value === null ? fallback : String(value));
  const number = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

  function restoreTransactions(list) {
    return withIds(
      list
        .map((item) => ({
          codigo: typeof item.id === 'number' ? item.id : '',
          subcategoria: '',
          instituicao: '',
          recorrente: 'Não',
          obs: '',
          ...item,
          descricao: text(item.descricao, 'Sem descrição'),
          valor: Math.abs(number(item.valor)),
          data: parseDate(item.data),
        }))
        .filter((item) => item.data),
    );
  }

  function restoreGoals(list) {
    return withIds(
      list
        .map((item) => ({
          prazo: '',
          prioridade: 'Média',
          imagem: '',
          obs: '',
          ...item,
          nome: text(item.nome).trim(),
          atual: number(item.atual),
          alvo: number(item.alvo),
        }))
        .filter((item) => item.nome),
    );
  }

  function restoreInvestments(list) {
    return withIds(
      list
        .map((item) => ({
          instituicao: '',
          tipo: 'CDB',
          liquidez: 'Não informada',
          aplicacao: '',
          vencimento: '',
          obs: '',
          ...item,
          ativo: text(item.ativo).trim(),
          valor: number(item.valor),
          pct: number(item.pct, 100) || 100,
          cdi: number(item.cdi, Aureon.config.defaultCdi) || Aureon.config.defaultCdi,
        }))
        .filter((item) => item.ativo),
    );
  }

  function restoreProfile(saved) {
    const base = defaultProfile();
    const profile = { ...base, ...(saved || {}) };
    profile.nome = text(profile.nome).trim().slice(0, 40);
    profile.foto = text(profile.foto);
    profile.metaEconomia = number(profile.metaEconomia, base.metaEconomia);
    profile.limiteGastos = Math.max(0, number(profile.limiteGastos));
    profile.cdiPadrao = number(profile.cdiPadrao, base.cdiPadrao) || base.cdiPadrao;
    profile.privacidade = Boolean(profile.privacidade);
    return profile;
  }

  function serialize(state) {
    return {
      version: VERSION,
      transactions: state.transactions.map((item) => ({ ...item, data: iso(item.data) })),
      goals: state.goals,
      investments: state.investments,
      profile: state.profile,
    };
  }

  function restore(saved) {
    return {
      version: Number(saved?.version) || 0,
      transactions: Array.isArray(saved?.transactions) ? restoreTransactions(saved.transactions) : null,
      goals: Array.isArray(saved?.goals) ? restoreGoals(saved.goals) : null,
      investments: Array.isArray(saved?.investments) ? restoreInvestments(saved.investments) : null,
      profile: saved?.profile ? restoreProfile(saved.profile) : null,
    };
  }

  Aureon.schema = Object.freeze({ VERSION, defaultProfile, restore, restoreProfile, serialize, withIds });
})(window.Aureon);
