# SESSION_HANDOFF — written 2026-07-16 against pushed HEAD `9f46d98`

The repo is authoritative over this document. Begin with a read-only
Phase A audit (`scripts/session-audit.sh`, Git Bash only) and try to
break every claim below before doing anything else.

## Preamble — carried context was wrong this session; assume this doc is too

Concrete refutations from this very session:

1. **The session opened on a stale audit file.** The uploaded audit
   showed HEAD `fce00ad` — the state from two sessions back — while the
   operator's own chips verdict presupposed commits that audit said did
   not exist. The upload timestamp dated the upload, not the file's
   creation; the fresh audit reconciled everything. Lesson: an attached
   artifact's vintage is a claim to falsify, not a fact to trust.
2. **The report channel dropped the diff twice more** (criterion-5
   "pasted whole above" with nothing above; then a shell-history
   `git show HEAD:` blob arrived in place of `git diff` — a command that
   cannot show working-tree changes by construction). The standing
   countermeasure held: the operator pastes raw, drops are normal.
3. **Architect jargon broke a gate.** "Perception wording" in a gate
   step confused the operator; worse, the first gate sequence (5 then 1,
   average 3.0) accidentally never exercised the D60 tie it existed to
   observe. The re-run (4 then 1, average 2.5 → Meh) observed it.
   Lessons, both architect-owned: gate steps in plain operator
   language; a step whose target is arithmetic must state the numbers
   it exercises and why.
4. **A prompt OLD-string ended mid-line** and left a ~105-char
   unwrapped status line in `scoring-read.md` against its ~75-char
   wrap. Content correct by grep; cosmetic debt accepted and banked.
5. **The prior handoff's clean-tree prediction was self-falsified** by
   `?? audit.txt` — the audit script's own exhaust. Banked fix:
   gitignore it or redirect the audit outside the repo.
6. **The prior handoff's unobserved D53 sha resolved to `cae5258`** —
   read from history at session open; the finding channel worked.

## Start here (Phase A, read-only) — every line is a falsifiable prediction

