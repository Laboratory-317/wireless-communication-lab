// Publish only Modern; archived design sources never enter the public artifact.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'quarto-site', '_site');
const output = path.join(root, '_site');
for (const file of ['index.html', 'ru/index.html', 'en/index.html', 'search.json']) {
  if (!fs.existsSync(path.join(source, file))) throw new Error(`Missing Quarto output: ${file}`);
}
if (path.dirname(output) !== root || path.basename(output) !== '_site') throw new Error('Unsafe output directory');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output);
fs.cpSync(source, path.join(output, 'themes-preview', 'modern'), { recursive: true });
fs.copyFileSync(path.join(root, 'index.html'), path.join(output, 'index.html'));
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log('Published build contains only the Modern design, RU/EN.');
