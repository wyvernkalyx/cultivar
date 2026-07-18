# SESSION_HANDOFF — written 2026-07-18 against pushed HEAD `12b7cc6`

The repo is authoritative over this document. Begin with a read-only
Phase A audit (`scripts/session-audit.sh`, Git Bash only) and try to
break every claim below before doing anything else.

This file supersedes the handoff committed at `b4970b5`, whose full
record remains retrievable:
`git show b4970b5:documentation/SESSION_HANDOFF.md`.

## Preamble — carried context lost every contest this session; assume this doc is fallible too

This was a design session: two `docs:` commits, zero code, zero
migration, zero database change. The architect's carried context was
wrong on nearly every state claim it brought in, and the repo adjudicated
each one:

1. **Carried HEAD was wrong.** Architect believed `b33f99d`; open HEAD was
   `b4970b5`. Believed three migration files; there are four. Believed the
   session-logging wiring slice sat at build 2 of 3 with Build 3
   unexecuted and decisions through D57; in fact D62-D66 shipped, wiring
   shipped, and the D53 delete-dialog copy ("...and its logged sessions")
   is present at `src/components/coa-detail.tsx:173`.
2. **"Three sessions unobserved" was inflated.** The architect claimed the
   Supabase block was three sessions unobserved; the prior handoff records
   one. This session it was fully re-observed (see Phase A) — the
   strongest that block has ever been, not the weakest.
3. **The lesson:** observed state adjudicates; the summary an implementer
   or a prior architect writes does not. Every Phase A prediction below is
   falsifiable — break it against the repo before trusting it.

## Start here (Phase A, read-only) — every line is a falsifiable prediction

| check | expected |
|---|---|
| branch | `main` |
| HEAD | a `docs:` commit, subject `docs: session handoff at 12b7cc6`, parent `12b7cc6`; its own sha unknowable here. Below it, newest first: `12b7cc6` (D77), `3e95749` (D70-D76), `b4970b5` (prior handoff). |
| `git rev-list --left-right --count origin/main...HEAD` | `0	0` **after** the operator pushes this handoff commit; a nonzero right count means the push has not run — a finding, not an error. Two-sided form proves equal, not merely ancestor. |
| `git status --short` | `?? audit.txt` only |
| `ls supabase/migrations/` | exactly four; newest `20260716162520_create_scoring_views.sql` (UNCHANGED this session — no migration was written) |
| Jest | 40 passed, 40 total (re-observed this session after a dependency revert; see Refuted) |
| Deno | 5 passed (carried from session-open audit; not re-run after) |
| `npx tsc --noEmit` | exit 0 — but see the false-gate landmine below before trusting a silent pass |
| `npx expo lint` | 1 error, 0 warnings (template `use-color-scheme.web.ts`) |
| Supabase (SQL editor, privileged) — RE-OBSERVED THIS SESSION, full | pg_class: all six public tables `relrowsecurity = true`, `relforcerowsecurity = false`. pg_policies: 9 rows; `session_entries` exactly INSERT + SELECT; predicates read (not names trusted) — `coas` scoped `auth.uid() = created_by`, analyte tables scoped via parent-COA exists(), `session_entries` insert checks `created_by = auth.uid() AND exists(coas ownership)`, select `created_by = auth.uid()`; `profiles_update_own` has NULL with_check (Postgres default = using; not a defect). Both views `session_current` and `coa_session_stats` are `relkind = v`, owner `postgres`, `reloptions` = `security_invoker=true`. |
| client role | `src/lib/supabase.ts` calls `createClient` once with `EXPO_PUBLIC_SUPABASE_ANON_KEY`; the local `.env` key decodes to JWT `role: anon`. `service_role` absent at HEAD except a `config.toml` comment. (Dev-path only; EAS-build env unobserved.) |
| `session_entries` row state | **empty**: `count(*) = 0`, deleted = 0, chains = 0. Rows existed during D62-D66 device gates and are gone — COA-delete cascade (D53) or account recreate; unrecoverable by construction, not a defect. |

