# Session Handoff

Written 2026-07-27, after `31089d2` landed and pushed. Supersedes the version
at `92d1ddb`.

**The repo is authoritative over this document.** Everything below can be
wrong. Begin with the read-only Phase A audit and try to break it.

## Preamble -- argue against yourself

The architect wrote five broken gate criteria in one day. Every one the same
defect: predicting what a `grep` would return without checking the shape of
the text being counted.

1. `grep -c 'security_invoker = true'` expected 2, returned 3 -- the file's
   own comment carries the token.
2. `grep -c 'KeyboardAvoidingView'` expected 3, returned 4 -- same cause.
3. A diff-based non-ASCII gate fired on a substring edit to a line that
   already held an en dash: *added lines* are not *introduced text*.
4. `git diff | grep -c '^-'` expected 2, returned 3 -- the replaced text
   spanned two physical lines.
5. A six-word phrase criterion returned 0 -- written against text the same
   prompt had just re-wrapped, and `grep` is line-oriented.

`handoff-specs.md` §4.4, which says to name a criterion's false-positive mode
before shipping it, was authored **the same morning** as items 2 through 5.
The rule is not the problem. The next session should assume the architect's
criteria are the weakest link in any prompt it writes, and should write the
falsification case first, in the prompt, before the expected value.

The implementer stopped or reported on all five. No artifact was ever bent to
satisfy a bad gate.

## Start here (Phase A, read-only)

Every line is a falsifiable prediction. If any does not match, the repo wins.

Observed 2026-07-27:

- Branch `main`. `git rev-parse HEAD` -> `31089d2`
- `git log -1 --oneline` -> `docs: drop a false clause from the survey-cut status line`
- Push output observed: `e7d56fc..31089d2  main -> main`
- `echo "ahead: $(git rev-list --count origin/main..main)"` -> `ahead: 0`
- `src/lib/lexicon.ts`: `LEXICON_VERSION = 4`; `RUNGS` plus `GLOSSARY` with
  the ladder group only. The six vocabulary arrays are gone.
- `src/components/session-ladder.tsx`: `Phase = 'ladder' | 'closing'`.
- Database, project `zmmlgatxckplfzqyexjb`:
  - `session_entries` -> **11 columns**: `id`, `entry_no`, `session_id`,
    `created_by`, `coa_id`, `lexicon_version`, `overall_word`,
    `overall_score`, `deleted`, `created_at`, `notes`. None of the six
    retired columns.
  - `session_entries` -> **9 rows across 4 chains**, all `lexicon_version 4`.
    All are device-gate taps. **Zero real sessions.**
  - `coas` -> **5 rows**, three of which are one Rainbow Runtz COA ingested
    three times.
  - `storage.buckets` -> **0**
  - Both views `security_invoker = true`; `session_entries` has 2 policies.

NOT observed this session, so not to be trusted as stated:

- `npm test`. Never run. `CLAUDE.md` ADAPT 1 no longer quotes a number.
  **Measure, do not recall.** Use `npm test`, never `npx jest`.
- Warning baseline WAS observed repeatedly: `npx tsc --noEmit` -> 0 errors,
  exit 0; `npx expo lint` -> 1 error, 0 warnings, exit 1, the template file
  `src/hooks/use-color-scheme.web.ts`. That IS the baseline, exit code
  included.

`entry_no` starts at 267, not 1. Postgres identity sequences do not reset on
DELETE, and 195 test rows consumed those numbers permanently. This is why row
predictions are relative only.

## What shipped

Newest first. Eight commits, `92d1ddb..31089d2`.

- `31089d2` -- `docs:` drop a false clause from the survey-cut status line
- `da61fa5` -- `docs:` survey cut shipped, with the gate result (D92-D96)
- `e7d56fc` -- `feat:` keyboard handling on the survey closing screen
- `b39d3a5` -- `feat:` cut the client survey to two screens (D92-D96)
- `9fb396b` -- `feat:` apply the survey cut to the schema (D92-D96)
- `aa2e64a` -- `docs:` session rhythm, section 4 of handoff-specs
- `2dc281f` -- `docs:` correct false status line in session-entries-schema
- `d4e7f7f` -- `docs:` goal sentence names chemistry, not terpenes

