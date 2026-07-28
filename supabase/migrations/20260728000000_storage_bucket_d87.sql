-- COA source PDFs: private Storage bucket and its policy surface
-- (slice 3, D87.1 and D87.2).
--
-- No code writes to this bucket yet. Slice 4 uploads at save time and
-- populates coas.pdf_object_path; slice 5 hashes the bytes. Until then the
-- bucket is empty and correct, exactly as coa_retirements is.
--
-- Design of record: documentation/design/coa-retention-and-possession.md
--
-- Design notes (ratified 2026-07-27):
--   * public = false. A public bucket makes every object world-readable by
--     URL regardless of the coas row's RLS, and a COA is user data.
--   * Constrained at creation (D87.2): application/pdf only, 10 MB ceiling.
--     Raising a limit later is trivial; lowering one after objects exist is
--     not.
--   * Object path is {auth.uid()}/{coa_id}.pdf (D87.1). Ownership is the
--     first path segment, so all four policies key on one expression and
--     there is a single thing to get right rather than four.
--   * Four policies, one per verb, never a single ALL policy (D87.1). An
--     ALL policy cannot be tightened later without dropping the one thing
--     protecting reads.
--   * UPDATE carries BOTH using and with check. using alone would let an
--     owner rename an object into another user's prefix; the check on the
--     way out is what makes the path a boundary rather than a label. The
--     clause a policy needs depends on its verb, and the wrong choice fails
--     open and silently.
--   * to authenticated, which this app's other policies omit. They rely on
--     auth.uid() being null for anon, which is sound but implicit. This is
--     the one table holding file bytes, so anon is excluded by name.
--
-- storage.objects is owned by supabase_storage_admin; this migration runs as
-- postgres, which is neither that role nor a superuser. Creating these
-- policies nonetheless succeeds -- verified 2026-07-28 by a probe that
-- created one and rolled it back. If a future Supabase change revokes that,
-- this file fails loudly at db push rather than degrading quietly.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('coa-pdfs', 'coa-pdfs', false, 10485760, array['application/pdf']);

create policy "coa_pdfs_select_own" on storage.objects for select
  to authenticated
  using (
    bucket_id = 'coa-pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "coa_pdfs_insert_own" on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'coa-pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "coa_pdfs_update_own" on storage.objects for update
  to authenticated
  using (
    bucket_id = 'coa-pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'coa-pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "coa_pdfs_delete_own" on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'coa-pdfs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
