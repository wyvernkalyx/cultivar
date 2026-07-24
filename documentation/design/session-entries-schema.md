# Session Entries — Schema

Status: design ratified (D52–D53); schema revised for the D70-D76 survey (D77, 2026-07-18; see Amendment at end); no migration applied yet. This is
slice 2 of the plan in `documentation/design/session-logging.md`, which
deliberately excluded schema. North stars: that doc (the mechanic this
table records) and `documentation/design/scoring-lexicon.md` (the durable
skeleton, especially items 2–4 and the D47 amendment).

## D52 — One table, append-only chain

A session is a **chain of entries** in a single table, `session_entries`.
Every user action is an INSERT: the drop inserts entry 1; a chip tap
inserts entry 2 (full snapshot, intent now filled); a re-drag inserts
entry 3; soft delete inserts an entry with `deleted = true`. The latest
entry in a chain wins, always.

**No UPDATE policy and no DELETE policy exist on this table.** That is
the point, not an omission: D47's "nothing recorded is ever silently
destroyed" and skeleton item 3's "never rewrite what was recorded" are
enforced by the schema's shape — a policy that does not exist cannot be
bypassed by a buggy or malicious client. Same family as ND != 0: the
invariant lives in structure, not in code promising to behave.

Ruled over the alternative: one-row-per-session with a revisions
side-table and an UPDATE path. Simpler reads, but "history is preserved"
would rest on a trigger faithfully snapshotting before every UPDATE — a
convention with moving parts. Rejected on those grounds.

Costs, named and accepted: each entry carries a full answer snapshot
(duplication — pennies at this scale); reads need latest-entry-per-chain
(see Banked); a deliberate ratified recompute or account-level hard
erasure goes through a migration or service role — exactly the ceremony
those operations deserve.

## The table

| column | type | constraints | meaning |
|---|---|---|---|
| `id` | uuid | pk, default `gen_random_uuid()` | entry identity |
| `entry_no` | bigint | `generated always as identity` | strict global order; within-chain order derives from it |
| `session_id` | uuid | not null | the chain key; client-generated at drop time |
| `created_by` | uuid | not null, default `auth.uid()`, references `auth.users (id)` on delete cascade | ownership; the `coas` convention verbatim, observed at `20260708220816_create_core_schema.sql:39` — name included: the repo's convention is `created_by`, and this table does not diverge from it (ratified during this pass when the divergence was flagged) |
| `coa_id` | uuid | not null, references `coas(id)` **on delete cascade** (D53) | what was consumed |
| `lexicon_version` | smallint | not null | the vocabulary the answers were given under; the client sends its constant (3 today, D77/D85) |
| `overall_word` | text | not null | the raw answer — the word as tapped |
| `overall_score` | smallint | not null, check between 1 and 5 | the hidden value at that lexicon_version |
| `energy` | text | nullable | axis 1 (D71); null = unanswered |
| `environment` | text | nullable | axis 2 (D71); null = unanswered |
| `main_goal` | text | nullable | axis 3, the intent anchor (D71-D72); a null Main Goal is the aimless session (D73) (renamed by D85; documentation/design/glossary.md) |
| `fit` | text | nullable | 3-point strings v1; intent-relative, never touches the score |
| `co_consumption` | text[] | nullable | multi-select confound panel (D75); presence-only; null/empty both = nothing recorded |
| `physical_state` | text[] | nullable | multi-select baseline panel (D76); presence-only; null/empty both = nothing recorded |
| `deleted` | boolean | not null, default false | soft delete is an entry with true |
| `created_at` | timestamptz | not null, default `now()` | the session's moment is its **first** entry's created_at |

Column decisions that are design, not accident:

- **Word and score are both stored.** The word is the raw truth
  (skeleton item 3: raw answers preserved); the score is the computation
  at that `lexicon_version`. There is deliberately **no** check
  constraint tying word to value — that would hardcode vocabulary into
  the schema and fight the versioning architecture.
- **No separate session timestamp.** The chain already knows its moment.
- **Fact classes are distinct columns** (skeleton item 4). Amended by
  D77 (derived from D76, not re-authored here): `energy`/`environment`/`main_goal`
  (three axes), `fit`, `co_consumption`, `physical_state`; `context` removed.
- **Fact-class values are text**, not enums: vocabularies are v1 and
  provisional, user-extensible by design (lexicon doc). The multi-select
  panels are `text[]` for the same reason (D77) — one column per fact class,
  zero migration to add a value. Enums would put vocabulary in the schema.

## RLS (the entire policy surface)

- `alter table session_entries enable row level security;`
- **INSERT**: own rows only (`created_by = auth.uid()`), **and** `coa_id`
  must reference a COA the user owns — the same parent-ownership
  predicate the analyte tables' policies already use, observed at
  `20260708220816_create_core_schema.sql:85-87`:
  `exists (select 1 from public.coas c where c.id = coa_id and
  c.created_by = auth.uid())`, in both `using` and `with check`.
- **SELECT**: own rows only (`created_by = auth.uid()`).
- **Nothing else.** No UPDATE, no DELETE, by design (D52).

## D53 — COA delete cascades