If any of these don't match, the repo wins — re-baseline before proceeding.

## What shipped (newest first)

- (this handoff commit) — `docs: session handoff at 12b7cc6`; parent
  `12b7cc6`; the write-last close, no code.
- `12b7cc6` — **docs: D77**, session-entries schema reconciled to the
  D70-D76 survey. In-place table edits + a D77 amendment block. No
  migration applied; this is the design, not the schema change.
- `3e95749` — **docs: D70-D76**, survey vocabulary and structure. In-place
  supersession pointers + an amendment block appended to
  `scoring-lexicon.md`.
- Nothing else. No `feat:`, no migration, no database change.

Non-repo artifact (scratch, NOT committed): a Word visualization of the
survey (`Cultivar-Survey.docx`) was produced in chat as a reasoning aid.
It is not a spec and not in the repo; regenerate from the docs if needed.

## The arc — the survey redesign (D70-D77), design-only

The operator drove a wholesale redesign of the session survey on
disposable pre-launch data (zero rows). Two design docs landed:

**D70-D76 (`scoring-lexicon.md`):**
- **D70** — overall scale strings → **Elite / Solid / Mid / Miss /
  Trash** (+2/+1/0/-1/-2). Symmetry preserved; `Mid` is the true neutral
  (the operator's `Decent` was skew-positive, corrected). Hidden 1-5
  mapping unchanged — this is what keeps cross-version averaging valid.
- **D71** — intent restructured from one single-select chip to **three
  orthogonal single-select axes**: Energy (Chill/Active/Buzzing),
  Environment (Solo/Social), Spark (Relief/Flow/Munchies). Skeleton
  reversal, ratified. Not multi-select — three clean single picks in
  three fields. Grounds: recover-later asymmetry (capture three while
  free; collapse in analysis anytime; capturing one is unrecoverable).
- **D72** — **Spark is the intent anchor**: fit is Spark-relative; the
  quadrant and intent lens read Spark; Energy/Environment are secondary
  lenses. D66's intent→fit-null is now Spark-scoped.
- **D73** — fit asks whenever Spark is answered; aimless = Spark-null (no
  explicit `just because` answer survives; the wheel's center carries it).
- **D74** — context free-text **deleted**.
- **D75** — co-consumption → multi-select panel: Alcohol, Caffeine,
  Nicotine, Fatty food, Terpene-rich food.
- **D76** — new fact class **physical-state**: Dehydrated, Fatigued,
  Stressed. `Stressed` sits closest to the health-data line — held as a
  felt transient state, glossary must not drift to "anxiety."

**D77 (`session-entries-schema.md`):**
- Column delta: `intent` → `energy`/`environment`/`spark` (three nullable
  text); drop `context`; `co_alcohol` → `co_consumption text[]`; add
  `physical_state text[]`; `lexicon_version` client constant → **2**.
- `text[]` chosen over booleans (explode a fact class into many columns;
  each new value a migration) and over a child table (breaks
  one-row-per-snapshot latest-wins, D52). Faithful to "distinct column
  per fact class, text not enums, provisional."
- Two landmines recorded in the doc: (a) cross-version score averaging is
  valid only while the hidden-value mapping is stable — a scale-*shape*
  change needs the ratified recompute; (b) dropping `context` forces a
  `session_current` recreate that MUST return `security_invoker = true`.

**Vocabulary boundary held twice on legal grounds, not taste.** The
operator's therapeutic-word proposals (`Relief` = anxiety+pain,
`Stressed`, a symptom category) were held against the medications-
exclusion posture and Washington's My Health My Data Act (broad
consumer-health-data definition, private right of action, a live cannabis-
retailer class action). Resolved to **feeling-words, wants-only**:
`Relief`/`Stressed` as felt states, no symptom vocabulary. Symptoms-in
remains available but requires the doc's own revisit bar (an architecture
where the operator cannot read the field; its own threat model) — not a
vocabulary swap.

## Refuted hypotheses / memory corrections

