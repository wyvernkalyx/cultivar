# COA Retention, Dedupe, and Possession -- design (D87-D91)

Status: RATIFIED 2026-07-27 (D87-D91, plus the nine sub-decisions in
"Ratification and amendments"). Slices 1-3 are implemented (docs `3b08e68`,
schema `bc7a91b`, bucket `0705eef`); slices 4-6 are not. This status line is
amended by the commit that changes its truth.

North stars: `documentation/design/product-metaphor.md` (the "in stock"
open question this pass answers), `documentation/design/session-entries-schema.md`
(the `coas` conventions and the D53 cascade), `CLAUDE.md` (no fabricated
data; nothing recorded is silently destroyed).

---

## Observed baseline (2026-07-26, read-only SQL)

Stated so this doc can be falsified rather than believed. Every line below
was observed, not recalled.

- `coas` columns: `id`, `created_by`, `strain`, `brand`, `batch`, `lab`,
  `source_lab`, `type`, `total_thc`, `total_cbd`, `total_terpenes`,
  `pdf_url`, `created_at`, `sampled_on`, `tested_on`.
- `coas` constraints: PK on `id`; FK `created_by` -> `auth.users(id)` on
  delete cascade. Indexes: `coas_pkey`, `coas_created_by_idx`.
  **No unique constraint of any kind beyond the primary key.**
- `coas` RLS: exactly one policy, `coas_all_own`, `cmd = ALL`, both `qual`
  and `with_check` = `(auth.uid() = created_by)`. Unlike `session_entries`,
  this table IS client-updatable and client-deletable.
- `storage.buckets`: **zero rows.** (Confirms the 2026-07-15 observation in
  `follow-ups.md`, still true eleven days later.)
- `session_entries`: **0 rows** -- emptied this session by deliberate
  operator reversal of D85.3 (see Ratified reversals, below).
- `coas`: 5 rows. `pdf_url` null on all five. `tested_on` null on all five.
  Three rows are `Animal House / RAINBOW RUNTZ / S01-RARU / total_thc
  22.7326 / total_terpenes 1.53` -- identical to four decimal places,
  created 07-17, 07-22, 07-25. These are one document ingested three times,
  not three lots.

### Ratified reversal recorded (2026-07-26)

**D85.3 is reversed for the test-phase rows.** D85.3 retired "vocabularies
revise freely" on the grounds that 135+ recorded rows made revision
consequential. Operator confirmed 2026-07-26 that those rows were
device-gate artifacts and that zero real sessions had ever been logged.
195 entries across 29 chains were deleted; `session_entries`,
`session_current`, and `coa_session_stats` all observed at 0 afterward.

D85.3's rule stands for every row recorded from here forward. The reversal
is scoped to the test-phase data it was written to protect and which turned
out to represent nothing.

---

## Purpose

Three defects share one root: the COA row is currently the only record of
the COA, and it is treated as both a lab document and a physical thing.

1. **The source PDF is discarded after parsing.** Every analyte value in
   `coa_terpenes`, `coa_cannabinoids`, and `coa_safety` is derived from a
   document that no longer exists. There is no re-parse path when a parser
   is fixed, and no audit path for the no-fabrication invariant. The
   strongest guarantee that a value was not invented is the document it
   came from.
2. **Ingest has no duplicate detection.** Re-uploading a COA creates a
   second shelf entry and splits that product's sessions across two
   `coa_session_stats` averages.
3. **There is no possession state.** `product-metaphor.md` names "in stock"
   as a needed primitive and records that the schema does not have one. The
   only way to clear a finished product off the shelf today is to delete the
   COA, which cascades (D53) and destroys its logged sessions -- forcing a
   choice between a cluttered shelf and destroying the engine's own training
   data.

This pass separates the durable lab document from the perishable physical
package, without introducing a second entity.

---

## D87 -- COA source PDFs are retained

Every successfully saved COA retains its source PDF in Supabase Storage. The
object reference is stored on the `coas` row.

