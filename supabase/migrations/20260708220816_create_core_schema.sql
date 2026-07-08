-- Cultivar core schema (Step 1, Slice 2)
--
-- Defines the per-user COA data model with Row-Level Security on EVERY table:
-- each of the ~10 test users can access only their own rows. Child analyte
-- tables are gated through the parent COA's ownership.
--
-- Design notes (approved):
--   * Per-user COA rows -- no cross-user dedup yet.
--   * Normalized child tables (terpenes / cannabinoids / safety), not JSON blobs.
--   * `sessions` table is deferred to a later slice.
--   * Analyte `pct` is null for ND / <LOQ / not reported -- never fabricate 0.

-- Profiles: one row per user, linked to auth.users
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text unique,
  display_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up
create function public.handle_new_user()
  returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- COAs: one parsed certificate, owned by the user who added it
create table public.coas (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  strain text,
  brand text,
  batch text,
  lab text,
  source_lab text,              -- 'kaycha' | 'drs-confident' | 'unknown'
  type text,                    -- sativa/indica/hybrid; often null (COA does not classify)
  total_thc numeric,
  total_cbd numeric,            -- null when ND / not reported
  total_terpenes numeric,       -- null when not reported
  pdf_url text,
  created_at timestamptz not null default now()
);
alter table public.coas enable row level security;
create policy "coas_all_own" on public.coas
  for all using (auth.uid() = created_by) with check (auth.uid() = created_by);
create index coas_created_by_idx on public.coas (created_by);

-- Child analyte tables. pct is null for ND / <LOQ / not reported (never fabricate 0).
create table public.coa_terpenes (
  id uuid primary key default gen_random_uuid(),
  coa_id uuid not null references public.coas (id) on delete cascade,
  name text not null,
  pct numeric
);
create table public.coa_cannabinoids (
  id uuid primary key default gen_random_uuid(),
  coa_id uuid not null references public.coas (id) on delete cascade,
  name text not null,
  pct numeric
);
create table public.coa_safety (
  id uuid primary key default gen_random_uuid(),
  coa_id uuid not null references public.coas (id) on delete cascade,
  category text not null,
  status text not null
);
create index coa_terpenes_coa_id_idx on public.coa_terpenes (coa_id);
create index coa_cannabinoids_coa_id_idx on public.coa_cannabinoids (coa_id);
create index coa_safety_coa_id_idx on public.coa_safety (coa_id);

-- RLS on child tables: access only rows belonging to a COA the user owns.
alter table public.coa_terpenes enable row level security;
alter table public.coa_cannabinoids enable row level security;
alter table public.coa_safety enable row level security;

create policy "coa_terpenes_all_own" on public.coa_terpenes for all
  using (exists (select 1 from public.coas c where c.id = coa_id and c.created_by = auth.uid()))
  with check (exists (select 1 from public.coas c where c.id = coa_id and c.created_by = auth.uid()));
create policy "coa_cannabinoids_all_own" on public.coa_cannabinoids for all
  using (exists (select 1 from public.coas c where c.id = coa_id and c.created_by = auth.uid()))
  with check (exists (select 1 from public.coas c where c.id = coa_id and c.created_by = auth.uid()));
create policy "coa_safety_all_own" on public.coa_safety for all
  using (exists (select 1 from public.coas c where c.id = coa_id and c.created_by = auth.uid()))
  with check (exists (select 1 from public.coas c where c.id = coa_id and c.created_by = auth.uid()));
