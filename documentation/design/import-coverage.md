# Import Coverage -- Design

Status: drafted 2026-08-23, awaiting operator ratification. This line
is amended by the commit that changes its truth.

## Purpose

The existential question, operator-named: how many real products yield
a readable COA? Two different zeros hide inside one failure rate. An
acquisition zero (the QR leads to no PDF at all -- the Metrc verifID
HTML class, qr-import.md) argues for the banked Metrc ingestion arc. A
parsing zero (a PDF arrives but no parser reads it) argues for new
per-lab parsers. Until the mix is measured, neither arc can be ranked.
The cheapest instrument is a manual tally: one row per product, filled
by whoever attempts the import.

## D153 -- Coverage is measured by a manual tally, one row per product

Each attempted product gets exactly one row with one terminal outcome.
The outcome names are tester-facing; a tester needs no knowledge of
labs or parsers to pick one.

| Outcome (tester marks one) | Internal meaning |
|---|---|
| NO QR | Package carries no scannable code |
| QR, NO COA | Clicked through; no PDF ever appeared (acquisition zero) |
| COA SEEN, IMPORT FAILED | PDF on screen, but neither auto-detect nor the Import this page control produced a saved product |
| IMPORTED, MOSTLY EMPTY | Saved, but the confirm screen was largely blank (unknown lab or layout drift; the sheet does not ask which -- the D134 ambiguity stays internal) |
| IMPORTED WITH DATA | Success |

Per-row fields: date, dispensary, brand, product name, lab name as
printed on the COA if one was seen, outcome, free-text note.

The metric: IMPORTED WITH DATA over total rows. The failure mix
(acquisition rows vs parsing rows) is the decision input for ranking
the Metrc arc against new-parser slices.

Grounds for manual over instrumented: lived-demand. No tester event
has happened yet; building schema and client writes to automate a
measurement never taken once by hand is speculative scaffolding. The
in-app attempt log is banked with an explicit trigger: the first
tester event's tally comes back unusable or unfilled.

## The tally sheet

Print or copy the table below; one row per product attempted.

| Date | Dispensary | Brand | Product | Lab (if seen) | Outcome | Note |
|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |

Outcome is one of: NO QR / QR, NO COA / COA SEEN, IMPORT FAILED /
IMPORTED, MOSTLY EMPTY / IMPORTED WITH DATA.

Completed sheets come back to the operator; results are appended to
this document as an observations section, dated, with the raw rows.

## Non-goals

- No in-app attempt logging, no schema change, no client writes
  (banked; trigger stated above).
- No parser or Edge Function changes.
- No new in-app copy or UX. The unsupported-lab vs unreadable-document
  UX distinction remains its own banked item.
- No commitment to a tester date; the sheet is ready whenever the
  rescheduled event happens, and is equally usable by the operator
  alone at Starlife or elsewhere.
