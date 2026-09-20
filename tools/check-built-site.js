// Check the actual Pages artifact, including content available without JavaScript.
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '../_site');
function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const files = walk(root);
const names = new Set(files.map((file) => path.relative(root, file).split(path.sep).join('/')));
const pages = files.filter((file) => file.endsWith('.html'));
assert.equal(pages.length, 37, 'Expected selector and nine pages in each of four themes');
for (const file of pages) {
  const markup = fs.readFileSync(file, 'utf8');
  assert.equal((markup.match(/<h1(?:\s|>)/g) || []).length, 1, `One primary heading: ${file}`);
  assert(/<main[^>]*>[\s\S]*<h[12]/.test(markup), `Static content missing: ${file}`);
  assert(markup.includes('name="description"'), `Description missing: ${file}`);
  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, new Set(ids).size, `Duplicate element IDs: ${file}`);
  for (const match of markup.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const href = match[1].replace(/&amp;/g, '&');
    if (/^(?:[a-z]+:|\/\/|#)/i.test(href)) continue;
    const relative = decodeURIComponent(href.split(/[?#]/)[0]);
    const target = path.resolve(path.dirname(file), relative || '.');
    const name = path.relative(root, target).split(path.sep).join('/');
    assert(!name.startsWith('../'), `Link escapes the artifact: ${href}`);
    // Exact-case matching catches Linux deployment failures on Windows.
    assert(names.has(name) || names.has(`${name}/index.html`), `Missing or wrong-case asset: ${file}: ${href}`);
  }
}
for (const file of files.filter((file) => file.endsWith('.pdf'))) {
  assert.equal(fs.readFileSync(file).subarray(0, 5).toString(), '%PDF-', `Invalid PDF: ${file}`);
}
for (const name of ['content', 'state', 'tools', '.git', 'AGENTS.md', 'README.md']) {
  assert(!fs.existsSync(path.join(root, name)), `Private project material in artifact: ${name}`);
}
console.log(`Passed: ${pages.length} pre-rendered pages, exact-case asset links, PDF signatures and publication boundaries.`);
