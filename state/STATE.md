# state/STATE.md

## Current Objective

Deliver four genuinely distinct theme previews with shared Markdown content,
GitHub Pages-only publishing, and a practical editing workflow for non-developers.

## Published to main — September 21, 2026

- At the user's explicit request, fast-forwarded `main` to the prepared branch and pushed it to origin.
- Deployment of `60811cf` succeeded: https://github.com/temaSW/wireless-communication-lab/actions/runs/35527977408 .
- Verified HTTP 200 and updated content on the public selector, student page and team page; verified a public patent PDF signature.
- Live URL: https://temasw.github.io/wireless-communication-lab/ . All four themes remain available.
- The launch-review publication status below supersedes the earlier local-only notes.

## GitHub access verified after owner login

- GitHub account `temaSW` has admin/push access to the repository.
- Pages is configured with `build_type: workflow` and HTTPS enabled; recent deployments of the existing main branch succeeded.
- Public URL: https://temasw.github.io/wireless-communication-lab/ .
- Remote main is `235cab1`; local redesign is `16b39cc`. No push, merge or deployment was performed.
- Codex has an isolated APPDATA directory. For gh commands in this session, set process-local GH_CONFIG_DIR to the existing user configuration at `$env:USERPROFILE\AppData\Roaming\GitHub CLI`. Do not copy or print credentials.

## September 21, 2026 launch preparation

- User confirmed keeping the four-theme selector at launch.
- Matched the original circular logo to each background with CSS clipping.
- Reworked the RU/EN student invitation and a separate contact call to action.
- Fixed colon/URL handling in Markdown prose and heading/paragraph rendering.
- Added default-language prerendering, metadata, root attachment allowlisting,
  automatic logo synchronization and artifact checks; introduced PR validation CI.
- Corrected sourced project dates, replaced failing DOI redirects with publisher links,
  filled a published professional email and kept unresolved profile fields explicit.
- Browser audit: 72 desktop pages and 64 narrow-page combinations passed overflow/image checks.
- Details, source links, known limitations and the small remaining data list are in `state/LAUNCH_REVIEW.md`.
- GitHub CLI has no active authentication; remote Pages configuration was not verified.
  No push, merge or publication was performed.

## September 21, 2026 editorial revision

- Cleaned RU/EN home, student, news, team and CV wording. Research descriptions use neutral research-interest lists; removed laboratory leadership hierarchy.
- Fixed CV parsing to retain introductory prose containing a colon (including research interests), with a regression check.
- Restored the original lab logo in the journal theme, including narrow layouts.
- Rebuilt all four SVG diagrams with explanatory labels and separate RU/EN assets. Human-authored labels live in `content/research-diagrams/`; the dependency-free generator runs in both build and check workflows.
- Following the user's updated requirement, unknown photos, contacts, research interests, news dates, history and laboratory photographs remain explicit placeholders. This supersedes the September 20 decision to hide empty contacts. No missing facts were invented.
- Verified all 80 renders and local references through `tools/codex-check.ps1`, plus the Pages artifact build. Browser-reviewed team/logo on desktop and at 375px content width, and the English diagram gallery. No horizontal overflow in the checked narrow team layout.
- Work remains local on `codex/four-lab-designs`; no push or publication.

## September 20, 2026 redesign

- Baseline captured in commit `634be9a`, including the existing documentation bundle.
- Reviewed WCSNG (UCSD), Signal Kinetics (MIT), Dina Katabi (MIT), and USC NSL.
  Findings and design decisions are in `state/DESIGN_REVIEW.md`.
- Rebuilt themes as an academic directory, research showcase, research journal,
  and engineering atlas, retaining existing URLs and section order.
- Added shared `css/theme-base.css`; each theme owns its composition.
- Filled home and student content in RU/EN; replaced history TODO with verified
  location/context. Removed empty public contact placeholders and example news links.
- The user rejected generated 3D illustrations. Those images were not added to the
  repository. Final visuals are editable SVG concept diagrams in `assets/research/`.
- Media now supports Markdown sections with images and captions. English bibliography
  headings are translated; original publication titles remain in their source language.
- Added URL language persistence, skip navigation, descriptive page titles, visible
  focus styles, and print styles. No new dependencies or external site services.
- Added 80 render combinations and local-link/image validation in `tools/check-site.js`.
- Fixed the parser so bulleted biographies remain descriptions, and CV introductions
  contain only the lead instead of repeating all subsequent sections.
- Verified all four home layouts visually on desktop and in a 390px iframe. Checked
  all 32 internal theme/page combinations in English at 375px content width: no
  horizontal overflow or broken loaded images. Tested language switching, team/CV
  navigation, and the `_site/` project-subpath build in the browser.
