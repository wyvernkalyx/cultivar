# Session Handoff

Written 2026-07-26, after `40df989` landed and pushed.

**The repo is authoritative over this document.** Everything below can be
wrong. Begin with the read-only Phase A audit in the next section and try to
break it before doing any work.

## Preamble -- carried context was wrong, repeatedly, this session

This session was mostly a demolition of the previous session's carried
context. Concretely, and worth the embarrassment because the pattern will
recur:

The architect opened by offering "unifying the ladder drop gesture with the
pill-tap pattern" as the top banked design item. **D80 shipped that
unification on 2026-07-20, six days earlier.** The ladder was already dead;
the score screen was already pills. The architect was a full ratified
decision stale and did not discover it until reading `session-logging.md`
end to end -- not from a search, which would have missed it.

Worse, and the reason this preamble exists: the architect recommended
truncating the test-phase session rows **three separate times**, each time
citing "test data is disposable, vocabularies revise freely" as doctrinal
cover. **D85.3 retired that ground on 2026-07-23.** The recommendation was
right on the merits and wrong on its authority, and the error survived three
repetitions because nobody had read `glossary.md`.

The lesson is not "read more docs." It is that the D-registry now spans six
documents and the architect's summary of it is unreliable by default. Read
the amendment blocks at the end of every doc before reasoning about survey
or lexicon state. They supersede the prose above them and the prose is not
always marked.

## Start here (Phase A, read-only)

Every line is a falsifiable prediction. If any does not match, the repo wins
-- re-baseline before proceeding.

Observed and verified 2026-07-26:

- Branch `main`. `git rev-parse HEAD` -> `40df989`
- `git log -1 --oneline` -> `docs: COA retention, dedupe, and possession design (D87-D91)`
- Parent: `ce74453`. Push output observed: `ce74453..40df989  main -> main`
- `git rev-list --left-right --count origin/main...main` -> `0	0`
- `select count(*) from session_entries;` -> **0**
- `select count(*) from coas;` -> **5**
- `select count(*) from storage.buckets;` -> **0**
- `src/lib/lexicon.ts`: `LEXICON_VERSION = 3`; six vocabulary arrays plus
  `GLOSSARY` with 27 entries. **Unchanged this session** -- no code moved.

NOT observed this session, and therefore NOT to be trusted as stated:

- `git status` cleanliness. The commit was surgical (1 file, 403
  insertions), but the working tree was never inspected.
- Test counts. `npm test` was never run. `CLAUDE.md` ADAPT 1 no longer
  quotes a number. The D85 doc's parenthetical implies a 52-test suite;
  treat that as a guess. **Measure, do not recall.** Use `npm test`, never
  `npx jest` (drops `--experimental-vm-modules`).
- Warning baseline. `CLAUDE.md` ADAPT 6 states `tsc --noEmit` -> 0 errors and
  `expo lint` -> 1 error (template file, not our code). Re-measure per delta 7.

## What shipped

- `40df989` -- `docs:` COA retention, dedupe, and possession design (D87-D91).
  Design only. No schema, no code, nothing implemented.

That is the entire session's committed output. Everything else below is
decision history that has not yet landed in any document.

## The arcs

**The survey shrank, and the argument that shrank it was the operator's
own.** `scoring-lexicon.md` already contained the rule: "This is the v1
ceiling. Completion falls with every added item; each future question must
argue its way in against the append-only pull, not ride in on it." D71
through D86.7 -- roughly fifteen ratified decisions across eight days -- added
three intent axes, a five-value confound panel, a fifth fact class, moved
both panels onto the required path, and authored 27 glossary definitions.
None of that chain argued against completion cost. D71 argued the reverse:
capture three dimensions while capture is free. **Capture was never free.**
D80 was spent on "it felt like I was using multiple applications," D82 on the
last seam, and D82.1 failed its gate outright. Three device gates burned on
the consequences of survey length.

**The decisive fact was that no real session had ever been logged.** 195
entries across 29 chains existed, all device-gate artifacts, 6.7 revisions
per chain. The operator confirmed: zero real sessions. That makes every
survey revision to date a design argument settled by other design arguments,
which `scoring-lexicon.md`'s own refinement doctrine says cannot work -- "the
operator cannot know how to improve the survey until real sessions are logged
against it." The redesign's justification is therefore NOT "the data says
cut." There is no data. It is: cut to what will actually get used, use it,
then let real sessions adjudicate.

**COA integrity turned out to be the more urgent problem.** The source PDF
is discarded after parsing, so every analyte row in the database is derived
from a document that no longer exists. No re-parse path when a parser is
fixed; no audit path for the no-fabrication invariant. Meanwhile ingest has
no duplicate detection (three of five `coas` rows are one document uploaded
three times) and there is no possession state, so the only way to clear a
finished product off the shelf is to delete the COA -- which cascades under
D53 and destroys its sessions. `40df989` designs all three as one pass.

## Refuted hypotheses and memory corrections

Architect claims made and then refuted in the same session. None should be
re-derived.