**Upload at save time, never at parse time.** The design is taken from the
`follow-ups.md` banked item verbatim: a rejected or abandoned parse must not
leave orphan files. Parsing happens first and writes nothing to Storage; the
upload occurs in the same user action that commits the `coas` row.

- Bucket: private (`public = false`), owner-scoped by Storage RLS. Never a
  public bucket -- a COA is user data, and a public bucket makes every
  object world-readable by URL regardless of the `coas` row's RLS.
- **`pdf_object_path` stores the object path, not a URL** (D87.3). Signed
  URLs expire; a stored signed URL is a value that silently rots. The client
  mints a signed URL at read time from the stored path. The inherited
  `pdf_url` column is not reused and stays dormant; removing it is banked as
  its own `chore:`.
- **Delete must reach Storage.** D53's cascade is a foreign key; foreign
  keys do not reach Storage objects. A COA delete that removes the row and
  leaves the object is an orphan leak. The delete path removes the object
  explicitly, and failure to do so is surfaced, never swallowed.

Grounds: parses are editable (the confirm/edit slice), and once the source
is gone there is no ground truth to check an edit against. This is the same
family as ND != 0 -- the invariant is protected by keeping the evidence, not
by trusting the derivation.

Costs, named and accepted: storage volume grows with every COA; the delete
path gains a second failure mode.

---

## D88 -- Duplicate detection on ingest, and it never merges silently

Ingest computes a SHA-256 hash of the PDF bytes and stores it on `coas`.
Duplicate detection uses two independent signals:

- **Content hash match** -- byte-identical document. Fast path, high
  confidence.
- **Natural key match (`created_by` + `lab` + `batch`)** without a hash
  match -- same lot, different bytes. Two causes: the document was
  re-downloaded and embeds a new generation timestamp, or the lab issued a
  **revised** COA with corrected results.

Neither signal is sufficient alone. A hash-only rule misses the re-download
case; a natural-key-only rule would silently swallow a lab correction, which
is a fabricated-data failure -- the app would show superseded results as
current.

**On any match, the user is prompted. Ingest never merges, increments, or
discards on its own.** Three outcomes:

1. **"I bought another package"** -> increment `on_shelf_count` (D89). No new
   `coas` row.
2. **"I uploaded this by mistake"** -> discard the upload. Nothing changes.
3. **"This is a corrected/updated report"** -> a new `coas` row. The prior
   row is left intact; superseding logic is explicitly banked, not
   improvised here.

Grounds: an accidental double-upload and a genuine second package are
indistinguishable to a hash. Auto-incrementing on a hash match writes a
fabricated fact about the user's inventory. Named cost: a prompt on a path
that is usually a mistake.

**Not a unique constraint.** No unique index is added on hash or on
`(created_by, lab, batch)`. A database constraint would make outcome 3
impossible and would turn a user-facing question into an insert error. The
check belongs in the ingest path where the user can answer it.

Landmine, recorded: `batch` and `lab` are parser output, and parser output
is not guaranteed. One of the five live rows has `brand = ''` (empty string,
not null), which is the ND != 0 principle violated at the string level. The
natural key must treat empty string as absent, and a row with no `batch`
falls back to hash matching only.

---

## D89 -- Possession is a count on the COA, not a second entity

`coas` gains `on_shelf_count` (integer, not null, default 1). This is the
"in stock" primitive `product-metaphor.md` names as missing.

- `> 0` -- on the shelf. The card renders with a quantity badge when `> 1`.
- `0` -- off the shelf. The COA is **not deleted**: its chemistry, its logged
  sessions, its average, its band, and its favorite flag all survive intact.
  Off-shelf is a display state, not an erasure.
- One card per COA regardless of count (operator-ratified 2026-07-26). Two
  packages of one batch are one card marked x2.

**Ruled over the alternative: a `jars` table**, one row per physical package,
with `session_entries.coa_id` re-pointed at the jar. Rejected on
lived-demand. It buys jar-level provenance (same batch, one stored badly)
that nothing today reads, at the cost of a new table, new RLS, a shelf query
rewrite, and an FK migration. The architect proposed it and withdrew it: the
argument used was D71's recover-later asymmetry, which holds only when
capture is genuinely free, and this capture is not. If jar-level provenance
ever earns a consumer, the retirement events (D90) will already be there to
seed it.

