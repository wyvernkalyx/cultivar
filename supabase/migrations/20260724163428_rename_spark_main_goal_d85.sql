-- D85 slice 1: rename session_entries.spark to main_goal.
-- session_current names spark explicitly and CREATE OR REPLACE cannot
-- rename a view output column, so both views (coa_session_stats depends
-- on session_current) are dropped and recreated from their observed
-- definitions (2026-07-23), main_goal substituted, security_invoker
-- restored on both. Grants restore via default privileges; the gate
-- verifies the observed set. Data untouched (documentation/design/
-- glossary.md, D85.2).

drop view public.coa_session_stats;
drop view public.session_current;

alter table public.session_entries rename column spark to main_goal;

create view public.session_current with (security_invoker = true) as
 select id,
    entry_no,
    session_id,
    created_by,
    coa_id,
    lexicon_version,
    overall_word,
    overall_score,
    fit,
    deleted,
    created_at,
    energy,
    environment,
    main_goal,
    physical_state,
    co_consumption
   from ( select distinct on (session_entries.session_id) session_entries.id,
            session_entries.entry_no,
            session_entries.session_id,
            session_entries.created_by,
            session_entries.coa_id,
            session_entries.lexicon_version,
            session_entries.overall_word,
            session_entries.overall_score,
            session_entries.fit,
            session_entries.deleted,
            session_entries.created_at,
            session_entries.energy,
            session_entries.environment,
            session_entries.main_goal,
            session_entries.physical_state,
            session_entries.co_consumption
           from public.session_entries
          order by session_entries.session_id, session_entries.entry_no desc) latest
  where deleted = false;

create view public.coa_session_stats with (security_invoker = true) as
 select coa_id,
    created_by,
    count(*)::integer as session_count,
    avg(overall_score) as average_score,
    round(avg(overall_score))::smallint as band
   from public.session_current
  group by coa_id, created_by;
