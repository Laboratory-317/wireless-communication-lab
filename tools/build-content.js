const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const contentRoot = path.join(root, "content");
const languages = ["ru", "en"];

function syncEnglishContent() {
  if (process.env.LAB_AUTO_TRANSLATE !== "1") return;

  const args = [
    path.join(__dirname, "translate-ru-to-en.js"),
    "--all",
    "--write"
  ];

  if (process.env.LAB_TRANSLATE_PROVIDER) {
    args.push("--provider", process.env.LAB_TRANSLATE_PROVIDER);
  }

  if (process.env.LAB_TRANSLATE_DELAY_MS) {
    args.push("--delay-ms", process.env.LAB_TRANSLATE_DELAY_MS);
  }

  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env
  });

  if (result.status !== 0) {
    throw new Error("English content synchronization failed.");
  }
}

const kickerDefaults = {
  ru: {
    home: "Научные направления",
    people: "Команда лаборатории",
    students: "Для студентов",
    projects: "Текущая работа",
    patents: "Интеллектуальная собственность",
    publications: "Результаты",
    media: "Медиа",
    news: "Новости лаборатории",
    cv: "Профили коллектива"
  },
  en: {
    home: "Research Interests",
    people: "Laboratory Team",
    students: "For Students",
    projects: "Current Work",
    patents: "Intellectual Property",
    publications: "Outputs",
    media: "Media",
    news: "Laboratory News",
    cv: "Team Profiles"
  }
};

const placeholderDefaults = {
  ru: {
    email: "Email",
    orcid: "ORCID",
    scholar: "Google Scholar",
    profile: "Внешний профиль",
    value: "заглушка",
    todo: "TODO",
    media: "Заглушка"
  },
  en: {
    email: "Email",
    orcid: "ORCID",
    scholar: "Google Scholar",
    profile: "External profile",
    value: "placeholder",
    todo: "TODO",
    media: "Placeholder"
  }
};

function readMarkdown(filePath) {
  return fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n").trim();
}

function stripComment(line) {
  return line.replace(/<!--[\s\S]*?-->/g, "").trim();
}

function keyValue(line) {
  const match = stripComment(line).match(/^([^:]+):\s*(.+)$/);
  return match ? [match[1].trim(), match[2].trim()] : null;
}

function titleOf(markdown, filePath) {
  const line = markdown.split("\n").find((item) => item.startsWith("# "));

  if (!line) {
    throw new Error(`Missing page title in ${filePath}`);
  }

  return line.replace(/^#\s+/, "").trim();
}

function bodyAfterTitle(markdown) {
  const lines = markdown.split("\n");
  const index = lines.findIndex((line) => line.startsWith("# "));
  return index === -1 ? lines : lines.slice(index + 1);
}

function metadata(lines) {
  const result = {};

  lines.forEach((line) => {
    const pair = keyValue(line);
    if (pair) {
      result[pair[0].toLowerCase()] = pair[1];
    }
  });

  return result;
}

function sections(markdown, level = 2) {
  return sectionsFromLines(bodyAfterTitle(markdown), level);
}

function topSections(markdown) {
  return sectionsFromLines(markdown.split("\n"), 1);
}

function contentSections(markdown) {
  const roots = topSections(markdown);
  return roots.length > 1 ? roots : sections(markdown);
}

function sectionsFromLines(lines, level = 2) {
  const heading = "#".repeat(level);
  const result = [];
  let current = null;

  lines.forEach((line) => {
    const headingMatch = headingMatchOf(line);

    if (headingMatch && headingMatch[1].length < level) {
      current = null;
      return;
    }

    if (line.startsWith(`${heading} `)) {
      current = {
        title: line.replace(new RegExp(`^${heading}\\s+`), "").trim(),
        lines: []
      };
      result.push(current);
      return;
    }

    if (current) {
      current.lines.push(line);
    }
  });

  return result.map((section) => ({
    title: section.title,
    lines: section.lines.map(stripComment).filter(Boolean)
  }));
}

function headingMatchOf(line) {
  return stripComment(line).match(/^(#{1,6})\s+(.+)$/);
}

function textFromLines(lines, options = {}) {
  return lines
    .filter((line) => !headingMatchOf(line) && (options.includeBullets || !line.startsWith("- ")) && (options.includeKeyValues || !keyValue(line)) && !imageFromLine(line))
    .map((line) => {
      const isBullet = line.startsWith("- ");
      const text = isBullet ? line.replace(/^-\s+/, "").trim() : line;
      const pair = keyValue(text);
      const rendered = options.includeKeyValues && pair ? `${pair[0]}: ${pair[1]}` : text;

      return options.includeBullets && isBullet ? `- ${rendered}` : rendered;
    })
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n /g, "\n")
    .trim();
}

function bullets(lines) {
  return lines
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^-\s+/, "").trim())
    .filter(Boolean);
}

