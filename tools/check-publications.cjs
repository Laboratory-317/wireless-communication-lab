'use strict';

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function archive(relative) {
  const lines = fs.readFileSync(path.join(root, relative), 'utf8').split(/\r?\n/);
  const entries = [], years = new Set(), identifiers = new Map();
  let year = null, previousYear = Infinity;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();
    const heading = line.match(/^### (\d{4})$/);
    if (heading) {
      year = Number(heading[1]);
      if (year >= previousYear || years.has(year)) throw new Error(`${relative}:${index + 1}: годы должны идти от новых к старым без повторов.`);
      years.add(year);
      previousYear = year;
    }
    if (!year || !line.startsWith('- **')) continue;
    const title = line.match(/^- \*\*(.+?)\*\*/)?.[1];
    if (!title) throw new Error(`${relative}:${index + 1}: не найдено название публикации.`);
    const keys = [...new Set([...line.matchAll(/10\.\d{4,9}\/[^\s)<>]+/gi)].map(match => match[0].replace(/[.,;]+$/, '').toLowerCase()))];
    keys.push(`${year}:${title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()}`);
    for (const key of keys) {
      if (identifiers.has(key)) throw new Error(`${relative}:${index + 1}: повтор публикации (${key}); первая запись в строке ${identifiers.get(key)}.`);
      identifiers.set(key, index + 1);
    }
    entries.push({ year, line });
  }
  if (!entries.length) throw new Error(`${relative}: архив публикаций пуст.`);
  return entries;
}

function allCitations(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8').split(/\r?\n/).map(line => line.trim()).filter(line => line.startsWith('- **'));
}

try {
  const counts = [];
  for (const lang of ['ru', 'en']) {
    const classic = `content/publications/${lang}.md`, modern = `quarto-site/${lang}/publications.qmd`;
    const a = archive(classic), b = archive(modern);
    const left = allCitations(classic), right = allCitations(modern);
    const mismatch = left.findIndex((line, index) => line !== right[index]);
    if (left.length !== right.length || mismatch !== -1 || JSON.stringify(a) !== JSON.stringify(b)) {
      throw new Error(`Библиография ${lang.toUpperCase()} расходится между ${classic} и ${modern}${mismatch === -1 ? '' : `; запись № ${mismatch + 1}`}.`);
    }
    counts.push(a.length);
    console.log(`${lang.toUpperCase()}: ${a.length} публикаций; оба оформления согласованы, повторов DOI нет.`);
  }
  if (counts[0] !== counts[1]) throw new Error('Количество публикаций в RU и EN различается. Проверьте обе языковые версии.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
