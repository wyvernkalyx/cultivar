-- Age-gate attestations -- slice 1, schema (D154-D157).
--
-- One table only. This migration populates nothing and no code path
-- writes or reads it yet: the UI slice (slice 2, device-gated) brings
-- the first writer and the first reader (the launch existence probe).
--
-- Design of record: documentation/design/age-gate.md
--
-- Design notes (ratified 2026-08-25):
--   * Attestation-only (D154): no birthdate, no age, no jurisdiction
--     name is ever stored. The row is the boolean fact with its
--     timestamp.
--   * Append-only by policy absence (D155), exactly as
--     session_entries (D52) and coa_retirements do it: INSERT and
--     SELECT only. A legal attestation a buggy client can silently
--     flip is not a record.
--   * kind is text, not an enum: the vocabulary is provisional
--     ('age21_jurisdiction' now; the consent/terms slice adds a
--     kind, zero migration).
--   * statement_version records which copy text was agreed
--     (lexicon_version precedent); the client sends its constant,
--     1 at ship.
--   * No parent table: ownership is created_by alone, the
--     profile_resets precedent.
--   * Check constraints are named explicitly, gating on the text of
--     the migration, never PostgreSQL's naming algorithm.
--   * No index. The only planned reader is the launch-path own-rows
--     existence probe, RLS-narrowed over a table holding one or two
--     rows per user for years. Stated so the absence reads as
--     deliberate, not forgotten.

create table public.user_attestations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null
    constraint user_attestations_kind_nonempty_check check (length(trim(kind)) > 0),
  statement_version smallint not null
    constraint user_attestations_statement_version_positive_check check (statement_version > 0),
  created_at timestamptz not null default now()
);

-- RLS: the entire policy surface. INSERT and SELECT of own rows.
-- Nothing else exists, and that is the point.
alter table public.user_attestations enable row level security;

create policy "user_attestations_insert_own" on public.user_attestations for insert
  with check (created_by = auth.uid());
create policy "user_attestations_select_own" on public.user_attestations for select
  using (created_by = auth.uid());
