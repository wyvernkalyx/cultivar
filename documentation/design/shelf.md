# Shelf

Status: slice 7 (compendium list, D41) implemented at `2cec835`; slice 8
(delete-from-shelf, D42) implemented; slice 9 (card detail, D45)
implemented at `8cef60d`; slice 10 (confirm dialog copy, D44) implemented
at `4f9a5b0`. North star:
`documentation/design/product-metaphor.md`. Slice 7 builds the compendium —
the untried state only; books, moods, and sessions are out of scope and
blocked on the scoring lexicon.

## Purpose

First read of the user's own COAs back out of the database, on the home
screen. Turns `index.tsx` from template scaffolding into the product's
landing surface.

## Placement (D41)

- `src/app/index.tsx`: hero section, "get started" code text, and hint rows
  REMOVED (template scaffolding; lived demand ended). Retained: account row,
  Add-to-shelf button, `AddToShelfModal`. New: a "Your shelf" heading and
  `ShelfList` as the screen body.
- New `src/components/shelf-list.tsx` owns its own query and states.

## Data (DB shape — the consumer D38 predicted)

- Query: `supabase.from('coas').select('id, strain, brand, lab, total_thc,
  total_cbd, total_terpenes, created_at').order('created_at',
  { ascending: false })`.
- RLS scopes rows to the signed-in user; no client-side filtering.
- A new local type mirrors the SELECTED COLUMNS (snake_case) — DB shape, not
  parser shape. `CoaParseResult` must not be imported here.

## Card (integrity disciplines applied)

- Content: strain, brand, added date, and the three totals (THC / CBD /
  Total terpenes) as plain lab facts.
- A null total renders "ND" — never 0, never blank. The invariant follows
  the data onto the shelf.
- Neutral by construction: zero sessions exist, so no mood, no color coding,
  no per-card visual variance (discipline 2: untried is neutral, never
  negative).
  (Superseded for scored cards in the scoring slice, D62–D63 — see
  documentation/design/scoring-read.md. Untried cards remain neutral by
  construction: that is D61 rendering, not a leftover.)
- Order: `created_at` descending ONLY. Chemistry never orders the shelf
  (discipline 1, extended from coloring to ordering).
- Cards are non-interactive this slice. (Superseded in slice 8: cards gain
  exactly one interaction — long-press to delete. See Delete-from-shelf.
  Superseded again in slice 9, D45: tap opens the card detail view and
  long-press is retired — see Card detail view.)

## States

- Loading: minimal text.
- Error: message plus a retry affordance.
- Empty: "Nothing on your shelf yet" (the add button is already on screen).
- Refresh: pull-to-refresh; and the list remount-keys on a counter bumped in
  the modal's `onClose`, so closing after a save refetches (the `pickId`
  pattern).

## Gate (UI-visible, physical iPhone; per-step verdicts, no aggregates)

1. Shelf renders the existing rows newest-first; brand "Moby & Zeke, LLC";
   ND rendering observed on `total_cbd`.
2. Add a COA through the full flow; close the modal; the list shows the new
   row without an app restart.
3. Pull-to-refresh completes.
4. Sign-out / sign-in regression intact.

## Non-goals

- Mood, books, bands, Never Again — blocked on the scoring lexicon.
  (Bands unblocked and landing in the scoring slice — see
  documentation/design/scoring-read.md. Mood visuals and Never Again
  remain banked.)
- In stock — blocked on schema (no possession state).
- Card detail view (slice 9 — renumbered; slice 8 is delete-from-shelf,
  designed below).
- Sorting, filtering, pagination (no lived demand at n=2), local cache,
  realtime.
- Deleting the orphaned template components (`hint-row`, `animated-icon`,
  `explore.tsx`) — banked `chore:`.

## Delete-from-shelf (slice 8, D42)
Status: implemented. The shelf's first interaction. Lived
demand: gate and exploration rows accumulate, and deletion today requires a
hand-built authenticated curl.
### Affordance
- Long-press on a card opens a native destructive confirm (`Alert.alert`
  with a destructive-styled Delete button and a Cancel button).
- Why long-press: zero new dependencies (swipe idioms need gesture-handler
  wiring; no lived demand), and the card stays visually neutral — no
  per-card chrome, so discipline 2 is untouched. Known tradeoff: long-press
  is undiscoverable. Accepted at n=1 operator; the visible, explicit delete
  affordance belongs to the card detail view (slice 9) when it exists.
