# Session Effects Tags -- Design

Status: design ratified D119-D121, 2026-08-04. D121 migration and
the slice (c) closing-screen UI both applied and
gated 2026-08-04; LEXICON_VERSION is 5. This line is amended by
the commit that changes its truth.

## Purpose

Tags-only mood capture, ruled by the operator 2026-08-04, resolving the
question the 2026-08-04 handoff carried as Blocked (two bipolar axes vs
tags vs both). A session records which effects showed up, in the user's
own everyday words. The tags feed the same personal-empirical engine as
the score: what correlates with this user's chemistry, never what a
terpene "does."

## D119 -- One flat text[] fact class, valence-free

`session_entries` gains `effects` (text[], nullable). Null and empty
both mean nothing recorded, per the D75 collapse. Values are text, not
an enum, per the standing convention. The client constant lives in
lexicon.ts.

The vocabulary, operator-authored and ratified verbatim:

- Head space: Focused, Creative, Uplifted/Happy, Giggly, Clear-headed,
  Mellow/Chill
- Body feel: Heavy Body, Couch-lock, Unwound/Unstressed, Heavy Eyelids,
  Energized
- Off-Key, common discomforts: Dry Mouth, Dry Eyes, Munchies
- Off-Key, head and body flags: Mind Racing, Jittery, Spacey,
  Forgetful, Lightheaded, Heavy-headed

Spacey and Forgetful are distinct tags by operator ruling 2026-08-04:
the original compound was the one pair naming two genuinely different
states, and splitting after real data accumulates loses which half was
meant. The remaining slash forms (Uplifted/Happy, Mellow/Chill,
Unwound/Unstressed) are synonym pairs and permanent single tokens.

**The groups are presentation only. The schema stores one flat array
with no valence.** Grounds: the same effect flips valence by session --
Couch-lock is the goal at 11pm and the failure at noon; Munchies either
way. The session score carries valence; tags record what happened.
Baking wanted/unwanted into the data would fabricate a judgment the
user did not make. The Off-Key grouping earns its place in the UI
because a visible discomfort list prompts recall of negatives users
otherwise omit; moving a tag between groups later is free because the
data never knew the groups.

Recorded, not defended against: Dry Mouth, Dry Eyes, and Munchies are
high-base-rate THC effects that will fire on most sessions and track
dose more than terpenes. Included deliberately -- they add nothing to
the required path, which this design does not touch, and their absence
is mildly informative. Do not expect them to differentiate chemistry.

Vocabulary constraint, standing: feeling-words only, no clinical terms.
The list above deliberately contains no "anxiety," "paranoia," or any
diagnostic vocabulary, and future additions hold that line.

## D120 -- Tags live on the closing screen, beside notes

The tag surface joins the existing closing screen next to free-text
notes. Grounds: tags are the structured form of the same optional
reflection notes already capture; the required logging path stays at
its ratified two-tap minimum (survey-cut.md) and gains no taps; no new
screen. The score screen is untouched -- its ratified tap-to-advance
mechanic cannot host a multi-select, which is why placement there was
rejected. Skipping tags costs zero additional actions and is recorded
as nothing: null, never empty-as-answer.

## D121 -- Schema slice: append the column, recreate the view, observe the flag

The migration adds `effects` and recreates `session_current` via
`create or replace view` with `effects` appended last -- observed by
the architect via MCP, 2026-08-04: `session_current` selects an
explicit column list, so the new column does not appear without a view
change, and both `session_current` and `coa_session_stats` carried
`security_invoker=true` in reloptions at that observation.
`coa_session_stats` reads only score fields and its definition is
untouched.

Gate (Tier 3): after the operator applies the migration, MCP observes
the new column on `session_entries`, `effects` present in
`session_current`'s column list, and **reloptions showing
security_invoker=true on both views** -- the view-recreate hazard
recorded in session-entries-schema.md, re-gated here because a view
change is exactly where the flag gets dropped.

`LEXICON_VERSION` moves 4 -> 5 in the UI slice, not the schema slice.
Grounds: the version stamps the vocabulary the user was shown. A
session logged after the migration but before the tag UI ships was
shown v4, and stamping it 5 would fabricate a fact about what the user
saw.

Tags never touch `overall_word`, `overall_score`, or the hidden 1-5
mapping, so the cross-version averaging landmine
(session-entries-schema.md) is not tripped: `coa_session_stats` remains
valid across the version boundary.

## Survey-cut compatibility

D92-D96 cut six fact classes; the two grounds that bear on this design
are answered here rather than assumed away.

"Nothing reads them" (D93 ground 1): nothing reads `effects` today
either, and this document does not pretend otherwise -- Non-goals
excludes scoring and stats changes. The distinction is the direction of
demand. The retired axes were architect-authored ahead of any usage and
never acquired a reader. Effects capture is operator-demanded after
first real usage (2026-08-03), which is D95's own mechanism working as
designed: the reflection channel surfacing the structured question that
earns its existence. The consumer that ratifies this capture is the
operator's ruling, not a banked engine.

"Capture is free failed its precondition" (D93 ground 3): the cost that
killed the axes was required-path cost -- device gates and the operator
not using his own app. Effects sit off the required path entirely: the
two-tap minimum gains no taps, and skipping tags is zero additional
actions. The capture-is-free claim in this document is scoped to the
required path, which is the path D93's evidence is about. If lived
usage shows the optional surface itself deters logging, that is a new
fact and this document is amended, not defended.

The build prompt for this document required the implementer to read
survey-cut.md end to end and STOP on any contradiction. If this
document shipped, that check passed.

## Non-goals

- No valence, polarity, or intensity stored per tag.
- No sliders and no scale-shape change; the 5-point resolution question
  stays banked per the operator's own ruling.
- No bipolar mood axes; superseded by the tags ruling.
- No user-authored custom tags in this pass. The lexicon principle
  makes them cheap later (text[], no migration); the entry surface is
  its own pass, banked.
- No glossary entries required; the vocabulary is everyday words by
  design, and any glossary additions are operator-owned copy.
- No changes to scoring, bands, or `coa_session_stats`.

## Slice plan

- Slice (a), docs: this document.
- Slice (b), schema (`feat:`): the D121 migration. Implementer authors,
  operator applies (`db push`, credentialed). Gate: the D121 MCP
  observation, including both views' reloptions.
- Slice (c), feat: the closing-screen tag UI and the `LEXICON_VERSION`
  bump to 5. Gate: device -- log a real session selecting tags across
  groups plus one with tags skipped, MCP read-back showing the exact
  array on one and null on the other.