- Carried HEAD, migration count, wiring-slice status (Preamble 1).
- "Three sessions unobserved" → one (Preamble 2).
- **Architect's gap-5 alarm** (views might bypass RLS) was a real risk
  class and came back **clean** — both views `security_invoker=true`. The
  alarm was correct to raise, wrong to imply live.
- **Architect's cell-count arithmetic was off ~4x** — claimed ~2
  sessions/cell/year for the three-axis intent; at 3 logs/week it is ~8-9,
  and the intent lens reads one axis at a time anyway. The sparsity
  objection mostly dissolved; three-axis stands.
- **Architect's `partial-insert blanking` hazard** (that a chip revision
  might null untouched fields) was **refuted by the blob** —
  `session-ladder.tsx` sends a full snapshot on every insert; the D52
  comment is load-bearing truth.
- **A dependency mutation happened and was reverted.** `npx expo install
  --check` was run un-piped, went interactive, and `Fix dependencies? Y`
  downgraded jest 30→29 and bumped six native packages before a SIGINT
  tore `node_modules`. Reverted via `git checkout -- package.json
  package-lock.json` + `rm -rf node_modules` + `npm ci`; baseline
  re-observed 40 Jest / tsc exit 0 / 1 lint. package.json is back to its
  committed state — nothing shipped.

## Ratified decisions

- **D70-D77**, as above. All design; no code, no migration.
- The three-axis intent (D71) is a **skeleton-item reversal** — recorded
  in both docs as derived-from-D76, cross-referenced so the two fact-class
  enumerations cannot drift.

## Open items

**Runnable now (the entry point)**
- **The migration.** D77 is the design; the migration is the
  implementer-authored, operator-applied (`db push`, credentialed) slice
  that makes it real. It is the first thing this whole sequence touches on
  the live database. See Entry point.

**Blocked**
- Reanimated strict-mode warning: one Metro stack-trace capture (carried).

**Banked (prioritized)**
1. **The wheel mechanic** — the survey's interaction redesign. Supersedes
   D56/D57/D64-D66; touches `session-logging.md` and `rich-path.md`. The
   operator's design leans, unratified: three-axis intent as a wheel
   (calyx-to-petal, center = null); marking-menu drill for families if
   kept; overall stays the ladder; fit ladders (ordinal); a
   one-question-per-screen rhythm with Close/Next replacing "More". Open
   sub-problems: thumb-reach on a 360° wheel; families-as-colour vs
   families-as-structure; the kaleidoscope easter-egg (art pass; a spin
   must never select). Gate this on the couch — completion is the metric.
2. **Glossary pass** — its own `docs:`. The operator's cross-fade /
   physiology material is excellent and **cannot ship as written**: it is
   population pharmacology (mechanism, causation, general case), which
   discipline 1 and CLAUDE.md forbid in user-facing copy. Enters via a
   personal-empirical rewrite (what the app tracks and why it might matter
   *for you*), definitions in the operator's own words.
3. **Doc-hygiene chore bundle** (grew large this session):
   - Five stale status lines, same defect class: CLAUDE.md line 151
     (`36 passed` → 40); `scoring-lexicon.md` / `rich-path.md` "no
     implementation exists" (both shipped); `session-logging.md` slice 3
     missing the shipped annotation its siblings carry;
     `product-metaphor.md` entire "Relationship to current work" section
     false (says five tables — six; says shelf/lexicon/sessions blocked —
     all shipped; two of four "open questions" resolved). Candidate rule
     for CLAUDE.md: *a doc's status line is amended by the commit that
     changes its truth, or the doc carries no status line.*
   - **`run()` audit-script fix.** `audit.txt`'s `$ ...` lines are
     `echo`s, not traces, and drift from what runs: [12] echoes a pipe
     that isn't executed; [14] echoes two drift lines where eight exist
     and a `tail -6` that hid six and suppressed an interactive prompt.
     Fix: `run() { printf '$ %s\n' "$*"; "$@"; }` so the shown command is
     the executed argv.
   - `npx expo install --check` is **interactive un-piped**; the script
     relied on `tail -6` to suppress the prompt as a side effect. Pipe it
     or move it operator-only.
   - `npx tsc --noEmit` is a **false-gate** when `typescript` is absent
     (offers to install an unrelated `tsc@2.0.4`, prints a joke). Gate on
     `node_modules/typescript/bin/tsc` existing first. (The audit's own
     [12] uses `$?` after command substitution, which is sound — verified;
     the echoed piped form is not what runs.)
   - Anchor greps in the prior audit are **presence-counts** (unsound per
     handoff-specs §1); pin location with `-n` on a discriminating form.
   - **Grep-gate discriminating-form rule** (learned twice this session,
     the second time it broke a commit prompt): a marker-count gate must
     target a form that appears only where the property lives (e.g. the
     table-row `| \`context\` |`), never a bare token that also appears in
     prose. The D77 prompt's `grep -cF '\`context\`' → 0` false-failed on
     its own amendment prose; the implementer STOPped correctly.
   - `audit.txt` gitignore; add tab-1/tab-3 Supabase SQL to the script
     (pg_policies alone never sees `relrowsecurity` or a view); the D76
     `Amends skeleton` line-split (below).
