// Publish only the public site. No packages, external services or network required.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');
execFileSync(process.execPath, [path.join(__dirname, 'build-diagrams.js')], { stdio: 'inherit' });
execFileSync(process.execPath, [path.join(__dirname, 'build-content.js')], { stdio: 'inherit' });
execFileSync(process.execPath, [path.join(__dirname, 'check-site.js')], { stdio: 'inherit' });
// _site is disposable generated output, never a source directory.
if (path.dirname(output) !== root || path.basename(output) !== '_site') throw new Error('Unsafe output directory');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output);
function copy(relative) {
  const destination = path.join(output, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(path.join(root, relative), destination, { recursive: true });
}
['index.html', 'css', 'js', 'assets', 'labicon.png'].forEach(copy);
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/lab-content.js'), 'utf8'), context);
const model = context.window.LAB_CONTENT;
model.themes.forEach((theme) => copy(theme.href));
// Obsidian image attachments currently live at repository root.
for (const name of fs.readdirSync(root)) {
  if (/\.(png|jpe?g|webp|svg)$/i.test(name) && name !== 'labicon.png') copy(name);
}
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log('Built _site/ for GitHub Pages. Source Markdown and internal documentation are not published.');
