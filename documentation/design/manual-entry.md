# Manual COA Entry -- design (D134)

Status: RATIFIED 2026-08-08. Not implemented. The implementing
commit amends this line or the line is wrong.

## D134 -- the pre-populated form, and the Not Available / ND pairing

A user whose document no parser reads enters the data by hand. The
form presents the full panel of canonical analyte names, every
value defaulting to **Not Available**; the user fills in what the
document gives them. Operator-specified form; the pairing below is
what makes it compatible with the no-fabrication invariant:

- **ND** -- "the lab document prints ND." A lab attestation the
  user transcribes deliberately. Stored: a row with null pct.
  Renders as ND downstream, same as parsed rows.
- **Not Available** -- "I hold no value for this row." The
  pre-populated default. **Never stored.** At confirm, every row
  still on Not Available is dropped from the emission; the database
  receives only rows the user touched (a number, or an explicit ND).

Grounds: storing Not Available rows as null would render them as
ND on the detail view and cards -- a panel of lab attestations
nobody read off a document. The invariant one level up from values.
Ratified 2026-08-08 (operator form, architect pairing).

## Entry point

The unsupported-lab guard gains one affordance: "Enter this COA
manually." The guard is where the lived demand dies today -- ACS
(image PDF, zero extracted characters) and Nova (letter-spaced
extraction) both fail closed through it, for reasons the guard
does not distinguish and does not need to here.

This answers the follow-ups.md open item verbatim: "A 200 routing
the user to manual entry may be correct, but it was never decided."
Decided: it routes, via this affordance. The doc commit amends that
entry.

Banked: a direct enter-manually route in the add flow, for a
paper-only COA with no file to pick. No lived case yet; one button
once the screen exists.

## Value states

Per analyte row and per total (THC / CBD / total terpenes):
a real number, an explicit ND, or Not Available (default).

- A blank commit never becomes ND in manual mode. This diverges
  deliberately from the parsed-mode editor, where blank-to-ND is
  sound because the row provably existed in the document; in manual
  mode it would convert "didn't finish typing" into "lab says not
  detected." ND requires the explicit act.
- An explicitly typed 0 remains a legal real number (the standing
  rule: fabricated zeros are banned, deliberate ones are not).
- Metadata (strain, brand, batch, lab) is free text under D97:
  trimmed-empty emits null. The lab field carries the transcribed
  lab name; sourceLab (below) is the system provenance marker and
  is not user-editable.
- Dates (sampled, tested) optional; blank emits null.

## Pre-populated names

- **Terpenes: the 35 canonical display names** in TERPENE_CANON
  (supabase/functions/_shared/coa/normalize.ts), extracted by parse
  2026-08-08, rendered terpenes-first per the standing display
  rule, in canon order. Code-sourced; no hand-curated list.
- **Cannabinoids: no code canon exists.** The stored corpus holds
  28 distinct spellings over roughly 15 chemical identities
  (case variants, delta-notation variants, one header-bleed
  defect). The form list is therefore ratified copy, 15 names:
  THCa, D9-THC, D8-THC, D10-THC, THCV, THCVa, CBD, CBDa, CBDV,
  CBDVa, CBC, CBCa, CBG, CBGa, CBN. The D10 R/S isomer rows are
  excluded on the fail-closed precedent (session handoff,
  2026-08-07 ratified decisions): a document printing them is
  served by add-row.
- **Add-row: the free-text escape hatch**, manual mode only, for
  an analyte outside the lists. The parsed-mode add-row deferral
  in confirm-edit-screen.md stands untouched -- its trigger ("a
  real drop is seen") has not occurred; this is a different
  trigger with a different scope.
- Consequence, stated: manual rows carry cleaner names than parsed
  rows (the stored corpus's variants come from lab print forms).
  The banked canonicalize-at-read item is unaffected either way.

## Provenance and payload

- **sourceLab: 'manual'.** No CHECK constraint exists on
  coas.source_lab (pg_constraint, observed 2026-08-08); this is a
  payload value, not a schema change. Per-lab audit aggregations
  will show it as its own bucket, which is the point.
- **The picked PDF is kept.** The guard path begins with a real
  file: the ingest call already returned its pdfSha256, and the
  modal's existing confirm machinery uploads the picked file
  post-insert (uploadCoaPdf). A manual entry born from a picked
  file keeps its ground-truth document and its dedup hash for
  free. Believed, verify at build: the empty-parse response
  carries pdfSha256 (the server hashes bytes before parsing);
  if it does not, the hash is null and the upload still runs from
  pickedUri. pdfSha256 is null only on the banked no-file path.
- **safety: [].** No manual safety transcription in v1. Observed
  2026-08-08: jsonb_array_elements over an empty jsonb array
  yields zero rows -- the construct insert_coa uses -- so an empty
  array inserts nothing and violates nothing.
- **No migration.** insert_coa (migration 20260728171246) already
  maps every key this flow emits, json null to SQL NULL, never
  coalesced to 0. Tier 2, not Tier 3.
- Dedup rides find_coa_duplicates unchanged: with a hash it
  hash-matches; without one, the absent-hash predicate (D88.4)
  still matches on lab/batch.
- type stays absent per the standing deferral.

## Architecture

- **Extend CoaEditor with a manual mode**; no sibling component.
  The D38 grounds against reuse (two grouping regimes in one file)
  do not recur: manual mode has no detected/ND grouping at all.
  The draft initializes with every canon row in the Not Available
  state, rendered as one flat list, terpenes then cannabinoids,
  canon order. No "Not detected (N)" section -- nothing is ND at
  init, and D37's no-migration rule carries over: a row set to ND
  stays in place.
- Draft rows gain a third value state internally (number | null-ND
  | not-available sentinel); emit strips not-available rows and
  otherwise produces the same parser-shape object the confirm
  contract commits to. insert wiring, dedup, phases, and the fixed
  confirm footer are untouched.
- The guard arm keeps its bare short block and gains the one
  button, which moves the modal to the manual draft phase carrying
  pickedUri and pdfSha256 forward.

## Slices and gates

- **Doc commit first** (this file + the follow-ups.md amendment):
  Tier 1, one combined prompt.
- **One Tier 2 feat slice**: manual mode + add-row + guard
  affordance + emit + phase wiring. The insert path is untouched,
  which is what keeps this one slice rather than two.
- Device gate (physical iPhone, per-step verdicts), outline:
  1. Pick the ACS PDF; land on the guard; the new affordance is
     visible.
  2. Enter manual; the full pre-populated form renders, everything
     Not Available.
  3. Transcribe a small set: at least one number, one explicit ND,
     one total, metadata; leave the rest untouched.
  4. Confirm; insert lands.
  5. MCP read-back: child row count equals touched-row count
     exactly; the ND row reads back as SQL NULL; no row exists for
     any untouched name (the pairing, live at the DB seam).
  6. Control: the parsed path (any known-lab fixture) still renders
     the grouped editor unchanged.

## Non-goals

- OCR for image PDFs (ACS) and despaced extraction (Nova) --
  parser-arc classes, banked, unblocked from this work.
- The direct no-file entry route (banked above).
- Manual safety rows; type; post-insert editing (exists for no
  path); parsed-mode add-row.
- Any parser or Edge Function change; any migration.
