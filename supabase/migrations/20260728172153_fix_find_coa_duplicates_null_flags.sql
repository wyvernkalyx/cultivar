-- Fix for 20260728171246: find_coa_duplicates returned NULL instead of
-- false for a signal flag whenever the flag's comparison touched a NULL
-- column on a row the other signal selected (observed at the schema
-- gate: a natural-key match with pdf_sha256 null carried
-- hash_match = null). Row selection was and is unaffected; only the
-- flags change. NULL is not "unasked" here -- the signal was evaluated
-- and did not match -- so false is the honest value. Everything else is
-- identical to the prior definition; create or replace preserves the
-- grants issued in 20260728171246.

create or replace function public.find_coa_duplicates(
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
    coalesce(a.h is not null and c.pdf_sha256 = a.h, false) as hash_match,
    coalesce(a.l is not null and a.b is not null
      and c.lab = a.l and c.batch = a.b, false) as natural_key_match
  from public.coas c, args a
  where c.created_by = auth.uid()
    and (
      (a.h is not null and c.pdf_sha256 = a.h)
      or
      (a.l is not null and a.b is not null
        and c.lab = a.l and c.batch = a.b)
    )
$$;