`coa_id` is `on delete cascade`. Deleting a COA takes its session
entries with it — user-initiated, dialog-guarded, never silent. Grounds:
the realistic delete case is a duplicate or mistaken ingest, where the
sessions are part of the mistake; the alternative (restrict) makes any
COA permanent the moment it is logged against, a dead end. Accepted
consequences: the delete dialog copy must grow "...and its logged
sessions" in the wiring slice, and COA delete is the one
dialog-guarded exception to soft-delete-only.

## Banked (named so they are not improvised later)

- **The latest-entry-per-chain read view** belongs to the scoring slice,
  not this one — nothing reads sessions yet. Landmine, recorded:
  Postgres views bypass RLS unless created `with (security_invoker =
  true)`. When that view is built, the flag is non-negotiable.
- **Ratified recompute** from preserved raw answers (skeleton item 3):
  a migration-or-service-role ceremony, never a client path.
- **Account-level hard erasure** (D47): banked privacy feature, same
  ceremony class.

## Non-goals (this slice)

- No view, no scoring, no band placement, no `average_score` /
  `never_again` storage — those belong to the scoring slice against the
  metaphor doc.
- No wiring: the ladder keeps its no-persistence honesty label until the
  wiring slice.
- No changes to existing tables or policies.
- No seed data.

## Gate

Schema/infra slice: the gate is **observed state** — pg_tables shows
`session_entries` with `rowsecurity = true`, and pg_policies shows
exactly two policies on it (INSERT, SELECT) and no others. The
migration is written by the implementer and applied by the operator
(`npx supabase@latest db push` — credentialed, operator-run only).

## Amendment (D77) -- schema revision for the D70-D76 survey, 2026-07-18

Operator-ratified in chat. Zero session rows exist; test data is disposable, so this is free today. This is the schema pass the D74-D76 hand-off in scoring-lexicon.md deferred by name; it reconciles this table with that amendment. The fact-class list is now derived from D76, not independently authored -- the two docs cross-reference and must not drift.

### Column changes
- intent (1 text col) removed; three nullable text columns replace it (D71): energy (Chill/Active/Buzzing), environment (Solo/Social), spark (Relief/Flow/Munchies, the anchor per D72). null = unanswered per axis. Spark-null is the aimless session (D73).
- context dropped (D74). At zero rows a plain column drop. Migration note: session_current selects `*`, expanded to explicit columns at creation, so dropping context forces a drop-and-recreate of that view -- see View-recreate hazard.
- co_alcohol (boolean) removed; co_consumption text[] replaces it (D75): Alcohol, Caffeine, Nicotine, Fatty food, Terpene-rich food; multi-select, presence-only. The boolean's "false reserved for explicit-no" is dropped: an array cannot distinguish "checked, none" from "unanswered," and D75 ratified that collapse.
- physical_state text[] added (D76): Dehydrated, Fatigued, Stressed; same array shape, same null/empty collapse.
- lexicon_version client constant is 2 today (was 1): the survey vocabulary turned over (D70 scale strings, D71 whole intent vocabulary), not merely a word.

### Why text[] and not booleans or a child table
Faithful to the ratified principle (distinct column per fact class, text not enums, provisional), extended from scalar to multi-valued facts. Booleans rejected: one per substance explodes a fact class into many columns and makes each new substance a migration -- the co_alcohol shape being replaced. Child table rejected: breaks one-row-per-snapshot latest-wins (D52); a session's truth would span tables and session_current's distinct-on cannot reach across. text[] chosen: one column per fact class, zero migration to add a value, presence-only reads clean; typo-as-silent-category controlled by a fixed client constant (lexicon.ts), no DB constraint.

### Cross-version score averaging -- landmine, recorded
overall_score is stored resolved and coa_session_stats averages it across all lexicon_versions. Valid ONLY because D70 kept the hidden 1-5 mapping identical: a v1 score 3 ("Meh") and a v2 score 3 ("Mid") both mean the middle. This holds for word swaps; it does NOT hold for a scale-shape change (5 points -> 7), where v1-score-3 and v3-score-3 are incommensurable and coa_session_stats would silently average across the boundary -- same family as session_current's latest-then-filter trap. Rule: cross-version averaging is valid only while the hidden-value mapping is stable; a scale-shape change requires the ratified recompute (skeleton item 3) before coa_session_stats spans the boundary. No action at zero rows.

### View-recreate hazard -- the one live risk in this pass
Dropping context forces a drop-and-recreate of session_current (selects `*`); coa_session_stats reads from session_current. This reopens, for the migration's duration, the RLS-bypass this doc banked as non-negotiable: Postgres views bypass RLS unless created with (security_invoker = true). A column-drop that recreates a view is exactly where the flag gets forgotten. Non-negotiable in the migration: both views come back with (security_invoker = true). The migration gate must re-observe both views' reloptions showing security_invoker=true, not only pg_tables/pg_policies. A column-drop must not silently reintroduce the bypass verified absent this session.

### RLS -- unchanged, confirmed not assumed
INSERT/SELECT scope on created_by = auth.uid() plus parent-COA ownership. No new column touches that predicate -- axes, panels, and the context drop are all payload, not ownership. D77 changes the column set and touches zero policy surface. Append-only shape (no UPDATE, no DELETE) unchanged.

### Migration sequencing (named, not designed here)
Implementer authors, operator applies (db push, credentialed). Must: add three axis columns, add physical_state, replace co_alcohol with co_consumption, drop context, recreate both views with security_invoker = true. Gate: observed state -- new column set, RLS on with the same two policies, and both views observed security_invoker=true after apply.
