# environment/INVENTORY.md

This file records the observed local environment for this project. It can become
stale and should be refreshed when tool availability matters.

Inventory date: 2026-08-23

## Observed Tools

| Tool | Observed version / status | Role |
| --- | --- | --- |
| PowerShell | 7.6.5 | Main shell and project automation runtime. |
| Node.js | v24.15.0 | Runs `tools/build-content.js` and JavaScript checks. |
| Git | 2.54.0.windows.1 | Version control. |
| ripgrep | Available in current shell | Fast source and content search. |

## Project Facts

- No `package.json` is present.
- The project currently relies on plain Node.js built-in modules for content
  generation.
- `.gitignore` excludes `.obsidian/`, `codex/`, and `themes-preview/*-demo/`.
- Existing human-facing documentation is in `README.md` and `tools/README.md`.
