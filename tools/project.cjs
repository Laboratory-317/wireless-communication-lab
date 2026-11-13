#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const modern = path.join(root, 'quarto-site');
const output = path.join(root, '_site');
const version = name => fs.readFileSync(path.join(root, `.${name}-version`), 'utf8').trim();
const expected = { node: version('node'), python: version('python'), quarto: version('quarto') };

function nodeVersion() {
  if (process.versions.node.split('.')[0] !== expected.node) {
    throw new Error(`Нужен Node.js ${expected.node}.x; найден ${process.versions.node}.`);
  }
}

function resolveTool(name) {
  const override = process.env[name === 'quarto' ? 'QUARTO_BIN' : 'PYTHON_BIN'];
  const candidates = override ? [[override]] : name === 'quarto'
    ? [[process.platform === 'win32' ? 'quarto.exe' : 'quarto']]
    : [['python3'], ['python'], ...(process.platform === 'win32' ? [['py', '-' + expected.python]] : [])];
  const found = [];
  for (const [command, ...prefix] of candidates) {
    const result = spawnSync(command, [...prefix, '--version'], {
      cwd: root, encoding: 'utf8', windowsHide: true, timeout: 15000
    });
    if (result.error || result.status !== 0) continue;
    const actual = `${result.stdout || ''} ${result.stderr || ''}`.match(/\b\d+\.\d+\.\d+\b/)?.[0];
    if (!actual) continue;
    const matches = name === 'quarto' ? actual === expected.quarto : actual.startsWith(expected.python + '.');
    if (matches) return { command, prefix, actual };
    found.push(actual);
  }
  const setting = name === 'quarto' ? 'QUARTO_BIN' : 'PYTHON_BIN';
  throw new Error(`Нужен ${name === 'quarto' ? 'Quarto' : 'Python'} ${expected[name]}${name === 'python' ? '.x' : ''}.${found.length ? ` Найдено: ${found.join(', ')}.` : ''} Установите программу или задайте ${setting} в .env.`);
}

function run(command, args = [], cwd = root) {
  const result = spawnSync(command, args, {
    cwd, stdio: 'inherit', windowsHide: true,
    env: { ...process.env, LAB_AUTO_TRANSLATE: '0', PYTHONDONTWRITEBYTECODE: '1', PYTHONUTF8: '1' }
  });
  if (result.error) throw new Error(`Не удалось запустить ${path.basename(command)}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${path.basename(command)} завершился с кодом ${result.status ?? result.signal}.`);
}

const script = relative => run(process.execPath, [path.join(root, relative)]);
const invoke = (tool, args, cwd = root) => run(tool.command, [...tool.prefix, ...args], cwd);

function checkSources() {
  const folders = ['tools', 'js', 'quarto-site'];
  for (const folder of folders) {
    for (const file of fs.readdirSync(path.join(root, folder)).filter(name => /\.(?:c?js)$/.test(name))) {
      run(process.execPath, ['--check', path.join(root, folder, file)]);
    }
  }
  script('tools/check-publications.cjs');
  console.log('Синтаксис JavaScript и исходные списки публикаций проверены.');
}

function test() {
  const python = resolveTool('python');
  checkSources();
  invoke(python, ['-m', 'unittest', 'discover', '-s', 'tools', '-p', 'test_*.py']);
}

function build() {
  const quarto = resolveTool('quarto');
  script('tools/build-site.js');
  // Quarto resolves includes before pre-render on a fresh checkout.
  script('quarto-site/home-sections.cjs');
  invoke(quarto, ['render'], modern);
  script('tools/build-comparison.js');
  console.log('Готовый сайт: _site/');
}

function requireBuild() {
  if (!fs.existsSync(path.join(output, 'themes-preview/modern/ru/index.html'))) {
    throw new Error('Полная сборка не найдена. Сначала выполните: node tools/project.cjs build');
  }
}

function check() {
  requireBuild();
  script('tools/check-publications.cjs');
  script('tools/check-site.js');
  script('tools/check-comparison.js');
}

function port(args) {
  if (args.length && (args.length !== 2 || args[0] !== '--port')) throw new Error('Формат: preview|dev [--port 4321]');
  const value = Number(args[1] || process.env.PREVIEW_PORT || 4321);
  if (!Number.isInteger(value) || value < 1 || value > 65535) throw new Error('Порт должен быть целым числом от 1 до 65535.');
  return String(value);
}

function main() {
  const [command = 'help', ...args] = process.argv.slice(2);
  nodeVersion();
  if (fs.existsSync(path.join(root, '.env'))) process.loadEnvFile(path.join(root, '.env'));
  if (args.length && !['dev', 'preview'].includes(command)) throw new Error(`Команда ${command} не принимает параметры.`);
  switch (command) {
    case 'doctor': {
      console.log(`Node.js ${process.versions.node}: OK`);
      let failed = false;
      for (const name of ['quarto', 'python']) {
        try { const tool = resolveTool(name); console.log(`${name} ${tool.actual}: OK (${tool.command})`); }
        catch (error) { console.error(error.message); failed = true; }
      }
      if (failed) process.exitCode = 1;
      break;
    }
    case 'build': build(); break;
    case 'check': check(); break;
    case 'check:sources': checkSources(); break;
    case 'test': test(); break;
    case 'validate': test(); build(); check(); break;
    case 'dev': {
      const quarto = resolveTool('quarto'), selectedPort = port(args);
      script('quarto-site/home-sections.cjs');
      invoke(quarto, ['preview', '--host', '127.0.0.1', '--port', selectedPort, '--no-browser'], modern);
      break;
    }
    case 'preview': {
      requireBuild();
      const selectedPort = port(args);
      console.log(`Новое оформление: http://127.0.0.1:${selectedPort}/themes-preview/modern/ru/`);
      console.log(`Прежнее оформление: http://127.0.0.1:${selectedPort}/themes-preview/journal/`);
      invoke(resolveTool('python'), ['-m', 'http.server', selectedPort, '--bind', '127.0.0.1', '--directory', output]);
      break;
    }
    case 'scholar:check': invoke(resolveTool('python'), ['tools/sync-scholar.py', '--dry-run']); break;
    case 'scholar:sync': invoke(resolveTool('python'), ['tools/sync-scholar.py']); break;
    case 'help':
    case '--help':
      console.log('node tools/project.cjs <команда>\n\n' +
        'doctor         Проверить Node.js, Quarto и Python\n' +
        'dev            Quarto с обновлением при правках, только новое оформление\n' +
        'build          Собрать оба оформления в _site/\n' +
        'preview        Показать готовую сборку обоих оформлений\n' +
        'check:sources  Проверить синтаксис и согласованность библиографии\n' +
        'test           Проверить исходники и запустить тесты Python без сети\n' +
        'check          Проверить готовый сайт и внутренние ссылки\n' +
        'validate       test → build → check\n' +
        'scholar:check  Проверить внешние источники без записи файлов\n' +
        'scholar:sync   Обновить библиографию из внешних источников\n\n' +
        'dev и preview принимают --port 4321. Остановка: Ctrl+C.');
      break;
    default: throw new Error(`Неизвестная команда: ${command}. Справка: node tools/project.cjs help`);
  }
}

try { main(); }
catch (error) { console.error(error.message); process.exitCode = 1; }
