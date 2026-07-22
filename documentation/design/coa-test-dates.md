# D84 -- COA test dates

Captures the sampled and tested dates printed on a COA, persists them on the
`coas` row, and shows them on the shelf and detail surfaces. Ratified by the
operator 2026-07-22 (P1-P5 plus the DRS resolution, recorded below as
D84.1-D84.6).

Purpose: the user wants to know whether the product is stale -- age relative
to the session being logged, which may taint the potency or the experience.
Age is displayed as fact. **No degradation claim ever appears in user-facing
copy**: "old weed is weaker" is a population-level assertion and violates the
personal-empirical invariant. The honest form of the staleness thesis is
deferred, not diluted: once dates exist, COA age becomes a candidate signal
for correlation against this user's own logged outcomes. That scoring slice
is banked, not built here.

## Decisions

- **D84.1 -- two nullable dates, not one.** `sampled_on date` and
  `tested_on date` on `public.coas`. Sampled = when the product was
  collected (what the analytes describe); tested = report completion (the
  date in common label usage). One column forces silent fallback and
  mislabeled dates; two honest nulls cost nothing. *(Deviation from the
  ratified prose: `_on` not `_at`, because `_at` conventionally signals
  `timestamptz` and D84.2 ratifies date-only.)*
- **D84.2 -- date-only, ISO, times dropped.** Values normalize to
  `YYYY-MM-DD`. Times are dropped (DRS emits garbage like `948`; freshness
  is measured in days; a fabricated timezone is worse than no time).
  Two-digit years pivot `YY -> 20YY` -- interpretation, documented, not
  fabrication. Per-assay dates (`Analyzed Date`, `Date Tested`) are out of
  scope: no lived demand.
- **D84.3 -- label mapping.**
  | Lab / layout | sampled_on | tested_on |
  |---|---|---|
  | Kaycha 2026 | `Sampled Date:` | `Completed:` |
  | Kaycha 2025 | `Sampled:` | (no label) -> null |
  | DRS Confident | `Sample Collection Date/Time:` | `Report Created:` |

  DRS `Sample Received:` (lab intake) is deliberately unused: collection is
  the semantic match for Kaycha's "Sampled." Unlabeled dates are never
  captured (rainbow-runtz carries a bare `05/12/25` with no anchor;
  claiming it is guessing). Absent, blank, or unparseable -> `null`, never
  a default. ND-class invariant applies.
- **D84.4 -- display.** Shelf card: `Tested <date>`; else `Sampled <date>`
  (labeled as such); else the existing `Added <created_at>`. Detail header:
  whichever of the two exist, honestly labeled; `Added` retained as
  provenance. Exact strings, and any age-in-days phrasing, belong to the
  banked survey/copy review -- this slice ships plain labeled dates.
- **D84.5 -- slice order.** (1) this doc, `docs:`; (2) pure-logic:
  `CoaResult` + both parsers + Jest, gate = tests pasted raw; (3) schema:
  one migration (add columns + `create or replace function insert_coa`),
  operator-applied, gate = observed SQL including a re-run of the standing
  RLS/policy/view queries; (4) client: payload keys + shelf/detail render,
  gate = physical-device walk. Four commits, one concern each.
- **D84.6 -- backfill posture.** PDFs are not persisted (Storage has zero
  buckets), so rows inserted before slice 4 keep null dates unless manually
  re-ingested. Recovery path is COA PDF persistence in Supabase Storage --
  already a CLAUDE.md commitment, proposed for promotion to the top of the
  banked queue after this pass. Out of scope here.

## Parser contract

`CoaResult` (in `supabase/functions/_shared/coa/types.ts`) gains exactly two
fields, both `string | null`, holding ISO `YYYY-MM-DD` or null:

```ts
sampledDate: string | null;
testedDate: string | null;
```

Parsing constraints, binding on implementation:

- **The extracted text is one single-spaced line** (`cleanText` collapses
  all whitespace). Every regex is label-anchored with a bounded value
  capture; nothing is line-based.
- **A date anchor requires a date-shaped value**: `\d{1,2}/\d{1,2}/\d{2,4}`
  immediately after the label (optional whitespace). This is what defuses
  the recorded false friend `Sample Size Received : 20 units` and the
  blank `Analyzed Date : .` class.
- Kaycha uses one sampled regex covering both layouts:
  `Sampled(?:\s+Date)?\s*:` + date capture. Trailing times (`02:30 PM`)
  are ignored by the capture, not consumed into the value.
- Kaycha 2026 carries `Completed:` twice (header and an
  `Ordered: ... Sampled: ... Completed: ...` summary run). Both carry the
  same value on all observed fixtures; the parser takes the first match
  and the tests assert the value, not the position.
- DRS year widths are mixed **within one document** (`03/04/2026` beside
  `03/03/26`); the normalizer accepts both widths everywhere and never
  assumes a per-lab width.
- Pivot rule: 2-digit year `YY` -> `20YY`. No century inference beyond
  that.
- `parseCoa`'s unknown-lab empty shell returns both fields null.

## Fixture expectations (the Jest table, one row per fixture)

| fixture | sampledDate | testedDate |
|---|---|---|
| `cosmic-cereal.pdf` | `2026-04-17` | `2026-04-28` |
| `permanent-shade.pdf` | `2026-04-17` | `2026-04-28` |
| `rainbow-runtz.pdf` | `2025-05-05` | `null` |
| `animal-face.pdf` | `2026-03-03` | `2026-03-12` |

Plus the unknown-lab shell: both null. The rainbow-runtz null is a
deliberate control: it distinguishes "absent label handled" from "matcher
never ran."

## Schema and RPC

One migration:

- `alter table public.coas add column sampled_on date, add column
  tested_on date;` (both nullable, no default -- a default would fabricate).
- `create or replace function public.insert_coa(payload jsonb)` -- same
  signature, same `security invoker` + `set search_path = ''`, insert list
  gains `sampled_on, tested_on` reading `(payload->>'sampledDate')::date`
  and `(payload->>'testedDate')::date`. A null payload key casts to null;
  nothing coerces to a sentinel.

No view changes: neither `session_current` nor `coa_session_stats` consumes
dates in this pass.

## Client

- `ShelfCoa` (`src/components/shelf-list.tsx`) and `CoaDetailRecord`
  (`src/components/coa-detail.tsx`) gain `sampled_on: string | null` and
  `tested_on: string | null`; select strings updated to fetch them.
- Confirm/edit screen: the parsed dates ride the existing payload into
  `insert_coa` unchanged. **Dates are not editable in `coa-editor.tsx` in
  this pass** -- editability is banked, not implied.
- Rendering per D84.4.

## Non-goals

- Per-assay dates (`Analyzed Date`, `Date Tested`).
- Any freshness arithmetic, staleness copy, or degradation language.
- COA age as a scoring signal (banked; depends on this pass).
- Storage buckets, PDF persistence, backfill (D84.6; separate pass).
- Date editing in the editor.
- View or `session_entries` changes.