4. **D76 `Amends skeleton` line-split** — the committed `3e95749` blob may
   contain a hard newline mid-word (`Amends s`/`keleton`). Renders as a
   spurious space in Markdown, not a break. One grep resolves whether it's
   real: `git show HEAD:documentation/design/scoring-lexicon.md | grep -n
   "Amends"`. Fix in the chore sweep.
5. Carried, untouched this session: detail-view session read/edit surface;
   home-zone parking after a confirmed entry; shelf sort-by-band (product
   decision, undecided); UI/art pass (operator-deferred); license-number
   extraction + `licensees` table + NY OCM dataset import; haptics;
   gear-icon confirmation on non-dev builds; Resend domain verification;
   quadrant / intent lens / confound discounting (capturable now, build on
   lived demand); anchor-collision residual (D69, revisit only on a real
   COA exhibiting it).

## Working rhythm

Stable method lives in `CLAUDE.md` and
`documentation/process/handoff-specs.md`. Reinforced this session:
(a) document-before-implement held — D70-D76 and D77 landed as design
before any migration; (b) the two-channel body check held — the operator
ran `git log -1 --format=%B | cat -A` independently before each push
authorization, and the architect refused to authorize on an implementer
summary both times; (c) STOP-on-failed-precondition held — the implementer
stopped on the malformed D77 grep gate and handed the decision back rather
than resolving it; (d) NEW — grep-gate discriminating-form rule (Banked
3); (e) NEW — the Supabase schema gate is only closed for the current
policy/view set: any migration touching `session_entries` or either view
reopens it, and the gate must re-observe `relrowsecurity` (tab-1) and view
`reloptions` (tab-3), which `pg_policies` alone never shows.

## Entry point

**The D77 migration.** Design-before-implement is satisfied (D77 is the
committed design). This is the implementer-authored, operator-applied
schema change — the first live-database write of the sequence.

The migration must: add `energy`, `environment`, `spark` (nullable text);
add `physical_state text[]`; replace `co_alcohol` with `co_consumption
text[]`; drop `context`; and **recreate both `session_current` and
`coa_session_stats` with `security_invoker = true`** — dropping `context`
forces the `session_current` recreate (it selects `*`), and that recreate
is exactly where the invoker flag gets silently lost, reopening the
RLS-bypass verified absent this session.

Before authoring it, read the current view definitions verbatim
(`git show HEAD:supabase/migrations/20260716162520_create_scoring_views.sql`)
so the recreate is verbatim-plus-flag, not reconstructed. Gate (observed
state, operator-run): the new column set present; RLS still on with the
same two policies; and **both views observed `security_invoker=true` after
apply** (the tab-3 `reloptions` query) — not only pg_tables/pg_policies. A
column-drop must not silently reintroduce the bypass.

Not a menu: absent an operator redirect, the migration is the move. The
`db push` Docker cache warning on Windows is cosmetic (remote apply
succeeds; observed state adjudicates).
