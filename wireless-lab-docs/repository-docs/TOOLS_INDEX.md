# tools/INDEX.md

## `tools/build-content.js`

- Purpose: generate `js/lab-content.js` from `content/**/*.md`.
- Command: `node tools/build-content.js`
- Ordinary build does not use network translation.
- `LAB_AUTO_TRANSLATE=1` enables automatic translation of missing English Markdown.
- `LAB_TRANSLATE_PROVIDER=libre` selects LibreTranslate when auto-translation is enabled.

## `setup-theme-showcase.ps1`

- Purpose: regenerate shared content, sync `labicon.png` into preview folders,
  and verify required preview pages.
- Command:
  `powershell -ExecutionPolicy Bypass -File .\setup-theme-showcase.ps1`

## `tools/new-theme-page.ps1`

- Purpose: create the same page across all four preview themes from
  `tools/theme-page.template.html`.

## `tools/update-cache-version.ps1`

- Purpose: update CSS/JS query-string cache versions across working HTML files.

## `tools/codex-check.ps1`

- Purpose: repository smoke-check for status, generated content, showcase
  structure, and JavaScript validity.
- Command:
  `powershell -ExecutionPolicy Bypass -File .\tools\codex-check.ps1`
- Optional: `-Serve`; optional port via `-Port`.
- Dependencies: PowerShell, Git, Node.js; Python only for `-Serve`.

## `tools/translate-ru-to-en.js`

- Purpose: translate Russian Markdown into paired English Markdown using
  MyMemory or LibreTranslate.
- Key options:
  - `--source <path>`
  - `--target <path>`
  - `--all`
  - `--write`
  - `--force`
  - `--if-source-newer`
  - `--provider mymemory|libre`
