# SESSION_HANDOFF -- written 2026-07-19 against pushed HEAD `8513c86`

The repo is authoritative over this document. Begin with a read-only
Phase A audit (`bash scripts/session-audit.sh`, Git Bash only) and try
to break every claim below before doing anything else.

This file supersedes the handoff committed at `5ee49a9`, retrievable:
`git show 5ee49a9:documentation/SESSION_HANDOFF.md`.

## Preamble -- carried context broke again; assume this doc is fallible

Phase A opened clean for the second consecutive session (all fourteen
prior-handoff predictions confirmed, three closed only by manual
paste). Then the session's own predictions and premises broke four
times:

1. **The device-gate row prediction was refuted: +13, not +8.** Benign
   -- a force-closed first walk deviated from the script (the operator
   answered two steps the script skipped) and wrote a complete 5-row
   chain. The lesson is not "predict better": a gate prediction
   assumes script compliance, and a red prediction plus a row-by-row
   read is exactly the audit working. The chain survived a force-close
   with every row a one-field delta.
2. **The recon prompt located pointer blocks "near the top" of two
   docs; they sit at the end.** Only scoring-lexicon.md points near
   the top. Corrected by the implementer's report.
3. **The recon prompt assumed four survey component files; there are
   two.** The whole survey is src/components/session-ladder.tsx; the
   owner is src/components/shelf-list.tsx.
4. **The freeze hypothesis "Metro dev-server artifact" was refuted by
   discrimination** (buttons ignored taps while the phone worked; the
   freeze arrived without a tap; no Metro output). It is app-layer.
   See Known open defect.

Also: D79 as ratified in chat was silent on fit placement; the
architect filled it (own screen, post-Spark, Spark-gated) and flagged
the fill before the docs commit. Ratified-by-silence after an explicit
flag, recorded here so it is not later mistaken for an unratified
drift.

## Start here (Phase A, read-only) -- every line is a falsifiable prediction

