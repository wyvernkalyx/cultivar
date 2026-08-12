# Design Overhaul -- v2 reference adoption (D137-D143)

Status: RATIFIED 2026-08-09 (rulings recorded in chat, per-carve-out, operator).
This status line is amended by the commit that changes its truth.

North star: the v2 design reference at `reference/handoff/` -- ten screens
(`01-stash.png` .. `10-tokens.png`), `cultivar-reference.md` (spec), and
`cultivar-reference.html` (styling source). The reference is a converged
Claude Design artifact reviewed by the architect and ratified by the
operator with the carve-outs below. Where this document and the reference
disagree, this document wins: the carve-outs are exactly the places the
reference was overruled or extended.

Sibling north stars: `documentation/design/product-metaphor.md` (superseded
in part -- see D138), `documentation/design/coa-retention-and-possession.md`
(D89 superseded in part -- see D139, D91 superseded in part -- see D140),
`documentation/design/dashboard.md` (surfaces absorbed -- see D142),
`CLAUDE.md` (no fabricated data; personal-empirical, never pharmacological).

---

## Observed baseline (2026-08-09, Phase A inventory + read-only SQL)

Stated so this doc can be falsified rather than believed.

- HEAD at authoring: a3d2e279bca0389b0417b7ffce52b387e9e23ebf.
- `src/constants/theme.ts` `Dash` hex values match the v2 reference tokens
  verbatim: all eight surface/text tokens, all five verdict hues, and the
  shared terpene hues. Deltas: the reference adds humulene `#C79BB8`;
  current `Dash.terpene` carries alpha-pinene and camphene the reference
  omits (kept -- identity hues are additive).
- No type-role token exists. Font family names are re-declared as local
  consts in 9 files (corrected from the inventory's 10 at slice 2's
  residual scan); every size/weight/tracking is a literal inside 17
  per-component StyleSheet blocks (319/303/239/139/119 lines for the five
  largest). `Spacing` (2/4/8/16/24/32/64) is referenced by only 3 files;
  the reference's scale is 4/8/12/16/18/24.
- The live lexicon v6 (`src/lib/lexicon.ts`) is string-identical to the
  reference's chip set: fourteen tags, three group labels, five rung words.
  There is NO lexicon migration in this arc. `LEXICON_VERSION` stays 6.
  The rung emoji are display-only and are never stored.
- The shipped ladder already saves the verdict row mid-survey
  (`session-ladder.tsx:829` discards "a session already on your shelf").
  The reference's tap-rung-saves-instantly is a presentation change over
  existing semantics, not a persistence change.
- Nav today is one native tab ("Home") rendering `src/app/index.tsx`; the
  web tab bar still carries Expo starter chrome ("Expo Starter",
  docs.expo.dev link).
- `coas.on_shelf_count` observed values: 0 (12 rows) and 1 (5 rows).
  Nothing exceeds 1; D139 needs no data migration.
- `favorite` is written by one writer (`src/lib/coa-favorite.ts`) and asked
  from four surfaces: shelf-card chip, archive-card chip, detail Yes/No
  pair, retirement prompt.

---

## D137 -- The v2 reference is the visual north star; tokens become a system

The reference's tokens, type roles, spacing scale, and radii are adopted as
the app-wide system, landed in `src/constants/theme.ts` and consumed
everywhere:

- `Dash` gains `humulene: '#C79BB8'`. Existing extra hues stay.
- A `Type` token set is created carrying the loaded family names as its
  first layer; the 9 files' local font consts collapse onto it, so a
  font swap edits theme.ts alone. The reference's sized roles (display
  26/1.1, title 13, label 10 tracked uppercase, body 11.5 tabular
  numerals for lab values, serif explainer 14.5) join the token set as
  each surface's restyle slice adopts them, not in slice 2.
