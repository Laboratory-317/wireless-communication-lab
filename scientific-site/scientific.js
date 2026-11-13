// Scientific is deliberately independent of the Modern appearance script.
// The shared preference key preserves the user's light/dark/system choice.
(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('sc-js');
  // Quarto also reads storage directly. If browser storage is unavailable,
  // supply a page-local fallback before its scripts run; nothing is persisted.
  try { window.localStorage.getItem('lab-theme'); } catch {
    const values = new Map();
    try {
      Object.defineProperty(window, 'localStorage', { configurable: true, value: {
        getItem: key => values.get(String(key)) ?? null,
        setItem: (key, value) => values.set(String(key), String(value)),
        removeItem: key => values.delete(String(key)),
        clear: () => values.clear(),
        key: index => [...values.keys()][index] ?? null,
        get length() { return values.size; }
      } });
    } catch { /* An immutable browser property still permits our theme buttons. */ }
  }
  const media = matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try { preference = localStorage.getItem('lab-theme') || 'system'; } catch {}
  if (!['light', 'dark', 'system'].includes(preference)) preference = 'system';
  function applyTheme() {
    const theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
    root.dataset.labTheme = theme;
    root.style.colorScheme = theme;
    if (document.body) {
      document.body.classList.toggle('quarto-dark', theme === 'dark');
      document.body.classList.toggle('quarto-light', theme === 'light');
    }
    document.querySelectorAll('[data-sc-theme]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scTheme === preference)));
  }
  applyTheme();
  media.addEventListener('change', applyTheme);
  document.addEventListener('DOMContentLoaded', () => {
    const content = document.querySelector('#quarto-content');
    const chrome = document.querySelector('.sc-chrome');
    const skip = document.querySelector('.sc-skip');
    const footer = document.querySelector('.sc-footer');
    if (content && chrome) content.before(chrome);
    if (chrome && skip) chrome.before(skip);
    if (content && footer) content.after(footer);
    const lang = root.lang.startsWith('en') ? 'en' : 'ru';
    const ru = lang === 'ru';
    document.querySelectorAll('[data-sc-theme]').forEach(button => button.addEventListener('click', () => {
      preference = button.dataset.scTheme;
      try { localStorage.setItem('lab-theme', preference); } catch {}
      applyTheme();
    }));
    document.querySelectorAll('[data-sc-language], [data-sc-design]').forEach(a => {
      const target = new URL(a.href);
      const params = new URLSearchParams(location.search);
      params.delete('lang');
      if (a.dataset.scDesign === 'classic') {
        params.set('lang', lang);
        if (target.searchParams.has('person')) params.set('person', target.searchParams.get('person'));
      }
      target.search = params.toString();
      if (a.dataset.scDesign !== 'classic') target.hash = location.hash;
      a.href = target.href;
    });
    const menu = document.querySelector('.sc-menu'), nav = document.querySelector('.sc-nav');
    function closeMenu() { menu?.setAttribute('aria-expanded', 'false'); nav?.classList.remove('is-open'); }
    menu?.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
    });
    document.querySelectorAll('[data-sc-search]').forEach(button => button.addEventListener('click', () => window.quartoOpenSearch?.()));
    const archive = [...document.querySelectorAll('.project-program')];
    const archiveButton = document.querySelector('[data-sc-archive]');
    function updateArchiveLabel() {
      if (!archiveButton) return;
      const expanded = archive.every(d => d.open);
      archiveButton.setAttribute('aria-expanded', String(expanded));
      archiveButton.textContent = expanded ? (ru ? 'Свернуть все разделы' : 'Collapse all sections') : (ru ? 'Раскрыть все разделы' : 'Expand all sections');
    }
    if (archiveButton) {
      archiveButton.hidden = false;
      archiveButton.addEventListener('click', () => {
        const expand = !archive.every(d => d.open);
        archive.forEach(d => { d.open = expand; });
        updateArchiveLabel();
      });
      archive.forEach(d => d.addEventListener('toggle', updateArchiveLabel));
      updateArchiveLabel();
    }
    function openAnchor() {
      let anchor;
      try { anchor = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { return; }
      if (!anchor) return;
      const details = anchor.closest('details');
      if (details) details.open = true;
    }
    openAnchor();
    window.addEventListener('hashchange', openAnchor);
    document.querySelectorAll('.sc-flow-controls').forEach(group => {
      group.hidden = false;
      group.querySelectorAll('[data-sc-highlight]').forEach(button => button.addEventListener('click', () => {
        group.closest('figure').dataset.scHighlight = button.dataset.scHighlight;
        group.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      }));
    });
    document.querySelectorAll('[data-sc-enlarge]').forEach(button => {
      button.hidden = false;
      button.addEventListener('click', () => {
        const dialog = document.createElement('dialog');
        dialog.className = 'sc-figure-dialog';
        dialog.setAttribute('aria-label', ru ? 'Полная научная схема' : 'Full scientific diagram');
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'sc-dialog-close';
        close.textContent = ru ? 'Закрыть ×' : 'Close ×';
        close.addEventListener('click', () => dialog.close());
        const view = document.createElement('div');
        view.className = 'sc-figure-scroll';
        view.tabIndex = 0;
        view.setAttribute('role', 'region');
        view.setAttribute('aria-label', ru ? 'Схема с горизонтальной прокруткой' : 'Diagram with horizontal scrolling');
        const clone = button.closest('figure').querySelector('svg').cloneNode(true);
        clone.setAttribute('data-sc-detail', 'full');
        // The enlarged copy must not duplicate the original SVG's IDs.
        const ids = new Map([...clone.querySelectorAll('[id]')].map(el => [el.id, `zoom-${el.id}`]));
        [clone, ...clone.querySelectorAll('*')].forEach(el => {
          for (const attr of el.getAttributeNames()) {
            let value = el.getAttribute(attr);
            for (const [oldId, newId] of ids) value = value.replaceAll(oldId, newId);
            el.setAttribute(attr, value);
          }
        });
        view.append(clone);
        const note = document.createElement('p');
        note.textContent = ru ? 'На узком экране схему можно прокручивать по горизонтали.' : 'On a narrow screen, scroll horizontally to explore the diagram.';
        dialog.append(close, view, note);
        dialog.addEventListener('close', () => { dialog.remove(); button.focus(); }, { once: true });
        document.body.append(dialog);
        dialog.showModal();
      });
    });
    // Keep the proven, shared publication filtering; add URL persistence here
    // only for Scientific, so switching language/design keeps a typed filter.
    const search = document.querySelector('#paper-search'), year = document.querySelector('#paper-year');
    if (search && year) {
      const savedYear = new URLSearchParams(location.search).get('year');
      if (savedYear && [...year.options].some(o => o.value === savedYear)) { year.value = savedYear; year.dispatchEvent(new Event('change')); }
      const persist = () => {
        const url = new URL(location.href);
        search.value.trim() ? url.searchParams.set('researcher', search.value.trim()) : url.searchParams.delete('researcher');
        year.value ? url.searchParams.set('year', year.value) : url.searchParams.delete('year');
        history.replaceState(null, '', url);
        document.querySelectorAll('[data-sc-language], [data-sc-design]').forEach(a => {
          const target = new URL(a.href);
          for (const key of ['researcher', 'year']) url.searchParams.has(key) ? target.searchParams.set(key, url.searchParams.get(key)) : target.searchParams.delete(key);
          a.href = target.href;
        });
      };
      search.addEventListener('input', persist);
      year.addEventListener('change', persist);
      document.querySelector('.publication-tools button')?.addEventListener('click', persist);
    }
    applyTheme();
  });
})();
