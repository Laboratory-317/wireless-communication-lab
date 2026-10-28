// Apply the saved preference before paint; tolerate disabled browser storage.
(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try { preference = localStorage.getItem('lab-theme') || 'system'; } catch {}
  if (!['light', 'dark', 'system'].includes(preference)) preference = 'system';
  function apply() {
    const theme = preference === 'system'
      ? (media.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.labTheme = theme;
    if (document.body) {
      document.body.classList.toggle('quarto-dark', theme === 'dark');
      document.body.classList.toggle('quarto-light', theme === 'light');
    }
    document.querySelectorAll('img[data-dark-src]').forEach(img => {
      const source = theme === 'dark' ? img.dataset.darkSrc : img.dataset.lightSrc;
      if (img.getAttribute('src') !== source) img.setAttribute('src', source);
    });
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === preference));
    });
  }
  apply();
  media.addEventListener('change', apply);
  document.addEventListener('DOMContentLoaded', () => {
    // Quarto inserts includes inside main; the shared chrome spans the whole page.
    const content = document.querySelector('#quarto-content');
    const header = document.querySelector('.site-header');
    const skip = document.querySelector('.home-skip');
    const footer = document.querySelector('.site-footer');
    if (content && header) content.before(header);
    if (header && skip) header.before(skip);
    const comparison = document.querySelector('.design-compare');
    if (header && comparison) header.before(comparison);
    if (content && footer) content.after(footer);
    const lang = document.documentElement.lang.startsWith('en') ? 'en' : 'ru';
    const page = location.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
    const classicLink = document.querySelector('[data-classic-design]');
    if (classicLink) {
      const query = new URLSearchParams({ lang });
      let classicPage = page;
      let fragment = '';
      if (page.startsWith('cv-')) { classicPage = 'cv'; query.set('person', page.slice(3)); }
      if (page === 'news') { classicPage = 'index'; fragment = '#section-news'; }
      if (page === 'media') classicPage = 'research';
      classicLink.href = `../../journal/${classicPage}.html?${query}${fragment}`;
    }
    const modernLink = document.querySelector('[data-modern-design]');
    if (modernLink) modernLink.href = `${page}.html${location.search}`;
    const section = page.startsWith('research') ? 'research'
      : page.startsWith('cv') ? 'people' : page;
    document.querySelectorAll('.home-languages a').forEach(a => {
      const target = a.getAttribute('lang');
      a.href = `../${target}/${page}.html${location.search}`;
      if (target === lang) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    document.querySelectorAll('.home-nav a, .site-footer nav a').forEach(a => {
      const destination = new URL(a.href, location.href);
      const name = destination.pathname.split('/').pop().replace(/\.html$/, '') || 'index';
      if (destination.origin === location.origin && name === section) a.setAttribute('aria-current', 'page');
    });
    document.querySelectorAll('[data-site-search]').forEach(button => {
      button.addEventListener('click', () => window.quartoOpenSearch?.());
    });
    document.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || '';
      if (/\/assets\/research\/(access|polar|ris|wireless)(-en)?\.svg$/.test(src)) {
        img.dataset.lightSrc = src.replace(/\.svg$/, '-light.svg');
        img.dataset.darkSrc = src.replace(/\.svg$/, '-dark.svg');
      }
    });
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.addEventListener('click', () => {
        preference = button.dataset.themeChoice;
        try { localStorage.setItem('lab-theme', preference); } catch {}
        apply();
      });
    });
    apply();
  });
})();
