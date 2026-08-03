-- Profile reset -- slice 4 of D110-D112: the profile_resets event table
-- and the reset_profile RPC.
--
-- Design of record: documentation/design/profile-reset-and-export.md
--
-- Design notes:
--   * profile_resets is append-only by policy absence, exactly as
--     session_entries (D52) and coa_retirements do it: INSERT and
--     SELECT only. A policy that does not exist cannot be bypassed by a
--     buggy client.
--   * No parent-ownership predicate on the INSERT policy. The two
--     tables this shape is copied from carry coa_id and gate on the
--     parent COA; profile_resets has no parent, so ownership is
--     created_by alone. Stated so the shorter predicate reads as
--     deliberate rather than as a dropped clause.
--   * The function runs as its caller, stated explicitly on the
--     definition below and gated on prosecdef = f (CLAUDE.md), with an
--     empty search_path and every reference schema-qualified.
--   * Every mutation carries created_by = auth.uid() as a predicate in
--     its own right, per the D88.1 grounds: the function must not rely
--     on RLS for its scoping, even though RLS also binds here.
--   * The snapshot is captured BEFORE any mutation. It is the only
--     record of the pre-reset favorite and on_shelf_count values, which
--     are the two reset effects not recoverable from raw rows (D110.2).
--   * The closing entries copy lexicon_version from the source row and
--     never a client constant (D110 step 1): a copy is not a new
--     answer.
--   * INSERT ... SELECT over session_current is safe against its own
--     output. The statement reads one snapshot taken at statement
--     start, so the deleted = true rows it writes cannot re-enter the
--     view it is reading and the insert cannot feed itself.
--   * created_by is not passed on either insert. Both columns default
--     to auth.uid(), so the caller cannot name a different owner --
--     the retire_coa precedent (20260729110106).
--   * reset_profile does not call retire_coa (D110.1). That RPC is the
--     survey-facing path -- one package, operator-authored reasons, a
--     favorite prompt -- and inserting the events directly keeps the
--     system-written reason out of the survey vocabulary.
--   * Events are written BEFORE the count is zeroed. The events are the
--     record and the count is derived state (D89); zeroing first would
--     leave the event generator reading the value it just destroyed.
--   * Grants mirror retire_coa (20260729110106) and find_coa_duplicates
--     (20260728171246) verbatim.
--   * No index on profile_resets. Nothing reads it yet -- zero rows, no
--     code path -- and the retention slice's precedent is that
--     FK-supporting indexes land with the first reader. Stated so the
--     absence reads as deliberate, not forgotten.

create table public.profile_resets (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  sessions_hidden integer not null,
  snapshot jsonb not null
);

-- RLS: the entire policy surface. INSERT and SELECT of own rows.
-- Nothing else exists.
alter table public.profile_resets enable row level security;

create policy "profile_resets_insert_own" on public.profile_resets for insert
  with check (created_by = auth.uid());
create policy "profile_resets_select_own" on public.profile_resets for select
  using (created_by = auth.uid());

create function public.reset_profile()
  returns jsonb
  language plpgsql
  security invoker
  set search_path = ''
as $$
declare
  v_snapshot jsonb;
  v_sessions_hidden integer;
  v_favorites_cleared integer;
  v_packages_retired integer;
begin
  -- (a) The pre-state, captured before anything moves. coalesce covers
  -- the caller with no COAs at all: the aggregate returns null over
  -- zero rows and the column is not null.
  select coalesce(
           jsonb_object_agg(
             c.id::text,
             jsonb_build_object(
               'favorite', c.favorite,
               'on_shelf_count', c.on_shelf_count
             )
           ),
           '{}'::jsonb
         )
    into v_snapshot
    from public.coas c
   where c.created_by = auth.uid();

  -- (b) One closing entry per live chain.
  insert into public.session_entries
    (session_id, coa_id, lexicon_version, overall_word, overall_score,
     notes, deleted)
  select session_id, coa_id, lexicon_version, overall_word,
         overall_score, notes, true
    from public.session_current
   where created_by = auth.uid();
  get diagnostics v_sessions_hidden = row_count;

  -- (c) Favorite is revisable state, not a record; nulling is not
  -- destruction. The is-not-null predicate keeps the reported count
  -- honest -- rows already null were not cleared by this reset.
  update public.coas
     set favorite = null
   where created_by = auth.uid()
     and favorite is not null;
  get diagnostics v_favorites_cleared = row_count;

  -- (d) One event per package on the shelf, then the zeroing.
  insert into public.coa_retirements (coa_id, reason)
  select c.id, 'Profile reset'
    from public.coas c
   cross join lateral generate_series(1, c.on_shelf_count)
   where c.created_by = auth.uid()
     and c.on_shelf_count > 0;
  get diagnostics v_packages_retired = row_count;

  update public.coas
     set on_shelf_count = 0
   where created_by = auth.uid()
     and on_shelf_count > 0;

  -- (e) The reset itself, recorded as an event.
  insert into public.profile_resets (sessions_hidden, snapshot)
  values (v_sessions_hidden, v_snapshot);

  -- (f) The completion state's three counts.
  return jsonb_build_object(
    'sessions_hidden', v_sessions_hidden,
    'packages_retired', v_packages_retired,
    'favorites_cleared', v_favorites_cleared
  );
end;
$$;

revoke execute on function public.reset_profile() from public;
revoke execute on function public.reset_profile() from anon;
grant execute on function public.reset_profile() to authenticated;
