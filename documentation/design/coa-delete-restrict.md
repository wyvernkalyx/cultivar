# COA Delete -- Restrict Over Cascade (D144)

Status: RATIFIED 2026-08-11 (D144). Migration landed as slice 2
(2026-08-11). This status line is amended by the commit that changes
its truth.

North stars: documentation/design/session-entries-schema.md (D53, which
this supersedes), documentation/design/coa-retention-and-possession.md
(D90.3, likewise; D87's delete-reaches-Storage rule), CLAUDE.md
("nothing recorded is silently destroyed").

## D144 -- history-bearing COAs are undeletable at the database

session_entries.coa_id and coa_retirements.coa_id change from ON DELETE
CASCADE to ON DELETE RESTRICT. The analyte tables (coa_terpenes,
coa_cannabinoids, coa_safety) stay CASCADE: analytes are the COA's own
content, not history about it. The created_by -> auth.users cascades are
untouched: account-level erasure keeps its ceremony path.

Effect: a COA with at least one session entry or retirement event cannot
be hard-deleted by any client path; the delete fails at the FK,
regardless of app code. A COA with no history deletes exactly as today.

## Supersession grounds (against D53 and D90.3 as written)

D53 chose cascade because "the realistic delete case is a duplicate or
mistaken ingest, where the sessions are part of the mistake," and
because restrict "makes any COA permanent the moment it is logged
against, a dead end." Both grounds are answered:

1. Observed during the slice-6 gate (recorded in
   documentation/SESSION_HANDOFF.md at 60a2977e and in 00a9dcc's body):
   three COAs deleted where one was intended. Mule Fuel lost 2 real
   sessions; one coa_retirements row was destroyed through the cascade
   (retirements 17 -> 16). The realistic delete case now includes
   accidents on real rows, and every recorded accident would have been
   blocked by restrict.
2. The dead end no longer exists. D53 predates possession (D89) and
   retirement (D90): at its ratification, delete was the only way off
   the shelf. Today the disposal path for a logged COA is retire /
   off-shelf, which preserves history by design; wrong sessions on a
   wrong row are handled by session soft-delete (D52), not by
   destroying the row. Duplicate ingest, D53's central case, is now
   caught at the door by D88's three-outcome prompt.
3. D90.3 accepted the cascade hole solely to avoid a soft-delete pass
   it judged out of scope, and warned that append-only was not durable.
   Restrict closes the hole with two FK clauses and no new column --
   strictly smaller than the pass D90.3 declined.

Recorded dissent: none. Cascade-by-design ("delete means total erasure")
was the runner-up; rejected because it ratifies the mechanism that
destroyed data three times in one gate session, and because the current
delete path is not even erasure-complete (next section).

## The delete path today is also a D87 regression

Observed 2026-08-11 (read-only SQL): 3 objects in coa-pdfs match no live
pdf_object_path -- the accident COAs' PDFs. D87 ruled that delete must
reach Storage with failure surfaced, and the retention slice's gate
observed removal working; the v2 delete path orphaned all three. The
code-side cause is unread and is the opening Phase A question of the
follow-up slice below. Operator ruling 2026-08-11: the 3 orphans are
KEPT -- reversible, and the sole surviving artifacts of the accident
COAs; disposition revisits before any public release.

## Named costs, accepted (operator, 2026-08-11)

- "Delete" becomes conditional. Until the steer-to-Retire copy ships
  (follow-up slice), deleting a history-bearing row surfaces an
  unpolished FK error -- failing in the safe direction. Ruled: this
  migration precedes D143 and the copy; a proven data-loss path
  outranks the written entry point.
- True erasure of a history-bearing COA (privacy request) becomes an
  operator-run ceremony. Acceptable at this cohort size; revisit before
  any public release.
- session-entries-schema.md's "COA delete is the one dialog-guarded
  exception to soft-delete-only" narrows to history-free rows.

## Slices

1. docs: this document, plus supersession pointers amended into D53's
   section and D90.3. Tier 1.
2. feat: the migration -- drop and re-add the two constraints (names
   observed live 2026-08-11: coa_retirements_coa_id_fkey,
   session_entries_coa_id_fkey) with ON DELETE RESTRICT. Tier 3:
   implementer authors, operator applies, observed-state gate below.
3. Banked follow-up (Tier 2, after D143): steer-to-Retire copy on the
   blocked path, and delete-reaches-Storage restored per D87, its
   Phase A reading the v2 delete path at HEAD.

## Gate (slice 2)

Observed SQL, pasted raw, with paired controls:
- pg_constraint shows confdeltype = 'r' on both named constraints, and
  'c' still on the three analyte coa_id FKs -- the unchanged case is
  the control for the query itself.
- Behavioral probe, rolled back: within one transaction, insert a
  transient COA and delete it (positive control -- history-free delete
  succeeds); attempt delete of a history-bearing COA and observe
  foreign_key_violation; roll back; separate read-back confirms coas
  count equals its same-session pre-probe read.
