# tests/FEEDBACK.md

## Purpose

This file describes how to prove that changes to this repository are correct.

## Minimum Check

Before final handoff, run when feasible:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\codex-check.ps1
```

The check should:

- show repository status;
- regenerate localized SVG diagrams and `js/lab-content.js`;
- run `setup-theme-showcase.ps1`;
- validate generated JavaScript with Node.js;
- verify required entry files exist.
- exercise all four themes in both languages, including each CV profile;
- validate local content links/images and reject public TODO/example links;
- retain localized, explicit placeholders for genuinely missing profile data.

For publication changes also run `node tools/build-site.js` and inspect `/_site/`
through the local server. The artifact must not contain repository documentation. The build also validates
pre-rendered content, exact-case local paths, HTML IDs and PDF signatures.
For responsive checks, `tests/responsive-preview.html` provides an actual narrow
iframe when the browser's viewport override is unavailable.

## Change-Specific Checks

| Change type | Check |
| --- | --- |
| `content/**/*.md` | Run `node tools/build-content.js`; inspect generated content if parsing changed. |
| `tools/build-content.js` | Run `node tools/build-content.js` and `tools/codex-check.ps1`. |
| `js/main.js` or `js/render-theme.js` | Run `tools/codex-check.ps1`; browser-check affected pages when feasible. |
| Theme CSS | Browser-check at least one desktop and one narrow viewport for the affected theme. |
| Theme page templates | Run `setup-theme-showcase.ps1` and inspect affected generated pages. |
| Translation tooling | Run `node tools/translate-ru-to-en.js --help`; if network is available, run a dry translation without `--write`. |
| Agent documentation | Check that `AGENTS.md`, `ARCHITECTURE.md`, `ENVIRONMENT.md`, `tools/INDEX.md`, `state/STATE.md`, and this file do not contradict each other. |

## Optional Local Server

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\codex-check.ps1 -Serve
```

Open `http://127.0.0.1:8080/`.

## Success Criteria

- Required checks complete without errors.
- Generated files are not manually edited.
- Content remains sourced from Markdown.
- Any skipped checks or remaining risks are stated in the final response.

## Update Policy

Update this file when checks, build commands, or readiness criteria change.
