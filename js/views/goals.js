(function (Aureon) {
  'use strict';

  const { $, clone, slots, mount, emptyState, readForm, fillForm, toggle } = Aureon.dom;
  const { store, repo, finance, modal, toast, media, config } = Aureon;
  const { brl, dateText, parseDate, imageSrc, iso } = Aureon.utils;

  function goalIcon(name) {
    const text = name.toLowerCase();
    const match = config.goalIcons.find(({ pattern }) => pattern.test(text));
    return match ? match.icon : config.defaultGoalIcon;
  }

  function renderSummary(goals) {
    const totals = finance.goalTotals(goals);
    const cards = [
      ['Já conquistado', totals.current],
      ['Objetivo total', totals.target],
      ['Falta para chegar lá', totals.left],
    ].map(([label, value]) => {
      const card = clone('tpl-goal-summary');
      const s = slots(card);
      s.label.textContent = label;
      s.value.textContent = brl(value);
      return card;
    });
    mount($('#goalsSummary'), cards);
  }

  function buildCard(goal, index) {
    const { percent, remaining } = finance.goalProgress(goal);
    const card = clone('tpl-goal-card');
    const s = slots(card);

    card.dataset.id = goal.id;
    card.style.setProperty('--i', index);

    s.art.classList.toggle('has-img', Boolean(goal.imagem));
    if (goal.imagem) {
      s.image.src = imageSrc(goal.imagem);
      s.image.alt = `Imagem da meta ${goal.nome}`;
    } else {
      s.image.remove();
    }

    s.emoji.textContent = goalIcon(goal.nome);
    s.priority.textContent = `Prioridade ${goal.prioridade || 'Média'}`;
    s.name.textContent = goal.nome;
    s.deadline.textContent = goal.prazo ? `Prazo: ${dateText(parseDate(goal.prazo))}` : 'Sem prazo definido';
    s.current.textContent = brl(goal.atual);
    s.target.textContent = `de ${brl(goal.alvo)}`;
    s.bar.style.width = `${percent}%`;
    s.percent.textContent = `${percent.toFixed(0)}% concluído`;
    s.remaining.textContent = remaining ? `Faltam ${brl(remaining)}` : 'Meta alcançada!';
    return card;
  }

  function render() {
    const { goals } = store.get();
    renderSummary(goals);
    const cards = goals.map(buildCard);
    mount(
      $('#goalsGrid'),
      cards.length ? cards : [emptyState('Sua próxima conquista começa aqui. Adicione uma meta.')],
    );
  }

  function openForm(goal) {
    const form = $('#goalForm');
    const isEdit = Boolean(goal);
    const uploaded = goal?.imagem?.startsWith('data:');

    form.reset();
    fillForm(form, {
      id: goal?.id ?? '',
      name: goal?.nome ?? '',
      current: goal?.atual ?? 0,
      target: goal?.alvo ?? '',
      deadline: goal?.prazo ?? '',
      priority: goal?.prioridade ?? 'Média',
      imageUrl: goal?.imagem && !uploaded ? goal.imagem : '',
    });

    toggle($('#goalImageNote'), !uploaded);
    toggle($('#removeImageRow'), !goal?.imagem);
    $('#goalModalEyebrow').textContent = isEdit ? 'EDITAR CONQUISTA' : 'NOVA CONQUISTA';
    $('#goalModalTitle').textContent = isEdit ? 'Editar meta' : 'Crie uma meta';
    $('#goalModalLead').textContent = isEdit
      ? 'Ajuste o plano sem perder o progresso.'
      : 'Um objetivo claro deixa o caminho mais leve.';
    modal.open('goalModal', { focus: '#goalForm [name=name]' });
  }

  async function resolveImage(form, existing) {
    const file = form.elements.imageFile.files[0];
    if (file) return media.fromFile(file);
    if (form.elements.removeImage.checked) return '';
    const url = form.elements.imageUrl.value.trim();
    if (url) return url;
    return existing?.imagem?.startsWith('data:') ? existing.imagem : '';
  }

  async function onSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const values = readForm(form);
    const existing = values.id ? repo.goals.find(values.id) : null;

    try {
      const fields = {
        nome: values.name.trim(),
        atual: Number(values.current) || 0,
        alvo: Number(values.target),
        prazo: values.deadline,
        prioridade: values.priority,
        imagem: await resolveImage(form, existing),
      };

      if (existing) repo.goals.update(existing.id, fields);
      else repo.goals.add({ obs: '', ...fields });

      modal.close('goalModal');
      toast(existing ? 'Meta atualizada' : 'Meta criada com sucesso');
    } catch (error) {
      toast(error.message);
    }
  }

  function openContribution(goal) {
    const { remaining } = finance.goalProgress(goal);
    const form = $('#contributionForm');
    form.reset();
    form.elements.id.value = goal.id;
    form.dataset.remaining = remaining;
    $('#contributionLead').textContent = remaining
      ? `${goal.nome}: faltam ${brl(remaining)} para chegar lá.`
      : `${goal.nome} já foi alcançada. Quer guardar mais um pouco?`;
    modal.open('contributionModal', { focus: '#contributionForm [name=amount]' });
  }

  function onContribute(event) {
    event.preventDefault();
    const { id, amount } = readForm(event.target);
    const goal = repo.goals.find(id);
    const value = Number(amount);
    if (!goal || !(value > 0)) return;

    const reached = goal.atual < goal.alvo && goal.atual + value >= goal.alvo;
    repo.goals.update(id, (current) => ({ atual: current.atual + value }));
    modal.close('contributionModal');
    toast(reached ? `Meta alcançada! 🎉 ${goal.nome}` : `Aporte de ${brl(value)} registrado`);
  }

  async function onCardAction(event) {
    const button = event.target.closest('[data-action]');
    const card = event.target.closest('.goal-card');
    if (!button || !card) return;

    const goal = repo.goals.find(card.dataset.id);
    if (!goal) return;

    switch (button.dataset.action) {
      case 'edit':
        return openForm(goal);
      case 'contribute':
        return openContribution(goal);
      case 'delete': {
        const confirmed = await modal.confirm({
          title: 'Excluir meta?',
          message: `A meta “${goal.nome}” será removida. Essa ação não pode ser desfeita.`,
        });
        if (!confirmed) return;
        repo.goals.remove(goal.id);
        toast('Meta removida');
      }
    }
  }

  function onImageError(event) {
    if (event.target.tagName !== 'IMG') return;
    event.target.closest('.goal-art')?.classList.remove('has-img');
    event.target.remove();
    toast('Uma imagem de meta não carregou. Use um link direto para o arquivo da imagem.');
  }

  function init() {
    $('#addGoalBtn').addEventListener('click', () => openForm());
    $('#goalForm').addEventListener('submit', onSubmit);
    $('#contributionForm').addEventListener('submit', onContribute);
    $('#fillRemaining').addEventListener('click', () => {
      const form = $('#contributionForm');
      if (Number(form.dataset.remaining) > 0) form.elements.amount.value = Number(form.dataset.remaining).toFixed(2);
    });
    $('#goalsGrid').addEventListener('click', onCardAction);
    $('#goalsGrid').addEventListener('error', onImageError, true);
  }

  Aureon.views.goals = Object.freeze({ init, render });
})(window.Aureon);
