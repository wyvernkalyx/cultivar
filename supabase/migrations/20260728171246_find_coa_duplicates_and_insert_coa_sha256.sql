-- slice 5b (D88.4-D88.6 support): the dedupe lookup RPC, and insert_coa
-- learns pdf_sha256.
--
-- find_coa_duplicates: both D88 signals in one owner-scoped query.
-- security invoker, and created_by = auth.uid() is carried as an
-- explicit predicate in its own right (D88.4): the function must not
-- rely on RLS for its scoping, even though under invoker RLS also
-- applies.
-- Empty-string arguments are absent (D88's landmine): a null or ''
-- lab or batch disables the natural-key arm, leaving hash-only.
-- Row-side values are compared exact: equality with a non-empty
-- argument cannot match an empty stored value, so no row-side
-- normalization is needed and the D88.2 (created_by, lab, batch)
-- index stays usable. The hash comparison is exact-case: the Edge
-- Function emits lowercase (D88.5) and the D88.3 check admits
-- lowercase only.
-- stable: reads only. on_shelf_count is returned because outcome 1's
-- client update writes count + 1 (D88.6). Grants mirror insert_coa:
-- authenticated only.

create function public.find_coa_duplicates(
  p_pdf_sha256 text,
  p_lab text,
  p_batch text
)
returns table (
  id uuid,
  strain text,
  brand text,
  lab text,
  batch text,
  on_shelf_count integer,
  hash_match boolean,
  natural_key_match boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  with args as (
    select
      nullif(trim(p_pdf_sha256), '') as h,
      nullif(trim(p_lab), '') as l,
      nullif(trim(p_batch), '') as b
  )
  select
    c.id, c.strain, c.brand, c.lab, c.batch, c.on_shelf_count,
    (a.h is not null and c.pdf_sha256 = a.h) as hash_match,
    (a.l is not null and a.b is not null
      and c.lab = a.l and c.batch = a.b) as natural_key_match
  from public.coas c, args a
  where c.created_by = auth.uid()
    and (
      (a.h is not null and c.pdf_sha256 = a.h)
      or
      (a.l is not null and a.b is not null
        and c.lab = a.l and c.batch = a.b)
    )
$$;

revoke execute on function public.find_coa_duplicates(text, text, text) from public;
revoke execute on function public.find_coa_duplicates(text, text, text) from anon;
grant execute on function public.find_coa_duplicates(text, text, text) to authenticated;

-- insert_coa: recreated per the D84 precedent. Same signature; the
-- column list gains pdf_sha256 from payload->>'pdfSha256'. nullif('')
-- maps an empty string to null -- ND-as-null at the string level, so
-- the D88.3 check never sees ''. create or replace preserves the
-- existing grants (the revokes live in 20260713170757).

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
     total_terpenes, sampled_on, tested_on, pdf_sha256)
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
    (payload->>'testedDate')::date,
    nullif(payload->>'pdfSha256', '')
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
