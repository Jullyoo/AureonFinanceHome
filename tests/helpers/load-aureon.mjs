import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const MODULES = [
  'js/core/namespace.js',
  'js/core/config.js',
  'js/core/utils.js',
  'js/core/events.js',
  'js/core/dom.js',
  'js/core/persistence.js',
  'js/data/vocabulary.js',
  'js/data/normalizers.js',
  'js/data/schema.js',
  'js/data/excel-io.js',
  'js/core/store.js',
  'js/services/filters.js',
  'js/services/finance.js',
  'js/services/repository.js',
];

export function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    removeItem: (key) => {
      delete data[key];
    },
    dump: () => ({ ...data }),
  };
}

export function loadAureon({ storage = fakeStorage() } = {}) {
  const sandbox = { console, localStorage: storage, setTimeout, clearTimeout };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  const run = (file) => vm.runInContext(readFileSync(resolve(root, file), 'utf8'), sandbox, { filename: file });
  run('vendor/xlsx.full.min.js');
  MODULES.forEach(run);
  const toSandboxBuffer = (nodeBuffer) => {
    const bytes = vm.runInContext(`new Uint8Array(${nodeBuffer.length})`, sandbox);
    bytes.set(nodeBuffer);
    return bytes.buffer;
  };

  return { Aureon: sandbox.Aureon, XLSX: sandbox.XLSX, storage, toSandboxBuffer };
}

export function workbookFile(XLSX, sheets, name = 'teste.xlsx') {
  const book = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([sheet, rows]) =>
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), sheet),
  );
  const bytes = XLSX.write(book, { type: 'array', bookType: 'xlsx' });
  return { name, arrayBuffer: async () => new Uint8Array(bytes).buffer };
}

export const rootDir = root;
