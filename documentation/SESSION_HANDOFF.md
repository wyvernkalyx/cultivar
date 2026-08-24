# SESSION_HANDOFF

Status: WRITE-LAST. Committed as this session's final act, 2026-08-24
(session opened 2026-08-23 evening on the fce992e handoff and crossed
midnight). HEAD at write time is d2b8367 (candidates 9-13 promoted);
this commit rides on top and also lands documentation/road-to-store.md.

## Preamble -- argue against yourself first

Three commits pushed, three authorized pushes, every movement line
observed, sync 0 0 after each. One commit (1d30a3c) was created and
then REPLACED BY AMEND before push (99494c6) because the architect
authored a false date: "Amendment (2026-08-23)" for a ratification
that happened on the 24th -- the session crossed midnight and the
architect dated from the session's opening day, not from when the
ratification was observed. The implementer flagged it; no gate could
have (a date is ASCII-clean and hash-stable; only reading catches
it). Second architect error, same pass: the amend was called
"provably safe" on a rev-list 0 1, which proves absence from the
LAST-FETCHED origin/main only -- the implementer's correction stands:
the real backstop is the push itself refusing a non-fast-forward.
Third, small: a step-4 expectation said "0 deletions" where git emits
no deletions clause at all -- a prediction about output text never
observed in that form. Also ledgered: a stray-redirect typo in one
architect gate command (stderr noise, no effect), and the candidate-9
bullet's first draft misstated its own incident (said the enumerated
word reached the device; it was the unenumerated neighbor) --
self-caught during construction, fixed before pinning. One transport
artifact: a prompt reached the implementer duplicated (operator
paste); preconditions would have refused a replay, and did not need
to.

New capability on record: the architect's container cloned
github.com/wyvernkalyx/cultivar directly this session (repo publicly
readable). All Phase A audits, post-change trees, and criteria were
executed architect-side; carriers were produced as files with pins.
Read-only remains absolute; push authority unchanged.

## Shipped this session

1. ba0094c -- docs: import coverage measured by manual tester tally
   (D153). documentation/design/import-coverage.md, 74 lines. The
   tally sheet is printable and ready for any tester event or a solo
   Starlife run.
2. 99494c6 -- docs: art-direction amendment -- shipped colors are the
   Dash palette. The D83 Layer 1 values stand as historical record;
   a dated amendment records the shipped Dash palette. Wider than
   the owed one-line fix by ruling ("2"): bg, surface, text had ALL
   drifted, and a value-swap would have made the doc assert a
   background D83 never ratified.
3. d2b8367 -- docs: promote candidates 9-13 into the handbook.
   CLAUDE.md is now 463 lines; four bullets under Prompt
   conventions, one under Gates. Candidates 1-8 remain carried
   (texts in SESSION_HANDOFF.md at fce992e, retrievable from
   history).

## Rulings made outside the repo (operator, this session)

- THE APP IS KALYX (ruled 2026-08-24). Full ruling with evidence
  trail recorded in documentation/road-to-store.md Phase 0: store
  search clean (operator, on device), TESS export 2026-08-24 clean
  in classes 9/42, kalyxjournal.com registered (Cloudflare).
  Bundle ID and repo slug stay cultivar. C-spelling phonetic twins
  banked for the Phase 4 attorney pass. Network Solutions showed
  the domain taken when ICANN showed it available -- registrar
  choice is now a recorded lesson.
- road-to-store.md is the operator-ratified priority instrument:
  six phases, next session opens with the next unchecked box. The
  operator asked for exactly this ("hand-hold me through this");
  the old ranked list survives inside Phase 3 but the roadmap
  supersedes it as the session-opening question.
- Still OPEN in Phase 0: the at-dispensary v1.1 re-scope ruling,
  and the Apple developer account type (individual vs organization
  -- the longest lead item if individual).

## Start here (Phase A, read-only)

