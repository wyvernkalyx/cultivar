# Scoring Lexicon

Status: design ratified (D46); amended (D47–D48); substantially revised for the survey vocabulary and structure (D70-D76, 2026-07-18; see Amendment at end); implemented through D66. The skeleton below is
durable; every vocabulary is v1 and provisional. Refinement from live use is
the designed path, not a failure of the design — the operator cannot know how
to improve the survey until real sessions are logged against it, and the
versioning architecture below exists precisely so revision cannot corrupt
history. North star: `documentation/design/product-metaphor.md`, which
reserved this pass ("its own dedicated design pass... do not improvise").

## Purpose

The survey is the heart of the personal-empirical engine: it is the only
place outcomes enter the system, and outcomes are the only thing Cultivar is
allowed to learn from (discipline 1 — mood from logged outcomes only, never
chemistry). This doc defines what a session asks, how answers become a score,
and how scores place COAs into books.

## Durable skeleton (expensive to change; ratified)

These survive every vocabulary revision. Changing any of them mid-stream
corrupts or re-interprets recorded history.

1. **The session score comes from the overall word alone, on every path.**
   The overall question is global-hedonic ("how was it, period") and means
   the same thing on every session, tagged or untagged, lazy or rich. Rich
   answers never move the score — no composite scoring, ever. A lazy log is
   a complete log, not a degraded one.
2. **The overall word is the only mandatory field in the product.** A
   session without it does not exist to the engine. Everything else, on any
   path, is optional.
3. **Sessions are append-only; scores are immutable facts.** Each session
   stores the raw answers, the computed score, and a `lexicon_version`.
   A later lexicon may remap words to values; recorded scores never
   recompute automatically. A deliberate, ratified recompute remains
   possible from preserved raw answers — never silent, never default. Same
   family as ND != 0: never rewrite what was recorded.

   Amended (D47): sessions are revisable and soft-deletable on top of the
   append-only substrate. Revising preserves every prior answer beneath — the
   latest answers drive the score; nothing is overwritten. Deleting is soft:
   the session vanishes from all computation and display, but the row
   survives, marked. Nothing recorded is ever silently destroyed. Hard
   erasure is an account-level privacy feature, banked, never a per-session
   gesture.
4. **Fact classes stay distinct fields, even where v1 leaves them thin:** _(amended by D76, 2026-07-18: physical-state added; context removed -- see Amendment)_
   - **intent** — what was this for (purpose, chosen before/at the session)
   - **fit** — did it do what you wanted (intent-relative outcome)
   - **context** — what were you doing (activity)
   - **co-consumption** — what else was in you (confounds)
   Merging fields later is migration surgery; adding to them is trivial.
5. **Band placement:** a COA's standing is the average of its session
   scores; its book is that average rounded to the nearest scale point.
   Five scale points = five books = five moods. The compendium (untried)
   is a sixth visual state, not a band — the absence of a score, never the
   middle of the scale (discipline 2). Never Again displays as the darkest
   band per the metaphor doc; the honest average keeps computing
   underneath (discipline 3).
6. **The `never_again` / `average_score` structure is ratified as
   proposed** — the metaphor doc's provisional direction survives this
   pass's revisit unchanged. NA is a standing verdict made between
   sessions, never a survey answer; a survey response can never set it.

## The two paths (per-session choice, no mode setting)

Both paths open identically. The rich path is the lazy path plus optional
depth; nothing on it gates saving.

### Lazy path — two taps, complete

1. **The overall word** (required): "Did you like it?"
2. **The intent chip** (single-select): "What was this for?"

### Rich path — the lazy path plus, all optional

3. **Fit:** "Did it do what you wanted?"
4. **Context:** "What were you doing?"
5. **Co-consumption:** alcohol.