function imageFromLine(line) {
  const trimmed = stripComment(line);
  const markdownImage = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  const obsidianImage = trimmed.match(/^!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/);

  if (markdownImage) {
    return {
      alt: markdownImage[1].trim(),
      src: markdownImage[2].trim()
    };
  }

  if (obsidianImage) {
    const src = obsidianImage[1].trim();
    return {
      alt: (obsidianImage[2] || path.basename(src, path.extname(src))).trim(),
      src
    };
  }

  return null;
}

function imagesFromLines(lines) {
  return lines
    .map(imageFromLine)
    .filter(Boolean);
}

function headingTitle(line, level) {
  const prefix = `${"#".repeat(level)} `;
  return line.startsWith(prefix) ? line.slice(prefix.length).trim() : null;
}

function firstSubheadingBeforeSection(lines, level = 3) {
  for (const line of lines) {
    if (line.startsWith("## ")) return null;
    const title = headingTitle(line, level);
    if (title) return title;
  }

  return null;
}

function readPage(lang, section) {
  const filePath = path.join(contentRoot, section, `${lang}.md`);
  const fallbackPath = path.join(contentRoot, section, "ru.md");

  if (!fs.existsSync(filePath) && lang === "en" && fs.existsSync(fallbackPath)) {
    return {
      filePath: fallbackPath,
      markdown: readMarkdown(fallbackPath)
    };
  }

  return {
    filePath,
    markdown: readMarkdown(filePath)
  };
}

function labelData(lang, section, title, meta) {
  const titleKey = section === "home" ? "researchTitle" : `${section}Title`;
  const kickerKey = section === "home" ? "researchKicker" : `${section}Kicker`;

  return {
    sectionLabels: {
      [kickerKey]: meta["надзаголовок"] || meta.kicker || kickerDefaults[lang][section],
      [titleKey]: title
    }
  };
}

function parseSite() {
  const markdown = readMarkdown(path.join(contentRoot, "site.md"));
  const lines = bodyAfterTitle(markdown).map(stripComment).filter(Boolean);
  const meta = metadata(lines);
  const themeSections = sections(markdown, 2);

  return {
    defaultLanguage: meta["язык по умолчанию"] || meta["default language"] || "ru",
    languageStorageKey: meta["ключ языка"] || meta["language storage key"] || "wireless-lab-language",
    themes: themeSections.map((theme) => {
      const themeMeta = metadata(theme.lines);
      return {
        key: theme.title,
        href: themeMeta["ссылка"] || themeMeta.href,
        title: {
          ru: themeMeta["название ru"] || theme.title,
          en: themeMeta["title en"] || themeMeta["название en"] || theme.title
        },
        description: {
          ru: themeMeta["описание ru"] || "",
          en: themeMeta["description en"] || themeMeta["описание en"] || ""
        }
      };
    })
  };
}

