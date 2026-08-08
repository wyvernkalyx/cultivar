-- D135: attach a parsed COA document to an existing (manual) shelf item.
-- documentation/design/attach-coa.md.
--
-- Update-in-place under the row's own id: metadata, totals, dates,
-- source_lab, and pdf_sha256 from the payload; all three child tables
-- replaced (delete by coa_id, insert from payload arrays) in the
-- function's single transaction. A torn half-replaced panel is the
-- failure this buys out.
--
-- Key mapping mirrors insert_coa (D84 / D88.5): a missing payload key
-- casts to null; nothing coerces to a sentinel; pdfSha256 '' maps to
-- null so the D88.3 hex check never sees ''.
--
-- security invoker, empty search_path. Ownership is RLS under invoker,
-- same posture as insert_coa -- and the zero-row guard makes an
-- unowned or absent id an error rather than a silent no-op: without
-- it, the child deletes and inserts would run against a row the
-- update never touched. found is checked immediately after the
-- update, before any child statement runs.
--
-- Grants mirror find_coa_duplicates: authenticated only. The D105
-- default-ACL revocations cover anon; the explicit revokes are stated
-- anyway so this file carries its own posture.

create function public.attach_coa(p_coa_id uuid, payload jsonb)
  returns uuid
  language plpgsql
  security invoker
  set search_path = ''
as $$
begin
  update public.coas set
    strain = payload->>'strain',
    brand = payload->>'brand',
    batch = payload->>'batch',
    lab = payload->>'lab',
    source_lab = payload->>'sourceLab',
    total_thc = (payload->>'totalThcPct')::numeric,
    total_cbd = (payload->>'totalCbdPct')::numeric,
    total_terpenes = (payload->>'totalTerpenesPct')::numeric,
    sampled_on = (payload->>'sampledDate')::date,
    tested_on = (payload->>'testedDate')::date,
    pdf_sha256 = nullif(payload->>'pdfSha256', '')
  where id = p_coa_id;

  if not found then
    raise exception 'attach_coa: no row for id %', p_coa_id;
  end if;

  delete from public.coa_terpenes where coa_id = p_coa_id;
  delete from public.coa_cannabinoids where coa_id = p_coa_id;
  delete from public.coa_safety where coa_id = p_coa_id;

  insert into public.coa_terpenes (coa_id, name, pct)
  select p_coa_id, t->>'name', (t->>'pct')::numeric
  from jsonb_array_elements(payload->'terpenes') as t;

  insert into public.coa_cannabinoids (coa_id, name, pct)
  select p_coa_id, c->>'name', (c->>'pct')::numeric
  from jsonb_array_elements(payload->'cannabinoids') as c;

  insert into public.coa_safety (coa_id, category, status)
  select p_coa_id, s->>'category', s->>'status'
  from jsonb_array_elements(payload->'safety') as s;

  return p_coa_id;
end;
$$;

revoke execute on function public.attach_coa(uuid, jsonb) from public;
revoke execute on function public.attach_coa(uuid, jsonb) from anon;
grant execute on function public.attach_coa(uuid, jsonb) to authenticated;
