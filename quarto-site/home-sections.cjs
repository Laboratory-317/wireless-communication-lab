// Homepage updates come from the publication archive and news source pages.
const fs = require('node:fs');
const path = require('node:path');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
for (const lang of ['ru', 'en']) {
  const read = name => fs.readFileSync(path.join(__dirname, lang, name), 'utf8');
  const ru = lang === 'ru';
  const archive = read('publications.qmd').split(ru ? '## Все публикации' : '## All publications')[1];
  if (!archive) throw new Error(`Missing ${lang} publication archive`);
  const groups = [...archive.matchAll(/### (\d{4})\s*\n([\s\S]*?)(?=\n### |$)/g)].sort((a,b) => Number(b[1])-Number(a[1]));
  const latest = groups.flatMap(group => group[2].split('\n').filter(line => line.startsWith('- **')).map(line => ({year:group[1], line}))).slice(0, 2);
  if (latest.length !== 2) throw new Error('Expected at least two publications');
  const papers = latest.map(({year,line}) => {
    const title = line.match(/^- \*\*(.+?)\*\*/)[1];
    return `<article class="home-update"><small>${year}</small><a href="publications.html">${escape(title)}</a></article>`;
  }).join('');
  const news = read('news.qmd');
  const newsItems = [...news.matchAll(/::: \{\.news-date\}\s*(\d{4}-\d{2}-\d{2})\s*:::\s*### ([^\n]+)/g)].sort((a,b) => b[1].localeCompare(a[1])).slice(0,2);
  if (!newsItems.length) throw new Error(`Missing ${lang} news entries`);
  const events = newsItems.map(([,date,title]) => {
    const formatted = new Intl.DateTimeFormat(ru ? 'ru-RU' : 'en-GB', {day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(date+'T00:00:00Z'));
    return `<article class="home-update"><time datetime="${date}">${escape(formatted)}</time><a href="news.html">${escape(title.trim())}</a></article>`;
  }).join('');
  const out = `<section class="home-block" aria-labelledby="updates"><div class="home-section-heading"><h2 id="updates">${ru ? 'Публикации и новости' : 'Publications and news'}</h2></div><div class="home-updates"><div class="home-update-panel"><h3>${ru ? 'Научные публикации' : 'Research publications'}</h3><p>${ru ? 'Статьи и материалы научных конференций.' : 'Journal articles and conference papers.'}</p>${papers}<a class="home-more" href="publications.html">${ru ? 'Все публикации' : 'All publications'} →</a></div><div class="home-update-panel"><h3>${ru ? 'Новости лаборатории' : 'Laboratory news'}</h3><p>${ru ? 'Доклады, конференции и события лаборатории.' : 'Presentations, conferences and laboratory updates.'}</p>${events}<a class="home-more" href="news.html">${ru ? 'Все новости' : 'All news'} →</a></div></div></section>\n`;
  const target = path.join(__dirname, lang, '_home-sections.qmd');
  if (!fs.existsSync(target) || fs.readFileSync(target,'utf8') !== out) fs.writeFileSync(target,out);
}