- `tools/build-site.js` and the full `tools/codex-check.ps1` passed. No publication
  or push was performed; implementation is on `codex/four-lab-designs`.
- Pages workflow now validates and publishes only `_site/`, using Node.js 24.
- Remaining source-data gaps: laboratory founding chronology, unavailable portraits,
  event/lab photos, and missing individual contacts. No public TODOs are required.

## Completed

- Read the existing website structure, README, renderer, and build scripts.
- Read the external harness methodology in
  `A:\PetProjects\UpdateAgentEnviroment`.
- Created root agent documentation split into instruction, architecture,
  environment, tools, state, and feedback subsystems.
- Added `tools/codex-check.ps1` as a repeatable smoke-check.
- Ran `powershell -ExecutionPolicy Bypass -File .\tools\codex-check.ps1`
  successfully.
- Added `tools/translate-ru-to-en.js` for RU to EN Markdown translation through
  ordinary free translation APIs: MyMemory by default and optional LibreTranslate.
- Verified translation tooling with `node --check`, `--help`, and a MyMemory
  dry-run without writing files.
- Re-ran `tools/codex-check.ps1` successfully after adding translation tooling.
- Updated the people card renderer and all theme preview styles so person cards
  use a larger `photo | information` layout while keeping people data sourced
  from Markdown.
- Ran `tools/codex-check.ps1` successfully after the people card layout update.
- Extended Markdown rendering so `#` sections, nested subsections, lists, and
  home-page action links render consistently across theme previews.
- Removed visible `undefined` fallbacks from shared renderers and converted the
  home contact link into a mail button action.
- Moved RU to EN synchronization behind the explicit `LAB_AUTO_TRANSLATE=1`
  switch so ordinary content builds do not depend on network translation.
- Added a patents page placeholder to the shared navigation and all theme
  previews.
- Replaced project placeholders with grant and research project cards sourced
  from the supplied Kryukov and Pokamestov documents.
- Added CV profile content for Yakov Kryukov and Dmitriy Pokamestov, plus CV
  links from their people cards.
- Extended the shared content builder and theme renderer for `patents` and
  `cv` pages.
- Regenerated `js/lab-content.js` with the local default `node tools/build-content.js`.
- Simplified section rendering by removing visible kicker labels from public
  page headers.
- Changed people cards so CV links are attached to the person's name instead
  of appearing as a separate contact row.
- Changed news editing to the simpler inline `content/news/<lang>.md` format,
  where each `##` section is one news item; legacy `news/items` folders remain
  parser-compatible as fallback.
- Changed CV source files to separate `content/cv/<surname>_<lang>.md` files.
- Added `content/README.md` with editor-facing instructions for non-technical
  content maintenance.
- Full `tools/codex-check.ps1` passed after translation was made opt-in.
- Simplified CV profile pages so their content renders as ordinary text
  sections instead of card-like blocks, and removed leadership wording from the
  Kryukov profile.
- Regrouped the projects page into thematic lists: RSF, Priority 2030, TUSUR
  Advanced Engineering School, UMNIK, industry contracts, and individual grants.
- Filled the patents page from the supplied `Патенты.7z` archive as grouped
  lists of inventions, utility models, and software registrations.
- Re-ran `tools/codex-check.ps1` successfully after the CV, projects, and
  patents updates.
- Changed projects and patents rendering from card grids to ordinary
  sequential grouped lists sourced from one Markdown file per language.
- Added patent PDF files under `assets/patents/` and linked all patent entries
  to their PDFs.
- Sorted project and patent entries within each group by year in the Markdown
  sources.
- Changed project and patent sorting inside each group to reverse chronological
  order: newer entries first.

## In Progress

- No active website content implementation work.

## Blocked

- No blocker for the redesign. Translation-service availability is not a build dependency.

## Known Issues

- The published pages still require JavaScript for content rendering; HTML
  prerendering is outside this visual redesign.
- Browser viewport overrides did not apply in the in-app browser. Responsive layout
  was inspected via `tests/responsive-preview.html` (390px iframe, 375px content width).

## Temporary Decisions

- The harness is stored in repository-level files rather than ignored `codex/`
  files so future agents can discover it reproducibly.

## Next Actions

- Use `AGENTS.md` as the entry point for future agent work.
- Keep `tools/INDEX.md` updated when reusable project tools change.
- For higher translation quality without paid APIs, configure a local or trusted
  LibreTranslate endpoint and use `--provider libre`.

## Update Policy

Update this file after meaningful project-state changes, before long pauses, when
blocked, or when handing work to another agent or human.
