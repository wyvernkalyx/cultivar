# Session Handoff — 2026-07-15

The repo is authoritative over this document.

**Carried context was wrong this session, concretely:** the architect's memory
ended at slice 5a / D37 and believed the latest decision was D37. Reality at
session start: slices 6c, 9, and 10 had shipped, decisions ran through D46, and
`scoring-lexicon.md` — the doc this whole session amended — was unknown to the
architect until pasted. A smaller one: the audit script's [14] annotation
predicted two outdated packages (jest, @types/jest); the run showed four
(expo-router and expo-splash-screen drifted upstream). Registry drift, not tree
drift, but the prediction was falsified as written. Trust nothing here you can
check. Begin with a read-only Phase A audit.

## Start here (Phase A, read-only)

- Branch `main`. `git log -1 --format='%h %p %s'` →
  `b6b073d 61d8210 docs: amend scoring lexicon (D47-D48), bank follow-ups`.
- `git fetch origin && git rev-list --count origin/main..HEAD` → `0`.
  Note: the push to b6b073d was observed (`61d8210..b6b073d main -> main`),
  but the post-push rev-list `0` was never seen in output — the paste ended at
  the push line. Sync is inferred from the push output, so this prediction is
  the one most worth actually running.
- `git status --short` → clean. Ignore the usual `LF will be replaced by CRLF`
  warnings on any git touch — Windows autocrlf noise, always present.
- `npm test` → 36 passed, 1 suite. `deno test` (ingest-coa, per audit script)
  → 5 passed. `npx tsc --noEmit` → 0 errors. `npx expo lint` → exactly 1 error
  (template `src/hooks/use-color-scheme.web.ts`), 0 warnings.
- `grep -rn "D47\|D48" documentation/` → hits ONLY in
  `documentation/design/scoring-lexicon.md` (status line, skeleton item 3,
  intent section, onboarding section). Zero hits in follow-ups.md, zero
  anywhere else.
- `npx expo install --check` → at least four outdated (jest, @types/jest,
  expo-router, expo-splash-screen). Known, tolerated, do not fix.

If any of these don't match, the repo wins — re-baseline before proceeding.

## What shipped

- `b6b073d` — docs: amend scoring lexicon (D47–D48), bank follow-ups. The
  session's only commit; everything else was design work in chat.

## The arcs

