# Session Logging — The Mechanic

Status: mechanic ratified (D49–D51) and device-gated — the drag beat
tap-and-settle at the spike gate (`97b1b45`). Persistence contract
ratified as leans (D54–D55, 2026-07-16), chip-row rendering and tap
semantics ratified (D56–D57, 2026-07-16), and the answer echo ratified
(D58, 2026-07-16); the physical-iPhone gate refines feel values, not
the shape. North stars:
`documentation/design/scoring-lexicon.md` (the skeleton this mechanic
serves), `documentation/design/product-metaphor.md`, and
`documentation/design/session-entries-schema.md` (the table the wiring
slice writes). Amended by D80 and D81 (blocks at end of file, 2026-07-20), implemented and device-gated at `5318afd`; amended by D82 and D82.1 (blocks at end of file, 2026-07-20), design-only, implementation pending.

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
the known risk to check. (Spike outcome: a full-screen sibling modal,
`presentationStyle="fullScreen"`, never nested inside the pageSheet.)

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
- Crash-safety — **corrected 2026-07-16.** The v1 sentence here claimed
  "no window exists between the drop and the save." False: the save is a
  network insert, and a window exists between release and the server's
  confirmation. The v1 grounds were written as if the save were local
  and instantaneous. What D50 actually guarantees: nothing *after* the
  drop is required of the user. The window itself is made visible and
  short by D54; crash-safety holds from confirmation, not from release.
- Gesture honesty: the drag feels like the commit, and it is. A staged
  variant ("World B": drop settles, dismiss saves) makes the satisfying
  drop theater and the boring dismiss the truth.
- Cost, named and accepted: fiddling writes revision rows, and a twitchy
  drop on the wrong word is recorded for the second it takes to re-drag.
  D47 built the substrate for exactly this; nothing downstream reads the
  score in that second; revision rows are pennies at n≈10.

World B is the named fallback if drop-equals-saved fails the gate.
(The spike gate it survived tested feel; the wiring gate tests it with
persistence live.)

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

## D58 — The answer echo

When the card is settled on a rung, the home-zone box — vacated and
otherwise empty — displays the settled answer word in large type. The
card covering the rung's word is thereby acceptable by design: the box
is the answer's legibility guarantee at couch distance, using space
that sits idle whenever the card is away.

- The echo is the settled rung's word, whenever the card is settled on
  a rung. It mirrors the card's pending translucency until the insert
  confirms (D54), clears whenever the card returns home (cancel, or a
  failed first drop), and after a failed revision shows the last
  confirmed word — because that is where the card lands (D55).
- **No live tracking during the drag** (ratified: bare minimum now; the
  swell is the mid-drag signal). If the art pass later wants the box to
  track the magnetized rung live, nothing here forecloses it.
- The inline error and the echo share the box; when both are visible,
  both must be legible — layout is the implementer's, gate-tuned.
- Type size and treatment are feel values, gate-tuned.

Refutation, recorded: the first fix attempt (2026-07-16) raised the
active rung's word above the settled card ("word-rise"). The gate
refused it — it read as an error state and pushed the top rung's word
off-screen. It was never ratified into this doc; the echo, proposed by
the operator at that gate, replaces it.

## The chip row (D48 content; D56–D57 rendering and semantics)

After the drop is **confirmed** (D54), the intent chip row fades in
beneath the landed card: "What was this for?" Single-select; there is no
skip affordance; dismissing without a tap stores intent as null (D48 —
unanswered is not an answer). A chip tap is a revision of the saved
session, not part of the save.

### D56 — Rendering absent onboarding

Onboarding is banked and no default chip exists, so "the onboarding
default renders first and biggest" (D48) is unimplementable today and
must not be faked — promoting any chip encodes a choice the user never
made, against D48's own spirit. Until onboarding ships: **seven uniform
chips in the seed-list order as authored** — sleep, exercise,
study/work, create, sex, socialize, just because (the
scoring-lexicon.md v1 seed list). The chip strings live in
`src/lib/lexicon.ts` as an `INTENTS` array beside `RUNGS` — one source,
never two. The first-and-biggest rule activates when onboarding ships.
User-extensibility of the intent vocabulary is not this slice (it needs
per-user storage that does not exist); banked.

### D57 — Tap semantics

- Tapping a chip when none is confirmed: a revision insert — word +
  score carried from the last confirmed entry, `intent` = the chip.
- Tapping a **different** chip after one is confirmed: another revision
  insert, same carry rule — append-only, exactly like re-drags.
- Re-tapping the **already-confirmed** chip: a no-op. An identical row
  carries zero information.
