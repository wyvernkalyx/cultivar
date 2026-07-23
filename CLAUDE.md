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

### Operator-only actions

- **Credentialed / interactive commands are operator-run only.** Claude Code must
  never run `supabase login`, `supabase link`, `supabase db push`, any `eas` command,
  anything touching the Apple Developer account, or any command that opens a browser
  or prompts for a password. Claude Code *writes* migrations and config; the operator
  applies them.
- **Push authority.** Claude Code never pushes. Claude (chat) owns the push decision
  and authorizes at a clean, gated checkpoint; Gregg executes the single `git push`.

---

## Core principles

- **Repo is authoritative over memory.** When memory and the repo disagree, the repo
  wins. Verify against the working tree before acting on any remembered fact.
- **Lived-demand.** Build what a concrete, present need requires. No speculative
  abstraction, no "we might want this later" scaffolding.
- **Personal-empirical, never pharmacological.** Cultivar never claims a terpene causes
  an effect. It reports what correlates with **this user's** own logged outcomes. No
  medical claims, no population-level effect assertions, no borrowed pharmacology in
  user-facing copy or in code comments that could migrate into copy. The
  population-level science is genuinely unproven; this is a correctness requirement,
  a regulatory posture, and the product's differentiator at once.
- **No fabricated data.** Display only what exists. For COAs, show `ND` or
  "not reported by lab" for absent analytes — **never invent terpene or cannabinoid
  values**, and never interpolate/estimate them into user-facing output.
- **Surgical commits.** One concern per commit. Docs land with the code they describe.
  No broken intermediate states — every commit builds and runs.
- **Pure logic is tested before it is wired to anything.** Extract logic into pure
  functions and cover it first — **Jest** for parser code, **`deno test`** for
  Edge Functions. App-code tests are not currently possible (see **[ADAPT]** item 1).
  Not every helper terminates in a component: the parser is server code
  (see **Ingestion**) and is wired to a handler, never to a UI.
- **Document-before-implement.** Capture the intended behavior in `documentation/`
  before writing the implementation.
- **A doc's status line is amended by the commit that changes its truth, or the
  doc carries no status line.** A status claim nobody re-verifies is a trusted
  narrative waiting to be believed; five of them were found false in one sweep
  (44872df).

---

## Ingestion

- **Parsing runs server-side.** The app never parses a PDF. Extraction and parsing
  happen in a Supabase Edge Function.
- **The parser lives at `supabase/functions/_shared/coa/`.** It is server code, and it
  lives where it runs. Import it by **relative path with an explicit `.ts` extension** —
  extensionless imports pass `deno check` locally and fail `supabase functions deploy`
  with a module-resolution error.
- **No `unstable` Deno flags, anywhere.** `sloppy-imports` in particular makes
  extensionless imports appear to work under a local check while production, which has
  no such flag, rejects them. A green check under different config than production is
  weaker evidence than it looks.

---

## Commit conventions

- **Explicit-path-only staging.** Stage named paths only. **Never `git add -A`,
  `git add .`, or `git commit -a`.**
- **`git mv` stages the rename with the original blob.** Any edit made *after* the move
  lives only in the working tree — `git status` shows `RM`. Committing without a second
  `git add` at the **new** path ships the move without the edit. Before committing a
  move-plus-edit, verify the **staged blob**: `git show :<new/path>`. Never the worktree.
- **ASCII commit messages** via stdin heredoc:
  ```bash
  git commit -F - <<'EOF'
  <subject>

  <body>

  Co-Authored-By: Claude <noreply@anthropic.com>
  EOF
  ```
