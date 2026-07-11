# Cultivar — Product Metaphor & Information Architecture

Status: north-star / product direction. NOT a buildable spec. No near-term
implementation. This doc anchors future UI slices and records the disciplines that
keep the metaphor faithful to the personal-empirical thesis. Speculative throughout;
open questions are marked.

## Why this exists

Cultivar should feel recreational and alive — a space stoners enjoy logging in —
not an accounting app. This doc captures the organizing metaphor so every screen
built later shares one vocabulary and one set of integrity rules.

## The core metaphor: the shelf

A user's collection is a **shelf**. The atoms on it are COAs, rendered as living
cards whose visual character reflects the user's own logged experience.

### Lifecycle of a COA

1. **Compendium (untried).** A COA the user has added but never logged a session
   with. Neutral, dormant — a "not yet" state (e.g. a seed / closed bud / sapling).
   No mood, because no experience exists to give it one.
2. **Scored (tried).** From the **first** logged session onward, the COA enters a
   **book** (a score band) determined by the average of its session scores. Its
   visual mood reflects that band — bright/healthy at the top, dark/wilting at the
   bottom.
3. **Never Again (override).** The user can explicitly banish a COA to the darkest
   band regardless of its average. It stays on the shelf — the floor of the same
   ranking, not a separate place.

### In stock

Independent of score: a COA can be marked **in stock** — the user physically has
this product on hand right now, ready to consume. In-stock items surface as cards
for quick session logging. (In-stock status is a future primitive; the current
schema has no possession state — see Open.)

## Books = score bands = mood

A **book** is a mood/score band, not a lab collection. COAs sort into books by their
average session score and **move between books** as that average shifts with new
sessions.

A book, a score band, and a mood are the same concept viewed three ways: how a COA
is filed, its numeric standing, and how it looks. A COA has exactly one at a time;
moving between books, changing bands, and shifting mood are one event, not three.

(Explicitly NOT organized by lab: the lab is who tested the product, not what it is,
and lab identity is near-irrelevant to the personal-empirical thesis. Lab may remain
a filter, never the organizing spine.)

## Sessions, surveys, and scores

- A **session** is a **survey** — a logged experience with a product.
- **Many sessions → one COA** (many-to-one).
- Each session produces a **session score** (numbers assigned to survey answers).
- A COA's standing = the **average of its session scores**.
- **Every session score is preserved.** History is never deleted.

### The scoring lexicon — OPEN, not designed here

The actual survey (what is asked, on what scale, how answers become numbers) is the
heart of the personal-empirical engine and gets its own dedicated design pass. This
doc asserts only that scores exist and that their average drives book placement. It
does NOT invent the survey scheme. When that pass happens, revisit the `never_again`
/ `average_score` structure proposed below — it is provisional direction, not a
settled schema.

## Integrity disciplines (non-negotiable — same family as ND != 0)

1. **Mood comes from logged outcomes ONLY, never from chemistry.** A wilting card
   means "you logged bad sessions," never "this terpene profile looks bad." The
   moment analyte values color the mood, Cultivar is making a population-level
   pharmacological claim — the exact thing the product refuses. Chemistry never
   touches the plant's health.
2. **Untried is neutral, never negative.** Zero sessions = no mood = dormant/neutral
   visual. Never render an untried COA as wilting; a negative mood is *earned* by
   real logged bad sessions, never defaulted into. (Same principle as ND != 0: absence
   of data is not a bad value.)
3. **Never Again overrides the DISPLAY, never the DATA.** Implemented as a separate
   `never_again` flag plus the honest computed `average_score` — never by writing a
   fake low score into the average. When set, display/bucketing use the darkest band;
   the true average keeps computing from preserved sessions underneath, so toggling
   off restores the real standing losslessly. (The "undid it while high" case is a
   first-class requirement.)

## Accepted characteristics (named, not bugs)

- **n=1 moods are volatile by design.** With one session, the average IS that one
  session, so the first log fully sets the mood until a second exists. Early moods
  swing; they stabilize as sessions accumulate. This is expected, not broken.

## Open questions (unresolved; do not improvise)

- The survey → score scheme (the scoring lexicon). Its own design pass.
- **In-stock as a data primitive** — needs a possession state the five-table schema
  does not yet have. Downstream of ingestion.
- Session-logging interaction — envisioned as a draggable, playful mechanic over the
  scoring lexicon. Design pass pending the lexicon.
- Exact visual language of mood (the plant-health spectrum) — art/design pass.

## Relationship to current work

None of this is near-term. The active path remains COA ingestion and the confirm/
edit screen (see `confirm-edit-screen.md`). This doc is the destination those slices
are walking toward, not a spec to build now.
