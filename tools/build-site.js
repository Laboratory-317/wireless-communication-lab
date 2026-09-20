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
model.themes.forEach((theme) => {
  copy(theme.href);
  fs.copyFileSync(path.join(root, 'labicon.png'), path.join(output, theme.href, 'labicon.png'));
});
// Copy only root image attachments referenced by public content.
function copyAttachments(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if ((key === 'src' || key === 'photo') && typeof item === 'string' &&
        /\.(png|jpe?g|webp|svg)$/i.test(item) && path.basename(item) === item) copy(item);
    else if (item && typeof item === 'object') copyAttachments(item);
  }
}
copyAttachments(model.languages);
// Render the default-language content at build time using the shared renderer.
// JavaScript enhances these documents with language and individual CV selection.
const renderer = fs.readFileSync(path.join(root, 'js/render-theme.js'), 'utf8');
const rootRenderer = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
const escape = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
function renderDocument(shell, isRoot, search = '') {
  const app = { innerHTML: '', querySelectorAll: () => [] };
  const document = {
    querySelector: () => app,
    body: { dataset: {
      page: shell.match(/data-page="([^"]+)"/)?.[1] || 'home',
      themeName: shell.match(/data-theme-name="([^"]+)"/)?.[1]
    } },
    documentElement: {}, title: ''
  };
  vm.runInNewContext(isRoot ? rootRenderer : renderer, {
    document, URL, URLSearchParams,
    window: { LAB_CONTENT: model, location: { search, href: 'https://build.invalid/index.html' }, localStorage: { getItem: () => null } }
  });
  return { markup: app.innerHTML, title: document.title };
}
const publicPages = ['index.html', ...model.themes.flatMap((theme) =>
  fs.readdirSync(path.join(output, theme.href)).filter((name) => name.endsWith('.html')).map((name) => theme.href + name)
)];
for (const relative of publicPages) {
  const file = path.join(output, relative);
  let shell = fs.readFileSync(file, 'utf8');
  const isRoot = relative === 'index.html';
  const rendered = renderDocument(shell, isRoot);
  if (relative.endsWith('/cv.html')) {
    // Query strings are not available to a static server: show all labelled CVs
    // without JavaScript, then let the client select the requested person.
    const profiles = model.languages[model.defaultLanguage].cvProfiles.map((profile) =>
      renderDocument(shell, false, `?person=${profile.slug}`).markup.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1]
    ).join('');
    rendered.markup = rendered.markup.replace(/(<main[^>]*>)[\s\S]*?(<\/main>)/, (_, start, end) => start + profiles + end);
  }
  shell = shell.replace(/(<(?:div|main)[^>]*data-render-(?:root|theme)[^>]*>)[\s\S]*?(<\/(?:div|main)>)/,
    (_, start, end) => start + rendered.markup + end);
  shell = shell.replace(/<html lang="[^"]*"/, `<html lang="${model.defaultLanguage}"`);
  shell = shell.replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(rendered.title)}</title>`);
  const content = model.languages[model.defaultLanguage];
  const description = `${content.labName}. ${content.tagline}. ${content.footer}.`;
  const prefix = isRoot ? '' : '../../';
  shell = shell.replace('</head>', `  <meta name="description" content="${escape(description)}">\n  <meta property="og:title" content="${escape(rendered.title)}">\n  <meta property="og:description" content="${escape(description)}">\n  <meta property="og:type" content="website">\n  <link rel="icon" href="${prefix}labicon.png" type="image/png">\n</head>`);
  shell = shell.replace('</body>', '<noscript><style>.language-switch,.color-mode-control{display:none}</style></noscript>\n</body>');
  if (!shell.includes('<h1') || shell.includes('undefined')) throw new Error(`Invalid prerender: ${relative}`);
  fs.writeFileSync(file, shell);
}
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log(`Pre-rendered ${publicPages.length} HTML pages in ${model.defaultLanguage}.`);
execFileSync(process.execPath, [path.join(__dirname, 'check-built-site.js')], { stdio: 'inherit' });
console.log('Built _site/ for GitHub Pages. Source Markdown and internal documentation are not published.');
