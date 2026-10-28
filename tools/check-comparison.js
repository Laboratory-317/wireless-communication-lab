const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', '_site');
let pages = 0;
let links = 0;
function walk(folder) {
  for (const item of fs.readdirSync(folder, {withFileTypes:true})) {
    const file = path.join(folder, item.name);
    if (item.isDirectory()) { walk(file); continue; }
    if (!item.name.endsWith('.html')) continue;
    const html = fs.readFileSync(file, 'utf8');
    pages++;
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
for (const lang of ['ru','en']) {
  const modern = path.join(root,'themes-preview','modern',lang,'index.html');
  const html = fs.readFileSync(modern,'utf8');
  assert(html.includes('data-classic-design'));
  assert(html.includes('data-modern-design'));
}
const classic = fs.readFileSync(path.join(root,'themes-preview','journal','index.html'),'utf8');
assert(classic.includes('../modern/ru/index.html'));
assert(classic.includes('design-compare'));
console.log(`Checked ${pages} HTML pages and ${links} local references across both designs.`);
