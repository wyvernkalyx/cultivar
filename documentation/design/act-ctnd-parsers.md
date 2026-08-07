# ACT Laboratories and CTND parsers -- Design

Status: design ratified D127-D130, 2026-08-06. Fixtures committed
at bfc6ae4. Canon entries (D129) shipped at aca0209; both parsers
implemented (slices c and d). This line is amended by the commit
that changes its truth.

Two real jars failed to import on 2026-08-06. Neither failure was
in acquisition: the QR walk, detection, download, and hash all
worked, and both PDFs reached the parse layer. Both landed in the
empty-parse guard because no parser exists for their labs. This is
the second and third lived-demand parser request, after Green
Analytics.

Fixtures, committed at bfc6ae4:
- `supabase/functions/_shared/coa/__fixtures__/hooch.pdf` --
  Alchemy Pure Hooch 3.5g, ACT Laboratories (NY).
- `supabase/functions/_shared/coa/__fixtures__/stank-breath.pdf` --
  Sapphire Farms Stank Breath 28g, Certified Testing and Data
  (CTND).

Evidence posture. Every claim below marked "observed" was produced
by the repo's own extractor and pasted by the implementer
(observation run, 2026-08-06). Claims marked "predicted" were not:
they come from the architect reading the PDFs through a different
extractor, or from a scratch reimplementation of a repo function,
and each is a gate case rather than a fact. The distinction is not
decoration -- on this arc the architect's non-repo extractor
already produced one wrong claim about ligature loss, and the
observation run refuted it.

## D127 -- Two parsers, added as two SourceLab members

`act` and `ctnd` join the existing members. Neither extends an
existing parser and neither extends the other.

Grounds. Observed: both documents place header values immediately
after their labels (`Batch#: AP-FE-GH0526`, `Cultivar(s): Stank
Breath`, `Date Sampled: 05/21/2026`). This is the adjacency Green
Analytics lacked, so D123's positional-slot machinery is not
needed here and must not be copied in. Beyond that shared property
the two documents differ in nearly every particular -- analyte
name forms, table layout, and which absence marker dominates --
so one parser serving both would be a conditional tangle.

No schema work: `coas.source_lab` is bare text with no check
constraint (D122), so the members are a TypeScript-only change.

## D128 -- Identification anchors: `ACT Laboratories` and `CTND`

Observed counts, repo extractor, both fixtures:

- `ACT Laboratories`: 24 in hooch, 0 in stank-breath.
- `CTND`: 36 in stank-breath, 0 in hooch.
- `Kaycha`, `Green Analytics`, `DRS Testing`: 0 in both.

Both anchors are therefore discriminating against each other and
against all three live parsers. Neither contains a ligature-prone
letter pair.

Rejected, with grounds: `Certified Testing and Data` as the CTND
anchor. It survives extraction intact on this document (observed:
`Certified` 6 hits), so the architect's prediction that it would
mangle is refuted. But one ligature loss did occur nearby --
`Regulatory Compliance Testing` extracts as `Regulatory Compliance
Tesng` -- which shows the glyph substitution is live in this
document and is not predictable per-occurrence. `CTND` has no such
exposure and more hits. `Certi` is unusable in either direction:
in hooch its 12 hits are all `Certificate`, in stank-breath its 6
are all `Certified`.

Identification is checked before any per-lab pattern runs, so a
mis-identification is a wrong parser, not a wrong value. Both
anchors are gated with a cross-fixture negative case: each
fixture must identify as its own lab and as no other.

## D129 -- Canon entries for ACT's analyte names, as its own slice

Predicted, and the first gate case of the parser arc: 8 of the 17
terpene names ACT prints do not resolve through the shared
canonical-name path, while 11 of 11 CTND names do. The cause is
that ACT prints ASCII single-letter prefixes (`b-Caryophyllene`,
`a-Humulene`, `trans-b-Farnesene`) where every other lab in the
corpus prints Greek letters or the full word, and the shared key
function folds Greek only.

Consequence if unaddressed, and the reason this is not deferred:
an ACT jar's Caryophyllene would display title-cased as a distinct
name and would not merge with the same compound on a Kaycha or
CTND jar. The same compound would occupy two names in the data,
and cross-COA comparison -- the product's entire purpose -- would
fragment silently, with no error surface anywhere.