- Cancel is a first-class outcome: no write occurs.
- Superseded in slice 9 (D45): long-press is retired and delete moves to
  the card detail view. This subsection stands as the slice-8 record.
### Confirm copy
- Title: "Remove from shelf?"
- Body names the strain and states what is destroyed: this COA and all of
  its lab data (terpene, cannabinoid, and safety rows). Cannot be undone.
- No sessions exist yet, so no history is at stake — which is exactly why
  the confirm is built now, while destruction is cheap.
- Superseded in slice 10 (D44): title and target format revised — see
  Confirm dialog copy below. This subsection stands as the slice-8 record.
### Mechanism
- Client delete, no RPC: `supabase.from('coas').delete().eq('id', id)`.
- Atomicity is declarative: `coa_terpenes`, `coa_cannabinoids`, and
  `coa_safety` all reference `coas (id) on delete cascade` (core-schema
  migration, lines 60/66/72). The insert needed a plpgsql RPC to construct
  a four-table transaction; the delete inherits one from the FK constraints.
- The RLS gate is the `coas_all_own` policy on `coas` (`for all using
  (auth.uid() = created_by) with check (auth.uid() = created_by)` —
  observed at migration lines 53–54). Cascade deletions on the child
  tables are referential actions, not user statements — they are not
  re-gated by child-table RLS. The DELETE policy on `coas` is the only
  gate, and the only one needed. Observed live 2026-07-13: authenticated
  REST delete of `ad93b685…` returned HTTP 204 with RLS-scoped cascade.
- Deleting a COA cannot touch the profile: user-directed cascades run
  child-ward only (`auth.users → coas → analyte rows`).
### States
- Success: refetch via the existing load path — honest state over
  optimistic removal at this scale. The row leaves the list without an app
  restart.
- Failure: error alert; the row remains; nothing else changes.
### Gate (UI-visible, physical iPhone; per-step verdicts; read-back mandatory)
1. Long-press a card: confirm appears naming that card's strain.
2. Cancel: row persists on screen; read-back shows the row and its child
   counts unchanged (control).
3. Delete the sludge-branded gate row (`d6ba53e7…`): row leaves the list
   without an app restart.
4. Read-back: zero rows in all three child tables for the deleted id; a
   surviving COA's child counts unchanged (the 14-vs-15 pattern, inverted).
5. Offline variant, exact order: load the shelf online → airplane ON →
   attempt delete → error alert shown, row persists → airplane OFF →
   pull-to-refresh → row still present, read-back unchanged.
6. Add-to-shelf regression: full add flow still lands a row.
### Non-goals (slice 8)
- Undo / soft delete (no lived demand; sessions do not exist).
- Batch delete, swipe-to-delete, edit-in-place.
- The below-the-fold confirm fix in the editor — named follow-on, its own
  slice.

## Confirm dialog copy (slice 10, D44)

Status: implemented at `4f9a5b0`. Revises the D42 confirm dialog in
`src/components/shelf-list.tsx` only — no card changes, no button-label
changes, no semantics changes.

### Why

Two defects, both live at n=1: the title ("Remove from shelf?") contradicts
its own permanent-delete body, and a strain-only target line cannot
distinguish same-strain cards — the shelf holds two Animal Face rows with
identical strain, brand, and totals today.

### Title

- Exact string: `Delete COA?`
- Names the object and the operation; permanence is carried by the body's
  "cannot be undone." Honest about today's behavior (permanent delete)
  without asserting anything about a future remove-vs-delete split.

### Body (line-echo form)

The body echoes the pressed card's displayed identity — strain, brand,
added date, in the card's own order and date format — then the unchanged
destruction sentence, separated by a blank line:

    <strain>
    <brand>
    Added <date>

    Deletes this COA and all of its lab data (terpene, cannabinoid, and
    safety rows). This cannot be undone.

- Strain line: trimmed strain; if null or blank after trim, the literal
  "this COA" (the existing D42 rule, moved onto its own line).
- Brand line: trimmed brand; if null or blank after trim, the line is
  omitted entirely — never rendered blank (same guard class as strain).
- Date line: "Added " + `new Date(created_at).toLocaleDateString()` —
  identical to the card's own rendering.
