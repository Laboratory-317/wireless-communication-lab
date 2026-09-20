(function () {
  const model = window.LAB_CONTENT;
  const app = document.querySelector("[data-render-theme]");
  if (!model || !app) return;

  const page = document.body.dataset.page || "home";
  const themeKey = document.body.dataset.themeName || "Theme preview";
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

  function html(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function inlineMarkdown(text) {
    return html(text)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  }

  function blockMarkdown(text) {
    const lines = String(text || "").split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const blocks = [];
    let paragraph = [];
    let list = [];

    function flushParagraph() {
      if (!paragraph.length) return;
      blocks.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }

    function flushList() {
      if (!list.length) return;
      blocks.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
      list = [];
    }

    lines.forEach((line) => {
      if (line.startsWith("- ")) {
        flushParagraph();
        list.push(line.replace(/^-\s+/, "").trim());
        return;
      }

      flushList();
      paragraph.push(line);
    });

    flushParagraph();
    flushList();

    return blocks.join("");
  }

  function mailIcon() {
    return `
      <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
      </svg>
    `;
  }

  function sectionActions(actions) {
    if (!actions || !actions.length) return "";

    return `
      <div class="section-actions">
        ${actions.map((action) => `
          <a class="section-action section-action-${html(action.icon || "link")}" href="${html(action.href)}">
            ${action.icon === "mail" ? mailIcon() : ""}
            <span>${html(action.label)}</span>
          </a>
        `).join("")}
      </div>
    `;
  }

  function headerActions(actions) {
    if (!actions || !actions.length) return "";

    return `
      <div class="header-actions">
        ${actions.map((action) => `
          <a class="header-action header-action-${html(action.icon || "link")}" href="${html(action.href)}" aria-label="${html(action.label)}">
            ${action.icon === "mail" ? mailIcon() : ""}
            <span>${html(action.label)}</span>
          </a>
        `).join("")}
      </div>
    `;
  }

  function assetSrc(src) {
    if (!src || /^(https?:|data:|\/)/.test(src)) {
      return src;
    }

    if (src.startsWith("../")) {
      return src;
    }

    return `../../${encodeURI(src)}`;
  }

  function render(language) {
    const content = model.languages[language] || model.languages[model.defaultLanguage];
    const theme = model.themes.find((item) => item.key === themeKey);
    const themeName = theme ? theme.title[language] : themeKey;
    const labels = content.sectionLabels;
    const placeholders = content.placeholders;

    document.documentElement.lang = language;
    document.title = `${page === "home" ? content.home : labels[`${page}Title`] || content.home} — ${content.labName}`;

    const nav = content.sections
      .filter((section) => section.key !== "research" && section.href !== "research.html")
      .map((section) => {
        const isCurrent = page === section.key || (page === "cv" && section.key === "people");
        return `<a href="${html(section.href)}" aria-current="${isCurrent ? "page" : "false"}">${html(section.title)}</a>`;
      })
      .join("");

    function newsBlock() {
      return `
        <section class="section section-news">
          <div class="section-head">
            <h2>${labels.newsTitle}</h2>
          </div>
          <div class="news-list">
            ${content.newsItems.map((item) => `
              <article class="news-item">
                ${item.date ? `<time>${html(item.date)}</time>` : `<span class="news-date missing-data">${html(content.missingDate)}</span>`}
                <h3>${item.title}</h3>
                <div class="markdown-block">${blockMarkdown(item.text)}</div>
              </article>
            `).join("")}
          </div>
        </section>
      `;
    }

    function researchBlock() {
      function researchSection(section) {
        const items = section.cards || content.researchInterests || [];
        return `
          <section class="section section-research">
            <div class="section-head">
              <h2>${html(section.title || labels.researchTitle)}</h2>
            </div>
            <div class="interest-list">
              ${items.map((item) => `
                <article class="${item.images && item.images.length ? "has-image" : ""}">
                  ${item.images && item.images.length ? `
                    <img class="interest-image" src="${assetSrc(item.images[0].src)}" alt="${html(item.images[0].alt || item.title)}">
                  ` : ""}
                  <h3>${html(item.title)}</h3>
                  <div class="research-copy">${blockMarkdown(item.text)}</div>
                </article>
              `).join("")}
            </div>
            <p class="illustration-note">${html(content.diagramCaption)}</p>
          </section>
        `;
      }

      function textSection(section) {
        return `
          <section class="section section-home-text">
            <div class="section-head">
              <h2>${html(section.title)}</h2>
            </div>
            ${section.text ? `<div class="home-text-body markdown-block">${blockMarkdown(section.text)}</div>` : ""}
            ${sectionActions(section.actions)}
          </section>
        `;
      }

      if (content.homeSections && content.homeSections.length) {
        return content.homeSections.map((section) => (
          section.type === "research" ? researchSection(section) : textSection(section)
        )).join("");
      }

      return `
        <section class="section section-research">
          <div class="section-head">
            <h2>${labels.researchTitle}</h2>
          </div>
          <div class="interest-list">
            ${content.researchInterests.map((item) => `
              <article class="${item.images && item.images.length ? "has-image" : ""}">
                ${item.images && item.images.length ? `
                  <img class="interest-image" src="${assetSrc(item.images[0].src)}" alt="${html(item.images[0].alt || item.title)}">
                ` : ""}
                <h3>${html(item.title)}</h3>
                <div class="markdown-block">${blockMarkdown(item.text)}</div>
              </article>
            `).join("")}
          </div>
        </section>
      `;
    }

    function projectsBlock() {
      return `
        <section class="section section-projects">
          <div class="section-head">
            <h2>${labels.projectsTitle}</h2>
          </div>
          <div class="grouped-list project-grouped-list">
            ${content.projects.map((project) => `
              <section class="grouped-section project-group">
                <h3>${html(project.title)}</h3>
                <div class="markdown-block">${blockMarkdown(project.text)}</div>
              </section>
            `).join("")}
          </div>
        </section>
      `;
    }

    function patentsBlock() {
      return `
        <section class="section section-patents">
          <div class="section-head">
            <h2>${labels.patentsTitle}</h2>
          </div>
          <div class="grouped-list patent-grouped-list">
            ${content.patents.map((patent) => `
              <section class="grouped-section patent-group">
                <h3>${html(patent.title)}</h3>
                <div class="markdown-block">${blockMarkdown(patent.text)}</div>
              </section>
            `).join("")}
          </div>
        </section>
      `;
    }

    function peopleBlock() {
      function personName(person) {
        return typeof person === "string" ? person : person.name;
      }

      function personDescription(person) {
        return typeof person === "string" ? "" : person.description;
      }

      function personPhoto(person, name) {
        if (typeof person === "string" || !person.photo) {
          const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("");
          return `<div class="photo-placeholder person-initials" aria-hidden="true">${html(initials)}</div><p class="missing-data photo-note">${html(content.missingPhoto)}</p>`;
        }

        return `<img class="photo-placeholder" src="${assetSrc(person.photo)}" alt="${html(person.photoAlt || name)}">`;
      }

      function contactValue(contact) {
        const value = String(contact.value || "").trim();

        if (!value) {
          return `<span class="missing-data">${html(content.missingData)}</span>`;
        }

        const markdownLink = value.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (markdownLink) {
          return `<a href="${html(markdownLink[2])}">${html(markdownLink[1])}</a>`;
        }

        if (/^https?:\/\//.test(value)) {
          return `<a href="${html(value)}">${html(contact.label)}</a>`;
        }

        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return `<a href="mailto:${html(value)}">${html(value)}</a>`;
        }

        if (/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(value)) {
          return `<a href="https://orcid.org/${html(value)}">${html(value)}</a>`;
        }

        return inlineMarkdown(value);
      }

      function personContacts(person) {
        if (typeof person === "string" || !person.contacts || !person.contacts.length) {
          return [{ label: placeholders.email, value: "" }];
        }

        return person.contacts.map((contact) => ({
          label: contact.label,
          value: contact.value || ""
        })).filter((contact) => contact.label.toLowerCase() !== "cv");
      }

      function personCvHref(person) {
        if (typeof person === "string" || !person.contacts) return "";

        const cvContact = person.contacts.find((contact) => contact.label.toLowerCase() === "cv");
        if (!cvContact || !cvContact.value) return "";

        const markdownLink = cvContact.value.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        return markdownLink ? markdownLink[2] : cvContact.value;
      }

      return `
        <section class="section">
          <div class="section-head">
            <h2>${labels.peopleTitle}</h2>
          </div>
          ${content.peopleGroups.map((group, groupIndex) => `
            <section class="people-group people-group-${groupIndex + 1}" aria-label="${group.title}">
              <div class="group-head">
                <h3>${group.title}</h3>
                <span>${group.people.length}</span>
              </div>
              <div class="people-list">
                ${group.people.map((person) => {
                  const name = personName(person);
                  const description = personDescription(person);
                  const cvHref = personCvHref(person);
                  return `
                  <article class="person">
                    <div class="person-photo">
                      ${personPhoto(person, name)}
                      <dl class="profile-list">
                        ${personContacts(person).map((contact) => `<dt>${html(contact.label)}</dt><dd>${contactValue(contact)}</dd>`).join("")}
                      </dl>
                    </div>
                    <div class="person-info">
                      <h4>${cvHref ? `<a href="${html(cvHref)}">${html(name)}</a>` : html(name)}</h4>
                      ${description ? `<div class="person-bio markdown-block">${blockMarkdown(description)}</div>` : `<p class="missing-data">${html(content.missingBiography)}</p>`}
                    </div>
                  </article>
                `;
                }).join("")}
              </div>
            </section>
          `).join("")}
        </section>
      `;
    }

    function studentsBlock() {
      return `
        <section class="section section-students">
          <div class="section-head">
            <h2>${labels.studentsTitle}</h2>
            <div class="student-lead markdown-block">${blockMarkdown(content.studentOffer.lead)}</div>
          </div>
          <div class="student-steps">
            ${content.studentOffer.steps.map((step, index) => `
              <article class="student-step">
                <span>${index + 1}</span>
                <h3>${step.title}</h3>
                <div class="markdown-block">${blockMarkdown(step.text)}</div>
              </article>
            `).join("")}
          </div>
          <div class="student-tracks" aria-label="${labels.studentsKicker}">
            ${content.studentOffer.tracks.map((track) => `<article>${track}</article>`).join("")}
          </div>
        </section>
      `;
    }

    function publicationsBlock() {
      const publicationContent = content.publicationContent || {
        lead: "",
        sections: (content.publicationSections || []).map((title) => ({
          title,
          text: "",
          items: [],
          groups: []
        }))
      };

      function publicationItems(items) {
        if (!items || !items.length) return "";

        return `
          <ul class="publication-items">
            ${items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}
          </ul>
        `;
      }

      return `
        <section class="section section-publications">
          <div class="section-head">
            <h2>${labels.publicationsTitle}</h2>
            ${publicationContent.lead ? `<div class="markdown-block">${blockMarkdown(publicationContent.lead)}</div>` : ""}
          </div>
          <div class="publication-list">
            ${publicationContent.sections.map((section) => `
              <article class="publication-section">
                <div class="publication-section-head">
                  <h3>${html(section.title)}</h3>
                  ${section.text ? `<div class="markdown-block">${blockMarkdown(section.text)}</div>` : ""}
                </div>
                <div class="publication-section-body">
                  ${publicationItems(section.items)}
                  ${(section.groups || []).map((group) => `
                    <section class="publication-year">
                      <h4>${html(group.title)}</h4>
                      ${publicationItems(group.items)}
                    </section>
                  `).join("")}
                </div>
              </article>
            `).join("")}
          </div>
        </section>
      `;
    }

    function mediaBlock() {
      return `
        <section class="section">
          <div class="section-head">
            <h2>${labels.mediaTitle}</h2>
            <div class="markdown-block">${blockMarkdown(content.mediaLead)}</div>
          </div>
          <div class="media-list">
            ${(content.mediaItems || []).map((item) => `
              <figure>
                ${item.images.map((img) => `<img src="${assetSrc(img.src)}" alt="${html(img.alt)}" loading="lazy" width="720" height="480">`).join("")}
                <figcaption><h3>${html(item.title)}</h3>${blockMarkdown(item.text)}</figcaption>
              </figure>
            `).join("")}
          </div>
        </section>
      `;
    }

    function cvBlock() {
      const params = new URLSearchParams(window.location.search);
      const requestedSlug = params.get("person");
      const profiles = content.cvProfiles || [];
      const profile = profiles.find((item) => item.slug === requestedSlug) || profiles[0];

      if (!profile) {
        return `
          <section class="section section-cv">
            <div class="section-head">
              <h2>${labels.cvTitle}</h2>
            </div>
          </section>
        `;
      }

      return `
        <section class="section section-cv">
          <div class="section-head">
            <h2>${html(profile.name)}</h2>
            ${profile.role ? `<p class="cv-role">${html(profile.role)}</p>` : ""}
            ${profile.summary ? `<div class="markdown-block">${blockMarkdown(profile.summary)}</div>` : ""}
          </div>
          <div class="cv-list markdown-block">
            ${profile.sections.map((section) => `
              <section class="cv-section">
                <h3>${html(section.title)}</h3>
                ${blockMarkdown(section.text)}
              </section>
            `).join("")}
          </div>
        </section>
      `;
    }

    const pages = {
      home: researchBlock(),
      news: newsBlock(),
      projects: projectsBlock(),
      patents: patentsBlock(),
      people: peopleBlock(),
      students: studentsBlock(),
      publications: publicationsBlock(),
      media: mediaBlock(),
      cv: cvBlock()
    };

    app.innerHTML = `
      <a class="skip-link" href="#content">${html(content.skipNavigation)}</a>
      <header class="site-header">
        <div class="topbar">
          <a class="back-link" href="../../index.html">${content.themeSelector}</a>
          <div class="topbar-actions">
            ${headerActions(content.headerActions)}
            ${languageSwitch(language)}
          </div>
        </div>
        <div class="brand">
          <img src="labicon.png" alt="${content.labName}">
          <div>
            <p class="theme-label">${themeName}</p>
            <h1>${content.labName}</h1>
            ${content.tagline ? `<p>${html(content.tagline)}</p>` : ""}
          </div>
        </div>
        <nav class="site-nav" aria-label="${html(content.navigationLabel)}">
          <a href="index.html" aria-current="${page === "home" ? "page" : "false"}">${content.home}</a>${nav}
        </nav>
      </header>
      <main id="content" tabindex="-1" class="page page-${page}">${pages[page] || pages.home}</main>
      <footer class="site-footer"><p>${html(content.tagline)}</p><p>${html(content.footer)}</p></footer>
    `;

    app.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || /^(?:[a-z]+:|\/\/|#)/i.test(href) || !/\.html(?:[?#]|$)/.test(href)) return;
      const url = new URL(href, window.location.href);
      url.searchParams.set('lang', language);
      link.setAttribute('href', url.pathname + url.search + url.hash);
    });

    app.querySelectorAll("[data-language]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextLanguage = button.dataset.language;
        saveLanguage(nextLanguage);
        const url = new URL(window.location.href);
        url.searchParams.set("lang", nextLanguage);
        window.history.replaceState(null, "", url);
        render(nextLanguage);
      });
    });
  }

  render(storedLanguage());
})();