- origin/main at write time = d2b8367573f1973be1558cdfc81a9517853caf57
  (movement 99494c6..d2b8367, rev-list 0 0). This handoff commit
  rides on top with road-to-store.md; at next open expect
  origin/main = the handoff commit, sync 0 0.
- Worktree: clean except the standing two untracked (.claude/*).
- Predictions, falsifiable: migrations 19 by name-form; suite 179
  tests / 5 suites; lint baseline 1 error 0 warnings exit 1 at
  use-color-scheme.web.ts:11; tsc clone-side TS2882 artifact
  persists (implementer tsc authoritative); CLAUDE.md 463 lines
  blob sha256 36ca6a84...a3fe; art-direction.md 304 lines blob
  6e963558...5258 with both amendment dates reading 2026-08-24;
  documentation/design/import-coverage.md 74 lines blob
  e09e2193...f095; documentation/road-to-store.md 110 lines sha256
  6d77b376...5496 (committed with this handoff -- verify blob at
  HEAD, not these worktree pins, after any fresh checkout).
- The MVP gap analysis (this session, chat): shipped core loop
  verified against Cultivar_MVP_and_Roadmap.md section 8; the
  structural gaps are at-dispensary support (scoping ruling open),
  age-gate + geo, consent/terms + account deletion (deletion
  confirmed absent by grep). Verify-don't-assume items listed in
  road-to-store.md Phase 3.

## Promotion candidates (1-8 carried; new this session)

14. A date in authored text is a state claim: date from when the
    ratification was observed, never from the session's opening
    day. Sessions cross midnight (implementer-caught, pre-push).
15. rev-list against origin/* is evidence of the last fetch, not of
    live origin -- for the ARCHITECT's claims too, not only the
    implementer's. The push's own fast-forward check is the
    backstop (implementer-corrected).
16. Expected-output text quotes git's actual emission ("1 file
    changed, 23 insertions(+)"), never a paraphrase with clauses
    git omits.

## Banked follow-ups

Operator-named arcs: COA copy-on-share (shape ratified banked);
onboarding (scan-first + glossary-in-place; D152 is step one);
Metrc Retail ID ingestion; tester distribution via EAS internal
(now Phase 5 of the roadmap). Import coverage GRADUATED to shipped
instrument (D153); in-app attempt logging stays banked with its
trigger written into the doc.

Small banked, carried: D150.1 count-line idea (unratified); share
text still consumes pooled top-3; D152 VoiceOver legend pass OWED;
glossary entries absent for nine canonical names; compliance-test
manual COA rename in-app. REMOVED as done: the art-direction
background fix (commit 2 above).

Carried, unchanged: handoff-specs 3.4/4.4 refresh; Reduce Motion
Scope B (doc first); 44pt-floor audit; dead result.message; ragged
wrap in delta-fab-touch.md; BottomTabInset; bloom comment;
session-ladder D83 note; same-name disambiguation; Stash
system-font states; last-card breathing room; orphaned PDFs;
migration 20260715185455 comment; theme.ts Dash docblock;
shelf-list Retry VoiceOver residual; formatPct rounding docs
question; D148/D149 layout revisit triggers; Counter view / Share
exercise; D149 collapsed-row + ProfileProducts VoiceOver. The
"app rename check" carried item is SUPERSEDED by the Kalyx ruling
and becomes the Phase 1 rename sweep.

## Working rhythm

This session had two halves and both worked. First half: three
Tier 1 slices in full ceremony (zero refutations of the incoming
handoff; every criterion pre-executed architect-side; one false
sentence stopped before origin). Second half: plain-language
product work -- store readiness, MVP gap, naming -- ending in an
operator ruling and a purchased domain, with the roadmap as the
written result. The operator opened the second half stating
burnout and "lost cause"; the evidence assembled (most of an MVP
shipped; finite enumerable remainder) is part of the record, not
pep. Sessions now open with the roadmap's next unchecked box:
first up is the Tier 1 commit already staged by this handoff, then
the Phase 1 rename sweep -- twenty minutes, device-gated by the
operator seeing Kalyx under the icon.
