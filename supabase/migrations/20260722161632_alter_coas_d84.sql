-- D84 slice 3: COA test dates (documentation/design/coa-test-dates.md).
-- Two nullable date columns; no defaults -- a default would fabricate.

alter table public.coas
  add column sampled_on date,
  add column tested_on date;

-- Recreate insert_coa with the two new columns. Same signature, same
-- security posture (invoker + empty search_path). A missing payload key
-- casts to null; nothing coerces to a sentinel.

create or replace function public.insert_coa(payload jsonb)
  returns uuid
  language plpgsql
  security invoker
  set search_path = ''
as $$
declare
  new_id uuid;
begin
  insert into public.coas
    (strain, brand, batch, lab, source_lab, total_thc, total_cbd,
     total_terpenes, sampled_on, tested_on)
  values (
    payload->>'strain',
    payload->>'brand',
    payload->>'batch',
    payload->>'lab',
    payload->>'sourceLab',
    (payload->>'totalThcPct')::numeric,
    (payload->>'totalCbdPct')::numeric,
    (payload->>'totalTerpenesPct')::numeric,
    (payload->>'sampledDate')::date,
    (payload->>'testedDate')::date
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
