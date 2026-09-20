# tests/FEEDBACK.md

## Minimum Check

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\codex-check.ps1
```

The check should:

- show repository status;
- regenerate `js/lab-content.js`;
- run `setup-theme-showcase.ps1`;
- validate generated JavaScript with Node.js;
- verify required entry files exist.

## Change-Specific Checks

| Change type | Check |
| --- | --- |
| `content/**/*.md` | Run `node tools/build-content.js`; inspect generated content if parsing changed. |
| `tools/build-content.js` | Run `node tools/build-content.js` and `tools/codex-check.ps1`. |
| `js/main.js` or `js/render-theme.js` | Run `tools/codex-check.ps1`; browser-check affected pages when feasible. |
| Theme CSS | Browser-check at least one desktop and one narrow viewport. |
| Theme page templates | Run `setup-theme-showcase.ps1` and inspect affected pages. |
| Translation tooling | Run `node tools/translate-ru-to-en.js --help`; optionally dry-run translation. |
| Agent documentation | Ensure project docs do not contradict each other. |

## Optional Local Server

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\codex-check.ps1 -Serve
```

Open `http://127.0.0.1:8080/`.

## Success Criteria

- Required checks complete without errors.
- Generated files are not manually edited.
- Content remains sourced from Markdown.
- Skipped checks and remaining risks are stated explicitly.
