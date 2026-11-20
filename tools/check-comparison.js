const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', '_site');
const modern = path.join(root, 'themes-preview', 'modern');
assert.deepEqual(fs.readdirSync(path.join(root, 'themes-preview')), ['modern']);
let pages = 0, links = 0;
function walk(folder) {
  for (const item of fs.readdirSync(folder, {withFileTypes: true})) {
    const file = path.join(folder, item.name);
    assert(!/^cv(?:[.-]|$)/i.test(item.name), `CV published: ${file}`);
    if (item.isDirectory()) { walk(file); continue; }
    if (!item.name.endsWith('.html')) continue;
    const html = fs.readFileSync(file, 'utf8');
    pages++;
    assert(!/design-compare|data-(?:classic|modern|scientific)-design|href="[^"\n]*\bcv(?:[.-]|\/)/i.test(html), `Removed interface in ${file}`);
    for (const [,ref] of html.matchAll(/(?:href|src)="([^"<>]+)"/g)) {
      if (/^(?:[a-z]+:|\/\/|#)/i.test(ref)) continue;
      const clean = decodeURIComponent(ref.replaceAll('&amp;', '&').split(/[?#]/)[0]);
      if (!clean) continue;
      const target = path.resolve(path.dirname(file), clean);
      assert(target === root || target.startsWith(root + path.sep), `Link escapes site: ${ref}`);
      assert(fs.existsSync(target), `Missing target in ${path.relative(root,file)}: ${ref}`);
      links++;
    }
  }
}
walk(root);
for (const lang of ['ru', 'en']) {
  for (const name of ['index', 'people', 'research', 'publications']) {
    assert(fs.readFileSync(path.join(modern, lang, `${name}.html`), 'utf8').includes('site-header'));
  }
}
assert(!/"href"\s*:\s*"[^"\n]*\bcv[.-]/i.test(fs.readFileSync(path.join(modern, 'search.json'), 'utf8')), 'CV in search');
const entry = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(entry.includes('themes-preview/modern/ru/'));
assert(!entry.includes('journal'));
console.log(`Checked ${pages} Modern HTML pages and ${links} local references; no CV or alternate designs.`);
