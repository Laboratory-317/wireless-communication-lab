# Wireless Communication Laboratory — project snapshot

Snapshot date: 2026-09-08
Repository: `temaSW/wireless-communication-lab`
Default branch: `main`
Observed main commit: `235cab1fc477eb7542e98a42816365866a7effd3`

## What the project is now

A multilingual static GitHub Pages site for a wireless communication laboratory.

The current implementation is deliberately framework-light:

- human content: Markdown under `content/`;
- build step: plain Node.js script using built-in modules;
- generated data: `js/lab-content.js`;
- browser rendering: vanilla JavaScript;
- theme differentiation: theme-local CSS;
- automation: PowerShell;
- hosting: GitHub Pages via GitHub Actions.

## Canonical flow

```text
content/**/*.md
    -> tools/build-content.js
    -> js/lab-content.js
    -> js/main.js / js/render-theme.js
    -> root selector + themes-preview pages
```

## Critical architectural fact

The four named themes are not currently independent native framework projects.

They are four visual preview folders:

```text
themes-preview/
├── academicpages/
├── hugo-academic/
├── minimal-mistakes/
└── bootstrap-academic/
```

Each contains small static HTML pages plus its own `style.css`, while the content
and behavior come from shared JavaScript.

Therefore, do not introduce Ruby/Jekyll, Hugo, npm/Vite, or separate theme builds
unless the user explicitly requests a migration to native framework implementations.

## Sources of truth

- Visible content: `content/**/*.md`
- Theme list/site settings: `content/site.md`
- Generated runtime content: `js/lab-content.js` (never hand-edit)
- Root selector renderer: `js/main.js`
- Shared preview renderer: `js/render-theme.js`
- Agent rules: `AGENTS.md`
- Architecture: `ARCHITECTURE.md`
- Environment policy: `ENVIRONMENT.md`
- Tool inventory: `tools/INDEX.md`
- Verification: `tests/FEEDBACK.md`
- Current work state: `state/STATE.md`

## Editing rule

For visible content changes, normally update both Russian and English Markdown
files. Automatic translation is optional and must not become a dependency of the
ordinary build.

## Verification rule

Use:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\codex-check.ps1
```

For visual changes, also browser-check affected themes and narrow viewports.

## Deployment

Pushes to `main` trigger the Pages workflow, rebuild the content model, upload
the repository as an artifact, and deploy it.

Do not publish without explicit user permission.

## Known issues

- English publications content is currently a copied fallback rather than a
  proper translation.
- Free translation providers can be quota-limited.
- Local working-tree state may differ from the GitHub snapshot; inspect status
  before local edits.

## Historical hand-off warning

`historical/Hand-off.txt` describes an older stage where native Academic Pages,
Hugo Academic, Minimal Mistakes, and Vite/Bootstrap builds were planned. It is
useful as project history, but it should not override the current repository
architecture described above.
