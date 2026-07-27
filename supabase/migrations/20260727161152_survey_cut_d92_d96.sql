-- D92-D96: the survey cut. Retires the three intent axes, fit, and
-- both confound panels as columns; adds notes.
-- Views are dropped and recreated because session_current selects
-- explicit columns. Both MUST return with security_invoker = true.

drop view if exists public.coa_session_stats;
drop view if exists public.session_current;

alter table public.session_entries add column notes text;

alter table public.session_entries
  drop column energy,
  drop column environment,
  drop column main_goal,
  drop column fit,
  drop column physical_state,
  drop column co_consumption;

create view public.session_current with (security_invoker = true) as
select id, entry_no, session_id, created_by, coa_id, lexicon_version,
       overall_word, overall_score, notes, deleted, created_at
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
         session_entries.created_at
    from public.session_entries
   order by session_entries.session_id, session_entries.entry_no desc
) latest
where deleted = false;

create view public.coa_session_stats with (security_invoker = true) as
select coa_id,
       created_by,
       count(*)::integer as session_count,
       avg(overall_score) as average_score,
       round(avg(overall_score))::smallint as band
  from public.session_current
 group by coa_id, created_by;

grant all on public.session_current to anon, authenticated, postgres, service_role;
grant all on public.coa_session_stats to anon, authenticated, postgres, service_role;