- **The ASCII gate is control-paired.** An ASCII gate is trusted only
  after its dirty control fails in the same shell that runs it, same
  session. Standing form (MINGW64-proven):
  control `printf 'ctl \342\200\224\n' | LC_ALL=C tr -d '\0-\177' | wc -c`
  → `3`, then gate `git log -1 --format=%B | LC_ALL=C tr -d '\0-\177' |
  wc -c` → `0`. The superseded form (`grep $'[\x80-\xff]'`) returned
  exit 1 on files od-verified to contain em dashes (GNU grep 3.11) — it
  never worked, and every pass it produced observed only the protected
  case. Controls are od-verified too: a control whose dirty bytes were
  never actually written is itself vacuous.
- **Exactly one co-author trailer:** `Claude <noreply@anthropic.com>`. No
  model-specific trailer — models change, and the handbook must not need an edit
  per release.
- **Verify trailers by parsing, never by counting.** Use
  `git log -1 --format=%B | git interpret-trailers --parse`. **Never
  `grep -c "Co-Authored-By"`** — a count matches prose mentioning the string, not just the
  trailer construct. Commit `90bad0a` proves it: its body explains why counting fails, so
  `grep -c` returns 3 where there are 2 trailers. Parse the construct; do not match its text.
- **Subject prefixes.** One of five, chosen by what the commit contains:
  - `feat:` — new behavior
  - `refactor:` — behavior-preserving restructuring (e.g. `9ba23d6`)
  - `chore:` — tooling, config, scaffolding
  - `docs:` — documentation only
  - `data:` — COA fixtures, seeded or user data. Keep data changes separate from code
    changes; never blanket-stage or revert these.

---

## Prompt conventions

- Every future prompt **starts by reading `CLAUDE.md`** plus the relevant
  `documentation/` files.
- Every prompt carries a **"No interactive prompts"** header — no `AskUserQuestion`,
  no popups; blockers are reported as plain numbered text and stop the run.
- **Phase A precondition checks** wherever work depends on a prior commit: audit
  (read-only) the repo state first and confirm the premise before changing anything.
- **Grep gates use discriminating forms.** A marker-count criterion must target a
  form that appears only where the gated property lives -- a table-row form, an
  exact whole line -- never a bare token that also occurs in prose, and single
  unbroken tokens only, since a phrase can span a line-wrap. A criterion the
  file's own prose can trip is malformed, and the implementer STOPping on it is
  correct. Every result line states the exit code alongside the count (`0`,
  exit 1): a grep binary that aborts (observed: SIGABRT / exit 134)
  makes a bare "no output" vacuously silent.

---

## Gates are typed by slice

- **Pure-logic slice** (e.g. the parser) — gate is **tests passing**, pasted raw.
- **UI-visible slice** — gate is **Gregg exercising the app on the physical iPhone**
  via the EAS dev build (`npx expo start --dev-client`). Unit tests are not evidence,
  and Expo Go is unusable on this project.
  - **A UI slice that adds a native module gates on a NEW EAS dev build, not the
    existing one.** A Metro reload carries JS only. A native module is autolinked
    during `expo prebuild` and must be compiled into the dev-client binary, so
    installing the dep with `npx expo install` and reloading Metro throws
    `NativeModule: <name> is null` on the old binary. Split such a slice: the
    dependency manifest lands first as its own `chore:` commit so the EAS build can
    autolink it, then the code that uses it lands after the on-device gate.
- **Schema/infra slice** — gate is **observed state** (e.g. tables + RLS visible in
  the Supabase dashboard).
- **Function-security gates observe `prosecdef`, never the deparser.**
  `pg_get_functiondef` omits `SECURITY INVOKER` because invoker is the
  default; a deparser's omission is never evidence. Standing form:
  `select proname, prosecdef from pg_proc where pronamespace =
  'public'::regnamespace and proname = '<fn>'` → `prosecdef = f`.

---

## [ADAPT] checklist (filled)

