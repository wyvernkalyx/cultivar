# Scoring Read — Views, Bands, and the Shelf's First Consumption of Sessions

Status: design ratified as leans (D59–D62) on 2026-07-16; no implementation
exists. The operator ratified with an explicit revision expectation ("I
really need to see what gets made and then edit") — every display decision
below is v1 and gate-revisable; the view *semantics* (D59's latest-then-
filter order, D61's absence-not-value) are the durable part, because
consumers will be built against them. North stars:
`documentation/design/product-metaphor.md` (disciplines 1–3),
`documentation/design/scoring-lexicon.md` (skeleton item 5: band
placement), `documentation/design/session-entries-schema.md` (the banked
view, its recorded `security_invoker` landmine, and the D52 chain shape
this read layer must never disturb).

## Purpose

Sessions exist; nothing reads them. This pass designs the read layer — how
an append-only chain of entries becomes one current session, how current
sessions become a COA's standing, and what the shelf renders. It writes no
schema and no code; the migration slice and the shelf wiring slice derive
from it.

## D59 — Two views, both `security_invoker = true`, one migration

### `session_current` — latest entry per chain, then soft-delete filtered

One row per live session: the entry with the highest `entry_no` within
each `session_id`, with `deleted = true` chains excluded **after** taking
the latest entry, never before.

Reference shape (the migration slice owns the final SQL):

```sql
create view session_current
  with (security_invoker = true) as
select * from (
  select distinct on (session_id) *
  from session_entries
  order by session_id, entry_no desc
) latest
where deleted = false;
```

**The order of operations is the invariant, not an implementation
detail.** Latest-then-filter means a chain whose latest entry is a soft
delete vanishes whole and no earlier entry resurfaces. Filter-then-latest
would resurrect the pre-delete snapshot — a silent undelete performed by
a query planner. Same family as ND != 0: the absence (a deleted session)
must not decay into a stale value.

### `coa_session_stats` — per-COA aggregate over `session_current`

One row per COA **that has at least one live session** (see D61):

| column | meaning |
|---|---|
| `coa_id` | the COA |
| `created_by` | ownership, carried through for RLS under the invoker flag |
| `session_count` | count of live sessions |
| `average_score` | numeric average of `overall_score`, unrounded — the honest number |
| `band` | `round(average_score)`, smallint 1–5 — the book (D60) |

Reference shape:

```sql
create view coa_session_stats
  with (security_invoker = true) as
select coa_id,
       created_by,
       count(*)::int              as session_count,
       avg(overall_score)::numeric as average_score,
       round(avg(overall_score))::smallint as band
from session_current
group by coa_id, created_by;
```

### Grounds

- **Two views, not one:** the shelf wants the aggregate; the quadrant,
  the intent lens, confound discounting, and AI summaries (all banked by
  name in the lexicon doc) want the per-session grain. `session_current`
  is the one place latest-entry-per-chain is ever computed — no consumer
  reimplements it, so no consumer can get it subtly wrong.
- **`security_invoker = true` is non-negotiable** on both: Postgres views
  otherwise run as their owner and bypass RLS — the landmine the schema
  doc recorded when it banked this view. Under the invoker flag, the base
  table's SELECT policy (`created_by = auth.uid()`) does the scoping;
  the views add no policy surface of their own.
- **Soft-delete exclusion lives in the view, not in consumers:** every
  currently designed consumer wants deleted sessions excluded, and a
  read surface that exposes deleted rows by default hands discipline-3's
  family a foot-gun. The ratified-recompute and hard-erasure ceremonies
  read the base table through a migration or service role — they never
  needed the view.
- **Views, not materialized views, not stored columns:** at cohort scale
  (n~10 users) the aggregate is pennies per query, and a stored
  `average_score` is a cache that can lie. The metaphor doc's provisional
  `average_score` storage direction is satisfied by computation; if scale
  ever demands materialization, that is its own pass with its own
  staleness contract.

## D60 — Band ties round half away from zero

`round(numeric)` is Postgres's built-in behavior: 2.5 → 3, 3.5 → 4.
Ratified as the choice, not inherited as the default: on a symmetric
bipolar scale a .5 average is genuinely ambiguous, and resolving toward
generosity is a product decision this line records. Named alternative,
rejected: half-to-even (statistically purer, zero benefit at this scale,
and it splits behavior from every future client-side compute that
reaches for standard rounding).

## D61 — Untried is absence, not a value

A COA with zero live sessions has **no row** in `coa_session_stats`. The
shelf LEFT JOINs (or equivalent) and renders neutral on null. Never a
band 0, never a defaulted 3, never a sentinel. Discipline 2 enforced by
shape — the row that doesn't exist cannot be mis-rendered — same family
as the UPDATE policy that doesn't exist on `session_entries`.

Corollary the wiring slice must honor: a COA whose only sessions are
soft-deleted **returns to untried**, visually and computationally. That
is not an edge case to paper over; it is D61 working.

## D62 — The shelf renders the band word, never the number

v1 display: a scored COA's card shows its band's word — the lexicon's
overall vocabulary at hidden values 1–5 ("I hated it" … "I loved it") —
sourced from `RUNGS` in `src/lib/lexicon.ts`, never a second string
table. The average stays hidden everywhere in the UI. Grounds: the
survey deliberately never shows the user a number (lexicon doc), and one
shelf label leaking `3.7` undoes that. Untried cards show no word and no
placeholder (D61).

Explicitly v1 and expected to change (operator, at ratification): the
word is a stand-in until the art pass replaces it with the mood visual
(five moods + neutral, metaphor doc). `session_count` is computed and
exposed by the view but **not rendered** in v1 — whether the card shows
"n sessions" is an art-pass question, banked.

## The truncate ruling (operational; no D-number)

`session_entries` currently holds 50+ rows of gate-testing junk
(disposable by the ratified test-phase ruling; last observed 51 on
2026-07-16). The operator truncates the table — privileged SQL editor,
operator-run, one statement:

```sql
truncate table session_entries;
```

**Timing: immediately before the shelf-wiring slice's device gate**, not
before. Grounds: ladder testing between now and then stays free, and the
gate opens on a clean table so the first computed shelf is over real
verdicts, not junk. The migration slice's gate does not need clean data —
observed catalog state adjudicates it, not row contents.

## Slices this doc governs

1. **Migration slice** (schema/infra): one migration creating both views.
   Gate: observed state — the two views present in
   `pg_views where schemaname = 'public'`, and
   `pg_class.reloptions` (or the dashboard's view definition) showing
   `security_invoker=true` on both. Any view without the flag fails the
   gate, full stop. Implementer writes the migration; operator applies it
   (`npx supabase@latest db push` — credentialed, operator-run only).
2. **Shelf wiring slice** (UI): the shelf list consumes
   `coa_session_stats`; scored cards render the band word; untried cards
   render exactly as today. Gate: physical iPhone, after the truncate,
   with a checklist that includes perception steps and a control case
   (an untried card that must NOT change).

## Non-goals (this pass)

- `never_again` and in-stock — no storage, no toggle UI exists yet;
  skeleton item 6 ratified the *structure*, and the column lands with the
  slice that renders it.
- Session recency/moment on the shelf — the aggregate discards
  `created_at`; retrievable from `session_current` whenever a consumer
  argues it in.
- Rich-path question placement (fit/context/co-alcohol) — unbanked by the
  prior handoff, still its own design pass, not a rider here.
- Mood visual language, card art, `session_count` display — art pass.
- The quadrant, intent lens, confound discounting — banked consumers;
  this doc only guarantees `session_current` gives them their grain.
- Any change to `session_entries`, its policies, or existing tables.

## Open questions (named, not improvised)

- Whether the shelf sorts by band once bands exist (today's ordering is
  untouched by this doc; a sort change is a product decision for the
  wiring slice's design amendment, not an implementer default).
- `session_id` index — still banked on "when something reads by chain";
  `session_current` reads by chain, so the migration slice should state
  whether it lands now or stays banked (architect lean: land it in the
  same migration, one line, the read exists now).