function parseNavigation(lang) {
  const { markdown } = readPage(lang, "navigation");
  const lines = bodyAfterTitle(markdown).map(stripComment).filter(Boolean);
  const meta = metadata(lines);
  const tabSection = sections(markdown, 2).find((section) => {
    const title = section.title.toLowerCase();
    return title === "вкладки" || title === "tabs";
  });

  if (!tabSection) {
    throw new Error(`Missing tabs section for ${lang}`);
  }

  return {
    labName: meta["название лаборатории"] || meta["lab name"],
    tagline: meta["подзаголовок"] || meta.tagline,
    diagramCaption: meta["подпись схем"] || meta["diagram caption"] || "",
    skipNavigation: meta["пропуск навигации"] || meta["skip navigation"] || "",
    navigationLabel: meta["навигация"] || meta["navigation label"] || "",
    footer: meta["подвал"] || meta.footer || "",
    rootEyebrow: meta["надзаголовок выбора темы"] || meta["theme selector eyebrow"],
    rootLead: meta["описание выбора темы"] || meta["theme selector lead"],
    themeSelector: meta["ссылка выбора темы"] || meta["theme selector link"],
    home: meta["главная"] || meta.home,
    sections: bullets(tabSection.lines).map((line) => {
      const [key, title, href] = line.split("|").map((part) => part.trim());
      if (!key || !title || !href) {
        throw new Error(`Invalid navigation item: ${line}`);
      }

      return { key, title, href };
    })
  };
}

function parseHome(lang) {
  const { filePath, markdown } = readPage(lang, "home");
  const title = titleOf(markdown, filePath);
  const meta = metadata(bodyAfterTitle(markdown));
  const homeSections = parseHomeSections(markdown);
  const researchSection = homeSections.find((section) => section.cards.length);

  if (researchSection) {
    return {
      ...labelData(lang, "home", researchSection.title, meta),
      homeSections: homeSections.map((section) => ({
        title: section.title,
        text: section.text,
        images: section.images,
        actions: section.type === "research" ? section.actions : [],
        cards: section.cards,
        type: section === researchSection ? "research" : "text"
      })),
      headerActions: homeSections.flatMap((section) => section.actions || []),
      researchInterests: researchSection.cards
    };
  }

  return {
    ...labelData(lang, "home", title, meta),
    researchInterests: parseSectionCards(markdown)
  };
}

function parseHomeSections(markdown) {
  return topSections(markdown).map((section) => {
    const actions = actionsFromLines(section.lines);
    const actionLines = new Set(actions.map((action) => action.sourceLine));

    return {
      title: section.title,
      text: textFromLines(section.lines.filter((line) => !actionLines.has(line)), { includeBullets: true, includeKeyValues: true }),
      images: imagesFromLines(section.lines),
      actions: actions.map(({ sourceLine, ...action }) => action),
      cards: parseNestedCards(section.lines, 2)
    };
  });
}

function actionsFromLines(lines) {
  return lines
    .map((line) => {
      const trimmed = stripComment(line);
      const match = trimmed.match(/^-\s+\[([^\]]+)\]\(([^)]+)\)$/);

      if (!match || !/^(для связи|contact)$/i.test(match[1].trim())) {
        return null;
      }

      return {
        label: match[1].trim(),
        href: match[2].trim(),
        icon: "mail",
        sourceLine: line
      };
    })
    .filter(Boolean);
}

function parseSectionCards(markdown) {
  const roots = topSections(markdown);
  const sectionLevel = roots.length > 1 ? 1 : 2;
  const cardLevel = sectionLevel + 1;

  return (roots.length > 1 ? roots : sections(markdown)).flatMap((section) => {
    const cards = parseNestedCards(section.lines, cardLevel);

    if (cards.length) {
      return cards;
    }

    return [{
      title: section.title,
      text: textFromLines(section.lines),
      images: imagesFromLines(section.lines)
    }];
  });
}

function parseNestedCards(lines, level = 3) {
  const cards = [];
  let current = null;

  lines.forEach((line) => {
    const headingMatch = headingMatchOf(line);

    if (headingMatch && headingMatch[1].length < level) {
      current = null;
      return;
    }

    const cardTitle = headingTitle(line, level);

    if (cardTitle) {
      current = {
        title: cardTitle,
        lines: []
      };
      cards.push(current);
      return;
    }

    if (current) {
      current.lines.push(line);
    }
  });

  return cards.map((card) => ({
    title: card.title,
    text: textFromLines(card.lines),
    images: imagesFromLines(card.lines)
  }));
}