| check | expected |
|---|---|
| branch | `main` |
| HEAD | a `docs:` commit, subject `docs: session handoff at 8513c86`, parent `8513c86`; its own sha unknowable here. Below it, newest first: `8513c86`, `dbc5426`, `5ee49a9`, `a22f74f`, `109f6ed`, `44872df`, `5b0aec9`, `b7c5f3c`, `1a04651`, `3497b6b`. |
| `git rev-list --left-right --count origin/main...HEAD` | `0	0` after the operator pushes this handoff commit; a nonzero right count means the push has not run -- a finding, not an error. |
| `git status --short` | clean; `audit.txt` only under `--ignored` as `!!`. |
| `ls supabase/migrations/` | exactly five; newest `20260718185916_alter_session_entries_d77.sql` (untouched this session) |
| Jest | 40 passed (last literal run: the D79 build report at `8513c86`'s tree) |
| Deno | 5 passed (last literal run: the `5ee49a9` audit; unchanged by construction through `8513c86` -- no supabase/functions changes in either commit) |
| `npx tsc --noEmit` | exit 0 |
| `npx expo lint` | 1 error, 0 warnings (template `use-color-scheme.web.ts`) |
| `npx expo install --check` | jest/@types/jest PLUS expo patch drift (constants, dev-client, router, splash-screen at last look). Expected, growing, do not fix. |
| Supabase (SQL editor; audit [16] has the three queries) | six tables `rowsecurity = t`; 9 policies, `session_entries` exactly INSERT + SELECT; both views `security_invoker=true`; a `(none)` row in query three means the flag is LOST. All re-observed this session pre-build. |
| `session_entries` | 23 rows, four chains (sizes 10, 5, 6, 2 in chain-start order), all `lexicon_version = 2`; top row: energy set, environment/spark/fit all null. Counts and transitions only, never absolute entry_no. Disposable test data; a wipe would zero this. |
| client constant | `src/lib/lexicon.ts:6` `LEXICON_VERSION = 2` |

If any of these don't match, the repo wins -- re-baseline before
proceeding.

## What shipped (newest first)

- (this handoff commit) -- the write-last close, no code.
- `8513c86` -- **feat:** D79 implemented in session-ladder.tsx: the
  two-phase model becomes the screen sequence ladder -> energy ->
  environment -> spark -> fit (Spark-gated) -> closing -> panels
  (optional). One PillScreen serves axis and fit screens. Write
  machinery untouched. Device-gated (see The arc). Ships one tracked
  open defect (see Known open defect).
- `dbc5426` -- **docs:** D79 ratified: axis capture restructure, wheel
  refuted as input control. Full block in session-logging.md, pointer
  in rich-path.md. The wholesale-rewrite promise both docs carried is
  re-banked to a consolidation pass.

## The arc -- the wheel pass ran and killed the wheel

The banked entry point executed, but the design conversation refuted
the design it was banked for. Operator's stated product goal:
predictable and understandable on first use. Against that criterion
the three-axis radial wheel lost on the evidence (no mobile
convention, composite novel encoding, thumb-reach, center-is-null
invisible to a novice), and one constraint dominated everything: the
survey is answered during or after a session -- the user is sometimes
impaired. That selects big targets, zero reading, no precision, skip
cheaper than answering (or users fabricate to dismiss screens, which
poisons the empirical layer the product runs on). D79's shape follows:
one axis per screen, full-width pills, tap-advance, first-class Skip;
calyx-to-petal relocates to the completion animation (banked, art
pass) where it can never mis-select. Two semantics were ratified in
chat on top: advance on insert CONFIRM, never on tap (the write path
is blocked-not-queued, so advance-on-tap would land on inert
controls); Skip never writes (the drop insert already records all
axes null, so null is free by construction).

The gate closed on 14 per-step verdicts including the airplane-mode
failure path (inline error on the failing screen, revert by
derivation, no stale error after recovery -- the fire-side
setSaveError(null) was verified in source before the gate) and the
null-spark branch (fit never shown). The DB read that refuted the +8
prediction closed benign (Preamble 1) and doubled as the strongest
evidence of the session: chain integrity held through a force-close
and through both freezes.

## Known open defect (shipped tracked, recorded in 8513c86's body)

Intermittent UI freeze after a confirmed insert: controls ignore taps,
phone otherwise fine, the confirming row lands in Postgres, the
10-second abort timer does not fire, one occurrence self-recovered
after minutes, one was force-closed. Three directed repro walks (Metro
visible) did not reproduce. Discriminated to the app layer;
UI-layer only -- no data loss or corruption in any occurrence.
Suspected neighborhood: the Reanimated strict-mode warning (carried
blocked item, same neighborhood, plausibly same root). Capture
protocol if it recurs: note wall-clock time, watch the 10-second mark,
paste the full Metro window including warnings.

## Refuted hypotheses / memory corrections

- The four Preamble items.
- The carried three-axis-wheel and marking-menu leans: refuted by D79
  with grounds. Do not re-derive them.
- Axis deselection-to-null's hoped resolution ("dissolves inside the
  wheel's center-is-null") died with the wheel; the blocker is intact
  and the item stays banked.

## Ratified decisions

- **D79** (dbc5426): axis capture restructure; grounds impaired-use,
  first-use predictability, null-honesty. Refutes the wheel.
- **Advance-on-confirm and Skip-never-writes** (chat, pre-build):
  grounds in The arc.
- **Three implementer judgment calls accepted** (8513c86's body):
  Close stays on the ladder screen; Skip/Back disable in flight;
  setPhase lives in finish()'s success branch.
- **Ship-with-tracked-defect** (operator-confirmed): grounds -- the
  data layer is provably intact through every occurrence, the defect
  is unreproducible on demand, and holding a gated diff hostage to an
  unsummonable bug buys nothing.
- **Ladder-unification banked as the next design pass**
  (operator-confirmed): see Open items.

## Open items

**Runnable now (the entry point)**
- **Ladder-unification design pass.** Operator's lived-use
  observation after the D79 gate: two input grammars in one flow
  (drag-and-drop ladder, then pill taps) is inconvenient and
  confusing; every screen should behave the same way. This refutes
  D50/D51 territory ("drop is the save"; the vertical ladder is the
  founding mechanic) and D79's "ladder unchanged" clause, so it is a
  ratification pass of its own, not an amendment: the drop gesture IS
  the save semantics, the ladder carries D51's up-is-better ordinal
  geometry, and the D54/D58 pending-card/echo grammar assumes a
  draggable card. Questions the pass must answer: does the ladder
  become pills (and what carries the ordinal geometry), do pills
  become a drag (refuted by D79's grounds), or does a third form
  unify them. Design-only, its own docs: commit, couch-gated.

**Blocked**
- The freeze (capture protocol above; fix path needs a capture).
- Reanimated strict-mode warning: one Metro stack-trace capture
  (carried; now doubly motivated).

**Banked (prioritized)**
1. Glossary pass (carried; personal-empirical rewrite, discipline 1).
2. Art/polish pass additions from this session: screen-title/gear-icon
   collision on every sequence screen (visible in all gate
   screenshots); screen transition animation; the completion
   calyx-to-petal bloom (D79); general sequence-screen formatting
   (operator: "really terrible, fix later").
3. Transitional survey copy review (carried; the fit question text and
   panel labels survived D79 unchanged).
4. Pending-state relocation into the design doc (carried; target is
   now the consolidation pass, since the wheel pass is spent).
5. Doc consolidation pass (new home of the wholesale-rewrite promise
   both docs carried; grounds in dbc5426).
6. check-ignore qualification (carried, promotion bar unchanged).
7. Axis deselection-to-null (blocker intact; wheel resolution dead).
8. Carried, untouched: detail-view session read/edit; home-zone
   parking; shelf sort-by-band; license extraction + NY OCM import;
   haptics; gear-icon confirmation on non-dev builds; Resend domain
   verification; quadrant/intent-lens/confound discounting;
   anchor-collision residual (D69); COA PDF persistence (Storage
   still has zero buckets); `auth-resp.json` at the repo parent
   (flagged, still unconfirmed deleted).

## Working rhythm

Stable method lives in CLAUDE.md and handoff-specs.md. In flux, all
carried from last session and holding: diff-via-operator-channel;
grep criteria carry exit codes in both shells; row predictions are
relative only; commit verification is cat -A character identity;
device gates keep per-step verdict lines (reaffirmed this session --
the aggregate "everything worked" initially offered would have buried
the freeze and the +13). New this session: a gate prediction is
conditioned on script compliance -- when a walk deviates, re-derive
the expected rows from what was actually done before calling the
refutation a defect.

## Entry point

**The ladder-unification design pass.** It exists because lived use on
the gated D79 build produced a direct operator observation against the
founding input mechanic, and the refinement doctrine ranks lived use
above design intent. Everything it needs is true: D79 is live and
gated, the freeze is tracked with a capture protocol, and the docs
carry the D79 record it will argue against. Design-only, its own
docs: commit, couch-gated on completion feel. Not a menu: absent an
operator redirect, this is the move.
