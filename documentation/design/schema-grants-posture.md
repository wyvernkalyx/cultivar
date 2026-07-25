# Schema grants posture -- anon and authenticated across public (D87)

Status: D87 ratified by the operator 2026-07-25 (option A: record the finding,
bank the DDL). No migration ships with this doc. The commit that applies the
revoke DDL amends this status line; until then the posture described below is
the live one.

## Why this exists

The session handoff banked a slice called "anon-grants tightening on both
views." A read-only diagnostic run before any design work refuted that item's
premise in three separate ways. This doc records the observed state, the
refutations, and the ruling, so the next session does not re-derive four
queries' worth of findings or re-open a settled question.

Method: the ratified rulings are D87.1-D87.4 below.

## Observed state (2026-07-25, Supabase MCP connector, privileged session)

The connector runs privileged, so these are catalog observations, not
behavioural ones. Nothing below was inferred from a client round-trip.

**Grants.** Eight relations in `public`, each granting the same seven
privileges to BOTH `anon` and `authenticated` -- sixteen grant rows:

    DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE

    base tables (relkind r): coas, coa_cannabinoids, coa_terpenes,
                             coa_safety, profiles, session_entries
    views     (relkind v): session_current, coa_session_stats

**View updatability.** Both views: `is_updatable = NO`,
`is_insertable_into = NO`, `is_trigger_updatable = NO`,
`is_trigger_insertable_into = NO`. No INSTEAD OF trigger exists on either.

**Row security.** All six base tables `relrowsecurity = true`,
`relforcerowsecurity = false`. Both views `security_invoker = true`.

**Policies.** Nine, all PERMISSIVE, all attached to role `{public}`, every one
keyed on `auth.uid()`:

    coas                 coas_all_own              ALL      auth.uid() = created_by
    coa_cannabinoids     coa_cannabinoids_all_own  ALL      EXISTS (coas c: c.id = coa_id AND c.created_by = auth.uid())
    coa_terpenes         coa_terpenes_all_own      ALL      same shape
    coa_safety           coa_safety_all_own        ALL      same shape
    profiles             profiles_select_own       SELECT   auth.uid() = id
    profiles             profiles_insert_own       INSERT   WITH CHECK auth.uid() = id
    profiles             profiles_update_own       UPDATE   auth.uid() = id
    session_entries      session_entries_select_own SELECT  created_by = auth.uid()
    session_entries      session_entries_insert_own INSERT  WITH CHECK created_by = auth.uid()
                                                            AND EXISTS (coas c: c.id = coa_id AND c.created_by = auth.uid())

**Default privileges.** `pg_default_acl` carries relation-type entries owned by
`postgres` and by `supabase_admin` granting `arwdDxtm` to `anon`,
`authenticated`, and `service_role`. Every future table created in `public`
under either owner inherits the same seven-privilege grant.

## D87.1 -- The banked target is inert

`anon`'s INSERT, UPDATE, and DELETE on `session_current` and
`coa_session_stats` cannot be exercised by anything. Both views are
non-updatable and carry no INSTEAD OF trigger, so PostgreSQL rejects the write
before any privilege or policy is consulted. Revoking them would change no
behaviour, close no path, and produce no observable difference in any client.

The bank item as written -- "tightening on both views" -- therefore targets the
one part of the surface where the grant is provably unreachable.

## D87.2 -- The scope is schema-wide, not view-scoped

The same seven-privilege grant to `anon` sits on all six base tables. The
handoff's view-only framing is an artifact of how it was observed: audit
section [19]'s grants query carries

    where table_schema='public' and table_name in ('session_current','coa_session_stats')

The finding inherited the query's blind spot. A grants observation is
unbounded by relation, or it is a spot-check and must be labelled as one.
(Candidate standing form; not promoted here.)

## D87.3 -- RLS holds the line, and that is why this is not urgent

Under `anon` there is no JWT, so `auth.uid()` returns null. Every policy
predicate above evaluates to NULL rather than true: SELECT returns zero rows,
INSERT fails its WITH CHECK, UPDATE and DELETE match nothing. The grant is
real; the reachable surface behind it is empty.

This was verified by reading the policy expressions, not by assuming their
shape from their names. The residual risk the grants represent is therefore
defence-in-depth against a FUTURE policy mistake -- a policy dropped, a table
added without RLS, a view later made updatable -- not an exposure today.

`relforcerowsecurity = false` means the table owner bypasses RLS entirely.
That is not reachable through PostgREST, which connects as `anon` or
`authenticated`, neither of which owns these tables. Recorded, not acted on.

## D87.4 -- A revoke-only migration would rot, so the DDL is not a one-liner

Because `pg_default_acl` grants the same privileges on future relations, a
migration that revokes on today's eight relations does not prevent the ninth
from inheriting the grant on creation. The durable form additionally requires
`ALTER DEFAULT PRIVILEGES ... REVOKE`, which deviates from Supabase's stock
configuration and carries its own cost: dashboard-created tables, Supabase
tooling, and future extensions all assume the stock defaults.

A snapshot fix that silently stops being true is the trusted-narrative failure
in schema form. Either the slice takes the default ACLs too, or it records
in its own text that it does not and why.

## Ruling

**Doc only. No DDL in this commit.** Grounds: the banked target is inert
(D87.1), the true target is not exploitable today (D87.3), and the durable fix
touches stock platform configuration and deserves its own decided slice
(D87.4). The value delivered here is that the finding is now recorded rather
than re-derived, and the bank item is corrected rather than executed as
written.

The DDL slice is banked, demoted below the `CLAUDE.md` worktree-verification
defect. It is a schema/infra slice: gate is observed state, migration is
operator-applied, and its acceptance criteria re-run the observation forms
below.

## What would change this ruling

Any one of these makes the DDL slice runnable-now rather than banked:

- A view in `public` becomes updatable, or acquires an INSTEAD OF trigger.
- A table is added to `public` without RLS enabled, or with a policy not
  keyed on `auth.uid()`.
- A policy's role list moves off `{public}` in a way that interacts with the
  grants.
- The project takes on a second human user, at which point defence-in-depth
  against a policy mistake stops being hypothetical.

## Observation forms

These are the queries that produced this doc. Re-run them, not their
recollection.

    -- grants, unbounded by relation
    select c.relname, c.relkind, g.grantee, count(*) as priv_count,
           string_agg(g.privilege_type, ',' order by g.privilege_type) as privs
    from information_schema.role_table_grants g
    join pg_class c on c.relname = g.table_name
    join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
    where g.table_schema = 'public' and g.grantee in ('anon','authenticated','public')
    group by 1,2,3 order by 2,1,3;

    -- view updatability (proves reachability, which a grant alone does not)
    select table_name, is_updatable, is_insertable_into,
           is_trigger_updatable, is_trigger_insertable_into
    from information_schema.views where table_schema='public' order by 1;

    -- policy expressions, not policy names
    select tablename, policyname, cmd, roles::text, qual, with_check
    from pg_policies where schemaname='public' order by 1,2;

    -- the rot check
    select defaclobjtype, pg_get_userbyid(defaclrole) as owner, defaclacl::text
    from pg_default_acl;

    -- owner bypass
    select relname, relrowsecurity, relforcerowsecurity from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relkind='r' order by 1;

North stars: `documentation/design/session-entries-schema.md` (the table whose
policies carry the load), `documentation/design/coa-insert.md` (the earlier
schema-gate observation record this one extends).