- Deselecting back to null is **not designed** and is not improvised
  here; banked. If lived use wants "never mind, no intent," that is its
  own pass.

Rich-path questions (fit, context, co-consumption) are **not placed in
this pass** — their surface (same screen below the chips vs. a later
detail edit) is banked until the mechanic survives the gate.
(Unbanked 2026-07-16: placed by `documentation/design/rich-path.md`,
D64–D66 — a second phase of this same surface.)

## Persistence contract (D54–D55) — the wiring slice

Ratified 2026-07-16. Inserts are direct client writes via `supabase-js`
against the RLS surface designed in
`documentation/design/session-entries-schema.md` — no Edge Function.
Ingestion needed one because parsing runs server-side; this is a plain
RLS-guarded table write.

### D54 — Pending until confirmed; the chip row is the confirmation

The drop is the **save attempt**. The UI never claims a success it has
not observed.

- Release fires the insert immediately. The card snaps to its rung in a
  visually distinct **pending** state (translucent or equivalent — feel
  is gate-tuned).
- **The chip row fades in only on confirmed insert.** D50's "the chip
  row appears after the save" becomes literal rather than theatrical:
  the element already designed *is* the success indicator. No new UI is
  invented for it.
- On failure, the card animates back to the home zone, a plain inline
  error renders ("Couldn't save — check your connection"), and retry is
  simply re-dropping. No partial state, no toast over a fake success.
- **Dismissal is disabled while an insert is in flight.** The silent-lie
  window is dismiss-during-pending. In-flight is sub-second on a live
  connection; a hung request fails visibly at a client timeout (~10s)
  and dismissal re-enables. Backgrounding or app-kill mid-flight can
  still lose the log — accepted and named; engineering it away means an
  offline outbox, which lived-demand rejects at this scale.
- **One in-flight insert at a time.** Chip tap, re-drag, and dismissal
  are disabled while an insert is pending — a whole class of
  snapshot-ordering races dies for free at invisible UX cost.
- **Duplicate-on-retry is absorbed by the schema; no idempotency
  machinery.** If a request times out client-side but landed
  server-side, the retry inserts a near-identical snapshot into the
  same chain and latest-entry-wins makes it a semantic no-op. Do not
  add idempotency keys out of reflex — the append-only design is why
  they are unnecessary.

### D55 — Revision failures revert to last confirmed truth

