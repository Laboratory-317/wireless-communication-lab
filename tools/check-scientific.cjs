'use strict';
// These checks guard the third design's most important contracts: unchanged
// source records, complete route coverage and isolated presentation assets.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { readPage, archiveIds } = require('../scientific-site/prepare.cjs');
const output = path.join(root, '_site/themes-preview/scientific');
const read = file => fs.readFileSync(file, 'utf8');
let count = 0;
for (const lang of ['ru', 'en']) {
  const names = fs.readdirSync(path.join(root, 'quarto-site', lang)).filter(n => n.endsWith('.qmd') && !n.startsWith('_')).sort();
  for (const name of names) {
    const page = name.slice(0, -4);
    const html = read(path.join(output, lang, page + '.html'));
    const generated = read(path.join(root, 'scientific-site/.generated', lang, name));
    assert.match(html, new RegExp(`<html[^>]*lang="${lang}"`));
    assert.match(html, /scientific\.css/);
    assert.match(html, /scientific\.js/);
    assert.doesNotMatch(html, /(?:href|src)="[^\"]*(?:home\.css|site\.css|home-theme\.js)/);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, `${lang}/${page}: expected one h1`);
    for (const design of ['classic', 'modern', 'scientific']) assert(html.includes(`data-sc-design="${design}"`));
    assert(html.includes(`../${lang === 'ru' ? 'en' : 'ru'}/${page}.html`));
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, `${lang}/${page}: duplicate IDs`);
    if (page === 'projects') {
      const sourceRecords = readPage(lang, page).body.split('\n').filter(l => l.startsWith('- '));
      const generatedRecords = generated.split('\n').filter(l => l.startsWith('- '));
      assert.deepEqual(generatedRecords, sourceRecords, `${lang}: project records changed`);
      assert.equal((html.match(/class="project-program"/g) || []).length, archiveIds.length);
      for (const id of archiveIds) assert(html.includes(`id="${id}"`));
      assert.equal((html.match(/class="sc-project sc-project-/g) || []).length, 5);
    }
    // All unaffected scientific prose and records must survive byte-for-byte
    // in the generated source. Only the presentation surrounds them.
    if (!['index', 'research', 'media', 'projects', 'students'].includes(page) && !page.startsWith('research-')) {
      assert(generated.includes(readPage(lang, page).body), `${lang}/${page}: canonical content changed`);
    }
    count++;
  }
  const scientificNames = fs.readdirSync(path.join(output, lang)).filter(n => n.endsWith('.html')).sort();
  assert.deepEqual(scientificNames, names.map(n => n.replace('.qmd', '.html')));
  const modern = read(path.join(root, '_site/themes-preview/modern', lang, 'index.html'));
  assert.doesNotMatch(modern, /(?:href|src)="[^\"]*scientific\.(?:css|js)/);
}
const script = read(path.join(output, 'scientific.js'));
assert(script.includes("localStorage.getItem('lab-theme')"));
assert(read(path.join(output, 'scientific.css')).includes('prefers-reduced-motion'));
assert.equal(read(path.join(root, 'scientific-site/.generated/navigation.html')), read(path.join(root, 'quarto-site/navigation.html')), 'Shared publication filter must remain unchanged');
console.log(`Scientific: ${count} localized pages, exact publication/project sources, three designs and isolated assets verified.`);
