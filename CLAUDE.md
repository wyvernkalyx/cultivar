# Cultivar — Project Handbook

Cultivar is a consumer app that learns a person's terpene preferences from lab-tested
COAs (Certificates of Analysis) and predicts how they'll experience a given product.

This file is the authoritative handbook. **Every prompt begins by reading `CLAUDE.md`
and the relevant `documentation/` files before doing anything else.**

---

## Roles & workflow loop

- **Architect-reviewer** — Claude (chat). Designs, writes prompts, reviews diffs.
- **Implementer** — Claude Code (this agent). Executes build/commit prompts.
- **Operator / final gate** — Gregg. Runs the manual gate and authorizes commits/pushes.

**Two-step rhythm.** Work arrives as a **build prompt** (make the changes, then STOP —
no staging, no commit) followed, after the manual gate passes, by a separate **commit
prompt**. A commit is not "done" until it is confirmed present in `git log`.

---

## Core principles

- **Repo is authoritative over memory.** When memory and the repo disagree, the repo
  wins. Verify against the working tree before acting on any remembered fact.
- **Lived-demand.** Build what a concrete, present need requires. No speculative
  abstraction, no "we might want this later" scaffolding.
- **No fabricated data.** Display only what exists. For COAs, show `ND` or
  "not reported by lab" for absent analytes — **never invent terpene or cannabinoid
  values**, and never interpolate/estimate them into user-facing output.
- **Surgical commits.** One concern per commit. Docs land with the code they describe.
  No broken intermediate states — every commit builds and runs.
- **Pure helpers unit-tested before UI wiring.** Extract logic into pure functions,
  cover them with Jest, then wire them into components.
- **Document-before-implement.** Capture the intended behavior in `documentation/`
  before writing the implementation.

---

## Commit conventions

- **Explicit-path-only staging.** Stage named paths only. **Never `git add -A`,
  `git add .`, or `git commit -a`.**
- **ASCII commit messages** via stdin heredoc:
  ```bash
  git commit -F - <<'EOF'
  <subject>

  <body>

  Co-Authored-By: Claude <noreply@anthropic.com>
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  EOF
  ```
- **Exactly two co-author trailers:** `Claude <noreply@anthropic.com>` and the current
  Claude model (currently `Claude Opus 4.8 (1M context) <noreply@anthropic.com>`).
- **`data:`-prefixed commits** for COA/session data directories (fixtures, seeded or
  user data). Keep data changes separate from code changes.
- **Never push without explicit authorization** from the operator.

---

## Prompt conventions

- Every future prompt **starts by reading `CLAUDE.md`** plus the relevant
  `documentation/` files.
- Every prompt carries a **"No interactive prompts"** header — no `AskUserQuestion`,
  no popups; blockers are reported as plain numbered text and stop the run.
- **Phase A precondition checks** wherever work depends on a prior commit: audit
  (read-only) the repo state first and confirm the premise before changing anything.

---

## [ADAPT] checklist (filled)

1. **Stack / test / build.** Expo (React Native) + TypeScript + Expo Router.
   **Expo SDK pinned to 56** (`expo@56.x`) — the current App Store Expo Go predates
   SDK 56, so on-device testing uses an **EAS development build**, not Expo Go.
   Tests = Jest + React Native Testing Library. Builds = EAS. Package manager = npm.
   **Always install Expo-managed deps with `npx expo install`** (not bare `npm install`).
2. **Repo / handbook / docs.** Repo root: `D:\Projects\Cultivar\cultivar`.
   Handbook: `CLAUDE.md`. Docs: `documentation/`. App source lives under `src/`
   (Expo Router routes in `src/app/`). Shared client code in `lib/`.
3. **Source-of-truth.** Supabase Postgres is canonical; a local cache serves offline
   reads. COA PDFs live in Supabase Storage. No auto-transform on save. Never fabricate
   terpene / cannabinoid values.
4. **Protected data dirs.** COA fixtures and any seeded/user data use **`data:`-prefixed
   commits**. Never blanket-stage or revert these.
5. **Untracked dev files never staged.** `.env`, local Expo config (`.expo/`), and
   editor/local config (`.vscode/` local settings).
6. **Warning baseline** (starter template on Expo SDK 56, pre-any-of-our-code):
   - `npx tsc --noEmit` → **0 errors, 0 warnings** (the SDK-57 template CSS
     side-effect-import errors do not occur under SDK 56).
   - `npx expo lint` → **1 error, 0 warnings** (template
     `src/hooks/use-color-scheme.web.ts`, `react-hooks/set-state-in-effect`).
   - **New work must not add warnings or errors above this baseline.**
7. **Manual-gate procedure.** `npx expo start` → scan the QR code with **Expo Go** on
   the iPhone → confirm the app loads and interacts before any UI-visible commit.

---

## Pointers

- Product spec / roadmap: `documentation/Cultivar_MVP_and_Roadmap.md`
- Methodology: `documentation/Working_Methodology.md`
- Session handoff: `documentation/SESSION_HANDOFF.md`
- Deferred items: `documentation/follow-ups.md`
- Design/logic reference (not production code): `reference/`