function parsePeople(lang) {
  const { filePath, markdown } = readPage(lang, "people");
  const title = titleOf(markdown, filePath);
  const bodyLines = bodyAfterTitle(markdown).map(stripComment).filter(Boolean);
  const meta = metadata(bodyLines);
  const kicker = firstSubheadingBeforeSection(bodyLines) || meta["надзаголовок"] || meta.kicker;

  return {
    ...labelData(lang, "people", title, { ...meta, kicker, "надзаголовок": kicker }),
    peopleGroups: sections(markdown).map((section) => ({
      title: section.title,
      people: parsePeopleEntries(section.lines)
    })),
    placeholders: {
      email: placeholderDefaults[lang].email,
      orcid: placeholderDefaults[lang].orcid,
      scholar: placeholderDefaults[lang].scholar,
      profile: placeholderDefaults[lang].profile,
      value: placeholderDefaults[lang].value
    }
  };
}

function parsePeopleEntries(lines) {
  const hasCards = lines.some((line) => line.startsWith("### "));
  const people = [];
  let current = null;

  function startPerson(name) {
    current = {
      name: name.trim(),
      photo: "",
      description: "",
      contacts: []
    };
    people.push(current);
  }

  function appendPersonLine(line) {
    const listItem = line.match(/^-\s+(.+)$/);
    const markdownLink = line.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    const bracketNote = line.match(/^\[([^\]]+)\]$/);
    const image = imageFromLine(line);

    if (!current) return;

    if (image) {
      current.photo = image.src;
      current.photoAlt = image.alt;
      return;
    }

    if (markdownLink) {
      current.photo = markdownLink[2].trim();
      current.photoAlt = markdownLink[1].trim();
      return;
    }

    if (bracketNote) {
      current.photoLabel = bracketNote[1].trim();
      return;
    }

    if (listItem) {
      const [label, ...valueParts] = listItem[1].split(":");
      if (!valueParts.length) {
        current.description = `${current.description} ${listItem[1]}`.trim();
        return;
      }
      current.contacts.push({
        label: label.trim(),
        value: valueParts.join(":").trim()
      });
      return;
    }

    current.description = `${current.description} ${line}`.trim();
  }

  if (hasCards) {
    lines.forEach((line) => {
      const cardTitle = headingTitle(line, 3);
      if (cardTitle) {
        startPerson(cardTitle);
        return;
      }

      appendPersonLine(line);
    });

    return people;
  }

  lines.forEach((line) => {
    const listItem = line.match(/^-\s+(.+)$/);

    if (listItem) {
      startPerson(listItem[1]);
      return;
    }

    appendPersonLine(line);
  });

  return people;
}

function parseStudents(lang) {
  const { filePath, markdown } = readPage(lang, "students");
  const title = titleOf(markdown, filePath);
  const allLines = bodyAfterTitle(markdown).map(stripComment).filter(Boolean);
  const meta = metadata(allLines);
  const pageSections = contentSections(markdown);
  const tracksSection = pageSections.find((section) => {
    const titleLower = section.title.toLowerCase();
    return titleLower === "направления" || titleLower === "tracks";
  });
  const stepSections = pageSections.filter((section) => section !== tracksSection);
  const leadLines = [];

  for (const line of allLines) {
    if (line.startsWith("## ")) break;
    if (!keyValue(line)) leadLines.push(line);
  }

  return {
    ...labelData(lang, "students", title, meta),
    studentOffer: {
      lead: textFromLines(leadLines),
      steps: stepSections.map((section) => ({
        title: section.title,
        text: textFromLines(section.lines)
      })),
      tracks: tracksSection ? bullets(tracksSection.lines) : []
    }
  };
}

function parseProjects(lang) {
  const { filePath, markdown } = readPage(lang, "projects");
  const title = titleOf(markdown, filePath);
  const meta = metadata(bodyAfterTitle(markdown));

  return {
    ...labelData(lang, "projects", title, meta),
    projects: parseGroupedSections(markdown)
  };
}