- A `Space` export lands the reference's 4pt scale (4/8/12/16/18/24)
  beside the legacy `Spacing`, whose three consumers keep rendering
  unchanged until their own slices retire them (app-tabs.web in slice 3,
  the ladder in slice 5); product screens migrate off hard-coded numbers
  as their restyle slices touch them, not in one sweep.
- `Dash.radius` gains `pill: 999`.

Grounds: the hex identity between shipped `Dash` and the reference proves
the reference was built on the shipped palette; the system half (type,
spacing) is the half that never landed, and its absence is why a font swap
today edits 10 files.

## D138 -- Three-tab nav; Stash / Active / History terminology

Nav becomes: Stash (default) / center + FAB / Insights, per the reference.
The + opens the selector sheet: "Scan or import a COA" (primary, opens the
existing add flow -- which already carries manual entry as its third route,
D134, and stays the sole ingestion entry) and "Log a session" (secondary,
strain picker then survey step 1). The Expo starter web chrome dies with
the old tab bar.

Terminology (operator ruling, carve-out 3): consumer copy says "My Stash",
"Active", "History". "Shelf" is retired from user-facing strings only.
Code identifiers, filenames, comments, and schema names are unchanged
(operator ruling B1): renaming `ShelfCard` or `on_shelf_count` is churn
with no user-visible value. `product-metaphor.md`'s shelf vocabulary is
superseded for consumer copy by this decision.

The History segment absorbs the off-shelf archive (D101): same rows
(`on_shelf_count = 0`), same card language, retirement reason still shown.
The archive stops being a modal behind a footer link and becomes the
second segment of the Stash list. D101's substance (off-shelf is a display
state; chemistry, sessions, verdicts survive) is unchanged.

Shipped-features accommodation (operator ruling, carve-out 4 -- nothing
shipped is lost):

| Shipped feature | Where it lives after the overhaul |
|---|---|
| Scan / QR / PDF import | + selector, primary entry (existing add flow) |
| Manual COA entry (D134) | Inside the add flow, unchanged (its third route) |
| Attach COA to manual item (D135) | Card/detail overflow, unchanged |
| Session logging (D52..D133) | Card "+ Log Session" and + selector |
| Retirement (D90) | Card/detail Retire action, unchanged mechanics |
| Off-shelf archive (D101) | History segment (this doc) |
| Buy-again (D91/D113) | See D140 |
| Profile reset (D110) / export (D111) | Settings (gear) on the Stash header |
| Preference summary + effects line (D98/D133) | Insights tab (D142) |
| COA detail, PDF viewer, safety, editor | Detail sheet, restyled (slice 6) |

## D139 -- Possession is binary (supersedes D89's count semantics)

Operator ruling, carve-out 6: the user tracks have-it / don't-have-it, not
package counts. "When they run out they retire it."

- The `on_shelf_count` column stays (B1: schema is not consumer copy).
  App semantics: `> 0` is in the Active stash, `0` is History. No UI
  renders a count, ever. The `x2` badges (card and detail) die.
- Dedupe outcome 1 ("bought another package", +1) is redefined: the same
  document arriving again is answered "Already in your stash. Nothing was
  changed." -- no increment, no new row. Outcomes 2 and 3 (natural-key
  match with different hash; corrected report) are unchanged.
- Retirement no longer branches on remaining count: the survey always
  says it takes the item off the stash, and `on_shelf_count` is set to 0
  (not decremented). D90's append-only event record is unchanged -- one
  retirement row per retire action, reasons unchanged.
- The reference's "2x purchased" badge is rejected with this ruling.
- No migration. Observed data is already binary.

D89's grounds (possession on the COA, not a jars table) survive intact;
only the count semantics narrow to a flag.

## D140 -- Buy-again is asked at retirement only (supersedes D91-settable-anywhere and D113's three ask-surfaces)

Operator rulings, carve-out 1 + DECIDE A1.

- The ask lives in the retirement prompt (D90 survey question 2),
  unchanged wording. It is the one moment the verdict is complete.