**The count is derived state; the events are the record.** This is the
`session_entries` / `session_current` pattern reused, not a new idea.

Named cost, accepted: with one card and many sessions, a session cannot say
which physical package it came from. Sessions stay on `coa_id`. No migration
on `session_entries`.

---

## D90 -- Retirement is an append-only event, not a decrement

A new table, `coa_retirements`. One row per package retired.

A counter alone cannot hold the verdict: `2 -> 1 -> 0` records that packages
left the shelf and loses whether each was finished or abandoned.
Decrementing is destructive, and "nothing recorded is ever silently
destroyed" applies.

**The retirement survey, two questions, asked once per package:**

1. **Why?** -- `Smoked it all` / `Gave up on it`. Required; this is the event.
2. **Would you buy it again?** -- writes `coas.favorite` (D91). Optional.

Two packages of one batch produce two events and are free to disagree. That
disagreement is signal, not an inconsistency to reconcile.

- The vocabulary is text, not an enum, per the standing convention: values
  are provisional and an enum puts vocabulary in the schema.
- Append-only enforced by policy absence -- **INSERT and SELECT only, no
  UPDATE, no DELETE**, exactly as `session_entries` does it (D52). A policy
  that does not exist cannot be bypassed by a buggy client.
- Retirement decrements `on_shelf_count` by one, floored at 0.

Named cost, operator-accepted 2026-07-26: with only two reasons, a package
that went bad, spilled, or was given away records as `Gave up on it` and
reads as a preference verdict on a product that may have been fine. Tolerable
at one user; noisier with real ones. A third reason is banked.

**Copy constraint:** when `on_shelf_count` will still be `> 0` after the
retirement, the survey must not say "taking this off the shelf" -- the card
stays. Wording is operator-owned.

---

## D91 -- Favorite is repurchase intent, and it is not Never Again

`coas` gains `favorite` (boolean, **nullable**).

- `true` -- would buy again.
- `false` -- would not buy again.
- `null` -- never asked. Unanswered is not an answer (D48, applied here).

Settable at any time from the COA detail view, and prompted at retirement.
It lives on `coas`, not on the retirement event, because it is a verdict about
the chemistry: a favorite must survive every package being gone, since
repurchase is the entire point.

**Distinct from `never_again`.** `product-metaphor.md` discipline 3 defines
Never Again as a display override to the darkest band, leaving the honest
computed average intact underneath. `favorite = false` is weaker and
different: a product can be perfectly decent and still not worth buying
again. Collapsing them would let a mild verdict banish a card. `never_again`
remains unimplemented and out of scope here.

Landmine, recorded: D85.1 already renamed the top rung to `Loved` and
explicitly retired the word `Favorite` from the session vocabulary. "Favorite"
here is a COA-level flag, not a rung. If the collision reads badly in use,
rename the flag, never the rung.

---

## Ratification and amendments (2026-07-27)

D87-D91 ratified by the operator, per-decision, 2026-07-27. The nine
sub-decisions below were authored by the architect under a delegation of
security, performance, and best-practice judgment, and are ratified with
them. Each is numbered against its parent so the parent's grounds still
govern.

**D87.1 -- the Storage predicate and path shape are pinned, not described.**
Object path is `{auth.uid()}/{coa_id}.pdf`. Policies on `storage.objects`
are written per verb -- SELECT, INSERT, UPDATE, DELETE, four separate
policies -- each with
`bucket_id = '<bucket>' and (storage.foldername(name))[1] = auth.uid()::text`.
Grounds: "owner-scoped by prefix" is a description, not a predicate, and a
bucket whose policy set is described rather than written is how a private
bucket turns out to be readable. Four verbs because a single ALL policy
cannot be tightened later without dropping the one thing protecting reads.

**D87.2 -- the bucket is constrained at creation.** `public = false`,
`allowed_mime_types = ['application/pdf']`, and an explicit file size limit.
Grounds: a private bucket with no type or size ceiling is still an upload
surface. The limit is set at creation because raising one later is trivial
and lowering one after objects exist is not.

