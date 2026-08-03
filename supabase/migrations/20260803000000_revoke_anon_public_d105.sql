-- D105: anon is a zero-privilege role in schema public.
-- RLS remains the primary wall; this closes the grant layer beneath it
-- and stops pg_default_acl from re-granting on future relations created
-- by role postgres. supabase_admin's default ACL also grants anon here
-- and cannot be altered from any held role (zero members, observed
-- 2026-08-03); recorded in
-- documentation/design/schema-grants-posture.md, D105.3.

revoke all privileges on all tables in schema public from anon;
revoke all privileges on all sequences in schema public from anon;
revoke all privileges on all functions in schema public from anon;

alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon;
alter default privileges for role postgres in schema public
  revoke all privileges on sequences from anon;
alter default privileges for role postgres in schema public
  revoke all privileges on functions from anon;