**The survey works end to end.** That is new as of today and was not true
this morning.

## The arcs

**The survey cut landed, and the interim was worse than the doc predicted.**
`survey-cut.md`'s slice plan claimed nothing would break between the schema
slice and the client slice. That sentence survived from the architect's
withdrawn proposal to keep the six columns; D94 dropped them, and the
sentence was missed in the edit that reversed it. The real interim was total:
the client sent all six dropped columns on every insert including the first
score tap, so PostgREST rejected the whole row and no session could be logged
at all between `9fb396b` and `b39d3a5`. Corrected in `da61fa5`, recorded
rather than deleted, because the error class -- a premise surviving the
decision that reversed it -- is one this project keeps hitting.

**The keyboard defect is shipped, named, and coupled.** On the closing screen
Close stays under the keyboard while the note has focus.
`keyboardShouldPersistTaps="handled"` works -- the first tap on Close
registers rather than being swallowed, confirmed twice at the gate.
`automaticallyAdjustKeyboardInsets` does not: `closingContent`'s `flexGrow: 1`
makes content exactly fill the frame, leaving no scroll slack for an inset to
consume. **Those two are coupled.** `flexGrow: 1` is also what pins the
bottom anchor the gate passed, so loosening it to rescue the inset would
break the layout that works. The banked fix is an input accessory bar, which
the platform positions without measurement. Two attempts have already gone at
this; the operator found the workaround (tap the background) unprompted.

**Process was rewritten mid-session because it had become unusable.** The
operator reported reading roughly 15% of the architect's output and missing
action items buried in prose. `handoff-specs.md` §4 (`aa2e64a`) adds the
chat -> operator channel: every message opens with a `DECIDE` / `DO` /
`NOTHING` box, action items appear only in the box, detail sits below a
skippable line, and findings accumulate rather than interrupting. It also
tiers ceremony by blast radius -- docs commits combine build with commit and
drop the operator's independent body check; code and schema keep the full
two-phase gate.

## Refuted this session

1. **`KeyboardAvoidingView` with `behavior="padding"`** does not work on this
   surface. It is not the outermost container; it sits inside a padded parent
   and an `Animated.View` carrying a transform. Do not retry it, and do not
   reach for `keyboardVerticalOffset` -- that trades the problem for a
   per-device constant.
2. **`automaticallyAdjustKeyboardInsets` alone** does not fix it either, for
   the `flexGrow` reason above. The architect proposed it confidently and was
   wrong.
3. **The architect's `--stat` predictions beat its `grep` criteria** every
   time both were present. `--stat` states file counts and line deltas
   directly; a `grep -c` states a number whose meaning depends on text shape.

## Ratified this session

- **D92-D96 shipped.** Grounds in `documentation/design/survey-cut.md`,
  including the post-gate Amendment.
- **The keyboard defect is accepted, not deferred.** The field is optional
  and the cost is one extra tap. The input accessory bar is banked with a
  named trigger: daily use making it worth another pass.
- **Goal sentence** (`d4e7f7f`): the app learns which chemistry a person
  prefers -- cannabinoids and terpenes, not strain names. "Strain
  preferences" was considered and rejected: strain names are chemically
  incoherent across growers, the ingestion unit is a per-lot COA.
- **Failed criteria stop before commit.** Ruled 2026-07-27 after the
  implementer proceeded past a failed criterion whose failure it had
  correctly diagnosed and whose property it had proven by other means. The
  analysis was right; the precedent is wrong. A rule that bends when the
  implementer is confident is advisory. Cost of stopping is one round trip.

## Open items

**Runnable now**

- **LOG A REAL SESSION.** See Entry point. This is not a task in the same
  sense as the others and it outranks all of them.
