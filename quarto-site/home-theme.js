// Apply the saved preference before paint; tolerate disabled browser storage.
(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try { preference = localStorage.getItem('lab-theme') || 'system'; } catch {}
  if (!['light', 'dark', 'system'].includes(preference)) preference = 'system';
  let motion = 'on';
  try { motion = localStorage.getItem('lab-motion') === 'off' ? 'off' : 'on'; } catch {}
  function apply() {
    document.documentElement.dataset.labMotion = motion;
    const theme = preference === 'system'
      ? (media.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.labTheme = theme;
    if (document.body) {
      document.body.classList.toggle('quarto-dark', theme === 'dark');
      document.body.classList.toggle('quarto-light', theme === 'light');
    }
    document.querySelectorAll('img[data-dark-src]').forEach(img => {
      const source = (theme === 'dark' ? img.dataset.darkSrc : img.dataset.lightSrc) + (motion === 'off' ? '#still' : '');
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
    const scientificLink = document.querySelector('[data-scientific-design]');
    if (scientificLink) scientificLink.href = `../../scientific/${lang}/${page}.html${location.search}${location.hash}`;
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
    const diagramVersion = document.querySelector('meta[name="lab-diagrams-version"]')?.content;
    const diagramQuery = diagramVersion ? `?v=${diagramVersion}` : '';
    document.querySelectorAll('img').forEach(img => {
      const src = (img.getAttribute('src') || '').split(/[?#]/)[0];
      if (/\/assets\/research\/(access|polar|ldpc|ris|wireless)(-en)?\.svg$/.test(src)) {
        img.dataset.lightSrc = src.replace(/\.svg$/, '-light.svg') + diagramQuery;
        img.dataset.darkSrc = src.replace(/\.svg$/, '-dark.svg') + diagramQuery;
      }
    });
    const illustration = document.querySelector('.research-overview, .home-directions, .student-tracks, .learning-grid, figure:has(img[data-dark-src])');
    if (illustration && page !== 'education') {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'motion-toggle';
      const update = () => {
        toggle.textContent = motion === 'on' ? 'Ⅱ' : '▷';
        const label = motion === 'on'
          ? (lang === 'ru' ? 'Приостановить анимацию' : 'Pause animation')
          : (lang === 'ru' ? 'Включить анимацию' : 'Play animation');
        toggle.setAttribute('aria-label', label);
        toggle.title = label;
        toggle.setAttribute('aria-pressed', String(motion === 'on'));
      };
      toggle.addEventListener('click', () => {
        motion = motion === 'on' ? 'off' : 'on';
        try { localStorage.setItem('lab-motion', motion); } catch {}
        update(); apply();
      });
      update();
      const controls = document.querySelector('.home-controls');
      if (controls) controls.append(toggle); else illustration.before(toggle);
    }
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.addEventListener('click', () => {
        preference = button.dataset.themeChoice;
        try { localStorage.setItem('lab-theme', preference); } catch {}
        apply();
      });
    });
    const photos = [...document.querySelectorAll('.research-gallery img')];
    if (photos.length) {
      const ru = lang === 'ru';
      let selected = 0, opener = null;
      const dialog = document.createElement('dialog');
      dialog.className = 'photo-dialog';
      dialog.setAttribute('aria-label', ru ? 'Просмотр фотографий' : 'Photo viewer');
      const close = document.createElement('button');
      close.type = 'button'; close.className = 'photo-dialog-close';
      close.textContent = ru ? 'Закрыть ×' : 'Close ×';
      const figure = document.createElement('figure');
      const full = document.createElement('img');
      const caption = document.createElement('figcaption');
      figure.append(full, caption);
      const controls = document.createElement('div');
      controls.className = 'photo-dialog-controls';
      const previous = document.createElement('button');
      previous.type = 'button'; previous.textContent = ru ? '← Назад' : '← Previous';
      const next = document.createElement('button');
      next.type = 'button'; next.textContent = ru ? 'Далее →' : 'Next →';
      const count = document.createElement('span'); count.setAttribute('aria-live', 'polite');
      controls.append(previous, count, next);
      if (photos.length === 1) controls.hidden = true;
      dialog.append(close, figure, controls);
      document.body.append(dialog);
      const show = (index) => {
        selected = (index + photos.length) % photos.length;
        const photo = photos[selected];
        full.src = photo.currentSrc || photo.src;
        full.alt = photo.alt || '';
        caption.textContent = photo.closest('figure')?.querySelector('figcaption')?.textContent || photo.alt || '';
        count.textContent = `${selected + 1} / ${photos.length}`;
      };
      previous.addEventListener('click', () => show(selected - 1));
      next.addEventListener('click', () => show(selected + 1));
      close.addEventListener('click', () => dialog.close());
      dialog.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault(); show(selected + (event.key === 'ArrowRight' ? 1 : -1));
        }
      });
      dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
      dialog.addEventListener('close', () => {
        document.body.classList.remove('photo-viewer-open');
        opener?.focus();
      });
      photos.forEach((photo, index) => {
        const link = document.createElement('a');
        link.href = photo.currentSrc || photo.src;
        link.className = 'photo-zoom';
        link.setAttribute('aria-label', `${ru ? 'Увеличить' : 'Enlarge'}: ${photo.alt || (ru ? 'фотографию' : 'photo')}`);
        photo.replaceWith(link); link.append(photo);
        link.addEventListener('click', (event) => {
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
          event.preventDefault(); opener = link; show(index); dialog.showModal();
          document.body.classList.add('photo-viewer-open'); close.focus();
        });
      });
    }
    apply();
  });
})();
