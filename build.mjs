import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, watch, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(root, 'src');
const entry = resolve(srcDir, 'index.template.html');
const output = resolve(root, 'index.html');
const distDir = resolve(root, 'dist');

const DEPLOY_ENTRIES = ['index.html', 'css', 'js', 'vendor', 'assets', 'img'];

const INCLUDE = /^([ \t]*)<!--\s*@include\s+(\S+)\s*-->[ \t]*$/gm;
const BANNER =
  '<!-- GERADO por build.mjs a partir de src/. Não edite este arquivo: edite src/ e rode "node build.mjs". -->\n';

function expand(source, stack = []) {
  return source.replace(INCLUDE, (_, indent, file) => {
    const path = resolve(srcDir, file);
    if (stack.includes(path)) throw new Error(`Include circular: ${file}`);
    const content = readFileSync(path, 'utf8').replace(/\s+$/, '');
    return expand(content, [...stack, path])
      .split('\n')
      .map((line) => (line ? indent + line : line))
      .join('\n');
  });
}

const render = () => expand(readFileSync(entry, 'utf8')).replace('<!DOCTYPE html>\n', `<!DOCTYPE html>\n${BANNER}`);

function build() {
  writeFileSync(output, render());
  console.log(`✔ index.html gerado (${new Date().toLocaleTimeString('pt-BR')})`);
}

function buildDist() {
  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true });
  DEPLOY_ENTRIES.filter((name) => existsSync(resolve(root, name))).forEach((name) => {
    cpSync(resolve(root, name), resolve(distDir, name), {
      recursive: true,
      filter: (path) => !path.endsWith('.gitkeep'),
    });
  });
  console.log('✔ dist/ gerado para publicação');
}

function check() {
  const current = existsSync(output) ? readFileSync(output, 'utf8') : '';
  if (current !== render()) {
    console.error('✖ index.html está desatualizado em relação a src/. Rode "node build.mjs" e faça o commit.');
    process.exit(1);
  }
  console.log('✔ index.html está em dia com src/');
}

const args = process.argv.slice(2);

if (args.includes('--check')) {
  check();
} else {
  build();
  if (args.includes('--dist')) buildDist();

  if (args.includes('--watch')) {
    let timer;
    watch(srcDir, { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          build();
        } catch (error) {
          console.error('✖', error.message);
        }
      }, 80);
    });
    console.log('Observando src/ ... (Ctrl+C para sair)');
  }
}
