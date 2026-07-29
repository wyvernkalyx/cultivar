-- COA retention, dedupe, and possession -- slice 6, the retirement RPC
-- (D90, D90.1) and the two FK-supporting indexes banked by the schema
-- slice.
--
-- Design of record: documentation/design/coa-retention-and-possession.md
--
-- Design notes:
--   * retire_coa is one transaction (D90.1). As two client operations
--     against a table carrying an ALL policy, a client could produce an
--     event with no decrement or a decrement with no event; either
--     outcome breaks D89's "the count is derived state; the events are
--     the record", and neither is detectable after the fact.
--   * security invoker, stated explicitly and gated on prosecdef = f
--     (CLAUDE.md). Under invoker, RLS binds both statements: the insert
--     is checked by coa_retirements_insert_own, which carries
--     parent-COA ownership, and the update is scoped by coas_all_own.
--   * created_by is not passed. The column defaults to auth.uid(), so
--     the caller cannot name a different owner.
--   * The floor is greatest(count - 1, 0) rather than a subtraction the
--     check constraint would reject. A retirement recorded against an
--     already-zero count is an event that still happened; refusing it
--     would destroy the record to protect the derived value.
--   * The no-row raise is defense in depth. RLS on the insert fails
--     first for a non-owner, and a missing COA fails the insert's FK,
--     so reaching the raise means the two statements disagree about
--     which rows exist -- which must abort, not return a count.
--   * Grants mirror find_coa_duplicates (20260728171246) verbatim.
--   * The two indexes are the ones 20260727194652 deliberately deferred:
--     "FK-supporting indexes land with slice 6, which brings the first
--     reader."

create function public.retire_coa(p_coa_id uuid, p_reason text)
  returns integer
  language plpgsql
  security invoker
  set search_path = ''
as $$
declare
  new_count integer;
begin
  insert into public.coa_retirements (coa_id, reason)
  values (p_coa_id, p_reason);

  update public.coas
    set on_shelf_count = greatest(on_shelf_count - 1, 0)
    where id = p_coa_id
    returning on_shelf_count into new_count;

  if not found then
    raise exception 'retire_coa: no COA updated for id %', p_coa_id;
  end if;

  return new_count;
end;
$$;

revoke execute on function public.retire_coa(uuid, text) from public;
revoke execute on function public.retire_coa(uuid, text) from anon;
grant execute on function public.retire_coa(uuid, text) to authenticated;

-- Both foreign keys, both unindexed until now. coa_id supports the
-- per-COA read the retirement history will want and the cascade from
-- coas; created_by supports the cascade from auth.users.
create index coa_retirements_coa_id_idx
  on public.coa_retirements (coa_id);

create index coa_retirements_created_by_idx
  on public.coa_retirements (created_by);
