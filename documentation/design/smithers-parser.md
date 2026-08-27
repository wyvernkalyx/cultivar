# Smithers CTS Parser

Status: drafted 2026-08-25; D161 rulings a/b/c operator-ratified
2026-08-25 (chat: "verbatim / sum / add them"). Amended by the commit
that changes its truth. Import-coverage arc; pattern of
act-ctnd-parsers.md and green-analytics-parser.md.

Lived demand, same day: three of the operator's five uploaded Nanticoke
COAs -- both Amnesia Haze vape formats and the Blue Raspberry 2g AIO --
came back sourceLab 'unknown'. Smithers CTS New York LLC is one of two
labs (with Keystone State Testing) behind every "not compatible" COA on
the vendor's archive page.

## D161 -- The Smithers arm, developed against real documents

The parser was written and made green architect-side against the three
uploaded PDFs before any implementer prompt existed; every expected
value in slice 2's tests was executed, not predicted. Layout: product
title opens the text; "COMPLIANCE FOR RETAIL" summary with category
BEFORE status (the mirror of DRS); cannabinoid rows as
<name> <LOQ|-> <avg%> <mg/serving>; terpene rows as <name> <LOQ%>
<result%> where the LOQ column is always a 7-decimal figure no result
shares -- that is the row anchor. identifyLab anchor: /Smithers CTS/i.

Three ratified calls:

a. Strain carries the printed product title, verbatim ("Blue Raspberry
   2g Vape AIO"). Smithers documents have no labelled strain field;
   the title is the closest printed statement of identity, editable at
   confirm. Never trimmed down to a guessed strain word (D97: printed
   text only, no inference).

b. Isomer rows that land on one canonical name are summed within a
   document. The vocabulary's standing precedents govern which names
   collapse: caryophyllene and ocimene isomers share a canonical
   (BCARYOPHYLLENE, TRANSBOCIMENE); nerolidol isomers stay distinct.
   Amnesia Haze prints cis-Ocimene 0.0166 and trans-b-Ocimene 0.1182;
   the stored Ocimene is 0.1348, the figure single-name labs print.
   Null + value = value; all-null stays null -- no zero is invented.

c. Twelve keys join the shared terpene map, eight as new canonical
   names (Pulegone, Isoborneol, Camphor, Cedrene, Cedrol, Fenchone,
   Geranyl Acetate, Nerol). Purely additive; no existing key changes;
   all eight repo fixtures re-parsed identically after the edit.
   Without them, detected values fall on the floor: trans-
   Caryophyllene 0.4512 is Amnesia Haze's second terpene and was
   being dropped.

## Executed values (the tests pin these)

Blue Raspberry 002-D08: THC 86.096, CBD 0.17904, terpenes 1.523,
9 of 9 printed detections captured, sampled 2025-10-20, tested
2025-10-28. Amnesia Haze 006-084 (AIO): THC 76.6, CBD 0.186,
terpenes 3.597, 24 canonical non-null rows from 25 printed detections
(the Ocimene pair summing), Terpinolene 1.032 dominant. Bugs found
against real documents and fixed: the two-column layout's repeated
header bled "LOQ" into a captured name; "Pulegone (+)" needed the
name grammar to admit a leading parenthesis.

## Slices

1. This document (Tier 1).
2. Code (Tier 2): parseSmithers.ts (new); additive edits to types.ts
   (SourceLab union), identifyLab.ts, parseCoa.ts, normalize.ts;
   fixtures blue-raspberry.pdf and amnesia-haze.pdf (operator places
   from own downloads, hash-pinned); Deno tests mirroring the
   animal-face suite. Gates: full deno test suite green on the
   implementer's machine (jsr.io is unreachable from the architect's
   container -- the suite run is genuinely the implementer's); device
   gate: import one Smithers COA on the phone, confirm screen
   populated, saved row read back over MCP.

## Non-goals

No Keystone State Testing arm (next slice, own doc). No change to any
existing parser's output. No re-parse or backfill of stored COAs. No
strain-word extraction heuristics.
