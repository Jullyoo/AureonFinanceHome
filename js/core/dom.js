(function (Aureon) {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function clone(templateId) {
    const template = document.getElementById(templateId);
    if (!template) throw new Error(`Template não encontrado: ${templateId}`);
    return template.content.firstElementChild.cloneNode(true);
  }

  function slots(root) {
    const map = {};
    const nodes = $$('[data-slot]', root);
    if (root.matches('[data-slot]')) nodes.unshift(root);
    nodes.forEach((node) => {
      map[node.dataset.slot] = node;
    });
    return map;
  }

  const mount = (container, nodes) => container.replaceChildren(...nodes);

  const toggle = (element, hidden) => element.classList.toggle('hidden', hidden);

  function emptyState(message) {
    const element = clone('tpl-empty-state');
    element.textContent = message;
    return element;
  }

  function emptyRow(message) {
    const row = clone('tpl-empty-row');
    row.firstElementChild.textContent = message;
    return row;
  }

  function readForm(form) {
    const values = {};
    new FormData(form).forEach((value, key) => {
      if (typeof value === 'string') values[key] = value;
    });
    form.querySelectorAll('input[type=checkbox]').forEach((box) => {
      values[box.name] = box.checked;
    });
    return values;
  }

  function fillForm(form, values) {
    Object.entries(values).forEach(([name, value]) => {
      const field = form.elements[name];
      if (!field) return;
      if (field.type === 'checkbox') field.checked = Boolean(value);
      else if (field.type !== 'file') field.value = value ?? '';
    });
  }

  function setOptions(container, values, selected) {
    container.replaceChildren(
      ...values.map((value) => {
        const option = new Option(value, value);
        if (container.tagName === 'SELECT') option.selected = value === selected;
        return option;
      }),
    );
  }

  function download(filename, blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  Aureon.dom = Object.freeze({
    $,
    $$,
    clone,
    slots,
    mount,
    toggle,
    emptyState,
    emptyRow,
    readForm,
    fillForm,
    setOptions,
    download,
  });
})(window.Aureon);
