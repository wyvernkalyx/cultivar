# Session Handoff

Written 2026-07-26, after `111a39e` landed and pushed. Supersedes the version
committed at `210b516` earlier the same day, which said the survey-cut doc
was "not drafted" -- true when written, false within the hour.

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

- Branch `main`. `git rev-parse HEAD` -> `111a39e`
- `git log -1 --oneline` -> `docs: the survey cut (D92-D96)`
- `git log -1 --stat` -> `documentation/design/survey-cut.md`, 1 file changed,
  402 insertions
- Push output observed: `210b516..111a39e  main -> main`
- `git rev-list --count origin/main..main` -> `0`
- `select count(*) from session_entries;` -> **0**
- `select count(*) from coas;` -> **5**
- `select count(*) from storage.buckets;` -> **0**
- `src/lib/lexicon.ts`: `LEXICON_VERSION = 3`; six vocabulary arrays plus
  `GLOSSARY` with 27 entries. **Unchanged this session** -- no code moved,
  no migration applied. The app on the device still walks all eight survey
  phases and writes the D77 column set. The design is three commits ahead of
  the product.

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

- `111a39e` -- `docs:` the survey cut (D92-D96). Eight screens to two.
- `210b516` -- `docs:` session handoff (superseded by this file).
- `40df989` -- `docs:` COA retention, dedupe, and possession design (D87-D91).

All three are design only. **No schema was migrated and no code was
changed.** Whatever the docs now say, the running product is unchanged from
where it stood at `ce74453`.

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

**Landed in `111a39e`:** D92 two screens, D93 fact classes retire (amending
skeleton item 4 to empty), D94 columns dropped and `LEXICON_VERSION` -> 4,
D95 free-text notes, D96 glossary reduced to the ladder group. Grounds are in
the doc.

**Operator overrides recorded at authoring**, so they are not relitigated:

- **D94 reverses the architect's proposal.** The architect proposed leaving
  the six retired columns in place, on the grounds that dropping them forces
  a view drop-and-recreate -- D77's named live risk, where
  `security_invoker = true` gets silently forgotten. The operator ruled to
  drop: a column the schema carries but nothing writes misdescribes the
  product. The architect's reasoning is preserved in the doc as the ruled-over
  alternative; the risk is answered by a mandatory `reloptions`
  re-observation in the gate rather than by avoiding the migration.
- **Notes live on the closing screen**, not their own. Named cost: a keyboard
  on the terminal screen may fight the banked completion animation.
- **Notes write on Close**, not on blur. Named cost: a force-quit between
  typing and Close loses the note -- consistent with what D54 already accepts.

**Still not documented anywhere:**

- **D85.3 reversed, scoped.** The 195 test-phase `session_entries` rows were
  deleted. Grounds: D85.3 retired "vocabularies revise freely" because 135+
  recorded rows made revision consequential; those rows were device-gate
  artifacts representing zero real sessions, so the rule was protecting
  nothing while imposing a permanent version-branched read layer on every
  future analysis. **D85.3 stands for every row recorded from here forward.**
  Executed via MCP with explicit operator authorization; verified 0. It is
  recorded in `40df989`'s commit body and in
  `coa-retention-and-possession.md`'s baseline, but no D-number carries it.
- **The handbook's goal sentence is wrong and the fix is not applied.**
  `CLAUDE.md` line 3 still says "learns a person's terpene preferences."
  Ratified replacement: chemistry, cannabinoids *and* terpenes. Rejected in
  the same pass: "strain preferences" -- strain names are chemically
  incoherent across growers, the ingestion unit is a per-lot COA, and
  learning at strain level discards the resolution the data has. Strain is
  the user's handle for shopping; chemistry is the model. Different layers.

## Open items

**Runnable now**

- **Survey-cut slice 2 (schema).** The migration in `survey-cut.md`: drop
  `coa_session_stats`, drop `session_current`, add `notes`, drop the six
  retired columns, recreate both views, set `security_invoker = true` on
  both, restore grants to the pre-migration observed set. **Capture the
  grants before running it** -- there is otherwise nothing to match against.
  Implementer authors, operator applies. Gate: observed SQL, including the
  paired control that the nine surviving columns are still present.
- **Survey-cut slice 3 (client).** `lexicon.ts` to `LEXICON_VERSION = 4`,
  six arrays removed, `GLOSSARY` reduced to the ladder group;
  `session-ladder.tsx` down to two phases plus the note field. Lands in the
  same session as slice 2, device gate after both. No native module, so no
  new EAS build.
- **The `CLAUDE.md` goal-sentence amendment.** One-line `docs:` commit.
- **Slices 2-6 of `coa-retention-and-possession.md`**, in the order given
  there. Independent of the survey cut -- different tables, no ordering
  dependency between the two arcs.

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

Also: the operator did not read either design doc before committing it.
Design docs carry architect inferences that no criterion can catch, and
`handoff-specs.md` is explicit that the claim check is a human reading the
diff. Worth restoring, and it matters more now that the docs are what the
migration will be built against.

**Paste truncation happened twice this session**, both times losing the tail
of a command's output -- once dropping a field from
`git rev-list --left-right --count` so a two-number result read as one, and
once cutting a command block off before it ran. Both were caught only because
the expected shape was stated as a prediction first. The tail-check rule in
`CLAUDE.md` covers files; it applies to pasted command output with equal
force. **Prefer single-value commands with labelled `echo` output** over
multi-field ones when the result gates a decision.

## Entry point

**Run survey-cut slice 2, the schema migration.** Three design commits landed
this session and zero lines of product changed; the app on the device still
walks eight screens and writes six columns the design has retired. That gap
is the largest single risk in the repo right now, because every additional
design pass widens it.

The migration's one real hazard is named and must not be treated as
paperwork: dropping columns forces both views to be recreated, and that is
exactly where `security_invoker = true` gets silently lost, which would let
users read each other's rows. **Capture the view grants before running it,
and re-observe `reloptions` on both views after.** Then slice 3, then the
device gate.

Then stop designing the survey and go log real sessions with it. Four survey
restructures landed in nine days -- D79, D80, D82/D82.1, and D92-D96 -- each
ratified in good faith, each refuted by the next look, and the refuting
instrument was never a design argument. It was the operator touching the app.
A fifth pass from the same standing position will fail the same way. The cut
exists so the survey is cheap enough to actually use; using it is the whole
point.
