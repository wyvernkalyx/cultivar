# Confirm/Edit Screen — COA Ingestion

Status: partially implemented — slices 4 (read-only render), 5a (empty-parse
guard), and 5b (editing) are landed; see their sections below. Slice 6
(confirm/insert) is designed and split (D39, D40): 6a insert RPC
(documentation/design/coa-insert.md), 6b confirm wiring (below); neither yet
built.
Confirm/insert remains slice 6.
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
DB column names is the **insert slice's** job, not this screen's — see Non-goals.

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
- `sourceLab` ("drs-confident")
- `totalThcPct` / `totalCbdPct` / `totalTerpenesPct` — shown; editable as analyte
  values under the same three-state rule (null preserved).

These are parser keys; mapping them to DB column names belongs to the insert slice.

Absent this slice:
- `type` (sativa/indica/hybrid) — no parser source; a COA is a chemical assay and
  `type` is a horticultural/marketing label, not a measurement. Deferred: it is
  orthogonal to the personal-empirical thesis (which correlates terpene profiles,
  not folk strain taxonomy). Not shown, not set. Revisit only if testing surfaces
  a real need.
- `pdf_url` — no Storage bucket yet; stays null.

## Analyte rows (terpenes, cannabinoids)

Each row: **name (editable), value (the `pct` key; editable, three-state), delete.**

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

## Slice 4 read-only render (landed)

The add-to-shelf modal's success state renders this shape read-only, in the order:
metadata, totals, terpenes, cannabinoids, safety. Terpenes render before
cannabinoids because terpene profiles are the product's signal — the
personal-empirical thesis correlates them, not potency. Within each analyte panel,
detected rows render first in parser emission order; ND rows collapse under an
always-present "Not detected (N)" control and every row remains individually
visible on expand — collapsed, never hidden. A `null` value on `pct` renders as
the literal string "ND", never 0 and never blank, per the three-state invariant;
`totalCbdPct` gets the same treatment. `sourceLab` renders as subordinate
secondary text — a system identifier, not user-facing vocabulary.
Editing remains slice 5b (behind the 5a empty-parse guard); confirm/insert
remains slice 6.

## Empty-parse guard (slice 5a)

Observed live 2026-07-12 against the deployed function:

- A PDF from no known lab returns HTTP 200 with an all-empty parse tagged
  `sourceLab: "unknown"` — the success branch, never the failure branch.
- A non-COA PDF whose text merely mentions a lab name returns the same
  all-empty parse under a known `sourceLab` ("drs-confident"). Lab
  identification is presence-of-string (`identifyLab.ts`), so misidentification
  is cheap.

Therefore the guarded input class is the empty parse, not "unknown lab", and
`sourceLab` must not be the predicate.

- Predicate: `terpenes.length === 0 && cannabinoids.length === 0`, checked in
  the success branch, independent of `sourceLab`.
- Render: a non-editable "couldn't read this COA" state with the existing
  repick affordance. Metadata, totals, and safety are not shown — an empty
  panel is not reconcilable, and there is no add-row to recover with.
- Own minimal UI. Do not reuse or couple to the failure branch's rendering;
  that branch is slated for its own redesign (banked envelope-unwrap item).
- Gate (UI-visible, physical iPhone): a neutral non-COA PDF pushed through the
  picker lands on the guard state, and `animal-face.pdf` still renders the full
  review as the control case.

## Editing interactions (slice 5b)

- Value editor: tap the value to edit in a numeric (decimal-pad) input.
  Prefill is the current number, or empty for ND. Commit on blur/done:
  empty or whitespace → null (ND); typed `nd`/`ND` → null; a valid number →
  that number; unparseable text → revert to the prior value, no error state
  this slice. An explicitly typed `0` is a legal real number — the three-state
  invariant bans fabricated zeros, not deliberate ones.
