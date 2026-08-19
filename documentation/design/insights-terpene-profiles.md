# Insights terpene profiles (D147)

Status: none. Amended by the commit that changes its truth.

## Problem, observed at b252a97

The target and avoid cards render `ChemistryProfile.terpenes`:
per-NAME min/max ranges pooled across every COA in the verdict set
(`terpeneRanges()`, aggregate.ts), top 5 by max. Three loved batches
with three different dominant terpenes merge into one list that
describes no product the user has actually rated. The pooled list
answers "which terpene names appear anywhere in my loved set" when
the useful question is "what does a batch I love look like".

## D147 -- per-COA profiles replace the pooled terpene list

Each COA in a verdict set gets a profile: its reported terpenes, pct
descending, name-ascending on ties (the topReportedTerpene ordering,
generalized to the full list). The dominant terpene is the first
element. A COA with zero reported terpene rows has no profile and
falls into a named "no reported terpene data" bucket -- counted,
displayed, never merged into a group and never invented (ND-null
invariant, applied at the profile grain).

The target and avoid cards both switch to profile groups. Symmetry
is the ground: two terpene semantics on one screen would make the
card unreadable. THC / CBD / total-terpenes scalar ranges are
unchanged; buy-again rows are unchanged.

## D147.1 -- grouping and within-group facts

Groups key on the dominant terpene name. Group order: member COA
count descending, then dominant name ascending. Each group states:

- COA count and session count (the log's own numbers).
- Dominant pct range across members, reported values only.
- Companion frequencies: for each non-dominant name, in how many of
  the group's members it is REPORTED (null rows join nothing). Top 3
  companions by count descending, then name ascending.

Every line is a description of this user's logged batches. No
synergy, potency, or effect claim anywhere; companion frequency is a
co-occurrence count in the log, stated as such.

## D147.2 -- COA-grain counting, session counts displayed

Groups count distinct COAs, not sessions. Grounds: the question the
card answers is "what should I buy again", which lives at product
grain, and a single chatty batch (many sessions, one chemistry) must
not multiply its profile's apparent frequency. The session count is
displayed beside the COA count so evidence weight stays visible.
Named alternative, rejected: session-weighted groups -- honest about
"how often" but lets one batch dominate the picture. Operator may
flip this at ratification.

## D147.3 -- ties at the dominant slot

Exact pct ties at the top resolve by name ascending (the existing
topReportedTerpene rule), and the tied companion sorts first in the
companion list at its true pct. The group key stays single-name.
Named cost, accepted: a genuinely co-dominant batch is filed under
the alphabetically first name; lab data makes exact ties rare, and a
multi-name key would fragment groups faster than it informs.

## D147.4 -- language gate

No effect language. The borrowed-pharmacology term for terpene
synergy -- "entourage" -- must not appear anywhere in src/, copy or
comments. Standing gate, case-insensitive because the term
capitalizes freely: grep -ril entourage src/ -> no output, exit 1,
on every slice of this arc. The term is named in this doc and this
doc only, which sits outside the gate's scope. Section copy
("TERPENE PROFILES" working title) is operator-owned at the device
gate, per standing practice.

## Edge cases, enumerated

- Session with overall_word null: already excluded upstream.
- A COA rated into both sets appears in both, per the standing
  both-profiles rule (aggregate.ts docblock) -- unchanged.
- All-ND or row-less COA: the no-data bucket, D147 above.
- Companion with only ND rows in a group: joins nothing, per D147.1.
- Empty verdict set: the card's existing empty state, unchanged.

## Non-goals (this arc)

- Share text keeps the pooled top-3 names this pass: its copy was
  gate-ratified 2026-08-10, and re-opening it is its own concern.
  Banked with this pointer.
- The ALL-TIME summary header, History/shelf card work: separate
  rulings, not this doc.
- No imputation, estimation, or cross-COA smoothing of any kind.
- No schema change: everything derives from existing InsightTerpene
  rows client-side in the pure lib.

## Slice plan

1. docs: this document.
2. feat: aggregate.ts extension (profile derivation, group builder,
   types) + Jest coverage in src/lib/insights -- pure-logic slice,
   gate is tests passing, pasted raw. tsc/lint/suite baselines held.
3. feat: insights.tsx card rendering -- Tier 2, device gate on the
   physical iPhone (profile groups legible on real data, no-data
   bucket renders, avoid card symmetric), VoiceOver spot-check rides
   along since the rank-4 posture now applies at authorship.
