# Session Entries — Schema

Status: design ratified (D52–D53); no implementation exists. This is
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
| `lexicon_version` | smallint | not null | the vocabulary the answers were given under; the client sends its constant (1 today) |
| `overall_word` | text | not null | the raw answer — the word as tapped |
| `overall_score` | smallint | not null, check between 1 and 5 | the hidden value at that lexicon_version |
| `intent` | text | nullable | null = unanswered (D48), never coerced to "just because" |
| `fit` | text | nullable | 3-point strings v1; intent-relative, never touches the score |
| `context` | text | nullable | free entry v1 |
| `co_alcohol` | boolean | nullable | null = unanswered; true = chip tapped; false reserved for a future explicit-no |
| `deleted` | boolean | not null, default false | soft delete is an entry with true |
| `created_at` | timestamptz | not null, default `now()` | the session's moment is its **first** entry's created_at |

Column decisions that are design, not accident:

- **Word and score are both stored.** The word is the raw truth
  (skeleton item 3: raw answers preserved); the score is the computation
  at that `lexicon_version`. There is deliberately **no** check
  constraint tying word to value — that would hardcode vocabulary into
  the schema and fight the versioning architecture.
- **No separate session timestamp.** The chain already knows its moment.
- **Fact classes are distinct columns** (skeleton item 4), thin in v1 by
  design: `intent`, `fit`, `context`, `co_alcohol`.
- **Intent/fit/context are text**, not enums: vocabularies are v1 and
  provisional, user-extensible by design (lexicon doc). Enums would put
  vocabulary in the schema.

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
