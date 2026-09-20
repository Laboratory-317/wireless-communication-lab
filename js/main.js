(function () {
  const model = window.LAB_CONTENT;
  const app = document.querySelector("[data-render-root]");
  if (!model || !app) return;

  const availableLanguages = Object.keys(model.languages);

  function storedLanguage() {
    const query = new URLSearchParams(window.location.search).get("lang");
    if (availableLanguages.includes(query)) return query;
    try {
      const value = window.localStorage.getItem(model.languageStorageKey);
      return availableLanguages.includes(value) ? value : model.defaultLanguage;
    } catch (_error) {
      return model.defaultLanguage;
    }
  }

  function saveLanguage(language) {
    try {
      window.localStorage.setItem(model.languageStorageKey, language);
    } catch (_error) {
      // Local storage can be unavailable in restricted browser contexts.
    }
  }

  function languageSwitch(currentLanguage) {
    return `
      <div class="language-switch" role="group" aria-label="Language">
        ${availableLanguages.map((language) => `
          <button type="button" data-language="${language}" aria-pressed="${language === currentLanguage}">
            ${language.toUpperCase()}
          </button>
        `).join("")}
      </div>
    `;
  }


  function colorModeControl(content) {
    const labels = content.colorModeLabels;
    const selected = document.documentElement.dataset?.colorMode || 'system';
    return `<label class="color-mode-control"><span>${labels.label}</span><select data-color-mode-select aria-label="${labels.label}">
      ${['system', 'light', 'dark'].map((mode) => `<option value="${mode}"${mode === selected ? ' selected' : ''}>${labels[mode]}</option>`).join('')}
    </select></label>`;
  }
  function render(language) {
    const content = model.languages[language] || model.languages[model.defaultLanguage];
    document.documentElement.lang = language;
    document.title = `${content.labName} - ${content.themeSelector}`;

    app.innerHTML = `
      <div class="root-topbar">
        <img class="lab-mark" src="labicon.png" alt="${content.labName}">
        <div class="display-controls">${colorModeControl(content)}${languageSwitch(language)}</div>
      </div>
      ${content.rootEyebrow ? `<p class="eyebrow">${content.rootEyebrow}</p>` : ""}
      <h1 id="page-title">${content.labName}</h1>
      ${content.rootLead ? `<p class="lead">${content.rootLead}</p>` : ""}

      <nav class="theme-grid" aria-label="${content.themeSelector}">
        ${model.themes.map((theme, index) => `
          <a class="theme-card theme-card-${index + 1}" href="${theme.href}?lang=${language}">
            <div class="theme-sketch" aria-hidden="true"><i></i><b></b><em></em><em></em><em></em></div>
            <div class="theme-number">0${index + 1}</div>
            <span>${theme.title[language]}</span>
            ${theme.description[language] ? `<small>${theme.description[language]}</small>` : ""}
          </a>
        `).join("")}
      </nav>
    `;

    app.querySelectorAll("[data-language]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextLanguage = button.dataset.language;
        saveLanguage(nextLanguage);
        const url = new URL(window.location.href);
        url.searchParams.set("lang", nextLanguage);
        window.history.replaceState(null, "", url);
        render(nextLanguage);
        app.querySelector(`[data-language="${nextLanguage}"]`)?.focus();
      });
    });
  }

  render(storedLanguage());
})();
