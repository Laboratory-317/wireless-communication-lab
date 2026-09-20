# state/STATE.md — snapshot from main

## Current Objective

Update the lab website with a patents placeholder, grant projects, and team CV
profile pages.

## Current Status

The repository state file says there is no active website content implementation
work in progress.

## Important Completed Work

- Repository-level agent documentation was split into instruction, architecture,
  environment, tools, state, and feedback subsystems.
- `tools/codex-check.ps1` was added as a repeatable smoke-check.
- RU -> EN translation tooling was added.
- People cards and shared theme rendering were expanded.
- Visible content remains Markdown-sourced.
- Patents, projects, CV pages, news parsing, and PDF patent links were added.
- Projects and patents are grouped and sorted reverse-chronologically.
- `js/lab-content.js` is regenerated from Markdown rather than edited manually.

## Blocked

- Automatic translation through MyMemory may be blocked by free-tier quota until
  reset, or until a reachable LibreTranslate endpoint is configured.

## Known Issues

- Working-tree modifications may exist independently of committed state.
- `js/lab-content.js` can change when checks regenerate content.
- `content/publications/en.md` is currently a copied fallback of the Russian
  publications list and needs proper English editing when translation quality matters.

## Next Actions

- Use root `AGENTS.md` as the entry point for agent work.
- Keep `tools/INDEX.md` synchronized with reusable tooling.
- Configure a local/trusted LibreTranslate endpoint if better free translation
  quality is needed.
