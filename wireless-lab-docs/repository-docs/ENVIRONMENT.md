# ENVIRONMENT.md

## Purpose

This file stores stable rules for choosing tools in this project. Fast-changing
facts about this machine are stored in `environment/INVENTORY.md`.

## Primary Stack

| Tool | Use |
| --- | --- |
| PowerShell | Main shell and script runtime on Windows. |
| Node.js | Required for `tools/build-content.js` and JavaScript validation. |
| Git | Version control and change inspection. |
| ripgrep | Fast file and text search. |
| Python | Optional static file server for local browser checks. |
| MyMemory API | Default no-key translator for Russian to English Markdown drafts. |
| LibreTranslate API | Optional ordinary translation API, preferably self-hosted for free use. |

## Tool Choice Rules

- Use existing project scripts before creating new ones.
- Use Node.js for checks related to generated JavaScript content.
- Use PowerShell for Windows-oriented repository automation.
- Use Python only for simple local serving or when a task clearly benefits from
  Python libraries.
- Do not add package dependencies unless the task requires them and the user has
  approved the tradeoff.
- For visual website changes, prefer browser verification over reasoning from
  HTML/CSS alone when feasible.
- For RU to EN content drafts, use `tools/translate-ru-to-en.js`. Prefer
  MyMemory when no local service is configured; prefer LibreTranslate when a
  free/self-hosted endpoint is available.
- Do not make translation a hard dependency of ordinary site builds. Local
  LibreTranslate is useful for editor workflows, but `node tools/build-content.js`
  must stay usable without network access.

## External Services

The published site is expected to be built by GitHub Pages from `main` using the
workflow under `.github/workflows/`. Do not publish or push without explicit user
request.