**D87.3 -- Q1 resolved: a new `pdf_object_path` column, and `pdf_url` is
left in place.** Grounds: `pdf_url` is null on all five rows and neither
view references it, so reuse is technically available -- but a column named
`url` holding an object path is a name that lies for the life of the schema.
Dropping `pdf_url` in the same migration was considered and rejected: no one
has read the client code to confirm nothing selects it, and a schema slice is
the wrong place to carry an unverified assumption. Its removal is banked as
its own `chore:`, gated on a grep over `src/`.

**D88.1 -- the dedupe lookup is scoped to the caller explicitly, never by
RLS.** Parsing is server-side. If `ingest-coa` executes under the service
role, RLS does not apply, and a hash lookup without an explicit
`created_by` filter would match another user's COA and disclose that it
exists. The query carries the caller's id as a predicate in its own right.
Grounds: this is the one item in this pass that is a disclosure hole rather
than a gap, and relying on RLS to bound a service-role query is relying on a
protection that is switched off.

**D88.2 -- two non-unique btree indexes, added with the columns.**
`(created_by, pdf_sha256) where pdf_sha256 is not null` and
`(created_by, lab, batch)`. Grounds: both dedupe signals are lookups on
every ingest, and D88 correctly rules out *unique* constraints while saying
nothing about indexes. Non-unique preserves D88's outcome 3, where a
corrected report deliberately produces a second row on the same natural key.

**D88.3 -- `pdf_sha256` carries a format check:** `~ '^[0-9a-f]{64}$'`.
Grounds: the doc records the `brand = ''` landmine and then defends nothing
against it. A hash column that accepts an empty string re-creates ND != 0
at the string level, and a malformed hash silently disables the fast path.

**D90.1 -- the retirement event and the decrement are one transaction.**
Both run inside a single `security invoker` RPC, gated on `prosecdef = f`
per `CLAUDE.md`. Grounds: as written they are two client operations against
a table carrying an ALL policy, so a client can produce an event with no
decrement, or a decrement with no event. Either outcome breaks D89's "the
count is derived state; the events are the record," and neither is
detectable after the fact. Lands with slice 6; ratified here so the slice
is not designed twice.

**D90.2 -- `reason` carries a non-empty check:** `length(trim(reason)) > 0`.
Grounds: same as D88.3. `not null` does not exclude `''`, and an empty
reason is an event that records that something happened and not what.

**D90.3 -- the cascade hole is accepted and recorded, not closed.**
`coa_retirements` cascades on COA delete and `coas` is client-deletable, so
the append-only record survives exactly as long as its parent. Append-only
holds against UPDATE and DELETE on the event table and does not hold against
deleting the COA. Grounds: D53 already made this trade for `session_entries`,
so parity is honest and closing it here would mean soft-delete on `coas`,
which is a larger pass than this one. Recorded so that a reader does not
mistake "append-only" for "durable."

**D87.4 -- slice 4 sequencing: after-save update. Ratified by the operator
2026-07-28.** The client saves the row via `insert_coa` unchanged, uploads
the PDF to `{auth.uid()}/{coa_id}.pdf` using the returned id, then writes
`coas.pdf_object_path` in a follow-up update. `insert_coa` gains no path
argument: the path embeds the row id, which exists only after the insert,
so an insert-time path would record a reference to an object that does not
exist yet -- the fabrication class, and a migration besides. Named cost,
accepted: a failure between upload and update leaves a saved COA with a
null path and possibly an orphan object -- detectable and repairable,
unlike its inverse. Upload or update failure surfaces to the user and
never unwinds the save that already happened.

**Slice 4 observed constraints (2026-07-28 recon, read-only, at `5f9254d`).**
Neither the PDF bytes nor the picked file URI survive the parse
step today -- the URI never enters component state -- so slice 4
threads the URI from pick to confirm; `copyToCacheDirectory: true` keeps
it resolvable for the session. Storage needs no new package:
`supabase.storage` ships in the installed `@supabase/supabase-js` 2.110.1,
so the EAS-rebuild split rule stays untriggered. Deletion order is row
first, then Storage object: a failed object removal leaves a detectable
orphan, while object-first would leave a row referencing a document that
no longer exists. The sole delete site (`deleteCoa`,
`src/components/coa-detail.tsx`) is fire-and-forget today; slice 4 makes
its failure surface explicit.

