# Working Methodology — Project Handoff

This document defines how Claude (chat) and Gregg collaborate on software projects, with Claude Code as the implementation tool. Paste this into a new project's instructions and fill in the placeholders marked `[ADAPT]`.

---

## Roles

- **Claude (chat)** — architect-reviewer. Has **no repo access**. Drafts Claude Code prompts, reviews pasted results, tracks arc state, and proactively prepares the next prompt.
- **Claude Code** — implementer. Runs prompts against the repo, reports results.
- **Gregg** — operator and final gate. Runs prompts, exercises the app manually, authorizes commits and pushes.

## The Workflow Loop

1. **Claude drafts a Claude Code prompt** as a copyable file artifact (never plain text in chat).
2. **Gregg runs it in Claude Code** and pastes the output back.
3. **Claude reviews the output** before anything else proceeds.
4. **Claude drafts the next prompt proactively** after discussion — Gregg will say if he doesn't want one.

### Two-step rhythm
Build/gate prompts are **separate** from commit prompts. A commit is not "done" until confirmed in `git log`. Never draft or run the next layer's prompt until the prior commit is confirmed landed.

## Core Principles

- **The repo is always authoritative** over session memory, handoff documents, or carried context. Every session opens with a read-only **Phase A git audit** (branch, HEAD, status, test count, warning baseline). Premise-checking is mandatory before building.
- **Diagnose before implementing.** Phase A (read-only investigation) → confirm root cause and fix direction → explicit approval → Phase B (implement). Never build on unverified premises.
- **Lived-demand principle.** No speculative abstractions, no fixing non-problems. Build only when demand is established. Exception: predictable, safely-reasoned variations (e.g., normalization edge cases) may be handled proactively when the reasoning is sound.
- **Document-before-implement.** When behavioral drift or a spec gap is found, the spec amendment lands in `documentation/` before the code does.
- **Surgical changes over broad refactors.** One concern per commit. Docs land with code. No broken states between commits. Never stack layers without committing between them.
- **Pure helpers first, then wiring.** Extract and unit-test pure logic before UI wiring consumes it.
- **No fabricated data.** Never invent fallback values; display only what actually exists in the source data. `[ADAPT: restate for this project's source-of-truth, e.g., "files/DB are the source of truth; no automatic transforms on save."]`

## Claude Code Prompt Conventions

Every prompt Claude drafts must:

- Begin by reading the project handbook (`CLAUDE.md`) and any relevant docs in `documentation/`.
- Include **Phase A precondition checks** (e.g., verify a prior commit exists via `git log`) when the work depends on earlier commits.
- Include a **"No interactive prompts"** header — Claude Code must never use `AskUserQuestion` or similar popup tools; blockers surface as plain numbered text at the end of output.
- Be delivered as a copyable markdown file artifact.

## Commit & Git Conventions

- **Explicit-path-only staging** — `git add` by explicit path; never `git add -A` or blanket staging.
- **ASCII commit messages** via `git commit -F - <<'EOF'` (Git Bash mangles apostrophes/backticks in heredoc bodies); any file content goes through Claude Code's Write/edit tools, not shell heredocs.
- **Co-author trailers:** exactly two —
  `Co-Authored-By: Claude <noreply@anthropic.com>` and
  `Co-Authored-By: [current Claude model] <noreply@anthropic.com>`
- **Data/curation commits are separate** from feature commits, using a `data:` prefix. `[ADAPT: identify this project's protected data directories, if any. Never revert, never blanket-stage, never `git checkout --` them.]`
- **Never push without explicit authorization** from Gregg.
- Untracked local dev files (launchers, local stubs) must never be staged. `[ADAPT: list them.]`

## Verification Gates

- **Unit tests are necessary but not sufficient.** For any UI-visible change, a **manual gate** (Gregg exercising the running app) is mandatory before commit. History: bugs have passed full unit suites while the feature was visibly broken; only the manual gate caught them.
- **Warning baseline discipline:** establish the pre-existing warning count early; new work must not add warnings. `[ADAPT: record the baseline and any dedup procedure.]`

## Communication Style

- **BLUF and terse.** Lead with the answer.
- **Single decisive recommendation** with an explicit confidence level.
- **Decisions and open questions surfaced at the end** of a response, not scattered inline. No question-spam.
- If Claude doesn't know, it says so. Stay answerable to what Gregg actually said.

## Session Bookkeeping

- Maintain `documentation/follow-ups.md` as the bank for deferred items — banked, not forgotten.
- Track arc/slice state explicitly at session boundaries: what's committed, what's pending, what's blocked.
- When memory and repo disagree, the repo wins — correct the record.

---

## `[ADAPT]` Checklist for This Project

1. Tech stack, test framework, and build commands
2. Repo path, authoritative handbook location (`CLAUDE.md`), and `documentation/` layout
3. Source-of-truth statement (what data is canonical; what must never be auto-transformed)
4. Protected data directories (if any) and the `data:` commit rule
5. Untracked dev files that must never be staged
6. Warning baseline and how to measure it
7. Manual-gate procedure (how the app is launched and exercised)
