# Insights reads like the stash -- Design (D150-D152)

Status: RATIFIED by operator 2026-08-21 in chat. This line is amended
by the commit that changes its truth.

## Purpose

Operator observation, 2026-08-21, screenshot of Stash and Insights
side by side: the Active card's terpene fingerprint (bar + name +
value) reads well; the Insights profile cards (dominant terpene with a
range, then "1 batch / 3 sessions / with ..." and a THC/CBD line) and
the summary card's chip row do not. Same data, two languages. This arc
makes Insights speak the card's language, removes the two blocks the
operator named, and gives every terpene name a plain-language meaning
where it is read. No schema change; everything derives from rows the
screens already load.

## Copy rule, ratified 2026-08-21: "product", never "batch" or "strain"

"Batch" is the lab's word for its unit of testing; the operator
reports it has no meaning to a buyer. User-facing copy says "product"
for one tested item, and identifies one by strain + brand as the card
does. "Strain" survives only as the name of the datum -- the "Strain"
field label and the "Strain not reported" fallback -- ratified
2026-08-21; as a count or a pronoun for the item ("13 strains", "which
strain?") it is displaced. Gate lesson, same date: the first criterion
gated only the word that prompted the rule; the rule's other violator
shipped past it. A copy-rule gate enumerates every displaced term. The metadata
field label "Batch" on the COA editor (the lab's own lot identifier)
is NOT renamed: that field holds the lab's batch string, and renaming
its label would mislabel the datum. Source identifiers (`batch`
columns, `p_batch`) are untouched -- this is a copy rule.

## D150 -- Profile cards show one fingerprint per product

Both profile cards ("Your target profile", "Profiles to avoid") render
the set's products as a list. Each entry: strain (or "Strain not
reported"), brand when present, then the card's `Fingerprint` --
track + legend of top-3 reported terpenes with values -- fed by the
same per-COA rule the shelf uses (`groupTopTerpenesByCoa`,
`src/lib/card-data.ts`: null pct excluded, top 3 by pct, name
tiebreak). Three cases, amended at the 2026-08-21 device gate (a manual
COA with nine reported terpenes and no total was labeled "no reported
terpene data" -- false copy): reported rows with a non-zero total draw
track + legend; reported rows without a total draw the legend alone
(shares need a lab total; the app never sums one); zero reported rows
render the identifier and "No reported terpene data", never an empty
track. The same three cases now govern the shelf card, where the
collapsed form originated. Operator ruling: no bar without a lab total.

Removed from both cards: the `ProfileGroups` dominant/range/meta
rendering and the `FactLine` THC/CBD row. The explainer sentence
stays, reworded under the copy rule.

Grounds against a single pooled bar: the card's bar divides each
terpene by THAT product's total. A pooled set has no single total; a
blended bar would show a profile no lab measured -- cross-COA
smoothing, a stated non-goal of D147 and the fabrication class. Per
product shows only what was in each jar. Named cost: a long Loved set
makes a tall card; capping or collapsing is banked on lived demand.

Data: `ChemistryProfile` gains `products: ProfileProduct[]`, built in
the pure lib (`aggregate.ts`) from `InsightCoa` + `InsightTerpene`,
ordered by strain then brand (stable across refetches). Jest covers
the new shape, including the null-pct exclusion and the no-data case.
`profiles` (groups) stays in the lib -- `export.ts` still consumes it;
only the screen's rendering of it goes. The `Fingerprint` component
and `CardTerpene` type are exported from `shelf-card.tsx`; the
component does not move.

## D151 -- The summary card drops the Loved-concentrations module

`LovedModule` in `preference-summary.tsx` ("In Loved sessions . lab
concentrations only" chips + THC/CBD) is removed, with its `loved`
prop, the `LovedConcentrations` type, and `buildSummary`'s `loved`
computation and `rankLovedTerpenes` helper in `src/lib/summary.ts`
if no other consumer remains (verify by grep, construct form). The
summary card keeps the verdict distribution, the buy-again count, and
the effects line.

Grounds: operator ruling -- redundant with the target profile card
directly above it and reductive (names without values). The card's
data-read role is now served by D150.

## D152 -- Terpene names explain themselves by aroma, on tap

A glossary (`src/constants/terpene-glossary.ts`) maps canonical
terpene names to one-line AROMA descriptors: what the compound smells
like and a familiar source. Examples of the register: "Limonene --
citrus; the smell of lemon peel." "Caryophyllene -- pepper and clove."
"Myrcene -- earthy, musky; mango and hops." Entries exist only where
the aroma is uncontroversial common knowledge; a name without an
entry shows "No description yet." -- never a guessed one.

Binding: descriptors describe smell and source. No effect, mood,
medical, or "known for" language, in the data file or anywhere it
renders. This is the personal-empirical rule applied to copy: the lab
measured the compound; what it does to a person is what the user's
own sessions say.

Surface: each legend item in `Fingerprint` becomes a Pressable
(accessibilityRole button, label "<name>, what is it", hitSlop to the
44pt floor). Tap opens a small Modal: name, colour dot, descriptor,
and one footer line: "A lab-reported aroma compound. Cultivar reports
what was in the product, not what it does." Close by tap outside or a
Close button. The shelf card's legend sits inside a card whose body
opens the detail; the legend press is nested, the D149 precedent.
Rendering in the Insights product list (D150) gets the same behaviour
for free.

Grounds: the operator reports every new viewer needs the concepts
explained and the explanation loses them. A word explained where it is
read, in terms the reader already has (smell), replaces a lesson.
Scope is terpene names only; "COA" and "Total terpenes" glossary
entries are banked for the onboarding arc.

## Non-goals

- Share text and Counter view copy (gate-ratified 2026-08-10; banked).
- Any change to `profiles` grouping in the lib, to `export.ts`, or to
  the COA editor's "Batch" field.
- Capping or collapsing the per-product list.
- Animation on the glossary modal beyond RN's default.
- Schema, RLS, Edge Functions.

## Slice plan

1. This doc (Tier 1, docs: commit).
2. D150 + copy rule: lib change with tests, screen change (Tier 2,
   one feat: commit, device-gated).
3. D151: deletion (Tier 2, one chore: commit, device-gated).
4. D152: glossary data + legend press + modal (Tier 2, one feat:
   commit, device-gated; VoiceOver pass on the legend).

Gate per slice: tsc 0; lint at baseline (1 error, 0 warnings, exit 1);
suite count stated as a prediction against the current 170/4 and then
observed; per-step device verdicts.