---

## Schema changes

On `coas`:

| column | type | constraints | meaning |
|---|---|---|---|
| `pdf_object_path` | text | nullable | Storage object path for the source PDF (D87). Nullable: the five existing rows have no PDF and never will. |
| `pdf_sha256` | text | nullable | hex SHA-256 of the source PDF bytes (D88) |
| `on_shelf_count` | integer | not null, default 1, check `>= 0` | possession (D89) |
| `favorite` | boolean | nullable | repurchase intent (D91); null = unasked |

Resolved by D87.3: `pdf_object_path` is a new column and `pdf_url` is left
in place, dormant. Its removal is banked as its own `chore:`. Indexes and
check constraints for these columns are specified in D88.2, D88.3 and
D90.2, and land in the same migration.

New table `coa_retirements`:

| column | type | constraints | meaning |
|---|---|---|---|
| `id` | uuid | pk, default `gen_random_uuid()` | event identity |
| `coa_id` | uuid | not null, references `coas(id)` on delete cascade | which COA |
| `created_by` | uuid | not null, default `auth.uid()`, references `auth.users(id)` on delete cascade | ownership; the `coas` convention verbatim |
| `reason` | text | not null | `Smoked it all` / `Gave up on it` |
| `created_at` | timestamptz | not null, default `now()` | when |

Cascade on `coa_id` matches D53: deleting a COA takes its retirement events
with it, same as its sessions.

### RLS

- `alter table coa_retirements enable row level security;`
- **INSERT**: `with check` only -- PostgreSQL rejects `using` on a
  `for insert` policy, and `session_entries_insert_own`, the live policy this
  copies, carries `with check` alone. The predicate is
  `created_by = auth.uid()` AND parent-COA ownership:
  `exists (select 1 from public.coas c where c.id = coa_id and c.created_by = auth.uid())`.
  This applies to every policy in this document, including D87.1's four
  Storage policies.
- **SELECT**: `created_by = auth.uid()`.
- **Nothing else.** No UPDATE, no DELETE, by design.

Storage bucket RLS: owner-scoped on the object path prefix. The bucket is
private; no anon access.

Note, observed and recorded: `coas` itself carries a single `ALL` policy, so
`on_shelf_count` and `favorite` are client-updatable. That is intended -- they
are derived and revisable state, not a record. The record is
`coa_retirements`, which is not updatable at all.

---

## Slice plan

Each slice is its own build prompt and its own commit. Gates are typed per
`CLAUDE.md`.

1. **`docs:`** -- this document. No code.
2. **Schema (`feat:`)** -- the four `coas` columns, the D88.2 indexes, the
   D88.3 and D90.2 check constraints, `coa_retirements` and its RLS.
   Migration authored by the implementer, applied by the operator
   (`db push`, credentialed). Gate: observed SQL with the paired control
   below.
3. **Storage bucket (infra)** -- bucket creation and Storage RLS. Landed as
   migration `20260728000000` in `0705eef`, applied by the operator. Gate:
   observed state.
4. **Retention (`feat:`)** -- upload at save time, populate the path, remove the
   object on COA delete. Gate: device, plus an observed Storage listing.
5. **Dedupe (`feat:`)** -- hash on ingest, both match signals, the three-outcome
   prompt. Gate: device, exercising all three outcomes and both signals.
6. **Retirement + favorite (`feat:`)** -- the two-question surface, the event
   insert, the decrement, the badge. Gate: device with read-back.

Slices 4-6 are UI-visible. None adds a native module: the PDF already
reaches the app through the existing picker, and hashing is pure JS. **The
EAS-rebuild split rule is therefore not triggered** -- unlike the banked
product-photo idea, which would trigger it.

---

## Non-goals (this pass)

