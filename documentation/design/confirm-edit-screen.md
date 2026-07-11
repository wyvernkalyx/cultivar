# Confirm/Edit Screen — COA Ingestion

Status: design (document-before-implement). No implementation yet.
Contract fixture: `animal-face.pdf` (DRS/Confident). Validated against the live
`ingest-coa` parse output observed at HEAD `4ab722f`. If the parser output for this
fixture later differs, re-check this design against it.

## Purpose

The last gate before any COA is written to the database. `ingest-coa` returns
parsed JSON that is a **lossy transcription** of the lab's certificate; the paper/
PDF COA is ground truth. This screen exists so the user reconciles the parse
against the authoritative COA and corrects it **before** anything is inserted.
No COA is ever persisted un-reviewed.

This is the first slice that WRITES to the database. UI-visible → gates on the
physical iPhone via the EAS dev build, not unit tests.

## Framing (governs every decision below)

The user has or obtains the real COA at ingestion time. Editing is not "change
freely" — it is "make the record match what the lab actually printed." Every
affordance serves that reconciliation.

## Input

The parsed JSON object `ingest-coa` returns (parser-key space, e.g. `totalThcPct`,
`sourceLab`). The screen consumes and emits **this shape**. Mapping parser keys to
DB column names (`totalThcPct` → `total_thc`, etc.) is the **insert slice's** job,
not this screen's — see Non-goals.

## The three-state invariant (non-negotiable)

Every analyte value is one of: a real number, or **null** (ND / `<LOQ` / not
reported). Null is a first-class, selectable state and is rendered as "ND" — never
as 0, never as blank-ambiguous. Clearing a real number lands on null, not 0.
This is the no-fabrication rule made visible; it outranks any UI convenience.

## Metadata fields (from `coas` parent)

Editable as free text:
- `strain` — "Animal Face"
- `brand` — arrives polluted: "Adult Use Powered by Condent LIMS 1 of 8 Moby &
  Zeke, LLC". User corrects to the real value ("Moby & Zeke, LLC"). This is the
  single most important correction on the screen.
- `batch`, `lab`

Display-only (system, not user-authored):
- `source_lab` ("drs-confident")
- `total_thc` / `total_cbd` / `total_terpenes` — shown; editable as analyte values
  under the same three-state rule (null preserved).

Absent this slice:
- `type` (sativa/indica/hybrid) — no parser source; a COA is a chemical assay and
  `type` is a horticultural/marketing label, not a measurement. Deferred: it is
  orthogonal to the personal-empirical thesis (which correlates terpene profiles,
  not folk strain taxonomy). Not shown, not set. Revisit only if testing surfaces
  a real need.
- `pdf_url` — no Storage bucket yet; stays null.

## Analyte rows (terpenes, cannabinoids)

Each row: **name (editable), value (editable, three-state), delete.**

- **Edit value** — number or ND, per the invariant.
- **Rename** — required, not cosmetic. `g CBDVa` is a column-header bleed of real
  `CBDVa`; the correct fix is rename → `CBDVa`, not delete.
- **Delete** — for a genuine phantom row.
- **No add-row this slice.** The parser emits a fixed complete panel (20 terpenes /
  16 cannabinoids for this lab); nothing is missing to add. No dropped-row defect
  has been observed. Add-row would be speculative — deferred until a real drop is
  seen.

### ND grouping (the panel is mostly ND by construction)

For `animal-face.pdf`: 6 of 20 terpenes and 2 of 16 cannabinoids carry values;
the rest are ND (14 and 14 respectively). ND rows are **real data and are never
hidden or removed** — but a flat list is a wall of noise. So:

- Detected rows (non-null) render first, expanded.
- ND rows collapse into an always-present, expandable section: "Not detected (N)".
- Every ND row remains individually visible on expand and is part of what the user
  confirms. Collapsed ≠ absent.

## Safety rows

Display-and-confirm only this slice. 8 rows (e.g. "Solvents: Not Tested"). No edit
affordance — no defect observed. Editing deferred until one is.

## View source

A "view source COA" toggle on-screen so the user compares parsed-vs-COA without
leaving. The PDF is in memory at ingestion (no Storage bucket needed). v1.

## Output / insert contract (boundary of this slice)

On confirm, the screen produces the corrected JSON (same shape as input). It does
**not** perform the insert. The insert is a separate slice, but this contract
constrains it: the write across `coas` + `coa_terpenes` + `coa_cannabinoids` +
`coa_safety` must be **atomic** — a partial insert is a corrupt record. The design
must permit a single transactional insert (e.g. a Postgres RPC); it must not assume
per-table client REST calls. RLS is already in place (owner = `auth.uid()` via
`created_by`).

## Non-goals (this slice)

- The insert mechanism (RPC vs client vs Edge Function) — next slice.
- The Storage bucket / `pdf_url` persistence.
- `type` field.
- add-row; safety-row editing.
- App-code test infra — UI slice gates on device, not unit tests.
- Parser cleanup (the brand sludge / `g CBDVa` are *inputs* to this screen; fixing
  them at the parser is a separate banked concern).
