# Attach a COA document to a manual shelf item -- design (D135)

Status: RATIFIED 2026-08-08. Not implemented.

## D135 -- attach is an update-in-place, never a new row

A shelf item entered manually (D134) later meets its real lab
document. The document's chemistry replaces the transcription; the
shelf item's identity and history do not move. Concretely: the
existing coas row is updated under its own id. session_entries are
never repointed -- the append-only chain is untouched by design, and
everything keyed to the id (sessions, favorite, on_shelf_count,
retirement history) survives with no migration of any kind on it.

## Flow

Overflow menu, rows with source_lab = 'manual' only: "Attach COA
document" -> pick file -> existing ingest path -> existing
confirm/edit screen -> commit as an update. If the parse dies at the
unsupported-lab or empty-parse guard, the attach dies with it: the
guard shows its error only. The guard's "enter manually" affordance
is suppressed in attach context -- it creates a new row, which is
the one thing attach must never do.

## Prefill rule at confirm

- Identity fields -- strain, brand -- prefill from the existing row
  when the row has them; the parse's values fill blanks only.
  Grounds: the shelf identity is the user's naming; a compliance
  form's "Whole Flower" must not overwrite "Mule Fuel".
- Document fields -- lab, batch, sampledDate, testedDate, totals,
  analytes, safety, sourceLab, pdfSha256 -- come from the parse.
- Everything metadata remains editable at confirm, unchanged.

## Commit seam

- New RPC attach_coa(p_coa_id uuid, payload jsonb): updates the coas
  row (metadata, totals, dates, source_lab, pdf_sha256) and replaces
  all three child tables (delete by coa_id, insert from payload) in
  one transaction. A torn half-replaced panel is the failure this
  buys out. security invoker, empty search_path; ownership is RLS
  under invoker, same posture as insert_coa. Tier 3.
- pdf_object_path stays on the existing D87.4 after-save path:
  uploadCoaPdf(pickedUri, id) runs post-attach against the existing
  id, unchanged.
- Dedup: find_coa_duplicates runs before commit, unchanged. A hash
  or lab/batch match on a DIFFERENT row is a STOP with a message --
  the document already lives on another shelf item. A match on the
  target row itself (re-attach) is not a conflict.

## Non-goals

- Attaching to parsed rows (replace-document); detach/un-attach.
- Any trace that the row was once manual (banked on request).
- Parser changes (D136 is its own slice, and ships first --
  operator ruling 2026-08-08, order (a)).
- OCR; repointing sessions; touching on_shelf_count, favorite,
  created_at.

## Slices and gates

1. This doc: Tier 1.
2. Migration (attach_coa): Tier 3 -- operator applies; SQL
   observation with a paired control (probe-and-restore update on a
   throwaway payload, rolled back).
3. UI slice: Tier 2, device gate on the lived case:
   1. Mule Fuel card overflow shows the affordance; a parsed row's
      overflow does not (control).
   2. Pick WF00350.pdf; confirm screen prefills strain and brand
      from the row, batch/lab/dates/chemistry from the parse.
   3. Confirm; MCP read-back on the SAME id: source_lab flipped,
      totals and child row counts equal the parse output exactly
      (counts pinned at build time by executed parse, not asserted
      here), session count on the id unchanged.
   4. pdf_sha256 and pdf_object_path both non-null at read-back.
   5. Dedup control: attempt the same file against the other manual
      row; STOP fires on the cross-row hash match.
