-- D77 -- reconcile session_entries to the D70-D76 survey.
--
-- Design of record: documentation/design/session-entries-schema.md
-- (Amendment (D77)) and documentation/design/scoring-lexicon.md
-- (Amendment (D70-D76)). Zero session rows are live, so the column swap
-- carries no data-migration statement.
--
-- Both views over session_entries are dropped and recreated: session_current
-- selects *, so dropping a column forces its recreate, and coa_session_stats
-- reads from session_current. The recreate returns each view with its invoker
-- flag intact (verbatim from 20260716162520_create_scoring_views.sql) so the
-- column drop does not silently reopen the RLS bypass. No CASCADE.

-- 1. Drop both views, dependent first (coa_session_stats reads session_current).
drop view public.coa_session_stats;
drop view public.session_current;

-- 2. Reconcile the column set.
alter table public.session_entries
  add column energy text,
  add column environment text,
  add column spark text,
  add column physical_state text[],
  add column co_consumption text[],
  drop column context,
  drop column intent,
  drop column co_alcohol;

-- 3. Recreate both views verbatim, invoker flag intact.

-- One row per live session: the highest-entry_no entry of each chain,
-- soft-delete filtered OUTSIDE the subquery (latest-then-filter, D59).
create view public.session_current
  with (security_invoker = true) as
select * from (
  select distinct on (session_id) *
  from public.session_entries
  order by session_id, entry_no desc
) latest
where deleted = false;

-- One row per COA that has at least one live session (D61).
create view public.coa_session_stats
  with (security_invoker = true) as
select coa_id,
       created_by,
       count(*)::int                       as session_count,
       avg(overall_score)::numeric         as average_score,
       round(avg(overall_score))::smallint as band
from public.session_current
group by coa_id, created_by;
