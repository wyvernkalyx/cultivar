# COA Insert — RPC Contract (slice 6a)

Status: designed (D39, D40), not implemented. Companion to
`documentation/design/confirm-edit-screen.md` ("Output / insert contract" and
"Confirm wiring (slice 6b, D40)").
Schema observed 2026-07-13 (Supabase SQL editor, both queries pasted whole):
five tables, RLS true on all five, 7 policy rows — matching
`supabase/migrations/20260708220816_create_core_schema.sql`, read end to end
the same day. The five-session schema-gate carry is closed.

## Decision (D39)

A single Postgres RPC, `public.insert_coa(payload jsonb) returns uuid`,
`security invoker`, performs the whole four-table write. Grounds:

- Atomicity is free: a plpgsql body is one transaction — parent insert,
  captured id, three child inserts, all-or-nothing. The committed output
  contract forbids per-table client REST for exactly this reason.
- RLS stays load-bearing: `security invoker` runs every insert as the
  calling user, so `coas_all_own`'s `with check` and the children's
  parent-ownership `exists` checks all fire. The children see the
  just-inserted parent because it is the same transaction. No service-role
  key exists anywhere in this path.
- The Edge Function alternative is either wrong (four supabase-js inserts
  are the forbidden non-transactional per-table REST in a server costume)
  or redundant (a hop that only calls this RPC). Payload-shape validation
  is the one thing an Edge Function would add; it is banked with the
  envelope-unwrap redesign, not bought now.
- The parser-key -> column mapping lives here, once, at the seam. The
  client sends the screen's emission verbatim.

## Mapping (parser-key space -> columns)

| payload key | column | handling |
|---|---|---|
| `strain`, `brand`, `batch`, `lab` | same names | `payload->>'key'`; json null -> SQL NULL |
| `sourceLab` | `source_lab` | text |
| `totalThcPct` / `totalCbdPct` / `totalTerpenesPct` | `total_thc` / `total_cbd` / `total_terpenes` | `(payload->>'key')::numeric`; json null -> SQL NULL — NEVER coalesce to 0 |
| `terpenes[]` (`name`, `pct`) | `coa_terpenes` | `jsonb_array_elements`; `pct` null-preserving |
| `cannabinoids[]` (`name`, `pct`) | `coa_cannabinoids` | same |
| `safety[]` (`category`, `status`) | `coa_safety` | both columns `not null`; the draft satisfies this by construction |
| (absent) | `type`, `pdf_url` | never read; columns default NULL |
| (never sent) | `created_by`, `id`, `created_at` | DB defaults; `default auth.uid()` owns `created_by` — the client MUST NOT send it |

## Function requirements

- `language plpgsql`, explicit `security invoker`, `set search_path = ''`
  with every reference schema-qualified (the `handle_new_user` precedent in
  the core-schema migration).
- Returns the new `coas.id` (uuid).
- No coalesce-to-zero anywhere; ND is NULL end to end. This is the
  no-fabrication product invariant at the DB seam and outranks convenience.
- Grants: revoke execute from `public` and `anon`; grant execute to
  `authenticated` only. The RPC is reachable only with a user token.
- Migration file authored by Claude Code at
  `supabase/migrations/<timestamp>_insert_coa_rpc.sql`; applied by the
  operator (`npx supabase@latest db push` — credentialed, operator-run).

## Gate (typed: schema/infra — observed state)

1. Function visible in the Supabase dashboard after `db push`.
2. One authenticated REST rpc invoke (D26 token flow, command-substituted
   token, never hand-pasted) with a real corrected `animal-face` payload ->
   returns a uuid.
3. Authenticated read-back, same user: 1 `coas` row + expected child counts;
   a value that was cleared to ND in the draft reads back as NULL, not 0.
4. Atomicity control: a second invoke with a deliberately broken child row
   (e.g. a safety entry missing `status`) must error AND leave zero new rows
   in all four tables — observed by read-back, not assumed.
5. The SQL editor CANNOT gate this: it runs privileged, `auth.uid()` is null
   there, and the invoker function would fail on `created_by` — which would
   be RLS working, not the function failing.

Gate row disposition: the successful gate insert is real, corrected data and
is KEPT as the first genuine shelf entry (default recorded 2026-07-13; the
operator may override and delete it after observation).

## Non-goals

- Storage bucket / `pdf_url` persistence.
- Cross-user dedup (per-user rows, per the core-schema design notes).
- Payload-shape validation beyond Postgres constraints (banked with the
  envelope-unwrap redesign).
- The 6b client wiring — separate slice; see `confirm-edit-screen.md`.