- **`coa-retention-and-possession.md` slices 2-6** (D87-D91), in the order
  given there. Slice 2 is schema and gates everything after. Independent of
  the survey -- different tables, no ordering dependency.
- **Doc drift, low priority:** `session-logging.md` and
  `scoring-lexicon.md` still describe the eight-phase survey.
  `scoring-lexicon.md` holds skeleton item 4, which D93 amended to empty --
  that one matters most, since a reader hitting the skeleton would build the
  wrong thing. `product-metaphor.md`'s "Relationship to current work" is
  stale on two counts.

**Blocked**

- **The dashboard / preference summary.** Not blocked on engineering --
  blocked on real sessions existing. Five COAs and zero real logs means
  nothing to summarize, and a summary at low n either says nothing or
  violates personal-empirical.
- **Store-inventory matching against favorites.** Structurally blocked:
  favorites key on chemistry, store menus publish brand, strain name, and
  THC%. No consumer channel publishes per-lot terpene data.

**Banked**

- Input accessory bar for the keyboard. Trigger: daily use.
- A spinner on Close while a note write is in flight. Today it goes
  unresponsive for up to 10s on a slow write. D54 is technically satisfied.
- Tap-outside-to-dismiss as an explicit affordance (`keyboardDismissMode`
  or a wrapping `Pressable`). The operator found the implicit version
  himself.
- `CO_CONSUMPTION` returns as one screen if free-text notes start showing
  confounds worth filtering on (D93's tripwire). Its column is dropped, so
  the return costs a migration -- deliberately.
- Pairwise comparison at jar depletion. Reasoning only, **no empirical
  support**.
- The three duplicate `RAINBOW RUNTZ` rows.
- `tested_on` null on all five COAs; `brand = ''` on one. Parser defects,
  found by reading the data. D88's natural key depends on how absence is
  represented.
- `ingest-coa` returns HTTP 200 with an empty shell on an unknown lab.
- Terpene whitelist silently drops unrecognized analytes.
- `anon` holds ALL privileges on both views. Latent, not live. Must not be
  fixed inside an unrelated migration.

## Working rhythm

Read `handoff-specs.md` §4 before writing any prompt. It was adopted today
and supersedes §1-§3 where they differ.

Two environment facts that cost real time before being written down:

- **The implementer's shell resets its working directory to
  `d:\Projects\DeadEditor` between calls.** Every command needs the `cd`
  prefix, and every prompt opens with the repo-identity precondition. A
  prompt gating only on file content once reported a wrong-repository run as
  "unexpected line 3."
- **Architect-supplied files must be placed by the operator** at a path
  named in the prompt. The architect's sandbox is not reachable from the
  implementer's shell. Twice a prompt said "the operator-supplied file"
  without the operator having been told to supply it.

The architect now has read-only Supabase MCP access and used it throughout:
schema observation, gate verification, and the post-gate read-back. Writes
require explicit per-statement operator authorization; `apply_migration`
stays operator territory. This does not extend to the repo -- HEAD, worktree
state, and test counts still arrive only through the operator.

## Entry point

**Log a real session. Then another. Then live with it for a week before
changing anything about the survey.**

This is the entry point, not a warm-up before the real work. Five survey
restructures have landed in nine days -- D79, D80, D82/D82.1, and D92-D96 --
each ratified in good faith, each refuted by the next look. The refuting
instrument was never a design argument; it was the operator touching the app.
Every one of those passes was made from a standing position with zero real
sessions logged, and the sixth would fail the same way.

The survey is now two taps. The reason it was cut is that the eight-screen
version was never used. If the next session opens with another survey design
question, the answer is in `scoring-lexicon.md` and it was already true when
this project had one screen: *the operator cannot know how to improve the
survey until real sessions are logged against it.*

If code must be written, `coa-retention-and-possession.md` slice 2 is ready
and touches nothing the survey touches. It also fixes something that is
losing data right now: every COA ingested without its source PDF retained is
permanently unverifiable.