| check | expected |
|---|---|
| branch | `main` |
| HEAD | a `docs:` commit, subject `docs: session handoff at 9f46d98`, parent `9f46d98`; its own sha unknowable here. Below it, newest first: `9f46d98`, `f16b1d6`, `dd30ddf`, `04d27c3`, `d80cf2f`, `37bf9eb`. |
| `git rev-list --count origin/main..HEAD` | **0** after the operator pushes the handoff commit; **1** means the push has not run — a finding, not an error. |
| `git status --short` | `?? audit.txt` only (the audit's own exhaust — the noise this table previously forgot; gitignore fix banked) |
| `ls supabase/migrations/` | exactly four files; newest `20260716162520_create_scoring_views.sql` |
| Jest | 36 passed (observed twice today: fresh audit + wiring-build control) |
| Deno | 5 passed (observed at today's fresh audit) |
| `npx tsc --noEmit` | exit 0 (observed at both build criteria today) |
| `npx expo lint` | 1 error, 0 warnings (template `use-color-scheme.web.ts`) |
| audit script item [14] | still stale-annotated: four drift lines (expo-router / expo-splash-screen / jest pair). Tolerate; re-annotation banked. |
| Supabase (SQL editor, privileged) | pg_tables: 6 tables, all `rowsecurity = true`. pg_policies: 9 rows; `session_entries` exactly INSERT + SELECT — any UPDATE/DELETE there is stop-everything. **New since last handoff:** pg_views shows `session_current` and `coa_session_stats`, both `reloptions` containing `security_invoker=true` (a missing flag is stop-everything — the view would bypass RLS); pg_indexes on `session_entries` shows 4 rows including `session_entries_chain_idx`. Row count: single-digit, post-truncate gate data, disposable by ratified ruling; exact count not predicted. |
| `grep -n '2026-07-15' documentation/design/session-logging.md` | exactly one hit, line 267 (the schema-doc reference; correct and deliberate) |
| `grep -Fxc '## D63 — The shelf wiring contract' documentation/design/scoring-read.md` | 1 |
| `grep -c 'coa_session_stats' src/components/shelf-list.tsx` | >= 1 (the wiring landed; exact count not pinned) |

If any of these don't match, the repo wins — re-baseline before proceeding.

## What shipped (newest first)

- `9f46d98` — feat: shelf renders the band word — sessions reach the shelf (D62–D63; device-gated incl. the D60 tie observed live)
- `f16b1d6` — docs: ratify the shelf wiring contract (D63); supersession notes in shelf.md; session-logging.md date fix (banked item, executed)
- `dd30ddf` — feat: scoring read views — session_current and coa_session_stats + chain index (D59–D61; applied to production, gated on observed catalog state)
- `04d27c3` — docs: design the scoring read layer (D59–D62)
- Session start HEAD was `d80cf2f` (prior session's handoff commit). The truncate ruling executed mid-session (operator, SQL editor) immediately before the wiring device gate, per its designed position.

## The arcs

**Arc 1 — the read layer (D59–D61).** Sessions existed; nothing read
them. Two `security_invoker = true` views in one migration:
`session_current` (latest entry per chain **then** soft-delete filtered
— that order is the invariant; filter-then-latest would resurrect the
pre-delete snapshot, a silent undelete) and `coa_session_stats` (count,
honest unrounded average, band by round-half-away-from-zero, D60). A COA
with zero live sessions has **no row** — untried is absence, never a
value (D61), and its corollary: a chain whose latest entry is a soft
delete returns its COA to untried. The chain index landed in the same
migration because its banked condition ("when something reads by
chain") fired. The invoker flag is non-negotiable and was gated by
direct `reloptions` observation. Watch-item, unfired: the migration
added no grants (matching the existing pattern); if the shelf ever
throws permission-denied on the views, a missing grant is suspect #1.

**Arc 2 — the wiring (D62–D63).** The shelf consumes
`coa_session_stats`: two queries in one `Promise.all`, merged
client-side by a `coa_id` Map — absence-of-key IS untried, carrying D61
by shape; no embedded join across a two-level view. One band-word line
(`RUNGS` lookup by score, never a second word table) above the totals
row; count and average fetched never, rendered never (D62). Every
ladder-close path routes through one `closeLadder` helper that
refetches — the stale-band defect was found by blob read before any
code existed. Two implementer choices accepted as better than spec: a
stats-query failure fails the whole load rather than degrading (scored
cards rendering as untried would be the shelf lying), and the
`bandWord` lookup renders absence on an impossible band rather than an
empty element. The device gate observed D60's tie live: 4 and 1 → 2.5
→ Meh on the physical iPhone.

**Arc 3 — the paper trail.** `scoring-read.md` is the design of record
(D59–D63, status line updated to true), `shelf.md` carries supersession
notes (neutral-by-construction now scoped to untried cards), and the
banked ratification-date fix executed as a pre-authorized rider (line
267's 07-15 deliberately untouched — it refers to the schema doc's
banking, which genuinely happened 07-15).

## Refuted hypotheses / memory corrections

- All six preamble items; plus:
- The chips verdict arrived: **taps survive** with working selection.
  Banked item 1 (chip-mechanic revisit) closes; re-openable at the art
  pass where it naturally belongs.
- The first gate run's 5-then-1 sequence produced a correct "Meh" that
  proved nothing about D60 (average exactly 3.0) — a green observation
  that tested the wrong property. The re-run was designed to force the
  tie.
- The shelf screenshots re-confirmed the parser brand sludge is now
  loudly user-facing ("Adult Use Powered by Condent LIMS 1 of 8" as the
  Animal Face brand line) — banked item, priority still rising.

## Ratified decisions

- **D59** — two views, both `security_invoker = true`, one migration;
  latest-then-filter is the invariant; soft-delete exclusion lives in
  the view, not consumers. Grounds: one place computes
  latest-entry-per-chain; the invoker flag is the recorded RLS landmine.
- **D60** — band ties round half away from zero (Postgres `round`
  built-in). Named alternative (half-to-even) rejected: purer, zero
  benefit at this scale, splits from client-side compute.
- **D61** — untried is row-absence, never a value; corollary:
  all-soft-deleted returns to untried. Enforced by shape.
- **D62** — v1 shelf renders the band word only, never the number;
  count and average unrendered; word sourced from `RUNGS`.
- **D63** — two queries merged by Map; refetch on every ladder-close
  path; one `smallBold` line above totals, gate-settles-it.
- All ratified as leans 2026-07-16 with explicit operator revision
  expectation ("I really need to see what gets made and then edit") —
  display decisions are gate-revisable; view semantics are durable.
- Operational, executed: the truncate fired at its designed position
  (before the wiring gate, not before ladder testing ended).

## Open items

**Runnable now**
- The rich-path design pass (the entry point below).

**Blocked**
- Reanimated strict-mode warning: still blocked on one Metro
  stack-trace capture.

**Banked (prioritized)**
1. Parser brand sludge — now on the shelf card, the ladder, the delete
   dialog, the echo screen, and today's gate screenshots. Rising every
   slice; still post-confirm-screen, barely.
2. Home-zone parking after a confirmed entry — unchanged two faces; a
   third added: soft-delete-returns-to-untried is proven in view
   semantics but **unverified on-device** (no delete gesture exists);
   verify the day the gesture ships.
3. UI/art pass — now also owns: band-word treatment, `session_count`
   display question, chip styling, echo treatment, feel constants, and
   the re-openable tap-vs-drag chip question.
4. Shelf sort-by-band — named open question in scoring-read.md; a
   product decision, not an implementer default. Chemistry never orders
   the shelf; whether the band does is undecided.
5. Audit script chore: gitignore `audit.txt` (or redirect outside the
   repo), re-annotate item [14], add the print-the-handoff-table
   section (now five sessions carried).
6. Doc micro-amendments bundle: entry-1 intent "omitted (null)" note +
   the scoring-read.md status-line rewrap (both cosmetic, fold into the
   next touch of each file).
7. tsconfig/Metro sticky-resolver landmine → `CLAUDE.md` if it bites a
   second time.
8. Haptics (`expo-haptics`, native module) — batch with the next
   build-forcing dependency.
9. Gear-icon confirmation on any non-dev build (carried).
10. Resend domain verification (carried).

## Working rhythm

Stable method lives in `CLAUDE.md` and
`documentation/process/handoff-specs.md`. In flux this session and worth
keeping: (a) gate checklists are written in plain operator language —
no method jargon — and any step whose target is arithmetic states the
numbers it exercises and why; (b) diff drops extend the commit-body
rule: on any dropped or wrong-command diff, the operator runs `git
diff` and pastes raw, and a `git show HEAD:` paste is recognized on
sight as the wrong artifact (it cannot show tree changes); (c) the
sha256 transcribe-and-hash channel and operator-read commit bodies
(`cat -A`) remain routine and caught zero defects today because they
were followed.

## Entry point

**The rich-path design pass** — fit, context, and co-alcohol placement
(banked item 2 of the prior handoff, unbanked by its own rule the
moment chips landed; chips landed and their tap verdict is in). The
shelf now closes the loop drop → band; the rich path is the remaining
unasked data the quadrant and confound lens are named consumers of.
Open with whole reads of `scoring-lexicon.md` (the rich-path and fit
sections, especially fit's render condition: intent answered and not
"just because"), `session-logging.md`, and the current
`session-ladder.tsx` blob — the pass must decide where the questions
live (on the logging surface post-confirmation vs. a detail-view
revision surface), and that placement question is exactly the shape
D49's grounds and the banked home-zone question already constrain. Not
a menu: absent an operator redirect, rich-path is the move.
