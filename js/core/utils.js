(function (Aureon) {
  'use strict';

  const brlFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const shortBrlFormat = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  const brl = (value) => brlFormat.format(Number(value) || 0);
  const shortBRL = (value) => shortBrlFormat.format(Number(value) || 0);
  const pad2 = (n) => String(n).padStart(2, '0');
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const percentOf = (part, total) => (total ? (part / total) * 100 : 0);

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  function iso(date) {
    return date ? `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}` : '';
  }

  const dateText = (date) => (date ? date.toLocaleDateString('pt-BR') : '—');


  function parseDate(value) {
    if (value instanceof Date) {
      return isNaN(value) ? null : new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }
    if (typeof value === 'number') {
      const parts = XLSX.SSF.parse_date_code(value);
      return parts ? new Date(parts.y, parts.m - 1, parts.d) : null;
    }
    if (!value) return null;

    const text = String(value).trim();

    let match = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
    if (match) return new Date(+match[3], +match[2] - 1, +match[1]);

    match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) return new Date(+match[1], +match[2] - 1, +match[3]);

    const parsed = new Date(text);
    return isNaN(parsed) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  function moneyNum(value) {
    if (typeof value === 'number') return value;

    let text = String(value ?? '0')
      .trim()
      .replace(/[R$\s]/g, '')
      .replace(/[\u2212\u2013]/g, '-');
    const accounting = /^\(.*\)$/.test(text) || /-$/.test(text);
    text = text.replace(/[()]/g, '').replace(/-$/, '');

    if (text.includes(',') && text.includes('.')) text = text.replace(/\./g, '').replace(',', '.');
    else if (text.includes(',')) text = text.replace(',', '.');
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(text)) text = text.replace(/\./g, '');

    const number = Number(text) || 0;
    return accounting ? -Math.abs(number) : number;
  }

  const keyOf = (text) =>
    String(text)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9%]/g, '');

  const fold = (text) =>
    String(text ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  function pick(row, ...names) {
    const byKey = {};
    Object.keys(row).forEach((key) => {
      byKey[keyOf(key)] = row[key];
    });
    for (const name of names) {
      const value = byKey[keyOf(name)];
      if (value !== undefined && value !== '') return value;
    }
    return '';
  }

  function imageSrc(url) {
    const value = String(url || '').trim();
    if (!value || /^data:/i.test(value)) return value;

    const drive =
      value.match(/drive\.google\.com\/file\/d\/([\w-]+)/) ||
      value.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([\w-]+)/);
    if (drive) return `https://drive.google.com/thumbnail?id=${drive[1]}&sz=w1200`;

    if (/dropbox\.com\//i.test(value)) return value.replace(/([?&])dl=0/, '$1raw=1');
    if (!/^https?:/i.test(value)) return value.replace(/\\/g, '/');
    return value;
  }

  function greeting(date = new Date()) {
    const minutes = date.getHours() * 60 + date.getMinutes();
    if (minutes <= 12 * 60) return 'Bom dia';
    return minutes <= 18 * 60 ? 'Boa tarde' : 'Boa noite';
  }

  const capitalize = (text) => (text ? text.charAt(0).toLocaleUpperCase('pt-BR') + text.slice(1) : '');

  const initialOf = (name) => (String(name || '').trim()[0] || '·').toUpperCase();

  const compareText = (a, b) => String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base' });

  Aureon.utils = Object.freeze({
    brl,
    shortBRL,
    pad2,
    clamp,
    percentOf,
    uid,
    iso,
    dateText,
    parseDate,
    moneyNum,
    keyOf,
    fold,
    pick,
    imageSrc,
    greeting,
    initialOf,
    capitalize,
    compareText,
  });
})(window.Aureon);
