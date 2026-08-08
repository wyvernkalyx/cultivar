# Green Analytics parser

Status: design ratified D122-D125, 2026-08-05; implemented 9ef88a6,
gate observed at 69 tests passing.
This line is amended by the commit that changes its truth.

The first parser request driven by lived usage rather than fixture
coverage. A real jar on the shelf -- Aeterna Cannabis Gelato 33,
tested by Green Analytics NY, LLC -- cleared every acquisition
layer at the QR import gate (qr-import.md, 2026-08-05 gate
observations) and landed in the empty-parse guard, because no
parser for this lab exists. The fixture is committed at
`supabase/functions/_shared/coa/__fixtures__/gelato-33.pdf`.

Every observation below was executed against the text the repo's
own extractor produces from that fixture, on one document. One
document is one document: where a rule is generalized from a single
observation it is flagged as such, and the flag is not decoration.

## D122 -- A third parser, not an extension of an existing one

Green Analytics is added as a fourth `SourceLab` member alongside
the two live parsers and the unknown shell. It does not extend
either existing parser.

Grounds. The two shapes the codebase already handles both transpose
their *analyte tables* while keeping header fields adjacent to their
labels. This document does the opposite. Its analyte tables are the
cleanest in the corpus -- one row per analyte, in reading order --
while its header block is transposed as a whole: every field value
is emitted in one run, and every field label in a separate run
later, with no adjacency between a label and the value it names.
The label token for the sample name occurs exactly once in the
document, in the label run, nowhere near the value. Every
header-field regex in both existing parsers anchors on a label
immediately preceding its value. None of them can work here, and
loosening them to reach across the gap would put the existing
parsers at risk for no gain.

Identification anchors on the lab's printed name, which occurs five
times and contains no ligature-prone letter pair, so it survives
extraction cleanly. No new schema: `coas.source_lab` is bare text
with no check constraint (observed over MCP, 2026-08-05), so the
new member is a TypeScript-only change.

## D123 -- Header fields: positional capture, fail-closed

With no label adjacency, header values are recovered by their
position in the value run, each anchored on both sides by
structurally stable neighbours.

- **Strain.** Captured as printed, then one exact literal suffix is
  removed when it is present in full: the trailing separator plus
  the words the lab appends to mark a representative sample. Only
  that exact literal, never a general "drop anything after a
  separator" rule -- strain names contain separators, and a greedy
  rule would eat them. Generalized from one document; a future
  Green Analytics COA that appends different words keeps them, and
  the operator edits on the confirm screen.
- **Batch.** No adjacent label, so it is recovered from its slot
  between the package identifier and the batch size, and the slot
  pattern requires the batch-shaped token to be present. Verified:
  one hit on the fixture, correct value. The pattern is deliberately
  tight rather than permissive. A permissive slot capture would
  return the batch *size* or a tracking identifier when a field is
  absent, and store it as a batch number -- a value the document
  never stated. Tight fails to null instead, and null is what
  absence means (D97).
- **Brand.** The client of record, captured between the report date
  and the sampling location. This is the party whose product it is,
  which is what brand means everywhere else in the app; the lab is
  carried separately and is not the brand.
- **Dates.** Both are date-shaped captures normalized through the
  shared US-date helper. Sampling carries a trailing time, which the
  date-shaped capture ignores, matching how the existing parsers
  handle the same nuisance.

Absent or unmatched is null in every case, never an empty string and
never a substituted neighbour.

## D124 -- Analyte tables: constant-MRL row anchors, section-scoped

Both analyte tables are clean rows and both carry a reporting-limit
column whose value is constant within a table. That column is the
row anchor, which is the same technique the DRS parser already uses
with its own constants.

Two constraints, both observed rather than assumed:

- **The terpene table must be scoped to its own section before rows
  are matched.** Run unscoped over the whole document, a row pattern
  of the right shape also matches rows in the pesticides and
  water-activity tables, which share the numeric column layout.
  Scoped between the terpene section's method line and that
  section's reporting-limit footnote, it returns exactly the panel
  the lab printed, including the two multi-word analyte names.
