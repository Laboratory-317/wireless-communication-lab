'use strict';

// Prepare an independent Quarto project. Canonical scientific text stays in
// quarto-site; no source page in the other designs is rewritten here.
const fs = require('node:fs');
const path = require('node:path');
const { renderDiagram } = require('./diagrams.cjs');
const portfolio = require('./portfolio.cjs');
const source = path.resolve(__dirname, '../quarto-site');
const output = path.join(__dirname, '.generated');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const raw = html => '\n\n```{=html}\n' + html + '\n```\n\n';
const directions = [
  { page: 'research-access', kind: 'access', code: 'NOMA / SCMA / RSMA', ru: 'Множественный доступ', en: 'Multiple access' },
  { page: 'research-polar', kind: 'polar', code: 'POLAR / LDPC', ru: 'Помехоустойчивое кодирование', en: 'Channel coding' },
  { page: 'research-metasurfaces', kind: 'ris', code: 'RIS / STAR-RIS', ru: 'Интеллектуальные поверхности', en: 'Intelligent surfaces' },
  { page: 'research-wireless', kind: 'mimo', code: 'MIMO / PHY', ru: 'Многоантенные системы', en: 'Multi-antenna systems' }
];
const archiveIds = ['rsf', 'start-1', 'priority-2030', 'engineering-school', 'umnik', 'industry-contracts', 'individual-grants'];
function readPage(lang, page) {
  const text = fs.readFileSync(path.join(source, lang, `${page}.qmd`), 'utf8').replaceAll('\r\n', '\n');
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Missing JSON front matter: ${lang}/${page}`);
  return { meta: JSON.parse(match[1]), body: match[2].trim() };
}
const arrow = '<span aria-hidden="true">↗</span>';
const label = (ru, a, b) => ru ? a : b;
function icon(name) {
  const paths = { sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>', moon: '<path d="M20 14A8.5 8.5 0 0 1 10 4a8.5 8.5 0 1 0 10 10Z"/>', system: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>', search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>' };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
}
function header(lang, page) {
  const ru = lang === 'ru';
  const nav = [['research', 'Исследования', 'Research'], ['projects', 'Проекты', 'Projects'], ['people', 'Команда', 'People'], ['publications', 'Публикации', 'Publications'], ['students', 'Студентам', 'Join us']];
  const section = page.startsWith('research') ? 'research' : page.startsWith('cv') ? 'people' : page;
  const classicPage = page.startsWith('cv-') ? 'cv' : page === 'news' ? 'index' : page === 'media' ? 'research' : page;
  const classicQuery = new URLSearchParams({ lang });
  if (page.startsWith('cv-')) classicQuery.set('person', page.slice(3));
  return `<a class="sc-skip" href="#quarto-document-content">${label(ru, 'К содержанию', 'Skip to content')}</a>
<div class="sc-chrome"><div class="sc-edition"><span>${label(ru, 'ТУСУР · ЛАБОРАТОРИЯ БЕСПРОВОДНОЙ СВЯЗИ', 'TUSUR · WIRELESS COMMUNICATION LABORATORY')}</span><nav aria-label="${label(ru, 'Версия оформления', 'Site design')}"><span>${label(ru, 'Оформление', 'Design')}</span><a data-sc-design="classic" href="../../journal/${classicPage}.html?${classicQuery}${page === 'news' ? '#section-news' : ''}">${label(ru, 'Прежнее', 'Classic')}</a><a data-sc-design="modern" href="../../modern/${lang}/${page}.html">${label(ru, 'Новое', 'New')}</a><a data-sc-design="scientific" aria-current="page" href="${page}.html">${label(ru, 'Научная', 'Scientific')}</a></nav></div>
<header class="sc-header"><a class="sc-brand" href="index.html" aria-label="${label(ru, 'Лаборатория 317 — главная', 'Laboratory 317 — home')}"><img src="../labicon.png" width="36" height="36" alt=""><span>LAB <b>/ 317</b></span></a>
<button class="sc-menu" type="button" aria-expanded="false" aria-controls="sc-navigation">${label(ru, 'Меню', 'Menu')} <span aria-hidden="true">☰</span></button>
<nav class="sc-nav" id="sc-navigation" aria-label="${label(ru, 'Основные разделы', 'Main navigation')}">${nav.map(([href, a, b]) => `<a href="${href}.html"${section === href ? ' aria-current="page"' : ''}>${label(ru, a, b)}</a>`).join('')}</nav>
<div class="sc-controls"><button class="sc-search" type="button" data-sc-search aria-label="${label(ru, 'Поиск по сайту', 'Search the site')}">${icon('search')}</button><nav class="sc-languages" aria-label="${label(ru, 'Язык', 'Language')}">${['ru', 'en'].map(l => `<a data-sc-language="${l}" href="../${l}/${page}.html" lang="${l}" hreflang="${l}"${l === lang ? ' aria-current="page"' : ''}>${l.toUpperCase()}</a>`).join('')}</nav><div class="sc-themes" role="group" aria-label="${label(ru, 'Цветовая тема', 'Color theme')}">${[['light', 'sun', 'Светлая тема', 'Light theme'], ['dark', 'moon', 'Тёмная тема', 'Dark theme'], ['system', 'system', 'Как в системе', 'System theme']].map(([mode, symbol, a, b]) => `<button type="button" data-sc-theme="${mode}" aria-pressed="false" title="${label(ru, a, b)}" aria-label="${label(ru, a, b)}">${icon(symbol)}</button>`).join('')}</div></div></header></div>`;
}
function footer(lang) {
  const ru = lang === 'ru';
  return `<footer class="sc-footer" id="contacts"><div class="sc-footer-top"><div><a class="sc-footer-brand" href="index.html">LAB / 317</a><p>${label(ru, 'Лаборатория беспроводной связи', 'Wireless Communication Laboratory')}<br>${label(ru, 'ТУСУР · Томск', 'TUSUR · Tomsk')}</p></div><nav aria-label="${label(ru, 'Дополнительные разделы', 'More sections')}">${[['education', 'Образование', 'Education'], ['patents', 'Патенты и программы', 'Patents and software'], ['news', 'Новости', 'News'], ['media', 'Научные схемы', 'Scientific diagrams']].map(([url, a, b]) => `<a href="${url}.html">${label(ru, a, b)}</a>`).join('')}</nav><div><p>${label(ru, 'Томск, ул. Вершинина, 47<br>Аудитория 317', '47 Vershinina Street, Tomsk<br>Room 317')}</p><a href="mailto:laboratory317@gmail.com">laboratory317@gmail.com ${arrow}</a></div></div><div class="sc-footer-bottom"><span>${label(ru, 'Физический уровень беспроводной связи', 'The physical layer of wireless communications')}</span><span>${label(ru, 'Научная / Scientific', 'Scientific')} · LAB 317</span></div></footer>`;
}
function intro(lang, page, meta) {
  const ru = lang === 'ru';
  return `<header class="sc-page-intro"><div class="sc-kicker"><a href="index.html">LAB / 317</a><span>/</span>${label(ru, 'ИССЛЕДОВАНИЯ И РАЗРАБОТКИ', 'RESEARCH AND DEVELOPMENT')}</div><h1>${escape(meta.title)}</h1>${meta.description ? `<p>${escape(meta.description)}</p>` : ''}${page === 'projects' ? `<a class="sc-text-link" href="#project-archive">${label(ru, 'К архиву грантов и проектов', 'Explore the funding archive')} <span aria-hidden="true">↓</span></a>` : ''}</header>`;
}
function sectionHeading(id, number, title, href = '', more = '') {
  return `<div class="sc-section-heading"><div><span class="sc-kicker">${number}</span><h2 id="${id}">${title}</h2></div>${href ? `<a class="sc-text-link" href="${href}">${more} ${arrow}</a>` : ''}</div>`;
}
function researchGrid(lang) {
  return `<div class="sc-directions">${directions.map((d, i) => `<a class="sc-direction" href="${d.page}.html"><div class="sc-card-top"><span>0${i + 1}</span><span>${lang === 'ru' ? d.code.replace('POLAR', 'ПОЛЯРНЫЕ') : d.code}</span>${arrow}</div><div class="sc-direction-art">${renderDiagram(d.kind, lang, 'compact', `direction-${d.kind}`)}</div><div class="sc-direction-copy"><h3>${d[lang]}</h3><p>${escape(readPage(lang, d.page).meta.description)}</p></div></a>`).join('')}</div>`;
}
function projectCard(item, lang, index, home = false) {
  const ru = lang === 'ru', p = item[lang];
  const period = typeof item.period === 'string' ? item.period : item.period[lang];
  const visual = item.photo ? `<img src="../assets/research/${item.photo}" alt="${escape(p.caption)}" loading="lazy" width="960" height="1280"><figcaption>${escape(p.caption)} · <a href="research-metasurfaces.html#ris-prototype">${label(ru, 'Источник', 'Source')}</a></figcaption>` : `${renderDiagram(item.diagram, lang, 'compact', `${home ? 'home' : 'project'}-${item.id}`)}<figcaption>${item.id === 'multichannel' ? label(ru, 'Принцип многоантенной передачи; устройство макета здесь не показано.', 'Multi-antenna transmission concept; the prototype layout is not depicted.') : label(ru, 'Иллюстрация принципа работы', 'Conceptual illustration')}</figcaption>`;
  return `<article class="sc-project sc-project-${item.id}${index === 0 ? ' sc-project-featured' : ''}" id="project-${item.id}"><figure class="sc-project-art">${visual}</figure><div class="sc-project-copy"><div class="sc-card-top"><span>${escape(p.type)}</span><span>${period}</span></div><h3><a href="${item.href}">${escape(p.title)} ${arrow}</a></h3><p>${escape(p.text)}</p><a class="sc-text-link" href="${item.href}">${label(ru, 'Подробнее о работе', 'Explore the work')} <span aria-hidden="true">→</span></a></div></article>`;
}
function portfolioGrid(lang, home = false) {
  const list = home ? [portfolio[1], portfolio[0], portfolio[2]] : [portfolio[1], portfolio[0], ...portfolio.slice(2)];
  return `<div class="sc-projects${home ? ' sc-projects-home' : ''}">${list.map((p, i) => projectCard(p, lang, i, home)).join('')}</div>`;
}
function updates(lang) {
  const ru = lang === 'ru';
  const archive = readPage(lang, 'publications').body.split(ru ? '## Все публикации' : '## All publications')[1];
  const groups = [...archive.matchAll(/### (\d{4})\s*\n([\s\S]*?)(?=\n### |$)/g)].sort((a, b) => Number(b[1]) - Number(a[1]));
  const papers = groups.flatMap(g => g[2].split('\n').filter(line => line.startsWith('- **')).map(line => ({year: g[1], title: line.match(/^- \*\*(.+?)\*\*/)[1]}))).slice(0, 2);
  const news = [...readPage(lang, 'news').body.matchAll(/::: \{\.news-date\}\s*(\d{4}-\d{2}-\d{2})\s*:::\s*### ([^\n]+)/g)].sort((a, b) => b[1].localeCompare(a[1])).slice(0, 2);
  return `<div class="sc-updates"><div><h3>${label(ru, 'Последние публикации', 'Recent publications')}</h3>${papers.map(p => `<article class="sc-update"><span class="sc-kicker">${p.year}</span><a href="publications.html">${escape(p.title)} ${arrow}</a></article>`).join('')}</div><div><h3>${label(ru, 'В лаборатории', 'From the lab')}</h3>${news.map(([, date, title]) => `<article class="sc-update"><time class="sc-kicker" datetime="${date}">${date.split('-').reverse().join('.')}</time><a href="news.html">${escape(title)} ${arrow}</a></article>`).join('')}<a class="sc-text-link" href="news.html">${label(ru, 'Все новости', 'All news')} →</a></div></div>`;
}
function home(lang) {
  const ru = lang === 'ru';
  return raw(`<section class="sc-hero" aria-labelledby="sc-home-title"><div class="sc-hero-copy"><p class="sc-kicker">${label(ru, 'ЛАБОРАТОРИЯ № 317 / ТУСУР', 'LABORATORY 317 / TUSUR')}</p><h1 id="sc-home-title">${label(ru, 'Исследуем связь.<br><em>Создаём системы.</em>', 'Exploring signals.<br><em>Building systems.</em>')}</h1><p class="sc-lead">${label(ru, 'От математической модели к эксперименту. Изучаем физический уровень беспроводной связи и разрабатываем технологии передачи данных для 5G и 6G.', 'From mathematical models to experiments. We study the physical layer of wireless communications and develop transmission technologies for 5G and 6G.')}</p><div class="sc-actions"><a class="sc-button" href="research.html">${label(ru, 'Исследования', 'Explore research')} ${arrow}</a><a class="sc-text-link" href="projects.html">${label(ru, 'Проекты и разработки', 'Projects and prototypes')} →</a></div></div><figure class="sc-hero-art"><div class="sc-card-top"><span>01 / ${label(ru, 'РАДИОКАНАЛ', 'RADIO CHANNEL')}</span><span>MIMO + RIS</span></div>${renderDiagram('hero', lang, 'compact', 'hero')}<figcaption><span>${label(ru, 'Управляем сигналом. Исследуем канал.', 'Shaping signals. Understanding channels.')}</span><span>${label(ru, 'Концептуальная схема', 'Conceptual diagram')}</span></figcaption></figure></section><div class="sc-topics"><span>5G / 6G</span><span>NOMA · SCMA · RSMA</span><span>${label(ru, 'ПОЛЯРНЫЕ КОДЫ', 'POLAR CODES')}</span><span>RIS · STAR-RIS</span><span>MIMO</span></div>
<section class="sc-section">${sectionHeading('research', '01 / ' + label(ru, 'ИССЛЕДОВАНИЯ', 'RESEARCH'), label(ru, 'Как устроена связь', 'The science of connection'), 'research.html', label(ru, 'Все направления', 'Research areas'))}${researchGrid(lang)}</section>
<section class="sc-section">${sectionHeading('projects', '02 / ' + label(ru, 'ПРОЕКТЫ', 'PROJECTS'), label(ru, 'От идеи к эксперименту', 'From ideas to experiments'), 'projects.html', label(ru, 'Все проекты', 'All projects'))}${portfolioGrid(lang, true)}</section>
<section class="sc-results">${sectionHeading('results', '03 / ' + label(ru, 'РЕЗУЛЬТАТЫ', 'OUTCOMES'), label(ru, 'Модели. Алгоритмы. Прототипы.', 'Models. Algorithms. Prototypes.'))}<div class="sc-result-list"><a href="research-access.html"><span>01</span><div><h3>${label(ru, 'Управление радиоресурсами', 'Radio resource allocation')}</h3><p>${label(ru, 'Адаптивное прекодирование и распределение мощности в системах RSMA.', 'Adaptive precoding and power allocation for RSMA systems.')}</p></div>${arrow}</a><a href="research-metasurfaces.html#ris-prototype"><span>02</span><div><h3>${label(ru, 'Экспериментальные поверхности RIS', 'Experimental RIS surfaces')}</h3><p>${label(ru, 'Прототипы, контроллер и программное обеспечение для настройки поверхности.', 'Prototypes, a controller and software for configuring the surface.')}</p></div>${arrow}</a><a href="patents.html"><span>03</span><div><h3>${label(ru, 'Программные разработки', 'Research software')}</h3><p>${label(ru, 'Зарегистрированные программы и патенты лаборатории.', 'Registered software and patents from the laboratory.')}</p></div>${arrow}</a></div></section>
<section class="sc-section">${sectionHeading('activity', '04 / ' + label(ru, 'НАУЧНАЯ ЖИЗНЬ', 'LAB NOTES'), label(ru, 'Публикуем и обсуждаем', 'Publishing and exchanging ideas'), 'publications.html', label(ru, 'Библиография', 'Publications'))}${updates(lang)}</section>
<section class="sc-join"><div><p class="sc-kicker">${label(ru, 'СТУДЕНТАМ · АСПИРАНТАМ · ПАРТНЁРАМ', 'STUDENTS · PHD RESEARCHERS · PARTNERS')}</p><h2>${label(ru, 'Исследовать вместе', 'Let’s work on what comes next')}</h2><p>${label(ru, 'Выбрать научную задачу, проверить идею или обсудить совместный проект.', 'Choose a research question, test an idea or discuss a joint project.')}</p></div><div><a class="sc-button" href="students.html">${label(ru, 'Присоединиться к лаборатории', 'Join the laboratory')} ${arrow}</a><a class="sc-text-link" href="mailto:laboratory317@gmail.com">${label(ru, 'Обсудить сотрудничество', 'Discuss a collaboration')} →</a></div></section>`);
}
function figure(kind, lang, id, variant = 'expanded') {
  const ru = lang === 'ru';
  const note = kind === 'dsp' ? label(ru, 'Синтетический пример: поворот созвездия 16-QAM и компенсация известной фазы. Это не результаты измерений.', 'Synthetic example: a rotated 16-QAM constellation and compensation of a known phase. These are not measurements.') : label(ru, 'Схема поясняет принцип работы; это не экспериментальные данные.', 'A conceptual diagram explaining the principle; not experimental data.');
  const controls = kind === 'access' ? `<div class="sc-flow-controls" hidden role="group" aria-label="${label(ru, 'Подсветка потоков', 'Highlight streams')}"><span>${label(ru, 'Потоки:', 'Streams:')}</span>${[['all', 'Все', 'All'], ['common', 'Общий', 'Common'], ['private', 'Приватные', 'Private']].map(([value, a, b]) => `<button type="button" data-sc-highlight="${value}" aria-pressed="${value === 'all'}">${label(ru, a, b)}</button>`).join('')}</div>` : '';
  return `<figure class="sc-detail-figure">${renderDiagram(kind, lang, variant, id)}<div class="sc-figure-tools">${controls}<button type="button" data-sc-enlarge hidden>${label(ru, 'Открыть полную схему', 'Open the full diagram')} ${arrow}</button></div><figcaption>${note}</figcaption></figure>`;
}
function transformBody(lang, page, body) {
  const ru = lang === 'ru';
  if (page === 'index') return home(lang);
  if (page === 'research') return raw(researchGrid(lang));
  if (page === 'projects') {
    let index = 0;
    body = body.replace(/<details\b[^>]*class="project-program"[^>]*>/g, () => `<details class="project-program" id="${archiveIds[index++]}"${index === 1 ? ' open' : ''}>`);
    if (index !== archiveIds.length) throw new Error(`Unexpected archive structure: ${lang}`);
    return raw(`<section class="sc-section sc-section-first">${sectionHeading('portfolio', '01 / ' + label(ru, 'ИЗБРАННЫЕ РАБОТЫ', 'SELECTED WORK'), label(ru, 'Исследования в действии', 'Research in practice'))}${portfolioGrid(lang)}</section><div class="sc-archive-heading"><span class="sc-kicker">02 / ${label(ru, 'ФИНАНСИРОВАНИЕ', 'FUNDING')}</span><p>${label(ru, 'Полный архив грантов, программ и договорных работ.', 'The full archive of grants, programmes and contract research.')}</p><button type="button" data-sc-archive hidden aria-expanded="false">${label(ru, 'Раскрыть все разделы', 'Expand all sections')}</button></div>`) + body;
  }
  const direction = directions.find(d => d.page === page);
  if (direction) {
    body = body.replace(/!\[[^\]]*\]\(\.\.\/assets\/research\/[^)]+\.svg\)\{\.detail-diagram\}\s*/g, '');
    body = raw(figure(direction.kind, lang, 'research-' + direction.kind)) + body;
    // Translate presentation labels only. The scientific prose and records stay intact.
    if (ru) body = body.replace('POLAR CODES · CHANNEL CODING', 'ПОЛЯРНЫЕ КОДЫ · КОДИРОВАНИЕ').replace('RIS · STAR-RIS · RF DESIGN', 'RIS · STAR-RIS · СВЧ');
  }
  if (page === 'students' && ru) body = body.replace('CHANNEL CODING', 'КОДИРОВАНИЕ').replace('MULTIPLE ACCESS', 'МНОЖЕСТВЕННЫЙ ДОСТУП');
  if (page === 'media') {
    // This page describes the new drawings; old figure-specific descriptions
    // (four-bit polar transform, TDMA) do not describe the Scientific library.
    body = label(ru, 'Схемы поясняют принципы работы систем и не представляют результаты измерений. По вопросам использования материалов: [laboratory317@gmail.com](mailto:laboratory317@gmail.com).', 'These diagrams explain system principles and do not represent measurement results. For questions about using these materials: [laboratory317@gmail.com](mailto:laboratory317@gmail.com).');
    for (const [kind, title] of [['access', label(ru, 'RSMA: общий и приватные потоки', 'RSMA: common and private streams')], ['mimo', label(ru, 'Пространственное прекодирование', 'Spatial precoding')], ['ris', label(ru, 'Отражающая поверхность RIS', 'A reflecting RIS')], ['polar', label(ru, 'Полярное преобразование', 'Polar transform')], ['dsp', label(ru, 'Компенсация фазы сигнала', 'Signal phase compensation')]]) {
      body += `\n\n## ${title}\n` + raw(figure(kind, lang, 'media-' + kind));
    }
  }
  return body;
}
function prepare() {
  if (path.dirname(output) !== __dirname || path.basename(output) !== '.generated') throw new Error('Unsafe staging path');
  fs.mkdirSync(output, { recursive: true });
  // Only generated QMDs are cleared, so removed canonical pages cannot survive.
  for (const lang of ['ru', 'en']) {
    const folder = path.join(output, lang);
    fs.mkdirSync(folder, { recursive: true });
    for (const name of fs.readdirSync(folder).filter(n => n.endsWith('.qmd'))) fs.unlinkSync(path.join(folder, name));
    const pages = fs.readdirSync(path.join(source, lang)).filter(n => n.endsWith('.qmd') && !n.startsWith('_')).sort();
    for (const name of pages) {
      const page = name.slice(0, -4), { meta, body } = readPage(lang, page);
      const ru = lang === 'ru';
      if (page === 'projects') meta.description = label(ru, 'Разрабатываем алгоритмы, программные модели и экспериментальные системы для беспроводной связи следующих поколений.', 'We develop algorithms, software models and experimental systems for next-generation wireless communications.');
      meta['body-classes'] = `${meta['body-classes'] || ''} scientific-page`;
      meta.toc = false;
      meta['title-block-style'] = 'none';
      meta['include-in-header'] = [{ text: '<script src="../scientific.js"></script>' }];
      meta['include-before-body'] = [];
      meta['include-after-body'] = ['../navigation.html'];
      const content = raw(header(lang, page)) + (page === 'index' ? '' : raw(intro(lang, page, meta))) + transformBody(lang, page, body) + raw(footer(lang));
      // Our semantic page heading is in the content. Keep pagetitle for the
      // browser/search metadata without Quarto emitting a second hidden h1.
      meta.title = '';
      fs.writeFileSync(path.join(folder, name), `---\n${JSON.stringify(meta, null, 2)}\n---\n${content}\n`);
    }
  }
  fs.cpSync(path.join(source, 'assets'), path.join(output, 'assets'), { recursive: true });
  fs.copyFileSync(path.join(source, 'labicon.png'), path.join(output, 'labicon.png'));
  fs.copyFileSync(path.join(source, 'navigation.html'), path.join(output, 'navigation.html'));
  for (const name of ['_quarto.yml', 'scientific.css', 'scientific.js']) fs.copyFileSync(path.join(__dirname, name), path.join(output, name));
  fs.writeFileSync(path.join(output, 'index.qmd'), '---\ntitle: Laboratory 317 · Scientific\ntoc: false\ninclude-in-header:\n  text: \'<meta http-equiv="refresh" content="0; url=ru/index.html">\'\n---\n\n[Русская версия](ru/index.qmd) · [English version](en/index.qmd)\n');
  console.log('Prepared Scientific: 17 pages × 2 languages from canonical Quarto sources.');
}
if (require.main === module) prepare();
module.exports = { prepare, readPage, archiveIds, directions };