- The detail sheet's Yes/No pair is removed. The card chips become
  display-only: `favorite === true` renders the reference's "buy again"
  badge; `false` and `null` render nothing on cards. The detail sheet
  shows the three-state answer read-only ("Would buy again" /
  "Wouldn't buy again" / "Not answered yet").
- `setFavorite` stays the one writer; `promptFavorite`'s card-surface
  Alert is retired with the tappable chips. Clearing an answer, if ever
  needed, is a re-retirement-free edge with no surface today -- banked.
- Null stays never-asked, distinct from "No" (D48). Nothing rewrites
  stored answers.

Recorded: the reference says "asked inside the log flow" but shows no such
screen; A1 resolves the inconsistency in favor of the shipped retirement
ask, which is an in-flow ask. The session survey stays purely about the
session.

## D141 -- Survey presentation adopts the reference; semantics unchanged

- Step 1: brand eyebrow, display strain, "Rate this session", explainer in
  the serif voice, five 56pt rungs with left verdict-band stripe and the
  reference's fixed emoji pair set. Tapping a rung saves instantly -- the
  already-shipped behavior, now stated in microcopy ("Tapping a verdict
  saves it instantly -- everything after is optional."). X Close covers
  pre-verdict exit; the post-verdict Discard path and its confirm survive
  as shipped.
- Step 2: "Anything else? (optional)", "<verdict> - saved" indicator,
  plain-text Done (top-right) and Save Session (bottom) running the same
  commit, strict 2-col chip grids per group, selected = solid accent + a
  check, note field below. Tags, groups, and version are the shipped v6.
- Haptics on rung/chip taps belong to D143, not this slice.
- Append-only chain (D52), hidden 5/4/3/2/1 mapping, and effects storage
  (D119) are untouched.

## D142 -- Insights tab (new surface; personal-empirical discipline applies)

The Insights tab hosts, top to bottom: Target profile (hero), Would Buy
Again, Profiles to avoid -- plus the full-screen Counter view. The
preference summary and session-derived effects line (D98, D133) move here
from the old dashboard; their aggregation rules are unchanged.

- Target profile: per-terpene ranges and THC/CBD ranges computed from the
  reported lab values of COAs whose sessions the user rated Loved.
  Reported values only; ND joins no range and is shown as ND. Copy states
  the discipline verbatim: "Ranges are the reported values of batches you
  rated Loved. No effect claims -- just what was in them."
- Profiles to avoid: the mirror over Disliked/Hated, same rules, stated as
  facts about reported values.
- Would Buy Again: rows where `favorite = true`, with in-stash/finished
  state from `on_shelf_count`, plus Share and Counter view actions. Share
  exports text (chemistry facts, never verdicts about other users -- this
  is the user's own list).
- Counter view: full-screen inverted light surface, large type, Target
  profile block + Buy Again cards. Brightness pinning belongs to D143.
- Aggregation lands as a pure library first (Jest-covered, parser-tree
  pattern) and is wired second. Subtitle counts sessions and strains
  all-time including History (D98 continuity).

Invariant restated because this surface is where it is most at risk: no
copy anywhere on Insights may claim or imply a compound causes an effect.
Ranges are descriptions of what was in the batches the user rated.

## D143 -- Native-module slice: haptics + brightness, one EAS rebuild

expo-haptics (rung/chip taps, ImpactFeedbackStyle.Light) and
expo-brightness (Counter view pins max brightness while open, restores on
close) are approved (operator ruling, carve-out 5). Both are absent from
package.json today. They land together in one `chore:` manifest commit,
the operator runs one EAS development build, and the consuming `feat:`
lands after the new binary is on the device. This slice is last so every
other slice gates over Metro reload against the 2026-08-03 binary.

---

## Slice plan

Each slice is its own prompt and its own commit; gates typed per CLAUDE.md.

1. `docs:` -- this document + the v2 reference artifacts into
   `reference/handoff/` (the twelve files). v2 supersedes v1 as north
   star; the tracked v1 artifacts (`01-dashboard.png` ..
   `07-tokens.png`, `design-brief.md`) remain committed as the
   historical record prior design docs cite (e.g. D131's ratified
   mock). Only `cultivar-reference.{md,html}` are superseded in place.
2. `refactor:` -- D137 tokens: Type.family and Space exports, humulene,
   pill radius; the 9 files' font consts collapse. Behavior-preserving;
   gate is suites green + device smoke (no visual change intended).
3. `feat:` -- D138 nav: three tabs, + FAB, selector sheet, starter chrome
   removed. Device gate.
4. `feat:` -- Stash screen: consolidated header, Active/History segments
   (archive absorbed), sort pills, expanding search (the standing queue's
   rank-2 item lands here), card restyle, D139 badge/dedupe/retire-copy
   changes, D140 chip display-only. Device gate with MCP read-back. May
   split at prompt time if the diff argues for it.
   [Amended by D145 (`delta-stash-header.md`): the segment row and the
   four sort pills are superseded on this surface by a two-segment
   control and a single Sort chip opening a native menu. The archive
   absorption, the search, and the card restyle are unchanged.]
5. `feat:` -- D141 survey restyle. Device gate.
6. `feat:` -- COA detail restyle + gear menu (Edit name/brand via a
   dedicated two-field rename sheet -- deliberately NOT the parse
   editor, so no path from the detail can touch stored analytes
   [operator B1, 2026-08-10]; Delete with a cascade-naming confirm
   naming the row (strain, brand when present; ratified 2026-08-10
   after two accidental deletions under generic copy) and stating the
   session count it destroys [operator A2, 2026-08-10,
   superseding D104 -- D104's ground survives as the confirm's wording
   and Retire remains the celebrated path]; D140 read-only answer).
   Device gate. [Amended by D144 (`coa-delete-restrict.md`): the
   session-count clause is superseded -- history-bearing rows are
   undeletable at the FK, so the confirm renders only for history-free
   rows and states no count; the identity echo survives.]
7. `feat:` -- D142 Insights: (7a) aggregation library, Jest gate; (7b) tab
   UI + Counter view sans brightness, device gate.
8. `chore:` + `feat:` -- D143: manifests, operator EAS build, then haptics
   + brightness. Device gate on the new binary.

## Non-goals (this arc)

- Re-parse COA PDF (the reference's gear item): stays banked. It touches
  D87 retention semantics and has no lived demand yet; adopting the gear
  menu does not adopt the item.
- Lexicon changes of any kind (v6 is the reference's own vocabulary).
- Any schema migration. D139 is app-semantics only.
- Renaming code identifiers, files, or schema to stash vocabulary (B1).
- Cross-user sharing beyond D142's text export of the user's own list.
- Android, OCR labs, and everything else standing in the banked list.
- The reference's sample data (Gush Mintz, Blue Lobster, Garlic Drip) --
  illustrative only, never seeded.

## Open questions deliberately left to slice prompts

- Whether NativeTabs can host the center FAB or the tab bar goes custom
  (slice 3 decides against the running app, not on paper).
- Whether slice 4 splits (header/segments/search vs cards/D139/D140).
- The exact set of sort pills at launch (reference shows Recent /
  Highest THC / Highest terps / Top rated; Top rated needs the session
  join the cards already do). Resolved by D145
  (`delta-stash-header.md`): all four ship, as options in the sort
  menu rather than as pills.
- What the seven untracked v1 `0N-screens.png` files become (operator may
  delete them; nothing references them once this lands). The tracked v1
  set is a separate question: a future `chore:` may sweep
  `documentation/` for citations and then delete or move the v1
  artifacts to `reference/handoff/v1/`; until that sweep runs, they
  stay where the citing docs expect them.