- The destruction sentence always reads "this COA"; the name no longer
  interpolates into it.
- `Alert.alert` bodies accept newlines; the blank line separates identity
  from consequence.

### Named limit (accepted)

Identical-display duplicates (same strain, brand, and added date) cannot be
disambiguated by any dialog copy. Confirmation of "the one I pressed" is
positional, and a modal alert cannot convey position. Accepted at n=1
operator; the real fix is the card detail view (slice 9), where delete runs
from a single-card context and ambiguity is impossible. This slice makes
the dialog honest, not omniscient.

### Boundary

The dialog describes what the code does today: permanent delete with
cascade. The remove-vs-delete semantics split stays blocked on the
in-stock/possession work and is not preempted here.

### Numbering

Slice 10, executed before slice 9. Slice numbers are identifiers, not a
schedule; renumbering would churn the existing D42/slice-9 cross-references
to preserve an ordinal reading the numbers do not carry.

### Gate (UI-visible, physical iPhone; per-step verdicts)

1. Long-press an Animal Face card: dialog title reads Delete COA?; body
   lines read strain, brand, added date matching that card, then the
   destruction sentence.
2. Long-press the Permanent Shade card (blank brand): the brand line is
   absent — no blank line where it would sit (control).
3. Cancel: row persists on screen; no write occurs.
4. Add-to-shelf regression: full add flow still lands a row.

No delete step: the delete mechanism is untouched and D42's gate already
observed it; this slice changes copy only. A delete may be exercised at
operator discretion but is not gate-required.

## Card detail view (slice 9, D45)

Status: implemented at `8cef60d`. The shelf's second read surface: tap a
card, see the whole record, delete it without ambiguity.

### Why / lived demand

- Operator instinct at the 6c gate: tapping a card should do something.
- Retires the D44 named limit: delete runs from a single-card context, so
  identical-display duplicates (two live pairs on the shelf today) stop
  being ambiguous.
- Delete gains the visible, explicit affordance D42 assigned here.
- Surfaces the columns the list never shows — `batch`, `lab`, `source_lab` —
  and the full analyte panels: the first client read of the child tables.

### Presentation (modal, not navigation)

- The detail renders in a React Native `Modal` owned by `ShelfList`, the
  same presentation family as `AddToShelfModal`. Tap sets a local
  `detailCoaId`; the modal hosts a new `CoaDetail` component
  (`src/components/coa-detail.tsx`).
- Why not a pushed route: no Stack exists. The root layout is the auth gate
  rendering `NativeTabs` directly (`app-tabs.tsx`); introducing a Stack
  restructures that gate and is its own slice, unsupported by lived demand
  (no deep links, no nav-history need). Banked: when real navigation demand
  arrives, the Stack conversion happens then and this modal converts.
- Owning the modal in `ShelfList` dissolves the post-delete refresh problem:
  the list owns `load()`, so a detail-context delete closes the modal and
  refetches. No focus-listener machinery.

### Interaction (supersedes D42's long-press)

- Tap on a card opens its detail. Long-press is retired; delete lives only
  on the detail view.
- Grounds: retiring the list-context delete extinguishes the D44 ambiguity
  entirely rather than leaving the ambiguous path alive beside the fixed
  one; the fast-path demand long-press served is unproven at n=1 operator.
- Cards remain visually neutral — tap adds no per-card chrome (discipline 2
  untouched).

### Data (DB shape; fresh single read)

- Query — one embedded select, one consistent snapshot:
  `supabase.from('coas').select('id, strain, brand, batch, lab, source_lab,
  total_thc, total_cbd, total_terpenes, created_at, coa_terpenes(id, name,
  pct), coa_cannabinoids(id, name, pct), coa_safety(id, category, status)')
  .eq('id', id).single()`.
- Fresh fetch, not the list row passed down: the detail shows columns the
  list never selected, and one consistent read beats a stitched one.
- RLS posture (observed at the core-schema migration): the child policies
  (`coa_terpenes_all_own`, `coa_cannabinoids_all_own`, `coa_safety_all_own`)
  are `for all` with the same parent-ownership predicate as `coas_all_own`
  (`exists (select 1 from coas c where c.id = coa_id and c.created_by =
  auth.uid())`). Embedded reads are re-gated by child RLS — unlike cascade
  deletes, which are referential actions — but the predicate is identical,
  so an owned COA always returns full panels. No partial-panel state exists.
