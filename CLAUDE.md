# Cultivar — Project Handbook

Cultivar is a consumer app that learns which chemistry a person prefers —
cannabinoids and terpenes, not strain names — from lab-tested COAs (Certificates
of Analysis), and predicts how a new product will land for them.

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
- **The operator gate is also enforced as policy.**
  `.claude/settings.json` denies the always-operator-run commands
  (`git push`, credentialed `supabase`, `eas`) and reading real `.env`
  files. Enforcement is Claude Code's, not the model's -- a deny holds
  even under a defective prompt. The file is the boundary; this bullet
  is the pointer. `git add` and `git commit` stay allowed: commits run
  under ratified commit-prompts, not autonomously.

---

## Core principles

- **Repo is authoritative over memory.** When memory and the repo disagree, the repo
  wins. Verify before acting on any remembered fact, and read the artifact the claim
  is about: `git show HEAD:<path>` for committed state, `git show :<path>` for what
  is staged, the working tree only for what is not committed yet. The three
  routinely disagree, and a check that passes because two of them happen to agree
  has verified nothing (see **Commit conventions** on blob identity, and
  `documentation/process/handoff-specs.md`, "Acceptance criteria").
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
- **File identity is the blob hash:** `git show <rev>:<path> |
  sha256sum`. autocrlf filtering is checkout-side, so worktree hashes stop
  reproducing after any fresh checkout on this machine. A worktree sha256
  is valid only for first-placement verification, never for re-verifying
  committed state.
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
  makes a bare "no output" vacuously silent. Presence gates carry the
  same case-discipline as absence gates: a case-sensitive pattern that
  under-matches returns a 0 indistinguishable from genuine absence
  (observed: 0 against live SPARK/Spark). State the case posture in the
  criterion -- `-i`, or exact-case chosen deliberately. Any pattern
  beginning with `-` is passed via `-e`; without it `grep -F` aborts
  exit 2 before matching anything. `-i` and `-F` are never combined:
  `grep -iF` aborts (SIGABRT, exit 134) on this machine's GNU grep 3.0
  regardless of pattern, path, or locale (isolated 2026-07-29,
  control-paired against a known-present token) -- a case-insensitive
  gate drops `-F` and escapes regex metacharacters instead. Predicted
  counts against code or other self-documenting files count constructs
  -- anchored or qualified forms (`^ *security invoker$`,
  `phase === 'incremented'`) -- never bare identifiers: reviewed code
  repeats its names in
  comment prose, and a bare-identifier count misses by exactly the
  number of times the file explains itself (corrected three times,
  2026-07-28). The architect does not hand-count: a predicted array
  length or diff-aligned line count is gated by parse
  (`... | node -e 'JSON.parse(...).<arr>.length'`) or written as
  observed-and-reported, never asserted from the supplied text
  (a 15-entry deny list predicted as 14, 2026-07-28).
- **Directory listings gate on name-form counts, never bare entry
  counts.** A bare entry count cannot detect a malformed name. Standing
  form for migrations: `ls supabase/migrations/ | grep -Ec '^[0-9]{14}_'`.
- **Implementer claims are worktree-only.** The implementer reports the
  worktree and nothing beyond it -- no claims about origin, database, or
  device state, in either direction. Asserting the negative ("not yet
  applied", "still owed") is as fabricated as asserting the positive.
  Remote state is evidenced only by observed push output and
  `git rev-list --left-right --count`, both through the operator.
- **The implementer's report pastes the artifact, never a pointer to
  it.** "The diff is in the tool output above" is not a report: the
  architect reviews only what the report body contains, and a pointer
  to a tool call it cannot see is an unreviewable claim (observed
  twice, blocked both times). Full diff and full command output go in
  the report body, verbatim, exit codes included.
- **Operator steps are numbered runnable blocks, never prose.** An
  operator instruction buried in a prompt preamble does not get run
  (observed twice: a file never placed; a migration timestamp never
  applied). Each block states what to run, what to expect, and what
  gets pasted back.
- **Tail-check before anchoring on a final line.** Never anchor a
  criterion, and never place an append, on the last line of a pasted
  artifact without first observing that line whole: `git show
  HEAD:<path> | tail -1 | cat -A` for committed state, `tail -1
  <path> | cat -A` for the worktree. A paste truncated at its final
  character yields an anchor that matches nothing and an append that
  lands inside a broken line (observed twice in one day: a diff's
  closing quote, a blob's final period). Applied twice since -- one
  real truncation caught, one clean pass. The artifact settles it,
  never the paste.

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
   never run: `npm test` still prints an all-green summary and exits 0, which is a green gate over
   tests that did not execute. Wiring that up is a `chore:` of its own, undertaken when a
   slice actually needs it — not before. UI slices gate on the physical iPhone; unit tests
   are explicitly not evidence for them.
   Builds = EAS. Package manager = npm.
   **Tests run as `npm test`, never `npx jest`** -- the npm script carries
   `--experimental-vm-modules`, which bare `npx jest` drops (observed: 48
   spurious failures against a 52-test suite).
   **Always install Expo-managed deps with `npx expo install`** (not bare `npm install`).
2. **Repo / handbook / docs.** Repo root: `D:\Projects\Cultivar\cultivar`.
   Handbook: `CLAUDE.md`. Docs: `documentation/`. App source lives under `src/`
   (Expo Router routes in `src/app/`). Shared client code in `src/lib/`, importable
   as `@/lib/...`.
3. **Source-of-truth.** Supabase Postgres is canonical; a local cache **will** serve
   offline reads — none exists and nothing reads from one. COA PDFs **will** live in
   the private Storage bucket `coa-pdfs` — created in migration `20260728000000`,
   no writer yet; slice 4 lands the first. No auto-transform on save. Never
   fabricate terpene / cannabinoid values.
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
