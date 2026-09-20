# ARCHITECTURE.md

## Purpose

This file describes the stable structure and responsibilities of the project.
Operational rules are in `AGENTS.md`; environment rules are in `ENVIRONMENT.md`;
tooling is indexed in `tools/INDEX.md`; current progress is in
`state/STATE.md`; verification rules are in `tests/FEEDBACK.md`.

## Structure

```text
wireless-lab-site/
├── AGENTS.md
├── ARCHITECTURE.md
├── ENVIRONMENT.md
├── README.md
├── index.html
├── css/
├── js/
├── content/
├── themes-preview/
├── obsidian-templates/
├── tools/
├── environment/
├── state/
└── tests/
```

## Component Responsibilities

`content/` is the source of truth for visible site text. Each public section has
separate Russian and English Markdown files.

`content/site.md` defines site-wide configuration and available themes.

`content/news/<lang>.md` stores news entries as ordinary `##` sections. The
older `content/news/items/<item-id>/` folder format remains supported only as a
fallback when no inline news sections are present.

`content/cv/<surname>_<lang>.md` stores individual team CV pages. The surname
stem is used in links such as `cv.html?person=kryukov`.

`tools/build-content.js` parses Markdown from `content/` and generates
`js/lab-content.js`.

`js/lab-content.js` is generated runtime data. It must not be edited manually.

`js/main.js` renders the root theme-selection page from `window.LAB_CONTENT`.

`js/render-theme.js` renders all theme preview pages from the same generated
content model.

`themes-preview/<theme>/` contains standalone preview pages and theme-local CSS.
Preview HTML should remain structurally consistent and use the shared renderer.

`css/style.css` styles the root theme-selection page.

`obsidian-templates/` contains templates for human content editing in Obsidian.

`tools/` contains reusable project scripts. See `tools/INDEX.md`.

`environment/` contains machine and runtime inventory for agent use.

`state/` contains current work state and follow-up notes.

`tests/` contains verification policy and future automated checks.

## Main Build Flow

```text
content/**/*.md
    -> tools/build-content.js
    -> js/lab-content.js
    -> index.html and themes-preview/*/*.html through shared renderers
```

## Architecture Update Policy

Update this file when component responsibilities, the build flow, or major
project directories change. Do not update it for ordinary content edits.