Ruling: **add explicit canonical entries; do not extend the key
function.** Folding a leading ASCII `b-` or `a-` into beta/alpha
changes the shared path every parser routes through, and a
single-letter prefix is too weak a signal to fold blindly. Explicit
entries are localized, reviewable, and fail visibly.

Entries to add, each mapping to a canonical value the file already
uses, except the last:

  b-Caryophyllene    -> Caryophyllene
  a-Humulene         -> Humulene
  b-Myrcene          -> Myrcene
  b-Pinene           -> beta-Pinene
  a-Pinene           -> alpha-Pinene
  a-Bisabolol        -> Bisabolol
  trans-b-Farnesene  -> Farnesene
  trans-b-Ocimene    -> Ocimene
  Borneol            -> Borneol   (new canonical value; no entry
                                   exists in any form)

The key forms above are predicted from a scratch reimplementation
of the key function, not from calling it. The implementer computes
each key by calling the real exported function and reports the
values before adding entries; a divergence is a STOP, not a
silent correction. Existing entries are not edited, and no
existing key is removed.

This lands as its own commit before either parser, on D125's
precedent: shared normalization is changed separately from the
parser that motivated it.

## D130 -- Bind to the detail tables, never the cover panel

Both documents print a rounded cover summary and a full-precision
detail table for the same values. Observed on the CTND cover:
total terpenes `2.78%`; the detail table prints more digits
(predicted: `2.7841`, gate case). Observed on the ACT cover: the
same rounding split, and the cover is additionally
value-before-label (`ND Total CBD 976.98 mg/unit Total THC`),
inverting the adjacency the rest of the document uses.

Rule: every stored numeric comes from the detail table. The cover
panel is never a capture site, even where it is easier to match.

Two hazards, both observed:

- **Repeated total labels.** `Total THC` occurs 3 times in hooch
  and 9 times in stank-breath; `Total CBD` likewise. In CTND the
  count is inflated by two causes at once: the cannabinoid table
  is printed as two side-by-side columns whose totals rows both
  extract, and the boilerplate Definitions paragraph prints
  `Total THC = THCa*0.877 + ...`, which a naive label pattern
  matches. Capture must be scoped to the detail table's own span
  and must not match the formula form.
- **Absence markers differ by lab and are both already handled.**
  CTND prints `< LOQ` where ACT prints `ND` (counted across whole
  documents: 163 vs 4 in CTND, 4 vs 147 in ACT -- predicted, from
  the architect's non-repo extractor). Both map to null through
  the existing shared cell parser, which maps ND, NR, NT, N/A, and
  any capture opening with a less-than sign to null and never to
  zero. No new ruling: this invariant is already ratified in code.
  What the parsers must get right is capturing the two-token
  `< LOQ` marker as one unit, per D124's finding on the same
  problem.

## Non-goals

- No Edge Function, schema, migration, or client change.
- No acquisition work. The Drive-hosted COA that also appeared on
  2026-08-06 imported through the existing file-picker fallback;
  a WebView download amendment stays banked in qr-import.md.
- No generalizing from one document per lab. Every rule here is
  observed on exactly one COA from each lab and is flagged as such
  by this sentence; a second COA from either lab is the only thing
  that promotes them.
- No error-copy change. The confirm screen's unsupported-lab
  message reads as file-picker advice to a user holding a jar;
  that is a real defect, banked separately, and it is not a
  parser change.

## Slice plan

- (a) docs: this document.
- (b) feat: the canon entries of D129, with the real key function's
  output pasted first. Gate: the suite passing.
- (c) feat: the ACT parser -- module, identification, dispatch,
  member, fixture cases. Gate: the suite passing.
- (d) feat: the CTND parser, same shape. Gate: the suite passing.

Slices (b) through (d) are pure logic. The gate is the test suite
passing, pasted raw, plus for (c) and (d) the cross-fixture
identification negative case of D128. No device gate: nothing in
this arc is UI-visible until a real jar is imported, which is the
operator's own next import and not a ceremony.
