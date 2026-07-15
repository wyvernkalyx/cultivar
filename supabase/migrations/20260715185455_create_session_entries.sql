-- Session entries (session-logging slice 2, D52-D53)
--
-- A session is an append-only chain of entries: the drop, a chip tap, a
-- re-drag, and a soft delete are all INSERTs of a full snapshot; the latest
-- entry in a chain wins. There is deliberately NO UPDATE policy and NO
-- DELETE policy on this table -- recorded history is unwritable by
-- construction, not by convention (same family as ND != 0).
--
-- Design of record: documentation/design/session-entries-schema.md
--
-- Design notes (ratified):
--   * Word and score are both stored: the word is the raw answer, the score
--     is its hidden value at that lexicon_version. No check ties word to
--     value -- vocabulary lives in the lexicon, never in the schema.
--   * Fact classes stay distinct columns (intent / fit / context /
--     co_alcohol), text not enums: vocabularies are v1 and provisional.
--   * Null intent means unanswered, never "just because" (D48).
--   * coa_id cascades on COA delete (D53): the dialog-guarded COA delete is
--     the one exception to soft-delete-only.

create table public.session_entries (
  id uuid primary key default gen_random_uuid(),
  entry_no bigint generated always as identity,   -- strict global order; within-chain order derives from it
  session_id uuid not null,                       -- the chain key; client-generated at drop time
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  coa_id uuid not null references public.coas (id) on delete cascade,
  lexicon_version smallint not null,
  overall_word text not null,                     -- the raw answer -- the word as tapped
  overall_score smallint not null check (overall_score between 1 and 5),
  intent text,                                    -- null = unanswered, never coerced
  fit text,
  context text,
  co_alcohol boolean,                             -- null = unanswered; false reserved for a future explicit-no
  deleted boolean not null default false,         -- soft delete is an entry with true
  created_at timestamptz not null default now()   -- the session's moment is its first entry's created_at
);
create index session_entries_created_by_idx on public.session_entries (created_by);
create index session_entries_coa_id_idx on public.session_entries (coa_id);

-- RLS: the entire policy surface. INSERT and SELECT of own rows, gated
-- through parent-COA ownership on the way in. Nothing else exists.
alter table public.session_entries enable row level security;

create policy "session_entries_insert_own" on public.session_entries for insert
  with check (
    created_by = auth.uid()
    and exists (select 1 from public.coas c where c.id = coa_id and c.created_by = auth.uid())
  );
create policy "session_entries_select_own" on public.session_entries for select
  using (created_by = auth.uid());