- No row migration during edit: the detected/ND grouping is computed once when
  the draft initializes and stays fixed for the session. A value edited to ND
  updates in place; it does not move into the collapsed section. The grouping
  is a reading aid, not a data property.
- Delete requires a confirm alert: with no add-row, a mistaken delete is
  unrecoverable short of a full repick, so the confirmation earns its friction.
- Rename: inline text edit on the name, commit on blur; an empty name reverts.
- Metadata: free-text inputs, string-typed, empty allowed (`""`, never null);
  no validation this slice.
- Draft state is local and id-keyed: rows receive stable generated ids when the
  draft initializes from the parse (names are editable, so the name cannot be
  the key; an index breaks under delete). Reducer vs. `useState` is the
  implementer's choice — it is not architecture.

### Placement (slice 5b, D38)

Ratified 2026-07-13. The editor is a new component, `CoaEditor` in
`src/components/coa-editor.tsx`; `CoaReview` (`src/components/coa-review.tsx`)
is retired in the same commit — deleted, not retained. Grounds:

- The grouping invariant diverges. `CoaReview`'s `AnalyteSection` recomputes
  detected/ND from current values on every render; D37 freezes grouping at
  draft init (no row migration). Same-shaped code, opposite invariant —
  reuse would violate D37 silently, and forking the logic inside one file
  puts two grouping regimes in one component.
- The props contract differs structurally: the editor consumes an id-keyed
  draft with commit semantics, not `CoaParseResult`. Mutating `CoaReview`
  falsifies its load-bearing "props-only and presentational" contract
  rather than superseding it.
- Post-5b, `CoaReview` has zero consumers. The plausible future read-only
  consumer (the shelf's COA detail view) will read DB shape, not parser
  shape, so the component would not fit it anyway. Retention is speculative
  scaffolding; git history is the archive.

Consequences:

- The exported types (`CoaParseResult`, `CoaAnalyte`, `CoaSafetyRow`) move
  to `coa-editor.tsx` — same parser-mirror pattern, same accepted-debt
  comment. `add-to-shelf-modal.tsx` updates its import, and `ReviewOrGuard`'s
  non-empty arm renders `CoaEditor`.
- Draft state lives inside `CoaEditor`, initialized once from the `coa`
  prop; the modal remount-keys the editor on pick identity so a repick
  cannot leak a stale draft. Slice 6's confirm-emit arrives later as an
  `onConfirm` callback; no state lifting is anticipated.
- The view-source toggle is not part of 5b (see Non-goals).

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

### Confirm wiring (slice 6b, D40)

- `CoaEditor` gains an `onConfirm(coa: CoaParseResult)` prop. Emission
  converts the draft back to parser shape: generated ids and
  `detectedAtInit` are stripped; deleted rows are simply absent; safety
  rows pass through unedited; metadata strings and three-state values as
  edited. The emitted object is the same shape the screen consumed — the
  committed contract above.
- The modal owns the insert call (`supabase.rpc('insert_coa', { payload })`)
  and the confirming/success/error phases. The RPC returns the new
  `coas.id`. Mechanism and mapping: `documentation/design/coa-insert.md`.
- Gate (UI-visible, physical iPhone): confirm the corrected `animal-face`
  draft; observe success; read back the inserted rows. A draft value
  cleared to ND must land as SQL NULL — never 0 (the invariant, live at
  the DB seam).
- Ordering (D40): 6b builds only after 6a's RPC is applied and gated.

## Non-goals (this slice)

- The insert mechanism is decided (D39: a Postgres RPC, slice 6a — see documentation/design/coa-insert.md); implementing it is not this screen's concern.
- The Storage bucket / `pdf_url` persistence.
- `type` field.
- add-row; safety-row editing.
- App-code test infra — UI slice gates on device, not unit tests.
- Parser cleanup (the brand sludge / `g CBDVa` are *inputs* to this screen; fixing
  them at the parser is a separate banked concern).
- The view-source toggle — designed above, not assigned to a slice; explicitly not 5b.
