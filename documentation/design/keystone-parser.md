# Keystone State Testing Parser

Status: drafted 2026-08-28; D162 rulings a-d operator-ratified 2026-08-28
(chat: "1. ratified. 2. ratified. 3. ratified. 4. ratified."), ruling e
ratified same day (chat: "(b) extend the category list"). Amended by the
commit that changes its truth. Import-coverage arc; pattern of
smithers-parser.md.

Lived demand: Keystone State Testing of New York is the second of the two
labs behind every "not compatible" COA on the vendor's archive page
(smithers-parser.md names the pair). Nine of the operator's real Keystone
documents drove development; five are in evidence this session.

## D162 -- The Keystone arm, developed against real documents

The parser was written and greened architect-side (2026-08-27 session)
against nine real documents -- flower, prerolls, blunts, infused to
47.83% THC, one all-ND terpene panel -- then re-executed 2026-08-28
against five uploaded originals after ruling e. Every expected value in
slice 3's tests was executed, never predicted.

Layout: extraction fuses columns two ways. Terpene rows fuse the result
with the CAS number ("0.2199123-35-3" reads two valid ways by shape);
every section's row number rides the tail of the previous token, at
template-dependent positions ("Results based on dry weight 3" lands
mid-table and moves between documents).

Five ratified calls:

a. CAS-table disambiguation. Each analyte's CAS constant is the
   deterministic splitter for the fused value+CAS token, and the
   20-entry table doubles as the documentation of Keystone's fixed
   terpene panel. Row matching anchors on name + CAS + the 0.1000 LOQ
   column, so the wandering row-number artifact cannot break it.

b. Positional terpene-total anchor. No terpene-total label survives
   extraction; the icon-strip value is taken by template position --
   CBD's mg/g before it, moisture after, the PASS strip terminating.
   THIS IS THE FRAGILEST THING IN THE PARSER: a template revision that
   reorders the icon strip silently breaks it, and no label exists to
   detect the shift. Hardest case, executed: All Gas .5g Preroll
   (AG081009PR) prints "0.000 %" -- a PRINTED zero, stored as total 0
   with all 20 analytes null. No invariant conflict: the zero is the
   lab's printed statement; the analytes print ND and stay null.

c. Strain carries the printed product title, verbatim (D161a
   inherited). Keystone documents have no labelled strain field; the
   title is the closest printed statement of identity, editable at
   confirm. No trimming to a guessed strain word (D97).

d. Keystone's own footnote governs date labels: "Date Sampled = date
   and time sample was collected from client" -- their labels invert
   the common reading. Date Sampled -> sampledDate; Date Released ->
   testedDate. The footnote, printed on every page, is the authority.

e. Safety sections are matched by printed-header variant groups
   (ruled "b", 2026-08-28). Keystone varies headers by product
   template: flower prints "Moisture by Analyzer" / "Water Activity by
   Meter"; jars and prerolls print "Moisture LWG" / bare "Water
   Activity"; infused prerolls add "Residual Solvents by HS-GC-MS".
   Eight canonical groups, most-specific variant first, first match
   wins and is stored verbatim, one row per group. Grounds: the flat
   7-name list dropped printed Pass results (5/7 on jars, 4/7 on the
   infused preroll, observed 2026-08-28); dropping printed lab results
   is the wrong default. The bare "Water Activity" variant is safe
   because the page-1 icon strip prints only uppercase PASS, which the
   mixed-case status capture cannot match. Absent sections stay absent:
   Coconut Cream prints no Foreign Matter section and gets no row.

## Executed values (the tests pin these)

Acapulco Gold 1/4 Oz Pouch DP121815: thc 20.98, cbd 0.05767, terp 0.42,
strain verbatim title, sampled 2025-04-28, tested 2025-05-06, 13
cannabinoids (7 detected), 20-panel terpenes (2 detected), dominant
Myrcene 0.2199, 7 safety Pass under the flower headers. All Gas .5g
Preroll AG081009PR: thc 24.25, terp total 0 (printed zero), 0 non-null
terpenes, dominant null, 7 safety Pass under the LWG/bare-WA variants.
Coconut Cream 1g Infused Preroll CM1218161GPRD: thc 47.83, terp 1.22, 4
non-null terpenes, dominant Caryophyllene, 7 safety Pass including
Residual Solvents, Foreign Matter correctly absent. Also executed, not
fixtures: All Gas 3.5g Jar AG081009 (terp 1.598, nn 6) and All Gas 7g
Glass Jar AG1126I2Q (terp 1.71, nn 6, dominant Limonene, CBDV ND).

identifyLab anchor: /Keystone\s+State\s+Testing/i -- observed 16 hits on
each of three Keystone documents, 0 on all ten repo fixtures
(cross-fixture negative case, D128 pattern).

## Slices

1. This document (Tier 1).
2. data: fixtures acapulco-gold.pdf, all-gas-preroll.pdf,
   coconut-cream.pdf (operator places architect-delivered carriers,
   hash-pinned; bytes identical to the uploaded originals).
3. feat (Tier 2): parseKeystone.ts (new, sha256 0242f1a6... pinned in
   the slice-3 prompt); additive edits to types.ts (SourceLab union),
   identifyLab.ts, parseCoa.ts; Deno tests mirroring the parseSmithers
   suite. Gates: full deno test suite green on the implementer's
   machine; operator deploys ingest-coa before the device gate; device
   gate: import one Keystone COA on the phone, confirm screen
   populated, saved row read back over MCP.

## Non-goals

No change to any existing parser's output. No re-parse or backfill of
stored COAs. No strain-word extraction heuristics. No shared-vocabulary
edits: all 20 panel names already resolve through the terpene map. No
OCR path (Caramel Cream is a raster scan; its own banked arc).
