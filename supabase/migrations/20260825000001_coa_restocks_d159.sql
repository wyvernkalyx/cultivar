-- Re-acquisition -- slice 1, schema (D159).
--
-- One table, two indexes, one RPC. This migration populates nothing and
-- no code path calls it yet: the UI slice (slice 2, device-gated) brings
-- the first caller from both D160 surfaces.
--
-- Design of record: documentation/design/restock.md
--
-- Design notes (ratified 2026-08-25; fold-or-separate ruled 2026-08-30:
-- the web-capable dialog is a separate arc, not this one):
--   * Re-acquisition is an event and the SAME row returns (D159). A new
--     row per package would split identical chemistry across rows
--     forever and turn every future scan into a dedupe prompt.
--   * coa_restocks mirrors coa_retirements in form (20260727194652).
--     No reason column, deliberate: a retirement needs a why; a
--     restock's why is its own name.
--   * Append-only by policy absence, exactly as coa_retirements and
--     user_attestations do it: INSERT and SELECT of own rows, gated
--     through parent-COA ownership on the way in. Nothing else exists.
--   * Both FK indexes at creation (the D90 form). Unlike the retirement
--     table, the first reader and the cascade both arrive in this arc,
--     so there is nothing to defer.
--   * restock_coa is one transaction (D90.1): the event and the count
--     move together or not at all. security invoker, stated explicitly
--     and gated on prosecdef = f (CLAUDE.md). Under invoker, RLS binds
--     both statements: the insert is checked by coa_restocks_insert_own,
--     the update is scoped by coas_all_own.
--   * The cap least(count + 1, 1) is the mirror of retire's floor
--     greatest(count - 1, 0) and enforces D139's binary invariant. A
--     restock recorded against an already-shelved row is an event that
--     still happened; refusing it would destroy the record to protect
--     the derived value.
--   * created_by is not passed. The column defaults to auth.uid(), so
--     the caller cannot name a different owner.
--   * The no-row raise is defense in depth, verbatim in reasoning from
--     retire_coa (20260729110106).
--   * Grants mirror retire_coa verbatim.

create table public.coa_restocks (
  id uuid primary key default gen_random_uuid(),
  coa_id uuid not null references public.coas (id) on delete cascade,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS: the entire policy surface. INSERT and SELECT of own rows, gated
-- through parent-COA ownership on the way in. Nothing else exists.
alter table public.coa_restocks enable row level security;

create policy "coa_restocks_insert_own" on public.coa_restocks for insert
  with check (
    created_by = auth.uid()
    and exists (select 1 from public.coas c where c.id = coa_id and c.created_by = auth.uid())
  );
create policy "coa_restocks_select_own" on public.coa_restocks for select
  using (created_by = auth.uid());

-- Both foreign keys, indexed at creation. coa_id supports the per-COA
-- read and the cascade from coas; created_by supports the cascade from
-- auth.users.
create index coa_restocks_coa_id_idx
  on public.coa_restocks (coa_id);

create index coa_restocks_created_by_idx
  on public.coa_restocks (created_by);

create function public.restock_coa(p_coa_id uuid)
  returns integer
  language plpgsql
  security invoker
  set search_path = ''
as $$
declare
  new_count integer;
begin
  insert into public.coa_restocks (coa_id)
  values (p_coa_id);

  update public.coas
    set on_shelf_count = least(on_shelf_count + 1, 1)
    where id = p_coa_id
    returning on_shelf_count into new_count;

  if not found then
    raise exception 'restock_coa: no COA updated for id %', p_coa_id;
  end if;

  return new_count;
end;
$$;

revoke execute on function public.restock_coa(uuid) from public;
revoke execute on function public.restock_coa(uuid) from anon;
grant execute on function public.restock_coa(uuid) to authenticated;
