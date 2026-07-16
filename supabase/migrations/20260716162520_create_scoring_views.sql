-- Scoring read layer (scoring slice, D59-D62)
--
-- Two security_invoker views over session_entries. Under the invoker flag
-- the base table's SELECT policy (created_by = auth.uid()) does the
-- scoping; these views add no policy surface of their own. Without the
-- flag a Postgres view runs as its owner and bypasses RLS -- the landmine
-- recorded when this view was banked.
--
-- Design of record: documentation/design/scoring-read.md
--
-- Design notes (ratified):
--   * session_current is latest-then-filter, and that ORDER is the
--     invariant (D59): take the highest entry_no per chain FIRST, exclude
--     deleted = true AFTER. Filter-then-latest would resurrect the
--     pre-delete snapshot -- a silent undelete. Same family as ND != 0.
--   * A COA with zero live sessions has NO row in coa_session_stats
--     (D61): untried is absence, never a value.
--   * band rounds half away from zero -- round(numeric) built-in (D60).
--   * average_score stays unrounded -- the honest number; band is the book.

-- Latest-entry-per-chain read support (banked in the schema doc on "when
-- something reads by chain" -- session_current reads by chain, so it lands
-- now).
create index session_entries_chain_idx
  on public.session_entries (session_id, entry_no desc);

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
