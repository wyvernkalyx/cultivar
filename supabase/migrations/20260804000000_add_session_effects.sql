-- D119, D121: session effects tags. Adds the flat text[] fact class to
-- session_entries and republishes session_current so the new column is
-- reachable through it.
--
-- The view is recreated because its definition uses an explicit column
-- list, which does not pick up a column added to the base table. The
-- invoker-security option is restated in the replacement statement
-- rather than assumed to survive it. coa_session_stats reads only score
-- fields; its definition is deliberately untouched.
--
-- Replacing the view in place, rather than dropping and recreating it,
-- preserves the existing privileges, so the D105 anon revocation is not
-- undone here and no grant statements are reissued.
--
-- No default and no check constraint: null and empty both mean nothing
-- recorded, and the vocabulary lives in the client lexicon, never in
-- the schema.

alter table public.session_entries add column effects text[];

create or replace view public.session_current with (security_invoker = true) as
select id, entry_no, session_id, created_by, coa_id, lexicon_version,
       overall_word, overall_score, notes, deleted, created_at, effects
from (
  select distinct on (session_entries.session_id)
         session_entries.id,
         session_entries.entry_no,
         session_entries.session_id,
         session_entries.created_by,
         session_entries.coa_id,
         session_entries.lexicon_version,
         session_entries.overall_word,
         session_entries.overall_score,
         session_entries.notes,
         session_entries.deleted,
         session_entries.created_at,
         session_entries.effects
    from public.session_entries
   order by session_entries.session_id, session_entries.entry_no desc
) latest
where deleted = false;
