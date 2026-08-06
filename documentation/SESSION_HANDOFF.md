# Session handoff -- 2026-08-05 second

The repo is authoritative over this document. This session's own
ledger, and it is long: the architect fabricated an eighth
character onto a seven-character sha and wrote it into a prompt
precondition; claimed two isomer names would collide with an
existing canon entry and was refuted by executing the key function;
predicted the operator's typecheck would show the fresh-checkout
error after reading the line that says it will not; and shipped a
prompt whose code differed from the code it had tested by one
import specifier, caught only by the blob-hash channel. Eight in
one session, five self-caught before shipping. Begin with a
read-only Phase A audit.

## Start here (Phase A, read-only)

- HEAD's parent is 1f3ee76 (feat: canonical names for seven
  analytes). Predicted subject of the handoff commit itself:
  "docs: session handoff 2026-08-05 second -- GA parser arc shipped
  end to end". Sync 0 0 after the operator's push. If HEAD is
  neither, work continued past this handoff -- reconcile first.
- git status --porcelain: exactly seven ?? reference/handoff/
  0N-screens.png lines (N=1..7), the standing noise.
- Migrations: 17 on disk by name-form count. No migration this
  session; the arc was pure logic.
- npm test -> 77 passed, up from 52. npx expo lint -> 1 error 0
  warnings, template file only, exit 1.
- npx tsc --noEmit -> 0 IN THE OPERATOR'S WORKTREE ONLY. On any
  fresh checkout it is 1 error, exit 2 (TS2882, @/global.css),
  architect-observed again this session on a clean clone. Read that
  sentence before predicting either value: the architect wrote the
  fresh-checkout number into a prompt aimed at the operator's
  machine and the implementer refuted it. Banked; not a regression.