1. **"Ladder/pill unification is the top banked item."** Refuted by D80,
   shipped 2026-07-20. The drag is gone; score is a pill screen.
2. **"The two panels are optional / off the required path."** That was D79.
   D82 moved both onto the required path as separate screens. Eight phases,
   not seven: score, energy, environment, main_goal, fit (conditional),
   physical_state, co_consumption, closing.
3. **"Spark."** Renamed Main Goal everywhere by D85.2 -- UI, code, column.
4. **`LEXICON_VERSION`.** Architect said 2. `session-logging.md` says "1
   today." Live client is **3**. Both were wrong; the doc is two versions
   stale on its own constant.
5. **"Vocabularies revise freely, so truncating is free."** Retired by D85.3
   on 2026-07-23. See the reversal under Ratified decisions.
6. **"The outcome variable is nearly constant -- 25 of 29 sessions positive
   -- and that is fatal."** Artifact. Those were gate taps, not ratings. The
   finding says nothing about the operator's preferences or the scale.
7. **"The lexicon version -> word-set mapping exists nowhere in the
   database, so skeleton item 3's recompute promise rests on remembering a
   commit."** Wrong. The hidden 5/4/3/2/1 mapping is unchanged across
   v1->v2->v3, which is exactly what makes cross-version averaging in
   `coa_session_stats` valid with no version branch (D77, D85.1, D85.3).
   What survives: the *axis strings* changed with no numeric invariant, so
   `group by main_goal` across versions silently splits one concept in two.
8. **A `jars` table** (one row per physical package, sessions re-pointed at
   the jar). Proposed by the architect and withdrawn: the argument used was
   D71's recover-later asymmetry, which the architect had criticized twice
   in the same session. It holds only when capture is genuinely free, and a
   new table plus RLS plus an FK migration is not free. Rejected with
   grounds in `coa-retention-and-possession.md` D89.
9. **An "intake" question and a binary "anything else in the mix?" flag.**
   Both proposed before reading the lexicon. `CO_CONSUMPTION` already does
   the second one better. Withdrawn.
10. **"Upload the PDF from the Edge Function at parse time."** `follow-ups.md`
    already banked the correct design: **save time, not parse time** -- a
    rejected or abandoned parse must not leave orphan files.

## Document defects found by reading (not by grep)

- **`session-entries-schema.md` status line is false.** It reads "no
  migration applied yet." The live database has every D77 column plus the
  D85 `main_goal` rename. This is exactly the failure `CLAUDE.md`'s
  status-line rule was added for after `44872df`.
- **D86.6 corrected one false premise in D86 and missed a second.** D86.1's
  grounds cite "the banked ladder-drop / pill-tap unification pass" and
  "collides with drag initiation on the ladder." D80 removed the drag four
  days before D86 was written. The erratum caught the panels-layout premise
  and left this one. It does not change D86's outcome; it is a live false
  sentence in a ratified doc.

## Data defects found (live, unfixed)

- Three `coas` rows are one document: `Animal House / RAINBOW RUNTZ /
  S01-RARU`, `total_thc` 22.7326 and `total_terpenes` 1.53 identical to four
  decimals, created 07-17, 07-22, 07-25.
- `brand = ''` (empty string, not null) on the Kaycha Cosmic Cereal row.
  ND != 0 violated at the string level. It will render as " - Cosmic Cereal"
  under D81, and D88's natural key depends on how absence is represented.
- `tested_on` null on all five rows, though both labs print a test date.
  Parser gap or extract-then-drop -- unresolvable without the PDFs, which is
  itself an argument for D87.
- `pdf_url` null on all five.
- `coas` has **no unique constraint beyond the primary key** -- nothing at
  the database level prevents duplicate ingest.
- `coas` carries a single `ALL` policy (`coas_all_own`), so it is
  client-updatable and client-deletable, unlike `session_entries`. Intended,
  but note the asymmetry before assuming append-only semantics anywhere.

## Ratified decisions (operator, in chat, 2026-07-26)

Only the first has landed in a document. **The rest exist nowhere but this
handoff.**

**Landed in `40df989`:** D87 retention, D88 dedupe, D89 possession count,
D90 retirement events, D91 favorite. Grounds are in the doc.

**Not yet documented:**

- **D85.3 reversed, scoped.** The 195 test-phase `session_entries` rows were
  deleted. Grounds: D85.3 retired "vocabularies revise freely" because 135+
  recorded rows made revision consequential; those rows were device-gate
  artifacts representing zero real sessions, so the rule was protecting
  nothing while imposing a permanent version-branched read layer on every
  future analysis. **D85.3 stands for every row recorded from here forward.**
  Executed via MCP with explicit operator authorization; verified 0.
- **The survey cuts to two screens.** Screen 1: the five `RUNGS`,
  tap-is-the-save, no Skip, Close cancels, glossary trigger showing the five
  rung definitions. Screen 2: product line, optional free-text note, Close.
  Two taps minimum. Cut entirely: `ENERGY`, `ENVIRONMENT`, `MAIN_GOAL`,
  `FITS`, `PHYSICAL_STATE`, `CO_CONSUMPTION`. Operator verbatim on the
  middle screens: "the rest are garbage."
