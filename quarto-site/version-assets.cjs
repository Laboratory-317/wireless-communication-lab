// Refresh browser caches whenever shared styles or theme behavior change.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const output = path.join(__dirname, '_site');
const versions = Object.fromEntries(['home.css', 'site.css', 'home-theme.js'].map(name => [
  name, createHash('sha256').update(fs.readFileSync(path.join(output, name))).digest('hex').slice(0, 12)
]));
for (const directory of ['', 'ru', 'en']) {
  const folder = path.join(output, directory);
  for (const name of fs.readdirSync(folder).filter(name => name.endsWith('.html'))) {
    const file = path.join(folder, name);
    const source = fs.readFileSync(file, 'utf8');
    const versioned = source.replace(/\b(href|src)="([^"?]*\b(home\.css|site\.css|home-theme\.js))(?:\?[^"\s]*)?"/g,
      (_, attribute, url, asset) => `${attribute}="${url}?v=${versions[asset]}"`);
    if (source !== versioned) fs.writeFileSync(file, versioned);
  }
}
