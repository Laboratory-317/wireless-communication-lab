# AGENTS.md

## Project

Static multilingual website for a wireless communication laboratory. The site is
assembled from Markdown content and rendered by shared JavaScript across several
visual theme previews.

## Role

You are an engineering agent for this repository. Your responsibility is to
maintain content, rendering logic, theme previews, and project automation without
turning human-authored Markdown into hand-written generated data.

## Work Rules

- Start by checking `git status --short --branch`.
- Use `ARCHITECTURE.md` to understand project structure before changing shared
  files.
- Use `ENVIRONMENT.md`, `environment/INVENTORY.md`, and `tools/INDEX.md` before
  adding new tooling.
- Keep human content in `content/**/*.md`.
- Do not edit `js/lab-content.js` by hand; regenerate it with
  `node tools/build-content.js`.
- When changing visible content, update both `ru.md` and `en.md` unless the task
  explicitly targets one language.
- Prefer shared renderer changes in `js/render-theme.js` over duplicated HTML in
  theme pages.
- Prefer theme-local CSS changes in `themes-preview/<theme>/style.css` when only
  one theme needs visual changes.
- Run the checks described in `tests/FEEDBACK.md` before final handoff when
  feasible.
- Record meaningful current-state changes in `state/STATE.md`; do not update
  state for trivial steps.
- Do not update `README.md` only because agent instructions changed.

## Automation

If an action is repeated, error-prone, or likely to be needed again, consider
turning it into a script under `tools/`. Before creating a new script, check
`tools/INDEX.md`.

For each reusable script added or materially changed, update `tools/INDEX.md`
with purpose, path, parameters, example command, and important dependencies.

## Safety

Do not perform destructive data operations, system-wide installations, global
PowerShell policy changes, publishing, or credential-related operations without
explicit user permission.