- Chip tap: the chip renders pending-selected; settles on confirm; on
  failure reverts to the **last confirmed intent**, plus the inline
  error — unselected when no chip was ever confirmed (the first-tap
  case, where the chain's confirmed intent is null), the prior chip
  otherwise. That is D55's own rule applied, not a new one. The session
  stays saved with its last confirmed intent throughout; a failed chip
  tap loses nothing that was ever claimed.
- Re-drag: same pending pattern; on failure the card returns to its
  **prior confirmed rung**, never the home zone — the last confirmed
  entry is the truth, and the UI lands on it.

### The three insert payloads

The client sends `created_by` **never** (`default auth.uid()` owns it)
and does not send `deleted` on any of these paths (default false).
`lexicon_version` is a client constant (1 today) living in `src/lib/`.

- **Drop (entry 1):** `session_id` = client-generated uuid minted **at
  drop time** (a home-zone cancel mints nothing); `coa_id` from the
  card detail; `lexicon_version`; `overall_word` = the rung word as
  displayed; `overall_score` = that word's hidden value;
  `intent` / `fit` / `context` / `co_alcohol` omitted (null, per D48).
- **Chip tap (revision):** full snapshot — same `session_id`,
  word + score copied from the last confirmed entry, `intent` = the
  chip's value.
- **Re-drag (revision):** full snapshot — new word + score, `intent`
  **carried forward** from the last confirmed entry. Full-snapshot
  semantics mean a re-drag after a chip tap must not silently null the
  intent; the client holds last-confirmed-entry state in memory, and
  D54's one-in-flight rule keeps that state unambiguous.

## Slice plan

1. **The spike** — the ladder live on-device, launched from the card
   detail. **Persists nothing and contains no chip row**; the drop
   animates and the surface states plainly that nothing was saved. Gate
   is feel-verdicts on the physical iPhone: does the drag beat
   tap-and-settle, does snap feel right, is the home-zone cancel
   discoverable. The spike is committed product code (it builds and
   runs), but its save path is explicitly absent, not stubbed —
   no fake success states. **Shipped and gated: `97b1b45`; the drag
   won.**
2. **Schema** — sessions table derived from the lexicon skeleton
   (raw answers, computed score, `lexicon_version`, four fact-class
   fields, revision/soft-delete structure per D47, RLS). Gated on a
   fresh pg_tables/pg_policies observation. Designed in
   `session-entries-schema.md` (D52–D53). **Shipped, applied, and
   gated on observed state: `1c93740`.**
3. **Wiring** — drop inserts, chip tap revises (D54–D55 above); the
   chip row lands (rendering per D48); the spike's honesty label is
   removed; the COA delete-dialog copy grows "...and its logged
   sessions" (D53 consequence); the settled-card-covers-rung-word
   spike defect is resolved by the answer echo (D58). **The detail-view sessions read
   is not in this slice** — moved to the scoring slice (amended
   2026-07-15), where the latest-entry-per-chain view lives; nothing
   in wiring needs a read, and the chip row's appearance is the
   in-session evidence a save happened. Gate: UI-visible — the
   physical iPhone, with persistence verified by a fresh
   `session_entries` SELECT in the SQL editor. **Shipped and gated
   across four commits: `111de9c` (D54-D55 persistence), `4034ea4`
   (chip row), `cae5258` (D53 dialog copy), `37bf9eb` (D58 echo).**

## Non-goals (this pass)

- Rich-path question placement (banked above).
- Any sessions read, view, or scoring — the scoring slice, against the
  metaphor doc, with `security_invoker = true` non-negotiable.
- Mood visual language, card shading, book placement UI — the art pass.
- Onboarding survey and default-chip sourcing — banked slice; this doc
  only consumes D48's rendering rule.
- Any change to `scoring-lexicon.md`, `product-metaphor.md`, or
  `session-entries-schema.md`.
- Never Again — not a survey answer (skeleton item 6); it does not appear
  on this surface at all.
- Offline outbox / retry queue — rejected by lived-demand; named in D54.

## Refinement doctrine

Same as the lexicon doc's: the operator is user 1, test data is
disposable (ratified ruling), and the gate outranks every lean above. If
the drag loses to tap-and-settle on the couch, D50/D51 are replaced by a
tap mechanic under the same D49 launch surface and the same chip-row
rules — the fallback swaps the gesture, not the skeleton.

## Amendment (D70-D78 pointer) -- 2026-07-18

The chip-row, context free-text, and alcohol-chip prose above describes
the superseded v1 survey and is retained as the record of what was
superseded. The ratified survey is D70-D78 (scoring-lexicon.md amendment
blocks): three single-select intent axes, the fit question keyed on
Spark, and two multi-select toggle panels; shipped at 5b0aec9. This
doc's interaction prose is rewritten at the wheel pass, not before.

## Amendment (D79) -- axis capture restructure, 2026-07-19

Operator-ratified in chat. This is the wheel pass; the wheel is refuted
as an input control. Grounds: the survey is answered during or after a
session (impaired-use constraint); first-use predictability; and skip
must cost less than answering (null-honesty) -- a novel radial encoding
fails all three. The carried three-axis-wheel and marking-menu leans
are refuted with it. Calyx-to-petal relocates to the completion
animation (banked, art pass; an animation can never mis-select).

The ratified interaction:

- On confirmed drop (D54), the flow advances to the axis screens.
- One axis per screen, three screens: Energy, Environment, Spark, in
  that order. The screen title is the axis name.
- Each screen: the axis's values as full-width stacked pills in thumb
  reach. Tapping a value records it and advances immediately -- no
  Next on axis screens.
- Skip is first-class: a persistent Skip control on every axis screen,
  no smaller than a pill; skipping records null and advances. Null
  must never cost more effort than answering. Gesture refinement
  banked.
- Fit (D73, Spark-keyed) becomes its own screen, shown only when Spark
  was answered, immediately after Spark, same pill-and-Skip pattern,
  vocabulary unchanged.
- The ladder (D50-D51) is unchanged and remains the entry gesture.
- The two panels (D75, D78) move off the required path: a closing
  screen carries Close and an optional panels entry, reachable but
  never blocking Close.
- Persistence grammar unchanged: D54-D55 pending semantics, D65
  revision inserts, D66 fit nulling, D77 shape, D78 null-not-empty.
  This decision moves surfaces; it does not touch writes.

Doc-rewrite note: the pointer block above promised a wholesale rewrite
at the wheel pass. Re-banked to a consolidation pass. Grounds: the
wheel's refutation removes the replacement prose that rewrite assumed;
the amendment-block chain is the ratified record, and rewriting
superseded v1 prose adds no information.

## Amendment (D80) -- ladder unification: score becomes a pill screen, 2026-07-20

Operator-ratified in chat, 2026-07-20. Grounds: lived use on the gated
D79 build. Operator verbatim: "It felt like I was using multiple
applications. The drag and drop tree for the first question and then
just pill taps for the other questions." The refinement doctrine ranks
lived use above design intent. The design test this pass answers to:
one coherent application -- no point in the flow where the interaction
model changes.

The ratified interaction:

- The score screen becomes a pill screen: the five RUNGS as full-width
  stacked pills, Elite at top, Trash at bottom. The vertical order
  carries D51's up-is-better geometry as visual order rather than drag
  distance.
- Tap is the save. D50's contract survives with the motion changed:
  the mandatory field and the save are one muscle motion; there is no
  done button and no confirm dialog, ever. Target size improves over
  the ladder (full width x screen height / 5).
- Tap fires the insert through the existing single writer. The tapped
  pill renders pending until the insert confirms (the D54 contract is
  preserved wholesale: never claim an unobserved success, one in-flight
  insert, controls disabled in flight, inline error on failure, ~10s
  client timeout, duplicate-on-retry absorbed by the schema). Advance
  on confirmed insert, never on tap (D79 semantics).
- No Skip on the score screen: score is the skeleton's mandatory
  field. Every other sequence screen keeps first-class Skip. This is
  the one intentional non-uniformity, and it is semantic, not
  gestural.
- Cancel is the Close control already on this screen. The card and the
  home zone are removed; the home-zone-is-cancel mechanic (D51) is
  superseded.
- The answer echo (D58) is superseded entirely: with no card, nothing
  is covered, and the selected pill's own state carries legibility.
- Revision: Back to the score screen and tapping a different pill is a
  revision insert -- the same grammar the axis screens already use.
- Persistence grammar unchanged: D54-D55 pending semantics, revision
  inserts, D66 fit nulling, D77 shape, D78 null-not-empty. This
  decision moves the surface; it does not touch writes.

Superseded and preserved, per decision:

- D50: superseded in gesture, preserved in contract (tap-is-the-save).
- D51: superseded as mechanic; the up-is-better vertical geometry is
  preserved as visual order. Named cost, operator-accepted: the
  shelf-rehearsal metaphor ("placing the product where it belongs")
  dies with the drag. Ceremony defers to the banked calyx-to-petal
  completion animation (art pass).
- D54: contract preserved; the card-specific failure mechanics are
  replaced by the pill screen's error grammar, already device-gated
  under D79.
- D58: superseded entirely.

Sequence-screen scaffold (part of this pass; exact values gate-tuned):

- One shared screen container for every sequence screen: safe-area top
  inset plus breathing room above the header. The current header sits
  at the raw top of a flex column with no inset.
- The title is truly centered: the Back control is balanced by an
  equal-width trailing spacer, so the title no longer offsets.
- Applies to all sequence screens: score, Energy, Environment, Spark,
  fit, closing, panels.
- Recon finding, recorded: the "gear icon" in the D79 gate screenshots
  is the Expo dev-client overlay, not app code; no gear is rendered
  anywhere in src/. The only in-app half of that collision is the
  header layout above.

Gate: couch gate on the physical iPhone. Criterion: seam-absence --
the full flow, start to finish, feels like one application. Completion
feel is observed secondarily at the same gate and feeds the banked art
pass; it is not pass/fail. (This amends the prior handoff's
"couch-gated on completion feel"; operator-confirmed 2026-07-20.)

This amendment is design-only. Implementation is a follow-on feat
slice, device-gated per the criterion above.

## Amendment (D81) -- every survey screen names the product, 2026-07-20

Operator-ratified in chat, 2026-07-20, on reviewing the D80
implementation diff. The retired card was also the survey's only
product identification; D80 recorded its gesture role and missed its
information role. The operator's ratified fix goes further than
restoring it in one place: every survey screen leads with the product
-- brand and strain together -- so the user is never rating an unnamed
thing.

- The header of every sequence screen shows the product identification
  as the top line -- the brand and the strain, rendered "Brand - Strain"
  -- with the screen's question beneath it as a subheading: score
  "Overall", the axis names, the fit question, the panels screen's
  "Anything else?". The closing screen, which asks nothing, shows the
  product identification alone.
- The balanced-spacer centering of the D80 scaffold applies to the
  name-plus-subheading unit as it did to the single title.
- Question wording itself is unchanged; the banked survey copy review
  still owns it.
- Type sizes and treatment are feel values, gate-tuned.

Design-only; implemented in the same feat slice as D80.

## Amendment (D82) -- the panels join the sequence, 2026-07-20

Operator-ratified in chat, 2026-07-20. Grounds: the operator's gate
verdict on the D80/D81 build named the panels screen as the last seam,
and the one-grammar criterion that killed the drag applies to it with
equal force. The open design question D80 left behind -- multi-select
cannot use tap-advance unmodified -- is answered here.

The ratified interaction:

- Both panels leave the off-path panels screen and join the required
  sequence as two separate screens, one card each: "How were you
  starting out?" (physical_state), then "Anything else?"
  (co_consumption). Each screen renders its full vocabulary as
  stacked pills, authored order, D75/D76 vocabularies unchanged.
- The full order: score, Energy, Environment, Spark, fit (still
  conditional on Spark, D73), starting-out, anything-else, closing.
  Grounds for the placement: the verdict screens stay a contiguous
  block about this run; the panels are context, not verdicts, and
  trail the block; the specific question precedes the catch-all.
- Multi-select grammar: a tap toggles a value and saves that toggle
  immediately -- tap-is-the-save survives per-toggle, D78 semantics
  preserved wholesale (selected inverts, toggled value renders
  pending, deselection writes). A full-width Done pill beneath the
  values advances the screen. Done never writes; it only advances.
- Done with nothing selected is the skip. There is no separate Skip
  pill on a multi-select screen: null costs one tap, the same as
  answering, so the null-must-never-cost-more principle is satisfied
  by Done itself. Rejected alternative, recorded: holding toggles in
  local state and saving the set at Done -- it breaks tap-is-the-save
  and introduces a batched save that can partially fail.
- The survey's one grammar split is now explicit and visible:
  single-select screens advance on the answer tap; multi-select
  screens toggle in place and advance on Done. The split is carried
  by what the eye can see -- pills staying lit -- not by hidden state.
  The score screen's missing Skip (D80) remains the one semantic
  non-uniformity.
- The closing screen loses the panels entry. It becomes: the product
  line alone in the header (D81, no title), a single Close button,
  and Back returning to the anything-else screen. Rejected
  alternative, recorded: deleting the closing screen and ending the
  survey on the anything-else Done -- rejected because the survey
  would terminate on a data-writing screen with no terminus, and the
  banked completion moment (art pass, calyx-to-petal) needs a screen
  to live on.
- Done pill treatment is visually distinct from the value pills;
  exact treatment is a feel value, gate-tuned, final styling owned by
  the banked art pass.
- Persistence grammar unchanged: D54-D55 pending semantics, D65
  revision inserts, D66 fit nulling, D77 shape, D78 null-not-empty.
  No schema change: both columns stay `string[] | null`,
  presence-only. This decision moves surfaces; it does not touch
  writes.

Superseded, per decision:

- The D79 closing-screen panels entry and the combined off-path
  panels screen are superseded as surfaces. D75/D76 vocabularies and
  D78 toggle semantics are preserved wholesale on the new screens.

Gate: couch gate on the physical iPhone. Criterion: seam-absence --
the full flow, start to finish, feels like one application, panels
included. Same criterion that gated D80; this pass exists because
that gate named the residue.

This amendment is design-only. Implementation is a follow-on feat
slice, device-gated per the criterion above.

## Amendment (D82.1) -- multi-select announces itself, 2026-07-20

Operator-ratified in chat, 2026-07-20, at the D82 device gate. The gate
FAILED on its seam criterion, informatively: the D82 block claimed the
grammar split was "carried by what the eye can see -- pills staying
lit." Refuted by lived use. Operator verbatim: "it presents exactly the
same as the other screens even though it is different." A lit pill is
legible only after the first tap; a multi-select screen must announce
itself before it.

The ratified fix:

- Every multi-select pill carries a leading checkbox: an empty square
  when the value is off, a checked square when it is on. The square's
  presence is the pre-tap cue that this screen is pick-any and needs
  Done, where a bare pill is pick-one and advances on tap.
- Single-select pills are unchanged -- no indicator. Considered and
  rejected: indicators on both grammars (circle vs square), rejected
  because the operator's ratified cue is the asymmetry itself; the
  bare pill is already the established single-select shape.
- No new dependencies; the checkbox is drawn with existing primitives.
  Final visual treatment is art-pass scope.

Everything else in the D82 block stands as gated: the sequence order,
the Done grammar, the per-toggle writes, the closing screen, and the
persistence conformance (observed row-by-row at this gate, including a
live null-normalization on deselect).

Gate: the same seam-absence couch gate, re-run on the two panel
screens after the checkbox lands in the same feat slice.

## Amendment (D85 pointer) -- 2026-07-24

Spark is renamed Main Goal by D85 (column at ef67af5, client at
9336f54; documentation/design/glossary.md is the renaming record).
The Spark references in the dated amendment blocks above are
historical records, left as written per D85.2's ledger boundary.