This is the v1 ceiling. Completion falls with every added item; each future
question must argue its way in against the append-only pull ("unasked is
unrecoverable forever"), not ride in on it.

## The overall scale (v1 vocabulary, provisional)

> Superseded by D70 (2026-07-18): Elite / Solid / Mid / Miss / Trash. The v1 strings below are retained as the pre-amendment record. See Amendment at end.

Five fully-labeled points, symmetric bipolar, operator-authored. The user
picks a word and never sees a number; hidden values are 1–5, evenly spaced.

| Word | Hidden value |
|---|---|
| I hated it | 1 |
| No | 2 |
| Meh | 3 |
| Yes | 4 |
| I loved it | 5 |

Grounds for the shape (stable psychometric consensus; Krosnick's survey-
methodology line, Preston & Colman 2000): reliability peaks at 5–7 points
and fully-labeled scales beat numeric or endpoint-only labeling; an odd
count gives a genuine midpoint, and "Meh" is the honest middle outcome
(unremarkable), not an evasion. Five over seven: the respondent is
frequently impaired at logging time, five distinguishable words is a
defensible cognitive load, and the point count is also the book count — a
five-mood shelf reads at a glance. The exact strings are v1; the count,
labeling-completeness, symmetry, and hidden 1–5 mapping are skeleton.

## Question two: intent (ratified over effect)

> Superseded by D71-D73 (2026-07-18): intent is now three orthogonal single-select axes (Energy, Environment, Spark), Spark the anchor. The single-chip model below is retained as the pre-amendment record. See Amendment at end.

- **Single primary intent, forced choice** — not multi-select. A
  multi-tagged session dilutes every correlation it touches; one forced
  pick is more honest data than three easy ones. Multi-intent banks for a
  lexicon v2 the data model can absorb.
- **"Just because" is a first-class chip, not a skip.** Aimless sessions
  are real and common; making purposelessness an answer keeps the chip row
  always-shown with no skip affordance and turns aimless sessions into
  data instead of gaps.
- **v1 seed list (provisional, operator-authored, user-extensible by
  design):** sleep, exercise, study/work, create, sex, socialize,
  just because.
- **Ruled over the alternative:** an effect vocabulary ("sleepy",
  "creative" — what it *did* rather than what it was *for*) was considered
  and banked. Intent is what the onboarding survey mirrors, what the
  expectation-vs-reality surface needs, and what the quadrant's x-axis is
  built from; an effect label cannot reconstruct purpose after the fact.
  Named weakness, accepted: retrospective intent is softer than a fresh
  effect report (people back-fill wants from outcomes). Effect vocabulary
  remains a candidate rich-path question for v2.
- **Unanswered is not an answer (D48).** No intent tap → intent stores as
  null, never coerced to "just because" (aimless-on-purpose is an answer;
  unanswered is a gap). Recorded = chosen, no exceptions.

## Rich-path questions (v1 forms, provisional)

> Superseded by D73-D75 (2026-07-18): fit gates on Spark; context free-text is deleted (D74); co-consumption is a multi-select panel (D75). Retained below as the pre-amendment record. See Amendment at end.

- **Fit** — "Did it do what you wanted?": No / Sort of / Yes (3-point,
  provisional). Fit is intent-relative and stored as its own fact; it
  never touches the score or the books. Asked only when the session's
  intent is answered and is not "just because."
- **Context** — "What were you doing?": vocabulary deliberately unseeded;
  the operator's first weeks of real use author it. Free entry acceptable
  for v1.
- **Co-consumption** — v1 is a single alcohol chip. A bad session that was
  really a whiskey session is a confound the engine must eventually see.

### Medications: excluded by design

Not a v1 trim — a posture. RLS scopes users from each other, not from the
operator; Cultivar today is a named-user cannabis database its operator can
read, and a medication field makes it a holder of health data — an elevated
privacy class and exactly the medical-adjacent territory the
personal-empirical posture refuses. Alcohol clears as a lifestyle confound;
meds do not. Revisit bar: an architecture where the operator *cannot* read
the field (client-side encryption or local-only storage) — its own design
pass with its own threat model, if lived demand ever asks.

## Onboarding survey (ratified concept; implementation banked)

A new user answers a questionnaire that mirrors the session survey — "what
do you imagine wanting from this?" — before any session exists. It seeds
the user's intent vocabulary from their own answers on day one and teaches
the survey mechanics while nothing is at stake.

**Discipline (non-negotiable, same family as untried-is-neutral): stated
wants are expectations, never outcomes.** Onboarding answers produce zero
scores, zero moods, zero card shading, and never feed the correlation
engine as sessions. Their future value is the expectation-vs-reality
surface ("you thought you were a sleep user; your logged sessions say
create") — a read surface, banked by name.

**Default intent chip (D48).** Onboarding asks "what's your usual reason?"
That chip renders first and biggest in the session survey's chip row —
friction reduction only. It is never auto-filled; a skipped chip row stores
null, always.

**Scan-your-favorites (banked).** Onboarding invites the user to scan in
known favorites even if not on hand. They enter the compendium as neutral
untried cards (discipline 2 applies in full) and double as expectation data
for the expectation-vs-reality surface.

## Banked consumers (named, so the data is captured for them now)

- **The quadrant** — per-intent scatter of quality (overall) x fit; the
  four regions: great-and-effective, fun-but-wrong-job,
  effective-but-unpleasant, the dead corner. Computable forever if intent
  + overall + fit are recorded; costs nothing now.
- **The intent lens** — "show me my shelf as a sleeper": a filter or
  re-ranking over the one true shelf. Never a second organizing spine; a
  COA has exactly one book at a time (ratified in the metaphor doc, held
  against the intent-shelf proposal this pass).
- **Confound discounting** — a lens that lets the user discount
  alcohol-confounded sessions from a card's *read*; the recorded scores
  stay preserved regardless.
- **Effect vocabulary** — rich-path candidate, v2.
- **Multi-intent** — v2, if lived usage keeps producing genuinely
  dual-purpose sessions.
- **Expectation-vs-reality** — the onboarding data's payoff surface.
- **AI session summaries** — Bevel-style natural-language reads of the
  user's own logs. Guardrail: generated copy obeys personal-empirical —
  correlations in this user's data only, never causal or population-level
  claims.

## Non-goals (this pass)

- Schema — no tables, columns, or migrations are designed here; the
  session-logging slice derives them from the skeleton.
- The session-logging interaction (the draggable, playful mechanic) — its
  own design pass, now unblocked by this doc.
- Mood visual language — the art pass; this doc fixes only that there are
  five moods plus neutral.
- Implementing the onboarding survey — its own banked slice.
- Any change to `product-metaphor.md` — the expectations-never-outcomes
  discipline lives here; promoting it into the metaphor doc's discipline
  list is a separate `docs:` amendment if ever desired.

## Refinement doctrine

The operator is user 1 and the test cohort is n~10 friends. Operator data
is disposable during the test phase (ratified ruling); if v1 vocabulary
proves wrong in use, wiping test sessions and re-baselining is explicitly
available. The append-only dread protects real users' histories, and none
exist yet. Vocabularies revise freely under `lexicon_version`; the six
skeleton items above do not revise without their own ratification pass.

## Amendment (D70-D76) -- survey vocabulary and structure, 2026-07-18

Operator-ratified in chat. Zero session rows exist; test data is disposable (refinement doctrine), so every change below is free today and supersedes prior ratified vocabulary without corrupting history. The pre-amendment text above is retained as the record of what was superseded. The interaction mechanic (the wheel) is a separate pass against session-logging.md and rich-path.md and is NOT decided here.

### D70 -- Overall scale: new vocabulary, symmetry preserved
Five overall words become Elite / Solid / Mid / Miss / Trash, mapping +2/+1/0/-1/-2 (hidden 5/4/3/2/1). Supersedes the v1 strings only (D46). Skeleton unchanged: five points, symmetric bipolar, fully labeled, odd count for a genuine midpoint, hidden 1-5. "Mid" is the true neutral (the unremarkable-outcome slot), not a mild positive.

### D71 -- Intent: three orthogonal single-select axes
Skeleton reversal. "Single primary intent, forced choice" is replaced by three orthogonal axes, each its own forced single pick, each independently nullable: Energy (Chill / Active / Buzzing), Environment (Solo / Social), Spark (Relief / Flow / Munchies). Grounds (recorded, because this reverses a skeleton item): these are three orthogonal questions, not one multi-tagged question. The dilution the old rule guarded against comes from tagging one question with many values; it does not arise when each axis is a clean single pick in its own field. Recover-later asymmetry decides the count: capturing three dimensions while free is reversible (collapse to one in analysis anytime); capturing one is not. All three are feeling-words -- a stated felt state, never a symptom claim. Supersedes D48's single chip, D56 (seven uniform chips), D57 (single-intent chip semantics). Storage: three nullable text columns, never one concatenated tag (schema pass derives them).

### D72 -- Spark is the intent anchor
Spark is the intent for every consumer needing a single referent. Fit is Spark-relative. The quadrant and the intent lens read Spark; Energy and Environment are secondary lenses (filterable, never the fit referent). Amends D66: an intent change nulls fit only when the changed axis is Spark; Energy/Environment changes never touch fit.

### D73 -- Fit render condition; aimless is null
Fit asks whenever Spark is answered; no Spark, no fit question. Retires the "not just-because" gate -- "just because" no longer exists in the vocabulary. Aimless is Spark-at-center (null): logging no Spark IS the "no particular reason" session; there is no explicit aimless answer, per D48's null-is-first-class rule.

### D74 -- Context free-text deleted
The "What were you doing?" free-text question is removed. Supersedes the context question (D65 context); the context column becomes unused/removable (schema pass decides). Its confound role is better served by D75/D76.

### D75 -- Co-consumption: a multi-select confound panel
The single alcohol chip becomes a multi-select panel: Alcohol, Caffeine, Nicotine, Fatty food, Terpene-rich food. Presence-only, multi-select by nature. Does NOT violate D71's single-pick rule: co-consumption is its own fact class, and confounds are what you discount against, never what you correlate intent on. Supersedes the single alcohol chip (D65); the "false reserved for a future explicit-no" note is moot.

### D76 -- Physical state: a new fact class
A fifth fact class is added: Dehydrated, Fatigued, Stressed (multi-select, presence-only). Amends skeleton item 4: intent (now three axes), fit, co-consumption (expanded), physical-state (new); context removed. Grounds: baseline physiology swings a session's outcome; capturing it lets the engine see the confound. Health-data line (carried from the medications-exclusion posture): these are felt transient states going in, not diagnoses. Dehydrated and Fatigued are light bodily-state. Stressed sits closest to the line -- a felt state is defensible where a mental-health diagnosis is not, but its glossary entry must hold the felt-state reading and never drift to "anxiety." If lived use pushes it toward a clinical frame, the medications-exclusion revisit bar applies.

### Hand-offs (not in this amendment)
Glossary: the cross-fade / physiology material is population-level pharmacology (mechanism, causation, general case) -- forbidden in user-facing copy by discipline 1 and CLAUDE.md. It enters via a personal-empirical rewrite (what the app tracks and why it might matter for you, never what a substance does in general). Its own docs pass; definitions must be the operator's own words. Schema: this amendment voids rich-path.md's "the columns exist -- zero schema." session-entries-schema.md needs a revision pass deriving three axis columns, a five-substance structure, a physical-state structure, and the context-column removal. Free today (zero rows); a real migration. Sequenced after this amendment, before any wheel build.

### Supersession scope
This pass retires or amends, wholesale, most of the survey's ratified vocabulary and interaction history: D46-D48 (scale strings, single intent), D56-D57 (chip rendering/semantics), D64-D66 (rich-path placement, per-answer inserts, intent->fit null now Spark-scoped). The refinement doctrine permits this ("vocabularies revise freely"); zero rows make it safe.