function parsePatents(lang) {
  const { filePath, markdown } = readPage(lang, "patents");
  const title = titleOf(markdown, filePath);
  const meta = metadata(bodyAfterTitle(markdown));

  return {
    ...labelData(lang, "patents", title, meta),
    patents: parseGroupedSections(markdown)
  };
}

function parseGroupedSections(markdown) {
  return sections(markdown).map((section) => ({
    title: section.title,
    text: textFromLines(section.lines, { includeBullets: true, includeKeyValues: true }),
    images: imagesFromLines(section.lines)
  }));
}

function parseCv(lang) {
  const cvRoot = path.join(contentRoot, "cv");
  const profileFiles = fs.existsSync(cvRoot)
    ? fs.readdirSync(cvRoot)
      .filter((fileName) => fileName.endsWith(`_${lang}.md`))
      .sort()
    : [];

  return {
    ...labelData(lang, "cv", "CV", {}),
    cvProfiles: profileFiles.map((fileName) => {
      const filePath = path.join(cvRoot, fileName);
      const markdown = readMarkdown(filePath);
      const title = titleOf(markdown, filePath);
      const bodyLines = bodyAfterTitle(markdown).map(stripComment).filter(Boolean);
      const profileMeta = metadata(bodyLines);
      const slug = fileName.replace(new RegExp(`_${lang}\\.md$`), "");
      const firstSection = bodyLines.findIndex((line) => headingTitle(line, 3));
      const summaryLines = firstSection < 0 ? bodyLines : bodyLines.slice(0, firstSection);

      return {
        slug: profileMeta.slug || slug,
        name: profileMeta["имя"] || profileMeta.name || title,
        role: profileMeta["роль"] || profileMeta.role || "",
        summary: textFromLines(summaryLines),
        sections: parseCvSections(bodyLines)
      };
    })
  };
}

function parseCvSections(lines) {
  const result = [];
  let current = null;

  lines.forEach((line) => {
    const title = headingTitle(line, 3);

    if (title) {
      current = {
        title,
        lines: []
      };
      result.push(current);
      return;
    }

    if (current) {
      current.lines.push(line);
    }
  });

  return result.map((section) => ({
    title: section.title,
    text: textFromLines(section.lines, { includeBullets: true, includeKeyValues: true })
  })).filter((section) => section.text);
}

