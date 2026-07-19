# Rich Path — Fit, Context, and Co-Alcohol on the Logging Surface

Status: design ratified as leans (D64–D66) on 2026-07-16; no
implementation exists. Display decisions are gate-revisable per the
operator's standing revision expectation; the revision-insert semantics
(D65) and the fit-nulling rule (D66) are the durable part. North stars:
`documentation/design/scoring-lexicon.md` (the rich path's content and
fit's render condition), `documentation/design/session-logging.md` (the
mechanic and the D54–D55 persistence contract this pass extends),
`documentation/design/session-entries-schema.md` (the columns, which
already exist — this pass adds zero schema).

## Purpose

The lexicon ratified three optional rich-path questions — fit, context,
co-consumption (v1: alcohol) — and the mechanic pass banked their
placement by name. Chips landed and survived their tap verdict, so the
bank's own condition fired. This doc places the questions and defines
their writes. Constraint inherited whole: nothing on the rich path may
gate saving — the lazy path stays two taps, complete.

## D64 — Placement: a second phase of the same logging surface

On confirmed insert, a small optional **"More"** affordance appears with
the chip row. Tapping it swaps the surface's phase: the ladder and home
zone fade out; the rich questions take the screen — fit (conditional),
context, co-alcohol — with a **Back** that swaps phases again and the
same Close as the only exit. Not a new modal; not a detail-view edit.

Grounds:
- **The lazy path is physically untouched.** Two taps, same geometry,
  same targets. The rich phase exists only behind an affordance that
  itself exists only after a confirmed save.
- **Replace, don't squeeze.** The chip row is permanently mounted and
  opacity-hidden specifically so appearing never reflows the rung
  geometry under the settled card. Questions rendered *below* the chips
  would inherit that rule and permanently compress the rung region —
  inverting D51's target-size grounds for questions most sessions never
  answer. A phase swap has no rungs on screen to reflow.
- **The keyboard never coexists with the drag.** Context is free text
  v1; summoning a keyboard over the drag surface violates D49's whole
  premise. In the rich phase there is no drag.
- **Capture at the moment.** Co-alcohol and context are facts about
  *now*; a later detail-view edit is the wrong moment for now-facts.
- **Dismissal loses nothing, ever.** Every rich answer is a revision
  insert on the D47 substrate (D65); Close mid-phase abandons only
  unasked questions.

Rejected alternatives, recorded:
- **Below the chips, same phase** — the three problems above (permanent
  rung compression, keyboard-over-drag, conditional-render reflow).
- **Detail-view revision surface** — no sessions read exists in the
  detail view (that read is deferred past even the scoring slice), and
  it is the wrong moment for now-facts. Banked again by name; if lived
  use wants day-after editing, that is its own pass with its own read.

Inside the rich phase, conditional rendering is **allowed** — the
mounting rule was a defense of the rung geometry, and the rich phase
has none. Fit renders conditionally there (below); nothing reflows that
matters.

## The three questions (v1 forms, from the lexicon)

- **Fit** — "Did it do what you wanted?" Three uniform chips: No /
  Sort of / Yes. **Renders only when the chain's confirmed intent is
  non-null and is not "just because"** (lexicon rule, inherited hard).
  Fit never touches the score or the books.
- **Context** — "What were you doing?" Free text, single line,
  deliberately unseeded (the operator's first weeks author the
  vocabulary). Commits on keyboard submit. A blank or
  whitespace-only submit is a no-op — an empty string is never
  recorded; null stays null (recorded = chosen).
- **Co-alcohol** — one chip: "alcohol". Tap = true.

## D65 — Each rich answer is its own revision insert

A fit chip tap, an alcohol chip tap, and a context submit each fire one
revision insert immediately: same chain, full snapshot (D52), same
one-in-flight rule, same pending-then-confirmed visual grammar, and the
same D55 failure rule — a failed rich insert reverts the answer's
rendered state to the last confirmed value, with the same inline error.
`lastConfirmed` grows `fit`, `context`, and `co_alcohol`; drops and
chip taps carry all three forward in their snapshots (except D66).

- Re-tapping a confirmed fit chip or the confirmed alcohol chip is a
  no-op — an identical row carries zero information (D57's rule,
  reused).
- Editing confirmed context text and resubmitting is a revision (text
  differs, so the row is not identical).