**The mis-tap tension, resolved by restructuring rather than choosing.** The
lexicon's own grounds (respondent frequently impaired) + two-tap logging +
append-only immutability jointly guaranteed wrong sessions carved in stone.
Gregg pushed back on immutability itself: an hour-later opinion change is
legitimate. Rather than break the skeleton, the rule's real purpose was
extracted — never silently destroy what was recorded — and revise/soft-delete
were layered on top of the append-only substrate (D47). The Never Again
pattern (change what's seen, preserve what was recorded) supplied the shape.
Hard delete was considered and rejected: deleting while high is exactly as
fat-finger-prone as logging while high; soft delete makes delete itself
mistake-proof. True erasure is banked as an account-level privacy feature.

**Null intent vs. "just because" (D48).** Whole reads of scoring-lexicon.md
and product-metaphor.md surfaced the gap: intent is optional with no skip
affordance, so an intent-less session is representable — and it is NOT the
same fact as "just because" (aimless is an answer; unanswered is a gap).
Gregg proposed auto-filling from an onboarding "usual reason" question; this
was pressure-tested and rejected as fabrication (recording a word the user
never chose — lazy loggers would accumulate false intent data). The instinct
survived one layer up: the onboarding default renders as the first-and-biggest
chip, pure friction reduction, never auto-filled. Fit renders only when intent
is answered and isn't "just because."

**The gesture lean.** Drag-card-onto-word primary, Daylio-style
tap-and-settle fallback, settled at the physical-iPhone device gate. Stated
honestly during ratification: no successful marketplace app logs by drag
(Vivino/Untappd/Daylio all tap) — A is the distinctive risk, B the proven
pattern. Gregg chose A-primary knowing that. D47's soft delete also lowered
the stakes: the save gesture no longer has to be perfect, only reasonably
accident-resistant.

**Vivino as negative example, Bevel as split example.** Gregg's visceral
reaction to Vivino recommending wines before knowing him ("full of shit")
independently re-derived the founding discipline — recommendations with none
of your data behind them are the thing Cultivar refuses. Bevel is the model
for the READ side only (interpretation layer over accumulated data); its
logging moment barely exists (data flows from the watch). Dark theme
requirement also came out of this: banked for the art pass.

**Original COA PDFs are currently discarded — confirmed and banked.** Gregg
asked; the answer (moderate-high confidence from CLAUDE.md, then confirmed by
Gregg observing zero Storage buckets in the dashboard) is that the PDF is
thrown away after parsing. This matters more now that parses are editable:
once the source is gone there is no ground truth to check an edit against.
Banked in follow-ups.md with the save-time-not-parse-time upload rule already
reasoned out.

## Refuted hypotheses / memory corrections

- Architect memory ran two slices and nine decisions stale (see preamble).
  Slices 6c (confirm action bar, D43), 10 (confirm dialog copy, D44), and 9
  (card detail view, D45) shipped before this session; slice 7 (shelf list)
  is inferred shipped — a detail view needs a list to open from — but this
  was never directly observed. Verify via shelf.md before any shelf-touching
  prompt.
- "Five Supabase tables" was believed from slice-2 memory and happened to be
  right — confirmed by observed pg_tables output (coas, coa_terpenes,
  coa_cannabinoids, coa_safety, profiles; RLS on all; four `_all_own` ALL
  policies + profiles insert/select/update-own, no delete). No sessions
  table exists; nothing holds never_again/average_score. The sessions
  migration is greenfield.
- The commit-body paste showed no blank lines between paragraphs; this was
  resolved as paste-flattening, not a malformed commit (%s printed the
  subject alone and interpret-trailers parsed exactly one trailer — both
  impossible without intact blank lines). Pattern worth remembering:
  terminal pastes eat blank lines; corroborate structure from format-aware
  commands before alarming.

## Ratified decisions

- **D47** — skeleton item 3 amended: sessions revisable and soft-deletable
  atop the append-only substrate; revisions preserve every prior answer;
  deletes exclude from all computation/display but the row survives, marked;
  nothing recorded is ever silently destroyed. Grounds: hour-later opinion
  changes are legitimate data corrections; hard delete rebuilds the mis-tap
  problem one level up; Never Again already proved the display-over-data
  pattern.
- **D48** — unanswered intent stores as null, never coerced to "just
  because"; fit renders only when intent is answered and isn't "just
  because"; onboarding default intent = first-and-biggest chip, never
  auto-filled. Grounds: recorded = chosen (ND ≠ 0 family); auto-fill
  fabricates data precisely from the laziest loggers.
- **Gesture lean (ratified direction, not final)** — drag-onto-word primary,
  tap-and-settle fallback, device gate decides. Recorded in follow-ups.md.

## Open items

**Runnable now:**
- Session-logging mechanic design pass — unblocked by the amended lexicon.
  This is the entry point below.

**Blocked:**
- Sessions-table migration — blocked on the mechanic design pass answering
  what the survey UI actually captures per interaction. Predicted shape
  (stated as prediction in-session, unratified): sessions table with COA ref,
  user scoping, raw answers, computed score, lexicon_version, four distinct
  fact-class columns, revision/soft-delete columns per D47, RLS, no
  UPDATE/DELETE-of-substance policies; plus a home for
  never_again/average_score (no per-user-per-COA relation exists — verify
  against shelf/card-detail implementation before assuming).

**Banked (see follow-ups.md for the durable copies):**
- Persist original COA PDFs (save-time upload; zero buckets observed
  2026-07-15).
- Dark theme as default (art pass).
- Onboarding scan-your-favorites; AI session summaries with the
  personal-empirical guardrail (both in scoring-lexicon.md).
- Resend domain verification; parser quality defects (brand sludge,
  column-header bleed) — carried from prior sessions, unchanged.

## Working rhythm

Stable method lives in CLAUDE.md and handoff-specs.md. One thing in flux,
worth carrying: Gregg asked for one-piece-at-a-time pacing (dyslexia + ADHD)
— short numbered pieces, one question or one command per message, explicit
"you're here, N of M" framing. It worked well; the session ratified two
durable decisions without a single derailment. Default to it.

## Entry point

Open the session-logging mechanic design pass. First act after Phase A: whole
reads of `documentation/design/shelf.md` and the slice-9 card-detail design
doc (never seen by the architect — the launch-surface inference "logging
starts from the card detail view" rests on them), then the amended
`scoring-lexicon.md` end to end. The pass designs the drag-onto-word
interaction (fallback named), and will force the sessions-table schema
question mid-pass — the pg_tables/pg_policies observation from this session
is already banked above, so the migration prompt's Current-state block can be
written from observed values. Document the mechanic in its own design doc
before any build prompt exists.