function slugify(text) {
  const translit = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
    щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya"
  };

  return String(text || "")
    .toLowerCase()
    .split("")
    .map((char) => translit[char] || char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseSimpleList(lang, sectionName, outputKey, placeholderKey) {
  const { filePath, markdown } = readPage(lang, sectionName);
  const title = titleOf(markdown, filePath);
  const lines = bodyAfterTitle(markdown).map(stripComment).filter(Boolean);
  const meta = metadata(lines);
  const items = bullets(lines);
  const sectionTitles = sections(markdown).map((section) => section.title);

  return {
    ...labelData(lang, sectionName, title, meta),
    [outputKey]: items.length ? items : sectionTitles,
    placeholders: {
      [placeholderKey]: placeholderDefaults[lang][placeholderKey]
    }
  };
}

function leadBeforeSections(markdown) {
  const leadLines = [];

  for (const line of bodyAfterTitle(markdown).map(stripComment).filter(Boolean)) {
    if (line.startsWith("## ")) break;
    if (!keyValue(line)) leadLines.push(line);
  }

  return textFromLines(leadLines);
}

function parsePublicationSection(section) {
  const sectionLead = [];
  const items = [];
  const groups = [];
  let currentGroup = null;

  section.lines.forEach((line) => {
    const groupTitle = headingTitle(line, 3);

    if (groupTitle) {
      currentGroup = {
        title: groupTitle,
        items: []
      };
      groups.push(currentGroup);
      return;
    }

    if (line.startsWith("- ")) {
      const item = line.replace(/^-\s+/, "").trim();
      if (currentGroup) {
        currentGroup.items.push(item);
      } else {
        items.push(item);
      }
      return;
    }

    if (!keyValue(line)) {
      sectionLead.push(line);
    }
  });

  return {
    title: section.title,
    text: textFromLines(sectionLead),
    items,
    groups: groups.filter((group) => group.items.length)
  };
}

function parsePublications(lang) {
  const { filePath, markdown } = readPage(lang, "publications");
  const title = titleOf(markdown, filePath);
  const lines = bodyAfterTitle(markdown).map(stripComment).filter(Boolean);
  const meta = metadata(lines);

  return {
    ...labelData(lang, "publications", title, meta),
    publicationContent: {
      lead: leadBeforeSections(markdown),
      sections: sections(markdown).map(parsePublicationSection)
    }
  };
}

function parseNewsPage(lang) {
  const { filePath, markdown } = readPage(lang, "news");
  const title = titleOf(markdown, filePath);
  const meta = metadata(bodyAfterTitle(markdown));

  return labelData(lang, "news", title, meta);
}

function parseMedia(lang) {
  const { filePath, markdown } = readPage(lang, "media");
  return {
    ...labelData(lang, "media", titleOf(markdown, filePath), {}),
    mediaLead: leadBeforeSections(markdown),
    mediaItems: sections(markdown).map((section) => ({
      title: section.title,
      text: textFromLines(section.lines),
      images: imagesFromLines(section.lines)
    }))
  };
}

function parseNewsItems(lang) {
  const pageItems = parseInlineNewsItems(lang);
  return pageItems.length ? pageItems : parseLegacyNewsItems(lang);
}

function parseInlineNewsItems(lang) {
  const { markdown } = readPage(lang, "news");

  return sections(markdown).map((section) => {
    const meta = metadata(section.lines);
    return {
      date: meta["дата"] || meta.date || "",
      title: section.title,
      text: textFromLines(section.lines, { includeBullets: true })
    };
  });
}

function parseLegacyNewsItems(lang) {
  const itemsRoot = path.join(contentRoot, "news", "items");

  if (!fs.existsSync(itemsRoot)) {
    return [];
  }

  return fs.readdirSync(itemsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((itemDir) => {
      const filePath = path.join(itemsRoot, itemDir, `${lang}.md`);
      const fallbackPath = path.join(itemsRoot, itemDir, "ru.md");
      const sourcePath = !fs.existsSync(filePath) && lang === "en" && fs.existsSync(fallbackPath)
        ? fallbackPath
        : filePath;
      const markdown = readMarkdown(sourcePath);
      const title = titleOf(markdown, sourcePath);
      const lines = bodyAfterTitle(markdown).map(stripComment).filter(Boolean);
      const meta = metadata(lines);

      return {
        date: meta["дата"] || meta.date || "",
        title,
        text: textFromLines(lines)
      };
    });
}

function mergeContent(target, source) {
  Object.entries(source).forEach(([key, value]) => {
    if (key === "sectionLabels" || key === "placeholders") {
      target[key] = { ...(target[key] || {}), ...value };
      return;
    }

    target[key] = value;
  });

  return target;
}

function buildLanguage(lang) {
  const data = parseNavigation(lang);

  [
    parseHome(lang),
    parsePeople(lang),
    parseStudents(lang),
    parseProjects(lang),
    parsePatents(lang),
    parsePublications(lang),
    parseMedia(lang),
    parseNewsPage(lang),
    parseCv(lang)
  ].forEach((section) => mergeContent(data, section));

  data.newsItems = parseNewsItems(lang);

  return data;
}

syncEnglishContent();

const site = parseSite();
const content = {
  defaultLanguage: site.defaultLanguage,
  languageStorageKey: site.languageStorageKey,
  themes: site.themes,
  languages: Object.fromEntries(languages.map((lang) => [lang, buildLanguage(lang)]))
};

const output = `// Generated by tools/build-content.js from content/**/*.md. Do not edit by hand.
window.LAB_CONTENT = ${JSON.stringify(content, null, 2)};
`;

fs.writeFileSync(path.join(root, "js", "lab-content.js"), output, "utf8");
console.log("Generated js/lab-content.js from content/**/*.md");