- **`notes` is a new nullable column** -- the survey cut's only schema
  addition.
- **`LEXICON_VERSION` -> 4** with the cut, because the version must now mark
  the *field set*, not just the strings. The hidden 5/4/3/2/1 mapping is
  untouched, so cross-version averaging stays valid and no recompute is
  triggered.
- **Tripwire, named:** `CO_CONSUMPTION` returns unchanged, as one screen, if
  free-text notes start showing confounds worth filtering on.
- **The handbook's goal sentence is wrong and the fix is not applied.**
  `CLAUDE.md` line 3 still says "learns a person's terpene preferences."
  Ratified replacement: chemistry, cannabinoids *and* terpenes. Rejected in
  the same pass: "strain preferences" -- strain names are chemically
  incoherent across growers, the ingestion unit is a per-lot COA, and
  learning at strain level discards the resolution the data has. Strain is
  the user's handle for shopping; chemistry is the model. Different layers.

## Open items

**Runnable now**

- **The survey cut design doc.** Not drafted. Supersedes D71-D76, D78, D82,
  D82.1 as surfaces and retires 22 of D86's 27 glossary entries (only the
  `ladder` group survives). Amends **skeleton item 4** to empty. Skeleton
  items do not revise without their own ratification pass -- say so in the
  doc rather than sliding it through.
- **The `CLAUDE.md` goal-sentence amendment.** One-line `docs:` commit.
- **Implementation slices 2-6 of `coa-retention-and-possession.md`**, in the
  order given there. Slice 2 (schema) is the gate for everything after.

**Blocked**

- **The user dashboard / preference summary.** Not blocked on engineering --
  blocked on the operator being a user. Four COAs and zero sessions means
  nothing to summarize, and a summary at low n either says nothing or
  violates personal-empirical.
- **Store-inventory matching against favorites.** Structurally blocked:
  favorites are keyed on chemistry, store menus publish brand and strain
  name and THC%. No consumer channel publishes per-lot terpene data. Dutchie+
  and Jane Roots are B2B; Confident LIMS is quote-priced and account-scoped.
  The honest version is names as a coarse prefilter, chemistry as the
  adjudicator, never "you'll like this."

**Banked**

- A third retirement reason separating "chose to stop" from "no longer had
  it." Currently a spilled or spoiled package records as `Gave up on it` and
  reads as a preference verdict. Operator-accepted at n=1.
- Pairwise comparison at depletion ("better than the last jar you finished")
  as a tie-breaker for a top-heavy absolute scale. The reasoning stands on
  its own; **it has zero empirical support** -- the apparent supporting data
  was gate artifacts.
- Product photos / brand logos / user tags. Native-module scope: camera or
  picker triggers the EAS-rebuild split rule. The COA retention slices do
  NOT trigger it, which is why they are cheaper than they look.
- `never_again` -- still unimplemented. `product-metaphor.md` discipline 3
  defines it as a display override to the darkest band with the honest
  average intact underneath. **Distinct from `favorite = false`**; do not
  collapse them.
- The three duplicate `RAINBOW RUNTZ` rows: delete now, or let the dedupe
  slice absorb them.
- `ingest-coa` returns HTTP 200 with an empty shell on an unknown lab
  (`follow-ups.md`). Still unanswered, still gating the confirm/edit slice.
- Terpene whitelist silently drops unrecognized analytes (`follow-ups.md`).
  Direct no-fabrication concern.
- Grant tightening: `anon` holds ALL privileges on both views. Latent, not
  live. Already banked by the D85 plan.

## Working rhythm -- what changed this session

**The architect now has read-only Supabase MCP access and used it.** Roughly
a dozen read-only SELECTs replaced pasted output. One destructive statement
was run (the `session_entries` delete) with explicit operator authorization
requested and given first. Standing posture: **reads freely, writes never
without explicit per-statement authorization, and `apply_migration` stays
operator-territory** -- `CLAUDE.md`'s credentialed-command rule is about who
applies migrations, and MCP does not change that.

This does not extend to the repo. HEAD, worktree state, test counts, and
warning counts still arrive only through the operator.

Also: the operator did not read `coa-retention-and-possession.md` before
committing it. Design docs carry architect inferences that no criterion can
catch, and `handoff-specs.md` is explicit that the claim check is a human
reading the diff. Worth restoring.

## Entry point

**Draft the survey-cut design doc.** It is the largest undocumented decision
from this session and the one most likely to be re-litigated or half-
remembered, because it reverses eight days of ratified work across two
documents and amends a skeleton item. Everything else -- the schema slices,
the goal-sentence fix, the dashboard -- is either downstream of it or
independent of it. Write it, land it as `docs:`, then run the schema slice
from `coa-retention-and-possession.md`.

Then stop designing the survey and go log real sessions with it. Three
survey restructures in eight days were each ratified in good faith and each
refuted by the next look, and the refuting instrument was never a design
argument -- it was the operator touching the app. A fourth pass from the same
standing position will fail the same way.