- The survey cut (Screens 1 and 5). Its own doc; independent of this one.
- A `jars` table. Rejected in D89 with grounds.
- `never_again` and `average_score` storage. Still the scoring slice's, per
  `session-entries-schema.md` non-goals.
- COA supersession logic when a revised report arrives (D88 outcome 3 creates
  a row and stops there). Banked.
- Product photos, brand logos, user tags. Banked; native-module scope.
- Store-inventory matching against favorites. Banked; requires chemistry on
  the menu side, which no consumer channel publishes.
- Removing the dormant `pdf_url` column. Banked as its own `chore:`, gated
  on a grep over `src/`.
- Grant tightening on the two views (`anon` holds ALL; latent, not live).
  Already banked by the D85 implementation plan; untouched here.

---

## Gates

**Schema slice.** Observed SQL, pasted raw:
- `coas` column list shows all four new columns with the stated types.
- `pg_policies` on `coa_retirements` shows exactly two policies, INSERT and
  SELECT, and no others.
- `pg_tables` shows `rowsecurity = true` on `coa_retirements`.
- Control case, paired, and it is the INSERT that is the control. Acting as
  the authenticated owner: insert one row, confirm it is visible, then
  attempt an UPDATE and a DELETE on it. Expect `inserted=1, visible=1,
  updated=0, deleted=0`, then roll back. **The UPDATE does not raise** --
  RLS with no UPDATE policy filters the row out and reports zero rows
  affected. Against an empty table zero is also what a working policy
  returns, so without the insert the observation cannot distinguish "no
  UPDATE policy" from "never tried."
- `session_entries` row count unchanged at 0; no view is dropped or
  recreated by this migration, so `security_invoker` is not at risk here --
  stated so the absence of that check is deliberate rather than forgotten.

**Storage slice.** `storage.buckets` shows exactly one bucket, `public = false`.
An object written by user A is not readable by an unauthenticated request.

**Retention slice.** Ingest a COA; observe a Storage object exists and the
`coas` row's path column resolves to it. Then delete that COA and observe the
object is gone. The delete half is the control; without it, retention has
been verified and leakage has not.

**Dedupe slice.** All three outcomes exercised on device, each with a
read-back:
- same file twice -> prompt -> "another package" -> `on_shelf_count` = 2, one
  `coas` row.
- same file twice -> prompt -> "mistake" -> unchanged, still one row, count 1.
- same `lab` + `batch`, different bytes -> prompt -> "corrected report" -> two
  `coas` rows.
- Control: a genuinely different COA ingests with no prompt at all.

**Retirement slice.** With `on_shelf_count` = 2: retire once, observe one
`coa_retirements` row and count 1 and the card still present; retire again
with the other reason, observe two rows with differing reasons and count 0
and the card off-shelf but the COA, its sessions, and its favorite intact.

---

## Banked

- A third retirement reason separating "chose to stop" from "no longer had it."
  Trigger: a second user, or the operator noticing the conflation in his own log.
- COA supersession when a corrected report arrives.
- Re-parse from retained PDFs. D87 makes it *possible*; whether it is a named
  product capability is undecided, and it should not be improvised into
  existence by whoever first wants it.
- Renaming `favorite` if the name reads badly in use.
- Jar-level session provenance (D89's rejected alternative), seeded by
  `coa_retirements` if it ever earns a consumer.

---

## Open questions for ratification

1. ~~Reuse `pdf_url` or add `pdf_object_path`?~~ Resolved 2026-07-27 by
   D87.3: new column, `pdf_url` left dormant.
2. Do the three duplicate `Animal House / RAINBOW RUNTZ / S01-RARU` rows get
   deleted now, leaving three clean COAs, or does the dedupe slice absorb
   them later? (They currently split nothing, since sessions are at 0.)
3. `tested_on` is null on all five rows though both labs print a test date.
   Parser gap or extraction-then-drop -- unresolved, and unresolvable without
   the PDFs. Does it join this pass or get its own?
4. The `brand = ''` empty-string row. Parser or validation gap; it will recur,
   and D88's natural key depends on the answer.
