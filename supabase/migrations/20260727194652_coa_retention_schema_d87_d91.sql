-- COA retention, dedupe, and possession -- slice 2, schema (D87-D91).
--
-- Columns and one table only. This migration populates nothing and no code
-- path writes these columns yet: retention (slice 4) fills pdf_object_path,
-- dedupe (slice 5) fills pdf_sha256, retirement (slice 6) writes
-- coa_retirements. The Storage bucket is slice 3 and is operator-run.
--
-- Design of record: documentation/design/coa-retention-and-possession.md
--
-- Design notes (ratified 2026-07-27):
--   * pdf_object_path is a NEW column; the inherited pdf_url is not reused
--     and stays dormant (D87.3). It holds an object path, never a signed
--     URL -- signed URLs expire, and a stored one silently rots.
--   * pdf_sha256 carries a format check (D88.3). A hash column that accepts
--     '' re-creates ND != 0 at the string level, and a malformed hash
--     silently disables the dedupe fast path.
--   * Two NON-unique indexes, one per dedupe signal (D88.2). Unique would
--     make D88 outcome 3 -- a corrected report on the same natural key --
--     impossible, and would turn a user-facing question into an insert
--     error.
--   * coa_retirements is append-only by policy absence, exactly as
--     session_entries does it (D52): INSERT and SELECT only. A policy that
--     does not exist cannot be bypassed by a buggy client.
--   * reason is text, not an enum: the vocabulary is provisional, and an
--     enum puts vocabulary in the schema.
--   * The coa_id cascade matches D53 and is a recorded, accepted hole
--     (D90.3): append-only holds against UPDATE and DELETE, and does not
--     hold against deleting the parent COA.
--   * Check constraints are named explicitly rather than left to the
--     server. A gate that locates a constraint by a generated name is
--     gating on PostgreSQL's naming algorithm; this one gates on the text
--     of the migration.
--   * No index on coa_retirements. Nothing reads the table yet -- zero
--     rows, no code path -- and the two indexes D88.2 ratifies are both on
--     coas. FK-supporting indexes land with slice 6, which brings the first
--     reader. Stated so the absence reads as deliberate, not forgotten.

alter table public.coas
  add column pdf_object_path text,
  add column pdf_sha256 text
    constraint coas_pdf_sha256_hex_check check (pdf_sha256 ~ '^[0-9a-f]{64}$'),
  add column on_shelf_count integer not null default 1
    constraint coas_on_shelf_count_nonneg_check check (on_shelf_count >= 0),
  add column favorite boolean;

-- Dedupe signal 1: byte-identical document, scoped to the owner. Partial --
-- the column is null on every existing row and stays null until slice 5.
create index coas_created_by_pdf_sha256_idx
  on public.coas (created_by, pdf_sha256)
  where pdf_sha256 is not null;

-- Dedupe signal 2: same lot, different bytes.
create index coas_created_by_lab_batch_idx
  on public.coas (created_by, lab, batch);

-- One row per package retired. on_shelf_count is derived state; these
-- events are the record (D89, D90).
create table public.coa_retirements (
  id uuid primary key default gen_random_uuid(),
  coa_id uuid not null references public.coas (id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reason text not null
    constraint coa_retirements_reason_nonempty_check check (length(trim(reason)) > 0),
  created_at timestamptz not null default now()
);

-- RLS: the entire policy surface. INSERT and SELECT of own rows, gated
-- through parent-COA ownership on the way in. Nothing else exists.
alter table public.coa_retirements enable row level security;

create policy "coa_retirements_insert_own" on public.coa_retirements for insert
  with check (
    created_by = auth.uid()
    and exists (select 1 from public.coas c where c.id = coa_id and c.created_by = auth.uid())
  );
create policy "coa_retirements_select_own" on public.coa_retirements for select
  using (created_by = auth.uid());
