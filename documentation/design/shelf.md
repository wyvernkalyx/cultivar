# Shelf — Compendium List (slice 7)

Status: designed (D41), not implemented. North star:
`documentation/design/product-metaphor.md`. This slice builds the compendium —
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
- Order: `created_at` descending ONLY. Chemistry never orders the shelf
  (discipline 1, extended from coloring to ordering).
- Cards are non-interactive this slice.

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
- In stock — blocked on schema (no possession state).
- Card detail view (slice 8); delete-from-shelf (its own slice: a
  data-destroying affordance deserving its own confirm design).
- Sorting, filtering, pagination (no lived demand at n=2), local cache,
  realtime.
- Deleting the orphaned template components (`hint-row`, `animated-icon`,
  `explore.tsx`) — banked `chore:`.
