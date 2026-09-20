// Dependency-free render and local-link checks for all themes and languages.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
const dataContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/lab-content.js'), 'utf8'), dataContext);
const model = dataContext.window.LAB_CONTENT;
const renderer = fs.readFileSync(path.join(root, 'js/render-theme.js'), 'utf8');
const pages = ['index', 'people', 'students', 'projects', 'patents', 'publications', 'media', 'news', 'cv'];
const failures = [];
let renders = 0;

function checkLinks(markup, file) {
  for (const match of markup.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const href = match[1].replace(/&amp;/g, '&');
    if (/^(?:[a-z]+:|\/\/|#)/i.test(href)) continue;
    const relative = decodeURI(href.split(/[?#]/)[0]);
    const target = path.resolve(path.dirname(file), relative || '.');
    if (!fs.existsSync(target)) failures.push(`${path.relative(root, file)}: missing ${href}`);
  }
}

for (const theme of model.themes) {
  for (const language of Object.keys(model.languages)) {
    for (const name of pages) {
      const file = path.join(root, theme.href, `${name}.html`);
      assert(fs.existsSync(file), `Missing ${file}`);
      const shell = fs.readFileSync(file, 'utf8');
      checkLinks(shell, file);
      const profiles = name === 'cv' ? model.languages[language].cvProfiles : [null];
      for (const profile of profiles) {
        const app = { innerHTML: '', querySelectorAll: () => [] };
        const document = {
          querySelector: () => app,
          body: { dataset: { page: name === 'index' ? 'home' : name, themeName: theme.key } },
          documentElement: {}, title: ''
        };
        const search = `?lang=${language}${profile ? `&person=${profile.slug}` : ''}`;
        vm.runInNewContext(renderer, {
          document, URL, URLSearchParams,
          window: {
            LAB_CONTENT: model,
            location: { search, href: `https://example.org/lab/${theme.href}${name}.html${search}` },
            localStorage: { getItem: () => null }
          }
        });
        assert.equal(document.documentElement.lang, language);
        assert(app.innerHTML.includes('<main'), `Empty ${file}`);
        assert(!/\bTODO\b|undefined|>заглушка<|>placeholder</i.test(app.innerHTML), `Placeholder in ${file}`);
        assert(!app.innerHTML.includes('https://example.com'), `Example link in ${file}`);
        if (profile) assert(app.innerHTML.includes(profile.name), `Wrong CV ${profile.slug}`);
        if (name === 'people') {
          const content = model.languages[language];
          assert(app.innerHTML.includes(content.missingPhoto), 'Missing-photo label must be visible');
          assert(app.innerHTML.includes(content.missingData), 'Unknown contact must remain visible');
          assert(app.innerHTML.includes(content.missingBiography), 'Unknown interests must remain visible');
        }
        if (name === 'index') assert.equal((app.innerHTML.match(/class="interest-image"/g) || []).length, 4);
        checkLinks(app.innerHTML, file);
        renders++;
      }
    }
  }
}

for (const theme of model.themes) {
  const cssFile = path.join(root, theme.href, 'style.css');
  const css = fs.readFileSync(cssFile, 'utf8');
  assert(css.includes('theme-base.css'), `Missing common CSS: ${cssFile}`);
}
assert.equal(model.themes.length, 4);
for (const content of Object.values(model.languages)) {
  for (const profile of content.cvProfiles) {
    assert(/Научные интересы:|Research interests:/.test(profile.summary), `Research-interest lead must remain visible: ${profile.slug}`);
    for (const section of profile.sections) {
      assert(!profile.summary.includes(section.text), `CV summary duplicates section: ${profile.slug}`);
    }
  }
}
const litvinov = model.languages.ru.peopleGroups.flatMap((group) => group.people)
  .find((person) => person.name.includes('Литвинов'));
assert(litvinov.description.includes('Кандидат'), 'Bulleted biography must remain visible');
assert(!litvinov.contacts.some((contact) => contact.label.includes('Кандидат')), 'Biography is not a contact');
if (failures.length) throw new Error([...new Set(failures)].join('\n'));
console.log(`Passed: ${renders} theme/language/page renders, all local content links and images exist.`);
