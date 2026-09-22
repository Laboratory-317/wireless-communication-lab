// Check navigation, published assets and research news without external packages.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/lab-content.js'), 'utf8'), context);
const model = context.window.LAB_CONTENT;
const renderer = fs.readFileSync(path.join(root, 'js/render-theme.js'), 'utf8');

function render(page, language) {
  const app = { innerHTML: '', querySelectorAll: () => [] };
  const document = {
    querySelector: () => app, body: { dataset: { page } }, documentElement: {}, title: ''
  };
  vm.runInNewContext(renderer, {
    document, URL, URLSearchParams,
    window: { LAB_CONTENT: model, location: { search: `?lang=${language}`, href: 'https://example.org/index.html' }, localStorage: { getItem: () => null } }
  });
  return { markup: app.innerHTML, title: document.title };
}

for (const language of ['ru', 'en']) {
  const data = model.languages[language];
  const home = render('home', language).markup;
  assert(home.includes('section-news'));
  assert(!home.includes('interest-list'));
  assert(home.indexOf('href="index.html"') < home.indexOf('href="research.html"'));
  assert(home.indexOf('href="research.html"') < home.indexOf('href="education.html"'));
  assert(!home.includes('site-footer'));
  assert(!home.includes('color-mode-control'));
  const research = render('research', language).markup;
  assert.equal(data.researchInterests.length, 4);
  for (const area of data.researchInterests) {
    const href = `research-${area.slug}.html`;
    assert(research.includes(`href="${href}"`));
    const detail = render(`research-${area.slug}`, language);
    assert(detail.title.startsWith(area.title));
    assert(detail.markup.includes('section-news'));
    assert(detail.markup.includes('href="research.html" aria-current="page"'));
  }
  const education = render('education', language).markup;
  assert.equal((education.match(/class="course-item"/g) || []).length, 3);
  assert.equal((education.match(/class="course-duration"/g) || []).length, 3);
  assert.equal((education.match(/https:\/\/engineers\.tusur\.ru\/courses\//g) || []).length, 3);
  assert(!/Стоимость|Funding:|RUB |Price:/.test(education));
  assert(!/Научные интересы:|Research interests:/.test(render('people', language).markup));
  for (const profile of data.cvProfiles.filter((item) => ['kryukov', 'pokamestov'].includes(item.slug))) {
    assert(!/Научные интересы:|Research interests:/.test(profile.summary));
  }

  // An entry can belong to several areas; general news belongs only on the home page.
  const original = data.newsItems;
  data.newsItems = [
    { title: 'Tagged news fixture', text: 'Test content', date: '2026-09-22', directions: ['polar', 'access'] },
    { title: 'General news fixture', text: 'Test content', date: '2026-09-21', directions: [] }
  ];
  assert(render('home', language).markup.includes('General news fixture'));
  assert(render('home', language).markup.includes('Tagged news fixture'));
  for (const slug of ['polar', 'access', 'wireless', 'metasurfaces']) {
    const detail = render(`research-${slug}`, language).markup;
    assert.equal(detail.includes('Tagged news fixture'), ['polar', 'access'].includes(slug));
    assert(!detail.includes('General news fixture'));
  }
  data.newsItems = original;
}

const output = path.join(root, '_site/themes-preview/journal');
const pages = fs.readdirSync(output).filter((file) => file.endsWith('.html'));
assert.equal(pages.length, 13);
for (const file of pages) {
  const markup = fs.readFileSync(path.join(output, file), 'utf8');
  assert(markup.includes('data-color-mode="light"'));
  assert(!markup.includes('js/color-mode.js'));
  assert(!markup.includes('site-footer'));
  assert(!/Объем финансирования|Funding: RUB/.test(markup));
  for (const match of markup.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = match[1];
    if (/^(?:[a-z]+:|\/\/|#)/i.test(url)) continue;
    const target = decodeURI(url.split(/[?#]/)[0]);
    assert(fs.existsSync(path.resolve(output, target)), `Broken link in ${file}: ${url}`);
  }
}
console.log(`Checked ${pages.length} built pages, RU/EN navigation, courses and research news filtering.`);