1. **Stack / test / build.** Expo (React Native) + TypeScript + Expo Router.
   **Expo SDK pinned to 56** (`expo@56.x`) — the current App Store Expo Go predates
   SDK 56, so on-device testing uses an **EAS development build**, not Expo Go.
   Tests = **Jest + `ts-jest`** (`testEnvironment: 'node'`), whose `roots` discover
   **only** `supabase/functions/_shared/coa`, and **`deno test`** for Edge Function
   code (e.g. `supabase/functions/ingest-coa/__tests__/ingestCoa.test.ts`).
   **App-code tests are not currently possible** — React Native Testing Library,
   `jest-expo`, and `react-test-renderer` are not installed, and Jest's `roots` would
   not discover them if they were. A test file placed anywhere under `src/` is silently
   never run: `npm test` still prints `40 passed` and exits 0, which is a green gate over
   tests that did not execute. Wiring that up is a `chore:` of its own, undertaken when a
   slice actually needs it — not before. UI slices gate on the physical iPhone; unit tests
   are explicitly not evidence for them.
   Builds = EAS. Package manager = npm.
   **Always install Expo-managed deps with `npx expo install`** (not bare `npm install`).
2. **Repo / handbook / docs.** Repo root: `D:\Projects\Cultivar\cultivar`.
   Handbook: `CLAUDE.md`. Docs: `documentation/`. App source lives under `src/`
   (Expo Router routes in `src/app/`). Shared client code in `src/lib/`, importable
   as `@/lib/...`.
3. **Source-of-truth.** Supabase Postgres is canonical; a local cache **will** serve
   offline reads — none exists and nothing reads from one. COA PDFs **will** live in
   Supabase Storage — the bucket is not yet created and nothing writes to it. No
   auto-transform on save. Never fabricate terpene / cannabinoid values.
4. **Protected data dirs.** COA fixtures
   (`supabase/functions/_shared/coa/__fixtures__/`) and any seeded or user data. The
   staging and prefix rules that govern them live in **Commit conventions**; this slot
   names the directories, not the rule.
5. **Untracked dev files never staged.** `.env` and local Expo config (`.expo/`) — both
   ignored by `.gitignore`. **`.vscode/` is tracked on purpose**: `extensions.json` and
   `settings.json` are shared editor config, not local overrides. Do not gitignore it.
   - **`.env.example` is tracked by explicit negation.** `.gitignore` ignores `.env*` and
     rescues this one file with `!.env.example`, which must remain the **last** matching
     pattern for that path. Never put a real value in it — it is the one env file guaranteed
     to be committed. Verify with `git show HEAD:.gitignore | grep -Fxc '!.env.example'` → 1.
     **Never `git check-ignore`**: it reads the working directory, not the commit, and it
     short-circuits on tracked files without evaluating a pattern at all.
6. **Warning baseline** (starter template on Expo SDK 56, pre-any-of-our-code):
   - `npx tsc --noEmit` → **0 errors, 0 warnings** (the SDK-57 template CSS
     side-effect-import errors do not occur under SDK 56).
   - `npx expo lint` → **1 error, 0 warnings** (template
     `src/hooks/use-color-scheme.web.ts`, `react-hooks/set-state-in-effect`).
   - **New work must not add warnings or errors above this baseline.**
7. **Manual-gate procedure.** Gregg exercises the app on the physical iPhone via the
   **EAS development build**: `npx expo start --dev-client` → open the Cultivar app on
   the iPhone and connect to the dev server → confirm the app loads and interacts
   before any UI-visible commit. **Expo Go is unusable on this project** — the App
   Store build of Expo Go predates SDK 56, and the app needs native modules Expo Go
   cannot bundle.

---

## Pointers

- Product spec: `documentation/Cultivar_MVP_and_Roadmap.md`
- Methodology: `documentation/working-methodology-handoff.md`
- Handoff specs (how prompts and session handoffs are written): `documentation/process/handoff-specs.md`
- Current session handoff: `documentation/SESSION_HANDOFF.md`
- Deferred items: `documentation/follow-ups.md`
- Design docs (per-slice, document-before-implement): `documentation/design/`
- Design/logic reference (not production code): `reference/`
