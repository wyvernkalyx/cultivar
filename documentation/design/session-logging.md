# Session Logging — The Mechanic

Status: mechanic pass ratified as leans (D49–D51); no implementation exists.
Every decision below is ratified *as the lean* — the physical-iPhone gate
settles what ships, per the standing ruling that reserved this pass
(drag-card-onto-word primary, Daylio-style tap-and-settle the named
fallback). North stars: `documentation/design/scoring-lexicon.md` (the
skeleton this mechanic serves) and
`documentation/design/product-metaphor.md`.

## Purpose

The lexicon doc defines *what* a session records; this doc defines the
physical act of recording it. Constraint inherited whole: the overall word
is the only mandatory field (skeleton item 2), sessions are append-only
with revision and soft delete on top (skeleton item 3, D47), and no intent
tap stores null, never "just because" (D48).

## D49 — Launch surface: the card detail view

Logging starts from the card detail view (slice 9): a "Log session" button
on the open card presents a full-screen logging surface for that COA.

Grounds:
- The card is pre-selected; no picker step. The cohort logs about the
  thing in their hand, which they have usually just looked at.
- The logging surface owns the whole screen — the drag competes with no
  scroll gesture.
- Dragging cards directly off the shelf was considered and rejected: it
  requires long-press-to-lift inside a scroll view, and long-press was
  deliberately retired from the shelf when delete moved to the detail
  view. Reintroducing it with a different meaning on the same surface is
  a confusion trap.
- A dedicated "log" tab was rejected: it starts from the act and adds a
  card-picker step the two-tap promise cannot afford.

Presentation mechanism (stacked Modal vs. state swap inside the detail
modal) is an implementation choice, not a design commitment — the
implementer reports which was used and why. iOS stacked-modal behavior is
the known risk to check.

## D50 — Drop is the save

Releasing the card on a word saves the session at that instant. There is
no "done" button and no confirm dialog, ever.

- The chip row (below) appears *after* the save; a chip tap is a
  **revision** of the already-saved session (D47 substrate).
- Re-dragging the card to a different word is likewise a revision; the
  prior answer is preserved beneath, per skeleton item 3.
- Dismissing the surface at any point after the drop loses nothing —
  there is nothing to finish.

Grounds:
- Skeleton item 2 made physical: the mandatory field and the save are the
  same muscle motion. An impaired user who drops the card is done.
- Crash-safety: no window exists between the drop and the save in which
  backgrounding, a dead battery, or distraction loses the log.
- Gesture honesty: the drag feels like the commit, and it is. A staged
  variant ("World B": drop settles, dismiss saves) makes the satisfying
  drop theater and the boring dismiss the truth.
- Cost, named and accepted: fiddling writes revision rows, and a twitchy
  drop on the wrong word is recorded for the second it takes to re-drag.
  D47 built the substrate for exactly this; nothing downstream reads the
  score in that second; revision rows are pennies at n≈10.

World B is the named fallback if drop-equals-saved fails the gate.

## D51 — The geometry: a vertical ladder

Five words stacked full-height: "I loved it" at top, "I hated it" at
bottom, "Meh" at dead center. The card starts in a home zone at the bottom
of the screen (thumb's resting position) and is dragged up to its rung.

Grounds:
- It is the shelf, rehearsed: better books sit higher, and the logging
  gesture and the organizing metaphor become the same physical idea —
  placing the product where it belongs. A horizontal row teaches nothing.
- One thumb, couch, impaired: vertical drag is the phone's native muscle
  motion, and screen-height ÷ 5 gives larger targets than screen-width
  ÷ 5. Target size is the working defense against the twitchy mis-drop
  accepted in D50.
- The scale's real midpoint is literally the middle of the screen.

Mechanics (provisional; the gate refines feel values, not the shape):
- **Snap, never hover-precision.** While dragging, the card magnetizes to
  the nearest rung and the active word swells, so the pending answer is
  unmissable before release. Release anywhere in the ladder = snap to
  nearest. No dead zones between rungs.
- **The home zone is the cancel.** Releasing the card in (or dragging it
  back to) its bottom home zone means "never mind" — no session, no
  cancel button. The geometry is the cancel.
- Rung order is fixed by the metaphor (up = better). Exact type sizes,
  swell scale, spring constants, and haptics are gate-tuned, not
  designed here.

## The chip row (placement; content is D48's)

After the drop, the intent chip row fades in beneath the landed card:
"What was this for?" Single-select; the onboarding default chip renders
first and biggest (D48); there is no skip affordance; dismissing without a
tap stores intent as null (D48 — unanswered is not an answer). A chip tap
is a revision of the saved session, not part of the save.

Rich-path questions (fit, context, co-consumption) are **not placed in
this pass** — their surface (same screen below the chips vs. a later
detail edit) is banked until the mechanic survives the gate.

## Slice plan

1. **The spike** — the ladder live on-device, launched from the card
   detail. **Persists nothing and contains no chip row**; the drop
   animates and the surface states plainly that nothing was saved. Gate
   is feel-verdicts on the physical iPhone: does the drag beat
   tap-and-settle, does snap feel right, is the home-zone cancel
   discoverable. The spike is committed product code (it builds and
   runs), but its save path is explicitly absent, not stubbed —
   no fake success states.
2. **Schema** — sessions table derived from the lexicon skeleton
   (raw answers, computed score, `lexicon_version`, four fact-class
   fields, revision/soft-delete structure per D47, RLS). Gated on a
   fresh pg_tables/pg_policies observation. Not designed here.
3. **Wiring** — drop inserts, chip tap revises, detail view gains a
   sessions read. Not designed here.

## Non-goals (this pass)

- Schema — no tables, columns, or migrations (slice 2 above derives them).
- Rich-path question placement (banked above).
- Mood visual language, card shading, book placement UI — the art pass.
- Onboarding survey and default-chip sourcing — banked slice; this doc
  only consumes D48's rendering rule.
- Any change to `scoring-lexicon.md` or `product-metaphor.md`.
- Never Again — not a survey answer (skeleton item 6); it does not appear
  on this surface at all.

## Refinement doctrine

Same as the lexicon doc's: the operator is user 1, test data is
disposable (ratified ruling), and the gate outranks every lean above. If
the drag loses to tap-and-settle on the couch, D50/D51 are replaced by a
tap mechanic under the same D49 launch surface and the same chip-row
rules — the fallback swaps the gesture, not the skeleton.