- **Absence is a two-token marker**, not a bare word: the
  less-than sign and the reporting-limit abbreviation, separated by
  a space. The row pattern must capture both tokens as one unit, or
  the split leaves a bare numeral behind and the row after it
  shifts. The shared percentage helper already maps any capture
  opening with a less-than sign to null, so the invariant is
  satisfied once the capture is correct.

Potency and terpene totals are captured from the summary rows,
each anchored on the bracketed formula label the document prints
beside it. The document is internally consistent: the printed total
potency equals the value its own printed formula computes from the
same table's rows, so a fault in this path will be visible rather
than plausible.

## D125 -- Scope, and what is deliberately not in it

In scope for the parser slice: a new per-lab parser module,
identification, dispatch, the new source-lab member, and fixture
test cases covering identification, both totals, batch, brand,
strain, both dates, the full terpene panel length, a reported
value, an unreported value asserted null, and a safety row.

Not in scope, each for its own reason:

- **Canonical display names for the seven analyte names this panel
  carries that the shared normalizer has no entry for.** They parse,
  they carry their values, and they display title-cased; nothing is
  lost. Adding entries changes shared normalization that every
  parser routes through, so it is its own commit after this slice.
  Banked, not forgotten. Note for the record: an earlier claim in
  chat that two of these names would collide with an existing entry
  was refuted by executing the key function -- the keys are
  distinct, and there is no cross-lab consequence.
- **Any client change.** The two components that surface the source
  lab treat it as an opaque string.
- **Any schema or migration work.** See D122.
- **Generalizing from one document.** A second Green Analytics COA
  is the only thing that can promote the flagged rules above from
  observed-once to observed.

## Gate

Pure-logic slice: the gate is the test suite passing, pasted raw.
Unit tests are evidence here precisely because nothing in this arc
is UI-visible.

## D136 -- The Full Compliance Test form: labeled-field fallbacks

Ratified 2026-08-08. GA prints at least two form variants. D122-D125
were generalized from the Adult-Use Product form (METRC 1A4-prefixed
tracking tags; batch recovered positionally between them; brand and
report date recovered from the "Sample Result" run). A third GA
document (batch WF00350, fixtured this slice) is the Full Compliance
Test form: no 1A4 tag anywhere in its extraction, and the same three
fields printed with adjacent labels instead:

    Batch Lot ID: WF00350 Batch Size:
    Date Reported: 12/11/2024 Client Name: NYHO LABS LLC Sampling Location:

Observed via the repo's own extractText on the document bytes,
2026-08-08. Chemistry, totals, sampledDate, and safety already parse
on this form; only batch, brand, and testedDate return null.

The rule: each of the three fields tries its D123 positional pattern
first, then a labeled fallback anchored on both sides, then null.

- batch: label "Batch Lot ID:", right-bounded by "Batch Size:".
- brand: label "Client Name:", right-bounded by "Sampling Location:".
  Client-of-record doctrine unchanged from D123.
- testedDate: label "Date Reported:", right-bounded by "Client Name:".
  Report-date-is-tested-date doctrine unchanged from D123.

Fail-closed posture unchanged: a form matching neither pattern set
stores null, never a neighbouring field.

Amendment, 2026-08-08, build refutation: the disjointness this
section originally claimed ("the labels do not occur on the
Adult-Use form") is false. The Adult-Use form's transposed header
prints the same labels as a contiguous empty run ("Batch Lot ID:
Batch Size: Serving Size (g): ..."), observed on the gelato-33
fixture's extraction. Fallback safety therefore rests on two facts,
both pinned by test: the positional capture is tried first, and
each labeled fallback requires a value-shaped token between
two-sided anchors, which the empty label run cannot satisfy. The
1A4 half of the claim held: no tracking tag occurs on the
compliance form's extraction.

Corpus note, not a claim about cause: the Orangutang Cookies row
stores batch and tested_on null with brand captured. No fixture
exists for that document; whether it is a third variant or an
unpopulated slot on a known form is unobserved. The banked
Orangutang fixture item stands.