- A new local type mirrors the selected columns and embeds — DB shape,
  snake_case. `CoaParseResult` must not be imported here (the D38/D41 rule).
- Excluded: `type` (deferred at ingestion; same grounds apply on read) and
  `pdf_url` (always null; no Storage bucket).

### Rendering (integrity disciplines applied)

- Section order mirrors slice 4: identity (strain, brand, added date,
  `batch`, `lab`; `source_lab` as subordinate secondary text — a system
  identifier, not user-facing vocabulary), totals, terpenes before
  cannabinoids, safety.
- A null value renders "ND" — never 0, never blank — on totals and on every
  analyte `pct`. The invariant follows the data wherever it is displayed.
- Detected rows first; ND rows collapse under an always-present
  "Not detected (N)" control, every row individually visible on expand.
  Grouping is recomputed from current values — there is no draft and no
  editing here, so D37's no-migration rule does not apply; that was an
  editing invariant, not a display law.
- No scores, no mood, nothing Never-Again-shaped: lab facts only. The
  scoring lexicon is not designed.

### Row order (named divergence, accepted)

- The child tables carry no position column, so slice 4's "parser emission
  order" is unrecoverable at the DB seam — insertion order is not a SQL
  guarantee.
- Order: alphabetical by `name` within the detected group and within the
  ND group; safety rows by `category`. A stated divergence from the
  editor's ordering.
- Rejected: `pct`-descending for detected rows — it begins ranking
  chemistry visually, and alphabetical costs nothing.
- Banked: a `position` column, if emission order ever earns lived demand.

### Delete on detail (D44 dialog reused verbatim)

- A visible, explicit Delete control on the detail view — the affordance
  D42 assigned here from the start.
- The D44 dialog is reused verbatim: same title, same line-echo body. The
  identity echo is redundant in a single-card context but harmless, and
  one dialog beats two.
- On confirmed delete: the existing client delete path
  (`from('coas').delete().eq('id', id)`; cascade via FKs; RLS-gated). On
  success the modal closes and `ShelfList` refetches via `load()`. On
  failure: error alert, the modal stays open, nothing else changes.

### States

- Loading: minimal text.
- Error — including a row deleted underneath, where `.single()` errors on
  zero rows: message, retry, and a close affordance.
- Loaded: the rendering above.

### Gate (UI-visible, physical iPhone; per-step verdicts; stills welcome)

1. Tap a card with full data (a RAINBOW RUNTZ row): detail opens showing
   strain, brand, batch, lab, added date, subordinate `source_lab`; the
   three totals; terpene panel detected-first with "Not detected (N)";
   cannabinoid panel; safety rows. Still requested — first render of a
   new screen.
2. ND rendering observed on a null value in the detail view.
3. Long-press any card: nothing happens (the retirement control).
4. Delete from detail: the D44 dialog appears (title "Delete COA?");
   confirm; the modal closes; the row is gone from the list without an app
   restart; read-back shows zero child rows for the deleted id. User data
   is test-phase and disposable — a duplicate RAINBOW RUNTZ is the natural
   target.
5. Cancel path: dialog Cancel — the modal stays open, the row persists.
6. Add-to-shelf regression: full add flow still lands a row.

### Non-goals (slice 9)

- Editing anything from the detail view (post-insert editing is
  undesigned).
- View-source PDF (no Storage bucket; the in-memory PDF exists only at
  ingestion time).
- Mood, scores, sessions, in-stock — blocked as ever.
- The navigation restructure (Stack conversion) — banked above.
- A `position` column — banked above.
- Sorting or filtering the analyte panels.

### Implementation deltas (accepted at `8cef60d`)

- Null or blank metadata (`batch`, `lab`, `source_lab`) omits its line
  entirely — the D44 guard class — never "ND", which is analyte
  vocabulary; the spec's ND rule names totals and analyte `pct` only.
- The loaded state carries a Close button alongside Delete in the fixed
  footer, per the presentation family (`AddToShelfModal` always shows an
  explicit Close); swipe-down dismissal is wired through both
  `onRequestClose` and `onDismiss`.
- The ND control renders "Not detected (0)" when a panel has no ND rows —
  always-present taken literally; expanding then shows nothing, which is
  the honest state.
