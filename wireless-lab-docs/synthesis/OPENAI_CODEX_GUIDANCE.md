# OpenAI Codex guidance relevant to this repository

Checked: 2026-09-08

This is a concise project-oriented summary of official OpenAI documentation and
engineering articles. It is not a copy of the original pages.

## 1. `AGENTS.md` discovery and precedence

Official Codex documentation says Codex reads instruction files before doing
work and builds an instruction chain.

Project-level discovery starts at the project root (typically the Git root) and
walks down toward the current working directory. In each directory, Codex checks
for `AGENTS.override.md` before `AGENTS.md`. Guidance closer to the working
directory appears later and therefore overrides broader guidance.

The documented default combined project-instruction size limit is 32 KiB
(`project_doc_max_bytes`), so large instruction sets should be split or kept
focused.

For this repository:

- keep root `AGENTS.md` concise and repository-wide;
- put specialized rules near specialized subtrees only if they become necessary;
- prefer links to durable docs over copying every detail into `AGENTS.md`;
- use `AGENTS.override.md` only when a true local override is needed.

Official source:
https://learn.chatgpt.com/docs/agent-configuration/agents-md

## 2. Treat repository knowledge as a system of record

OpenAI's Harness Engineering article describes a practical lesson from using
Codex at scale: give the agent a map, not a giant manual.

The article recommends a short `AGENTS.md` that points to structured repository
documentation. Detailed architecture, plans, specs, reliability notes, and
reference material can live in focused documents under `docs/` or other clearly
named areas.

For this repository, the existing split already follows that direction:

- `AGENTS.md`
- `ARCHITECTURE.md`
- `ENVIRONMENT.md`
- `tools/INDEX.md`
- `tests/FEEDBACK.md`
- `state/STATE.md`
- editor-facing content documentation

Official source:
https://openai.com/index/harness-engineering/

## 3. Make the project legible and verifiable to the agent

The same OpenAI article emphasizes agent-legible applications and tools:
agents should be able to inspect state, run checks, and validate behavior rather
than rely on guesswork.

Applied here:

- keep repeatable checks in `tools/codex-check.ps1`;
- keep generated content reproducible;
- expose build commands explicitly in docs;
- use browser checks for visual work;
- avoid hidden/manual build steps;
- record meaningful current state and blockers in a discoverable file.

Official source:
https://openai.com/index/harness-engineering/

## 4. Context is finite

OpenAI's article on the Codex agent loop explains that conversation history,
tool calls, code, and instructions all consume the model context window.

Applied here:

- do not make `AGENTS.md` encyclopedic;
- keep current-state notes separate from stable architecture;
- prefer small, relevant source documents;
- avoid duplicating the same instructions across many files.

Official source:
https://openai.com/index/unrolling-the-codex-agent-loop/

## Recommended documentation policy for this project

Use this hierarchy:

```text
AGENTS.md
  -> short operational rules and links

ARCHITECTURE.md
  -> stable architecture and build flow

ENVIRONMENT.md
  -> stable tool policy

environment/INVENTORY.md
  -> observed machine/tool versions

tools/INDEX.md
  -> reusable scripts

tests/FEEDBACK.md
  -> proof/verification rules

state/STATE.md
  -> temporary current work and blockers

content/README.md
  -> human editor instructions
```

When these documents conflict, prefer the file whose scope matches the question
and the newest verified repository state. Treat historical hand-offs only as
historical context.
