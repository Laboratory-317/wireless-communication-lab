// Keep the classic routes and publish the Quarto design beside them.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'quarto-site', '_site');
const destination = path.join(root, '_site', 'themes-preview', 'modern');
for (const file of ['index.html', 'ru/index.html', 'en/index.html', 'search.json']) {
  if (!fs.existsSync(path.join(source, file))) throw new Error(`Missing Quarto output: ${file}`);
}
fs.cpSync(source, destination, { recursive:true });
const scientific = path.join(root, 'scientific-site', '.generated', '_site');
for (const file of ['index.html', 'ru/index.html', 'en/index.html', 'search.json']) {
  if (!fs.existsSync(path.join(scientific, file))) throw new Error(`Missing Scientific output: ${file}`);
}
fs.cpSync(scientific, path.join(root, '_site', 'themes-preview', 'scientific'), { recursive:true });
console.log('Published build contains journal/, modern/ and scientific/ designs.');