- **Deselection stays banked, and it now has a named cost:** a
  mis-tapped alcohol chip is **stuck true** until deselection is
  designed — unlike intent, there is no other chip to move to. Accepted
  for the disposable-data era. The lexicon's "false reserved for a
  future explicit-no" is not spent here: this surface writes null or
  true only.

Payload shape: identical to the wiring slice's inserts — full snapshot,
`created_by` and `deleted` never sent, `session_id` and word + score
and intent carried from `lastConfirmed`, plus the three rich fields at
their current confirmed values with the answered one changed.

## D66 — An intent change nulls fit

Fit is intent-relative: an answer given under *sleep* is not an answer
about *create*. A chip-row revision that **changes intent** sends
`fit: null` — the old fit survives beneath in the chain, per
append-only; it is not carried onto a question that was never asked.
A re-drag (word change, intent carried) carries fit forward untouched.
Without this rule, full-snapshot carry silently attaches a stale answer
to a new question — the same error family as coercing null to "just
because."

Consequence, named: changing intent after answering fit re-opens the
fit question (it re-renders unanswered in the rich phase, if the new
intent qualifies). That is correct, not a bug.

## Non-goals (this pass)

- Deselection-to-null on any chip — banked, cost named above.
- Medications — excluded by posture (lexicon doc), not trimmed.
- Effect vocabulary, multi-intent — lexicon v2 candidates, banked.
- Context vocabulary seeding, suggestions, or chips — free text v1.
- Detail-view session read or edit surface — banked again by name.
- Any schema change — the columns exist; zero migrations.
- Any change to the ladder's geometry, feel values, or the chip row's
  rendering — the rich phase is additive behind its affordance.
- The "More" affordance's final form and the phase-swap animation —
  feel values, gate-tuned.

## Slice plan

One build (JS only — no new dependencies, Metro reload suffices), then
the device gate, then commit. The build touches `session-ladder.tsx`
(phase state, the rich phase's render, the three insert paths, D66 in
the chip-tap payload) and nothing else.

## Gate (UI-visible, physical iPhone; per-step operator verdicts, plain
language; numbers stated where arithmetic or data is the target)

1. Log a session (drop only), don't touch More, close. In the SQL
   editor, the chain's latest entry has fit, context, and co_alcohol
   all NULL — the lazy path writes exactly what it wrote before.
2. Log a session, tap an intent that is not "just because", tap More.
   The ladder is gone; you see the fit question, the context box, and
   the alcohol chip. Tap Back: the ladder is back, card still on its
   rung, chip still selected.
3. In More, answer fit. In SQL, the latest entry carries your fit AND
   the same word, score, and intent as before — one new row, everything
   carried.
4. Type a context word, submit. New row, context recorded, fit still
   there.
5. Tap alcohol. New row, co_alcohol true.
6. Back to the ladder, change the intent chip. In SQL: the new row has
   the new intent and **fit NULL** (D66); your old fit is still in an
   earlier row. In More, fit shows unanswered again.
7. On a chain whose intent is "just because" (or untouched), open More:
   no fit question is shown.
8. Airplane mode ON, answer fit: the error shows, the fit selection
   falls back to its last confirmed state. Airplane OFF, tap again:
   confirms.
9. Lazy-path regression: fresh card, drop, close — two taps, geometry
   unchanged, shelf band updates as before.

## Refinement doctrine

Per the lexicon and mechanic docs: operator is user 1, test data
disposable, the gate outranks every lean. If the phase swap confuses on
the couch, the fallback is scroll-into-view *below* the chip row with
the rung-compression cost accepted consciously — a swap of surface, not
of the D65/D66 write semantics.

## Amendment (D70-D78 pointer) -- 2026-07-18

The fit/context/co-alcohol prose above describes the superseded v1 rich
phase and is retained as the record. The ratified rich phase is D73-D78
(scoring-lexicon.md): fit asks whenever Spark is answered; context is
deleted; the panels are multi-select toggles. Shipped at 5b0aec9;
rewritten at the wheel pass, not before.

## Amendment (D79 pointer) -- 2026-07-19

The wheel pass occurred and refuted the wheel; the ratified interaction
is D79 (session-logging.md). Under D79, fit is its own Spark-keyed
screen immediately after Spark, and the panels are an optional entry on
the closing screen, off the required path. The wholesale rewrite this
doc's D70-D78 pointer promised is re-banked to a consolidation pass;
grounds in the D79 block.