- tsc does not cover the parsers at all. tsconfig.json excludes
  supabase/functions/** outright, so no per-lab parser has ever
  been typechecked by npx tsc --noEmit; parser types are checked by
  ts-jest inside npm test. Implementer's finding, verified. Do not
  treat a tsc pass as evidence about parser code.
- DB via MCP, observed at write time: coas 10, session_entries 59
  raw / 12 current, tombstoned chains 14, retirements 7, storage
  objects 7, anon grants in public 0, green-analytics COAs 1,
  analyte rows with pct = 0 across both panels 0.
- The installed dev-client binary is the 2026-08-03 EAS build from
  dbfe1cc. It ran the whole device gate this session unchanged. No
  new build is owed; this arc added no native module.
If any of these do not match, the repo wins -- re-baseline.

## What shipped (newest first, five commits, plus this handoff)

- 1f3ee76 feat: canonical names for seven analytes (D125)
- 949efb6 docs: amend green analytics parser status line
- 9ef88a6 feat: green analytics parser (D122-D125)
- b11ed96 docs: green analytics parser design (D122-D125)
- 1e9dd4c data: green analytics gelato 33 COA fixture

## The arcs

**The Green Analytics parser shipped end to end, and the jar that
motivated it is on the shelf.** A real Aeterna jar had been
unreadable since the QR arc: it cleared every acquisition layer and
landed in the empty-parse guard. This session closed that loop --
fixture, design, parser, deploy, device gate, DB read-back. The
format diverges structurally from both existing shapes and that is
the whole reason it needed its own module: Kaycha and DRS transpose
their *analyte tables* while keeping header fields beside their
labels; Green Analytics does the opposite. Its analyte tables are
the cleanest in the corpus, one row per analyte in reading order,
while the header block is transposed as a whole -- every field
value in one run, every field label in a separate run later, no
adjacency between a label and the value it names. The sample-name
label token occurs exactly once in the document, nowhere near its
value. Every header regex in both existing parsers anchors on a
preceding label, so none of them can reach. Header fields are
therefore recovered positionally, each anchored on both sides, and
tight rather than permissive: an unpopulated slot matches nothing
and yields null instead of capturing a neighbour and storing it as
a value the document never stated. Analyte rows anchor on the
constant reporting-limit column, with each table scoped to its own
section first -- unscoped, a correctly shaped row pattern also
matches the pesticides and water-activity tables, which share the
numeric column layout. Absence is a two-token marker captured as
one unit so the shared percentage helper maps it to null.

**The gate was run per step, with a database read-back, and the
invariant held at the storage layer.** Five separate observations,
each pasted or screenshotted: deploy manifest, shelf load, confirm
screen, ND expansion, save. The stored row carries 32 terpene rows
(24 null), 13 cannabinoid rows (9 null), 10 safety rows, total CBD
null -- and exactly zero rows with pct = 0 across both panels. Not
one ND became a zero anywhere along parser -> Edge Function ->
confirm screen -> database. One unplanned piece of evidence turned
out to be the strongest: the stored pdf_sha256 equals the sha256 of
the committed fixture, so the file the phone fetched over the QR
path is byte-identical to the file the test suite parses. The
fixture is not a stand-in for the real artifact; it is the real
artifact.

**A shared-normalization change is a two-part change, and the
architect learned that the hard way.** The canonical-name commit
landed and was pushed before anyone asked where it takes effect. It
takes effect in two places, neither of them automatic: the
deployed Edge Function (bundled at deploy time, so a commit is not
live until the operator deploys) and future imports only (analyte
names are written into coa_terpenes at insert, so rows already
stored keep the spelling they were written with). Both gaps were
found after the push, by the architect, late. The deploy was run;
the four odd names on the existing Gelato row were left alone by
operator decision.

## Refuted hypotheses / corrections

Architect's, in order:
1. Guessed `chain_id` and `entry_type` as column names in the first
   Phase A DB query; the schema refuted both (`session_id`, and a
   separate `coa_retirements` table). Read information_schema
   before querying next time.
2. Wrote `2fd73659` into a prompt precondition. The observed sha was
   the seven-character `2fd7365`; the eighth character was
   fabricated and resolves to no object. An abbreviated sha typed by
   the architect is a hand-count with extra steps -- paste the full
   40.
3. Claimed cis- and trans-Nerolidol would collide with the existing
   bare nerolidol canon entry and change what Kaycha and DRS already
   produce. Executed terpeneKey: three distinct keys, no collision,
   no cross-lab consequence. A mechanism asserted without running
   it. There is now a test asserting the distinctness so the belief
   cannot be re-derived.
4. Predicted Cosmic Cereal and Permanent Shade would parse their
   strains upper case because Rainbow Runtz does. Both come back
   correctly cased; only Rainbow Runtz is shouty.
5. Wrote the fresh-checkout tsc expectation into a prompt aimed at
   the operator's worktree, contradicting the previous handoff's own
   line, which the architect had read that morning. The implementer
   refuted it and then concluded the handoff line was stale -- it is
   not, it is precisely right, and that second inference is the one
   that would have propagated damage if believed.
6. Shipped a prompt whose parser code differed from the tested code
   by one unused import: the edit was made in the prompt text and
   never in the validated file. Caught by the blob-hash channel,
   isolated, re-tested, matched. Bytes-before-prompt means editing
   the artifact, not the prompt.
7. Predicted the confirm screen would show 32 terpene rows. It shows
   the detected ones with the rest behind a toggle -- 8 and 24 here.
   Corrected by reading the component before the operator looked,
   not after.
8. Pushed the canon commit without asking where it takes effect.
   See the arc above.

Implementer's catches, all unprompted and all correct:
- The fabricated sha, with a full resolution walk showing it named
  no object.
- tsconfig excludes supabase/functions/**, so the typecheck gate in
  a parser prompt was structurally incapable of gating the file the
  slice added.
- The design doc's status line went false the moment the feat commit
  landed, flagged against a prompt whose non-goals forbade touching
  that file. It reported instead of improvising; the amendment
  became 949efb6.
- The canonical-name test's input column is not evidence of the
  lab's printed form, since terpeneKey normalizes case and
  punctuation before lookup. True. The printed forms were verified
  separately by the architect against extracted fixture text; the
  test as shipped gates display form only.
- The commit body's claim about widening what the older parsers
  accept is reasoning about a code path, not an observation, and no
  fixture exercises it.

## Ratified decisions

- D122 Green Analytics gets its own parser module rather than an
  extension. Grounds: the transposed-header shape above, in
  green-analytics-parser.md.
- D123 header fields recovered positionally, tight not permissive.
  The batch slot was ratified in its structural form (anchored on
  the tracking identifiers and the two numeric fields, any
  alphanumeric token in the slot) over a shape-strict form that
  would hardcode a batch format observed exactly once.
- D124 constant-MRL row anchors, section-scoped before matching.
- D125 scope, and four things outside it. The canonical names were
  the one deferral that came back the same session.
- Strain: the representative-sample suffix is stripped, one exact
  literal only, never a general separator rule.
- Deploy-only was chosen over re-importing or SQL-correcting the
  Gelato row's four title-cased names. Cosmetic; corrected on any
  future re-import.

## Open items

**Runnable now: promote three things to CLAUDE.md.** All are
corrected-twice or worse. (a) The operator deploy step: a parser or
shared-normalization commit is not live until the operator runs the
CLI deploy for the ingest function, and that command exists nowhere
in the repo -- it bit twice in one session, once nearly before the
device gate and once entirely after a shared-code commit. It
belongs in the Ingestion section. (b) Full-length shas in prompt
preconditions. (c) Bytes-before-prompt applies to the artifact, not
the prompt text -- an edit made only in a prompt is untested code.
Also over the bar from the previous session and still unpromoted:
the blob-hash ratification check.

**Blocked:** nothing.

**Banked (new this session, ahead of the carried list):** Rainbow
Runtz parses its strain as upper case, now locked in by an
assertion that records the defect rather than hiding it -- fixing
it touches parseKaycha and deserves its own arc. The Gelato row's
four title-cased analyte names on COA 07f87c10. Analyte names are
frozen at insert, so every future canon change reaches new imports
only -- whether to canonicalize at read time instead is a real
design question, not a bug. A stronger Green Analytics test
asserting the full panel against the printed panel, which wants a
second Green Analytics fixture so a per-document quirk can be told
from a lab convention.
Carried, unchanged: stale hasher comment in add-to-shelf-modal.tsx;
fresh-checkout tsc dependency on generated typings; DRS Testing
walk detail; support-copy reword window; the seven reference
screenshots (one shows the email); "Expo Starter" web tab chrome;
empty-shelf double statement; authenticated TRUNCATE; off-shelf
log; preference_summary view; never_again; retirement last-log
step; third retirement reason; Android; app-code test wiring;
un-retire; 5-point scale resolution; user-authored custom tags;
EXPLAINERS.closing line 3; the 220ms bloom window;
Alert-under-external-dismissal; anon-grants durable ACL;
commit-body/doc phrase collisions; the download-event prong,
unexercised because no known provider produces it.

## Working rhythm

Unchanged from CLAUDE.md and handoff-specs 4. Two live
observations. The three-deep commit check (implementer report,
operator cat -A, architect blob hash against ratified bytes) caught
its first real divergence this session -- tested bytes against
shipped bytes -- having caught nothing the session before. It is
cheap and it is not ceremonial. And the worktree-only rule is
functioning as a channel rather than a restriction: five of the
implementer's unprompted flags this session were things outside its
assigned scope that it reported instead of acting on, and two of
them changed what shipped.

## Entry point

The CLAUDE.md promotion pass (Runnable above). Three rules, all
earned by failures recorded in this session's ledger, and one
carried from the previous session. It is a Tier 1 pass, the bytes
are architect-authored, and it should take one prompt. Doing it
first means the next product arc starts with the deploy step
written down rather than remembered.

The product finding handoff-specs 4.7 asks for: this session
shipped two feat commits, one data commit, and two docs commits,
and the product moved in the way that matters -- a lab that could
not be read this morning is parsed, deployed, gated on device, and
stored with every absent analyte as null. The ratio is healthy.
After the promotion pass, the next arc is product again, and the
strongest candidate is the second Green Analytics fixture, because
every rule flagged as generalized-from-one-document stays that way
until a second document exists.
