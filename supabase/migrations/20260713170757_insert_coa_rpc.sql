-- insert_coa: the atomic four-table COA write (slice 6a, D39).
--
-- Contract: documentation/design/coa-insert.md. The payload is the confirm
-- screen's emission, verbatim, in parser-key space; the parser-key -> column
-- mapping lives here, once, at this seam.
--
--   * Invoker rights: every insert runs as the calling user, so RLS
--     (coas_all_own + the children's parent-ownership checks) stays
--     load-bearing. No service role anywhere in this path.
--   * ND / <LOQ / not reported is NULL end to end: json null lands as SQL
--     NULL; 0 is never substituted for an absent value.
--   * created_by, id, created_at are never read from the payload -- the
--     column defaults own them (created_by = auth.uid()).
--   * No error handling: a constraint failure (e.g. a safety row missing
--     its status) aborts the entire transaction. That IS the atomicity
--     contract; catching it would break the gate's control case.

create function public.insert_coa(payload jsonb)
  returns uuid
  language plpgsql
  security invoker
  set search_path = ''
as $$
declare
  new_id uuid;
begin
  insert into public.coas
    (strain, brand, batch, lab, source_lab, total_thc, total_cbd, total_terpenes)
  values (
    payload->>'strain',
    payload->>'brand',
    payload->>'batch',
    payload->>'lab',
    payload->>'sourceLab',
    (payload->>'totalThcPct')::numeric,
    (payload->>'totalCbdPct')::numeric,
    (payload->>'totalTerpenesPct')::numeric
  )
  returning id into new_id;

  insert into public.coa_terpenes (coa_id, name, pct)
  select new_id, t->>'name', (t->>'pct')::numeric
  from jsonb_array_elements(payload->'terpenes') as t;

  insert into public.coa_cannabinoids (coa_id, name, pct)
  select new_id, c->>'name', (c->>'pct')::numeric
  from jsonb_array_elements(payload->'cannabinoids') as c;

  insert into public.coa_safety (coa_id, category, status)
  select new_id, s->>'category', s->>'status'
  from jsonb_array_elements(payload->'safety') as s;

  return new_id;
end;
$$;

-- Reachable only with a user token.
revoke execute on function public.insert_coa(jsonb) from public;
revoke execute on function public.insert_coa(jsonb) from anon;
grant execute on function public.insert_coa(jsonb) to authenticated;
