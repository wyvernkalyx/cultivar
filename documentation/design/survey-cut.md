# The Survey Cut -- design (D92-D96)

Status: RATIFIED and implemented 2026-07-27 across 9fb396b, b39d3a5,
and e7d56fc. See the Amendment at the end for what the device gate
found. Lands as a `docs:` commit before any code moves; this status
line is amended by the commit that changes its truth.

North stars: `documentation/design/scoring-lexicon.md` (the durable skeleton,
especially items 1-4), `documentation/design/session-logging.md` (the
interaction chain this supersedes), `documentation/design/glossary.md`
(D85/D86, whose scope this reduces).

**This pass amends a skeleton item.** Skeleton item 4 is reduced to nothing.
`scoring-lexicon.md`'s refinement doctrine states that the skeleton items do
not revise without their own ratification pass. This document is that pass,
and it says so plainly rather than arriving as an amendment block on a doc
about something else.

---

## Observed baseline (2026-07-26)

- `session_entries`: **0 rows.** Emptied this session by the operator's
  scoped reversal of D85.3.
- `src/lib/lexicon.ts`: `LEXICON_VERSION = 3`; `RUNGS`, `ENERGY`,
  `ENVIRONMENT`, `MAIN_GOAL`, `CO_CONSUMPTION`, `PHYSICAL_STATE`, `FITS`,
  and `GLOSSARY` (27 entries across seven phases).
- Live survey: eight phases -- score, energy, environment, main_goal, fit
  (conditional on main_goal), physical_state, co_consumption, closing.
- `session_entries` columns present and unwritten-by-nobody-yet: `energy`,
  `environment`, `main_goal`, `fit`, `physical_state`, `co_consumption`.
- Real sessions ever logged, at any point in the project's history, by
  anyone: **zero.** Operator-confirmed 2026-07-26.

---

## Why this pass exists

`scoring-lexicon.md` already contains the rule this chain violated:

> This is the v1 ceiling. Completion falls with every added item; each future
> question must argue its way in against the append-only pull ("unasked is
> unrecoverable forever"), not ride in on it.

D71 added three intent axes. D75 expanded one confound chip into a
five-value panel. D76 added a fifth fact class. D82 moved both panels onto
the required path. D85/D86 authored 27 glossary definitions for the
vocabulary that resulted. Fifteen-odd ratified decisions across eight days,
and none of them argued against completion cost. D71 argued the reverse:
capture three dimensions while capture is free.

**Capture was never free.** D80 was spent on the operator's verdict that the
flow "felt like I was using multiple applications." D82 was spent on the last
seam. D82.1 **failed its gate** and needed a checkbox affordance to announce
a grammar the design believed was already visible. Three device gates, all
consumed by the consequences of survey length.

And the refutation that settles it: **zero real sessions have ever been
logged.** Every survey revision to date was a design argument adjudicated by
other design arguments, which the same doc says cannot work -- "the operator
cannot know how to improve the survey until real sessions are logged against
it."

So the grounds for this cut are explicitly **not** "the data says so." There
is no data. The grounds are: reduce the survey to what will actually get
used, use it, and let real sessions adjudicate the next change.

**Recorded honestly:** this is the fourth survey restructure in eight days
(D79, D80, D82/D82.1, now this), each ratified in good faith from the same
standing position, each refuted by the next look. The correct guard is not a
better argument. It is logging real sessions before the fifth pass.

---

## D92 -- The survey is two screens

**Screen 1 -- Score.** The five `RUNGS` as full-width stacked pills, `Loved`
at top through `Hated` at bottom. Tap is the save. No Skip. Close is the
cancel. One info trigger showing the five rung definitions.

**Screen 2 -- Closing.** The product identification line (D81), an optional
free-text note (D95), and Close. No info trigger (D86's structural exclusion
for closing survives).

Minimum cost: **two taps.** Maximum: two taps plus typing.

What survives from the superseded chain, unchanged:

- **D80's tap-is-the-save**, wholesale. The mandatory field and the save are
  one motion; no done button, no confirm dialog, ever.
- **D54-D55 persistence semantics**, wholesale. Pending until confirmed, one
  in-flight insert at a time, controls disabled in flight, inline error on
  failure, ~10s client timeout, duplicate-on-retry absorbed by the schema.
  Advance on confirmed insert, never on tap.
- **D81's product identification** on every screen.
- **Revision by Back-and-retap**, the same grammar the axis screens used.
- **Skeleton items 1, 2, and 3 untouched** -- and they are the reason this
  cut is safe. Item 1: the score comes from the overall word alone, on every
  path; rich answers never moved it. Item 2: the overall word is the only
  mandatory field. So **nothing removed here ever touched the score, the
  band, or the shelf.**

What disappears as a consequence rather than a decision:

- **Skip.** D79 made it first-class on every screen because null had to cost
  no more than answering. With no optional questions, there is nothing to
  skip. D79's principle is not repealed; it has no surface left.
- **The grammar split.** D82.1's checkbox affordance existed to announce
  multi-select. No multi-select screen remains.

---

## D93 -- Skeleton item 4 is reduced to nothing (the fact classes retire)

Skeleton item 4 ("fact classes stay distinct fields") listed intent, fit,
context, and co-consumption; D76 amended it to three axes, fit,
co-consumption, and physical-state. **All of them retire as survey
questions.**

Retired: `ENERGY`, `ENVIRONMENT`, `MAIN_GOAL`, `FITS`, `PHYSICAL_STATE`,
`CO_CONSUMPTION`.

Grounds:

1. **Nothing reads them.** Every named consumer -- the quadrant, the intent
   lens, confound discounting, expectation-vs-reality -- is banked. Building
   and maintaining capture for a consumer that does not exist is speculative
   scaffolding, banned by name in `CLAUDE.md`.
2. **They never touched the score** (skeleton item 1), so their removal
   cannot corrupt scoring, band placement, or `coa_session_stats`.
3. **The recover-later argument (D71) failed its own precondition.** It holds
   when capture is free. Capture cost three device gates and, more
   decisively, cost the operator using his own app at all.

**Named, permanent cost, accepted:** the quadrant (Main Goal x fit) can never
be computed for the logging period this covers. Intent-conditional
preference -- "this chemistry is great for Deep Focus and poor for Ease
Tension" -- is the app's most interesting possible finding and it is
forfeited for now. It was equally forfeited by a survey nobody completed.

**Tripwire, named so its return is a decision and not a drift:**
`CO_CONSUMPTION` comes back **unchanged, as one screen**, if free-text notes
begin showing confounds the operator wants to filter on. Its vocabulary and
its glossary entries are preserved in `glossary.md` for exactly that. Under
D94 its column is dropped, so the return costs a migration -- deliberately,
so that it arrives as a ratified decision rather than a quiet refill.

---

## D94 -- The columns are dropped; `LEXICON_VERSION` becomes 4

**The six retired columns are dropped:** `energy`, `environment`,
`main_goal`, `fit`, `physical_state`, `co_consumption`. Operator-ratified
2026-07-26 over the architect's proposal to leave them in place.

Grounds: at zero rows the drop destroys nothing, and a column the schema
carries but nothing writes is a standing invitation to misread -- the next
reader cannot tell "retired" from "not yet wired." The schema should say what
the product does.

Ruled over the alternative (leave them nullable and unwritten): it would have
avoided a view recreate and made the `CO_CONSUMPTION` tripwire free, but it
buys that with a schema that misdescribes the product.

**The named cost, and it is real.** `session_current` selects explicit
columns and `coa_session_stats` reads from it, so a column drop forces a
drop-and-recreate of both views. D77 recorded this as "the one live risk in
this pass": a column-drop that recreates a view is exactly where
`security_invoker = true` gets forgotten, silently reintroducing an RLS
bypass -- users able to read each other's rows. **Non-negotiable in the
migration: both views come back with `security_invoker = true`, and the gate
re-observes `reloptions` rather than assuming.**

Second named cost: the `CO_CONSUMPTION` tripwire (D93) now costs a migration
to honour. Accepted -- its return should be a decision with ceremony, not a
column quietly refilling.

**`LEXICON_VERSION` -> 4.** Grounds: the version must now mark the **field
set**, not merely the strings. Under v3 a null `main_goal` meant *the user
skipped*. Under v4 it means *the question was never asked*. Those are
different facts and D48's "unanswered is not an answer" requires they stay
distinguishable. With zero v3 rows surviving, the boundary is clean by
construction, but the version must still carry it -- future rows, and any
future read, need the field set to be recoverable from the row.

**The hidden 5/4/3/2/1 mapping is UNCHANGED.** This is the invariant D77 and
D85.1/D85.3 identified as what keeps cross-version averaging valid without a
version branch. v4 is a field-set change, not a scale-shape change, so
`coa_session_stats` needs no branch and **no ratified recompute is
triggered.** Stated explicitly because the recompute ceremony is expensive
and someone will reasonably ask.

D85.3's versioned-revision rule stands and applies to v4 onward.

---

## D95 -- Free-text notes

`session_entries` gains `notes` (text, nullable). The survey cut's only
schema addition.

Its job is **not** training data. It is the channel through which the
operator discovers which structured question deserves to exist later --
including whether `CO_CONSUMPTION` should return. It is never in the
inference path, never scored, never displayed as a correlate.

- **Empty is null, never empty string.** Same family as ND != 0, and the same
  normalization rule D78 ratified for the panels. This matters concretely:
  the live `coas` table already carries a `brand = ''` row, which is that
  principle already violated once.
- **Deliberate exception to tap-is-the-save, with grounds.** Text has no tap.
  The note writes one revision insert on Close (or on blur), not
  keystroke-by-keystroke. This is **not** the batched save D82 rejected: that
  rejection was about a *set* of toggles saved together and able to partially
  fail. One field, one insert, cannot partially fail.
- Closing with an empty note writes nothing. No revision insert, no row
  churn.

**Placement (operator-ratified 2026-07-26): the closing screen.** No separate
note screen -- a two-screen survey does not grow a third for an optional
field. Named cost, carried to the gate: this puts a keyboard on the terminal
screen and may fight the banked calyx-to-petal completion animation (art
pass). If the gate says it reads badly, the fallback is its own screen, not a
redesign.

**Write timing (operator-ratified 2026-07-26): on Close.** One revision
insert when the survey ends, not on blur. Fewer writes, and the note is a
single field whose value is not interesting until the user is done with it.
Named cost: a force-quit between typing and Close loses the note. Consistent
with D54, which already accepts that backgrounding mid-flight can lose a log
and rejects an offline outbox at this scale.

---

## D96 -- Glossary scope reduces to the ladder

Of D85.4's 27 ratified entries, **five remain in the client**: the `ladder`
group -- `Loved`, `Liked`, `Neutral`, `Disliked`, `Hated`.

- **`glossary.md` is not edited.** It is the ledger. All 27 entries and their
  ratification history stay as written, exactly as D85.2's ledger boundary
  held the word "Spark" in D71-D73. This document is the record that reduces
  the client surface.
- **The `GLOSSARY` structure in `src/lib/lexicon.ts` drops to one group.**
  D86.3's verbatim rule survives in full for the five that remain:
  character-identical, no truncation, no paraphrase, no generated copy.
- **D86.6's partition property is restated for the cut:** one term-bearing
  phase, five entries, one sheet, zero orphans. Closing carries no trigger.
- **D86.2's sheet mechanics survive unchanged** -- dismissible, read-only,
  never selects or writes or navigates, zero insert-path surface. That last
  property was deliberate while the intermittent-freeze defect stays open,
  and the defect is still open.
- D86.7's Modal mechanism (core React Native `Modal`, pageSheet) is unchanged.
  No new dependency, no native module, **so the EAS-rebuild split rule is not
  triggered by this pass.**

The three axis-title entries (`Target Energy`, `Setting`, `Main Goal`), added
as new data by D86.7, leave the client with their axes.

---

## Supersession scope

Retired **as surfaces**, with structures and vocabularies preserved in their
docs as ledger:

- **D71** (three orthogonal axes), **D72** (Main Goal as anchor), **D73** (fit
  render condition), **D75** (co-consumption panel), **D76** (physical state
  fact class), **D78** (panel toggle deselection)
- **D82** (panels join the sequence), **D82.1** (multi-select announces itself)
- **D79** in what remains of it -- the axis screens and first-class Skip
- **D86.1-D86.7** in scope only: seven term-bearing phases become one

Preserved and load-bearing:

- **D80** in full -- pill screen, tap-is-the-save, no Skip on score, advance on
  confirmed insert
- **D81** -- product identification on every screen
- **D54, D55** -- pending/confirmed persistence grammar
- **D85.1** -- the v3 rung strings and, critically, the stable hidden mapping
- **D85.3** -- versioned revision, applying to v4
- **Skeleton items 1, 2, 3, 5, 6** -- untouched
- **D53** -- COA delete cascade

Amended: **skeleton item 4**, to empty.

---

## Slice plan

1. **`docs:`** -- this document. No code.
2. **Schema (`feat:`)** -- migration, in this order: drop
   `coa_session_stats`; drop `session_current`; add `notes` to
   `session_entries`; drop the six retired columns; recreate
   `session_current` (observed definition, six columns removed, `notes`
   added); recreate `coa_session_stats` (observed definition, unchanged);
   set `security_invoker = true` on both; restore view grants to the
   pre-migration observed set. The drop order follows the D85 precedent,
   which resolved the same dependency chain by observation. Migration
   authored by the implementer, applied by the operator (`db push`,
   credentialed).
3. **Client (`feat:`)** -- `lexicon.ts`: `LEXICON_VERSION = 4`, remove the six
   arrays, reduce `GLOSSARY` to the ladder group. `session-ladder.tsx`:
   remove six phases, add the note field, keep the score screen and the
   closing screen.

Slices 2 and 3 land in one session with the device gate after both, following
the D85 precedent: between them the client writes columns the schema still
has, so nothing breaks in the interim -- unlike the D85 rename, which broke
inserts between slices.

No native module is added. **No new EAS dev build required.**

---

## Non-goals

- Editing `glossary.md`. It is the ledger (D96).
- Grant tightening on the two views. `anon` holds ALL privileges; latent, not
  live, and already banked as its own decided slice. The recreate restores
  the observed set exactly and must not tighten as a side effect.
- Any change to scoring, band placement, `average_score`, or `never_again`.
- The retirement survey and `on_shelf_count` -- that is
  `coa-retention-and-possession.md` (D87-D91), independent of this pass.
- Onboarding. Still banked, and now with less to mirror.
- The banked art pass, including the calyx-to-petal completion animation.
- The intermittent-freeze defect. Still open, still unreproduced.

---

## Gate

**Schema slice.** Observed SQL, pasted raw:

- `session_entries` column list shows `notes` and shows **none** of
  `energy`, `environment`, `main_goal`, `fit`, `physical_state`,
  `co_consumption`.
- Control, paired: the column list still shows `overall_word`,
  `overall_score`, `session_id`, `entry_no`, `lexicon_version`, `deleted`,
  `created_at`, `coa_id`, `created_by`. A drop criterion that observes only
  the dropped columns cannot distinguish "dropped the right six" from
  "dropped more than six."
- `pg_get_viewdef(session_current)` shows `notes` and none of the six.
- **`reloptions` show `security_invoker=true` on BOTH recreated views.**
  Re-observed, never assumed -- the standing rule, and D77's named live risk.
  This is the criterion the whole D94 cost is about; it does not get skipped
  because the migration looked clean.
- View grants match the pre-migration observed set, captured **before** the
  migration runs so there is something to match against.
- `select count(*) from session_entries;` -> `0`, unchanged.

**Client slice.** Device gate on the physical iPhone:

- Log a session with the score only. Two taps. Read back: one row,
  `lexicon_version = 4`, `overall_word` and `overall_score` set, `notes`
  null, and **all six retired columns null.**
- Log a session with a note. Read back: `notes` set on the latest entry of
  the chain.
- Close with the note field touched but left empty. Read back: `notes` is
  **null, not `''`** -- the normalization control.
- Back from closing, tap a different rung, Close. Read back: a revision entry
  in the same `session_id` chain with the new word and score; the prior entry
  intact beneath it.
- Open the ladder info sheet: five entries, character-identical to
  `glossary.md`. Dismiss; selection state unchanged.
- Confirm no info trigger renders on the closing screen.
- Seam criterion, carried from D80/D82: the full flow feels like one
  application.

---

## Banked

- `CO_CONSUMPTION` returns as one screen, on the D93 tripwire.
- The quadrant, the intent lens, confound discounting,
  expectation-vs-reality. All were already banked; they are now also
  unfeedable until their questions return.
- Pairwise comparison at jar depletion as a tie-breaker for a top-heavy
  absolute scale. Reasoning only -- **no empirical support**; the apparent
  supporting data was device-gate artifacts.
- Note placement (closing screen vs. its own), pending the device gate.
- A full-27 standalone glossary screen (D86.5), still banked, now further out.

---

## Questions resolved at authoring (2026-07-26)

All three open questions this document was drafted with were ratified by the
operator before it landed. Recorded here with their consequences rather than
deleted, so the reasoning is not relitigated.

1. **Note placement -- the closing screen.** See D95.
2. **Note write timing -- on Close.** See D95.
3. **`notes` in `session_current` -- yes.** This question was contingent on
   D94: leaving the six columns in place would have made the view recreate
   avoidable, and including `notes` would then have cost one. The operator's
   ruling to drop the columns forces the recreate regardless, so exposing
   `notes` through the view is free and is included.

The one question this pass deliberately does **not** answer: whether the
`session_current` recreate should also carry the banked grant tightening. It
should not. That is its own decided slice, and a security change riding
inside an unrelated migration is how it ships unreviewed.

---

## Amendment -- shipped, 2026-07-27

Authored after the device gate. Everything in this section is observed, not
predicted.

### What landed

- `9fb396b` -- schema. Dropped the six retired columns, added `notes`,
  dropped and recreated both views. Applied by the operator via `db push`.
  Observed after apply: `session_entries` carries 11 columns with `notes`
  present and none of the six retired; both views `security_invoker=true`;
  grants restored to the pre-migration set; 0 rows; 2 policies intact.
- `b39d3a5` -- client. `LEXICON_VERSION = 4`, the six vocabularies removed
  from `lexicon.ts`, `GLOSSARY` reduced to the ladder group, the survey cut
  to two screens, the note field added. 217 insertions, 588 deletions.
- `e7d56fc` -- keyboard handling on the closing screen.

### Correction to the slice plan above

The Slice plan section states that between slices 2 and 3 "the client writes
columns the schema still has, so nothing breaks in the interim." **That
sentence is false and was false when written.** It survived from the
architect's original proposal to leave the six columns in place; D94 ratified
dropping them, and the sentence was missed in the edit that reversed it.

The real interim state was total breakage: the client sent all six dropped
columns on every insert including the first score tap, so PostgREST rejected
the whole row and no session could be logged at all between `9fb396b` and
`b39d3a5`. That is exactly the D85 failure mode the sentence claimed to have
avoided. Recorded rather than deleted, because the class of error -- a
premise surviving the decision that reversed it -- is the one this project
keeps hitting.

### Device gate, 2026-07-27

Run by the operator on the physical iPhone. Per-step verdicts:

| step | verdict |
|---|---|
| Score tap advances to closing, two taps total | PASS |
| Back, different pill, Close -- revision accepted | PASS |
| Type a note, tap Close | **PARTIAL** -- see below |
| Type then delete a note, Close -- normalization | PASS |
| Info sheet shows five rung definitions, dismisses | PASS |
| Seam criterion: feels like one application | PASS |

Read back from the live database after the gate: 9 entries across 4 session
chains, every row `lexicon_version = 4`. One note wrote as text; every other
row wrote `notes` as **null, never `''`** -- the D95 normalization control,
confirmed on the bytes rather than the UI.

### The one defect, accepted rather than fixed

Close stays under the keyboard while the note has focus.
`keyboardShouldPersistTaps="handled"` works -- the first tap on Close
registers rather than being swallowed as a dismissal, confirmed twice.
`automaticallyAdjustKeyboardInsets` does not: `closingContent`'s `flexGrow: 1`
makes the content exactly fill the frame, so there is no scroll slack for an
inset to consume.

**Those two are coupled.** `flexGrow: 1` is also what pins the bottom anchor
the gate passed. Loosening it to make the inset work would cost the layout.
The banked fix is an input accessory bar pinned above the keyboard, which the
platform positions without measurement.

Shipped as a named defect: two attempts have gone at it, the field is
optional, and the cost is one extra tap. The operator found the workaround --
tap the background to dismiss -- without being told.

### D95's named cost did not materialize

D95 warned that putting the note on the closing screen might fight the banked
calyx-to-petal completion animation. Observed at the gate: **the bloom stayed
visible throughout typing.** The stated fallback (the note gets its own
screen) is not needed and stays unexercised.

### Still true

The app has now logged sessions end to end. **None of them is a real
session.** The nine entries above are gate taps. The cut exists so the survey
is cheap enough to actually use; using it is the whole point, and it has not
happened yet.
