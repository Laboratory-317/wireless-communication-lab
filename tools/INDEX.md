# tools/INDEX.md

Reusable project tools.

## `tools/build-site.js`

- Purpose: Build and validate the public GitHub Pages artifact in `_site/`.
- Parameters: None.
- Example: `node tools/build-site.js`
- Dependencies: Node.js built-in modules; existing content builder and site checker.
- Notes: Recreates only the generated `_site/` directory. Copies configured previews,
  CSS, JS, assets, and root image attachments. Excludes content sources and internal
  documentation. Run a local server at the repository root and open `/_site/` to
  verify project-subpath behavior before deployment.

## `tools/check-site.js`

- Purpose: Validate all theme/language/page renders, CV selection, local links,
  images, and absence of public TODO/example links.
- Parameters: None.
- Example: `node tools/build-content.js` followed by `node tools/check-site.js`.
- Dependencies: Node.js built-in fs, path, vm and assert modules.
- Notes: Uses a minimal DOM stub; does not replace browser layout/interaction checks.

## `tests/responsive-preview.html`

- Purpose: Local browser inspection in a real 390px iframe viewport.
- Parameters: `theme`, `page`, and `lang` query parameters.
- Example: `http://127.0.0.1:8080/tests/responsive-preview.html?theme=academicpages&page=people.html&lang=en`
- Dependencies: A static local HTTP server and a browser. No packages.
- Notes: Not included in the Pages artifact. Scrollbar reduces content width to 375px
  on browsers using a 15px scrollbar.

## `tools/build-content.js`

- Purpose: Generate `js/lab-content.js` from human-readable Markdown in
  `content/**/*.md`.
- Parameters: None.
- Example:

```powershell
node tools/build-content.js
```

- Dependencies: Node.js built-in `fs`, `path`, and `child_process` modules;
  internet access for the configured translation provider when English files are
  missing.
- Notes:
  - Required after changing `content/` or the parser itself.
  - Does not use network translation by default.
  - Set `LAB_AUTO_TRANSLATE=1` to auto-generate missing English Markdown during
    the build.
  - Set `LAB_TRANSLATE_PROVIDER=libre` to use LibreTranslate when automatic
    translation is enabled.

## `setup-theme-showcase.ps1`

- Purpose: Regenerate shared content, sync the root `labicon.png` into theme
  preview folders, and ensure required preview pages exist.
- Parameters: None.
- Example:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-theme-showcase.ps1
```

- Dependencies: PowerShell, Node.js.

## `tools/new-theme-page.ps1`

- Purpose: Create the same page across all four theme preview folders from
  `tools/theme-page.template.html`.
- Parameters: See script source before use.
- Example:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\new-theme-page.ps1
```

- Dependencies: PowerShell.

## `tools/update-cache-version.ps1`

- Purpose: Update CSS/JS query-string cache versions across working HTML files
  and shared `theme-base.css` imports in theme-local CSS.
- Parameters: Required `-Version <string>`, for example `20260920-final`.
- Example:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\update-cache-version.ps1 -Version 20260920-final
```

- Dependencies: PowerShell.

## `tools/codex-check.ps1`

- Purpose: Agent smoke-check for repository status, generated content, theme
  showcase structure, and JavaScript validity.
- Parameters:
  - `-Serve`: optionally start a local static server after checks.
  - `-Port <number>`: server port when `-Serve` is used; default is `8080`.
- Example:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\codex-check.ps1
```

- Dependencies: PowerShell, Git, Node.js; Python only when `-Serve` is used.

## `tools/translate-ru-to-en.js`

- Purpose: Translate Russian Markdown content to paired English Markdown using
  ordinary translation APIs, not agent/LLM APIs.
- Parameters:
  - `--source <path>`: translate one Russian Markdown file.
  - `--target <path>`: target English Markdown path; defaults to sibling `en.md`.
  - `--all`: translate all `content/**/ru.md` files.
  - `--write`: write files; otherwise print translation to stdout.
  - `--force`: overwrite non-empty targets.
  - `--if-source-newer`: write only when the English target is missing, empty,
    or older than the Russian source.
  - `--provider mymemory|libre`: choose provider; default is `mymemory`.
- Example:

```powershell
node tools/translate-ru-to-en.js --source content\news\items\001-laboratory-news\ru.md
```

- Dependencies: Node.js with built-in `fetch`, internet access for MyMemory, or
  a reachable LibreTranslate instance.
- Notes: MyMemory works without a key but has free-tier limits. LibreTranslate
  can run for free as a self-hosted local API.

## `tools/build-diagrams.js`

- Purpose: Generate the four explanatory SVG diagrams in both languages from labels in `content/research-diagrams/{ru,en}.md`.
- Parameters: none.
- Example: `node tools/build-diagrams.js`.
- Dependencies: Node.js built-ins only.
- Outputs: `assets/research/*.svg`. Edit labels in Markdown and drawing geometry in this script.
- Integration: `tools/build-site.js` and `tools/codex-check.ps1` now run this generator before building content; their existing parameters remain unchanged.

`tools/check-site.js` also checks that missing photos, contacts and interests remain visible in both languages. Run with `node tools/check-site.js`; no parameters or additional dependencies.

`tools/build-content.js` retains colon-containing CV prose and excludes only known profile metadata from introductions. `tools/check-site.js` checks research-interest introductions remain visible. Existing commands and dependencies are unchanged.
