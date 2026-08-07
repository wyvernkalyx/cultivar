# Session handoff -- 2026-08-07

The repo is authoritative over this document. This session opened by
refuting the previous handoff's own Phase A: "HEAD's parent is
bfc6ae4" was false at birth -- the parent was 8fe4c21, which that
handoff's own What-shipped list names as its newest commit. The
error survived because a parent sha was written from memory rather
than from git log, in the one line handoff-specs 2.2 exists to
police. Begin with a read-only Phase A audit.

## Start here (Phase A, read-only)

- The parent of the handoff commit is
  014ec55f1e4aeaf6a6d3350b8bbb785df9bf77ae (feat: CTND parser --
  parser arc complete). Predicted subject of the handoff commit
  itself: "docs: session handoff 2026-08-07 -- parser arc shipped
  end to end, two jars imported". Sync 0 0 after the operator's
  push. If HEAD is neither, work continued past this handoff --
  reconcile first.
- git status --porcelain: exactly seven ?? reference/handoff/
  0N-screens.png lines (N=1..7), the standing noise.
- Migrations: 17 on disk by name-form count, unchanged; no
  migration this session. Fixtures: 7 PDFs, unchanged.
- npm test -> 121 passed. Observed twice at session close: in the
  operator's worktree and on a fresh clone of 014ec55. npx expo
  lint -> 1 error 0 warnings, template file only, exit 1. npx tsc
  --noEmit -> 0 in the operator's worktree only; a fresh checkout
  fails on the generated-typings side-effect import (re-observed
  2026-08-07, still the banked item).
- DB via MCP, observed at write time: coas 14 (was 12), source_lab
  set kaycha / drs-confident / green-analytics / act / ctnd, one
  act row and one ctnd row, both matching their fixture cases field
  for field (Hooch AP-FE-GH0526 27.91/2.819 2026-05-21/26; Stank
  Breath STBR-028-FL8 28.4/2.7841 2026-05-08/15). session_entries
  67 raw / 16 current, lexicon 6 stamps 3, non-null effects 7 --
  unchanged all day; the two imports added COAs, not sessions.
- The installed dev-client binary is still the 2026-08-03 EAS build
  from dbfe1cc. Today's device gate ran over Metro reload; nothing
  added a native module; no build owed.
- The deployed ingest-coa bundle was pushed twice today by the
  operator, observed both times; the second deploy carried HEAD
  (parseCtnd.ts and the updated dates.ts in the asset list). npx
  resolves supabase CLI 2.112.0 now, up from the recorded 2.111.0.
If any of these do not match, the repo wins -- re-baseline.

## What shipped (newest first, seven commits, plus this handoff)

- 014ec55 feat: CTND parser (D127, D128, D130) -- parser arc complete
- b3150b8 feat: month-name US date normalizer (slice d1)
- d29145e feat: path-agnostic copy for the unsupported-lab guard
- 9a8a751 feat: ACT Laboratories parser (D127, D128, D130)
- aca0209 feat: canonical entries for ACT's ASCII-prefixed analyte
  names (D129)
- d45710e docs: promote pasted-not-retyped prose rule to prompt
  conventions

## The arcs

**The parser arc shipped end to end, and the jars that started it
are on the shelf.** Slices (b) through (d) landed as four commits
-- canon entries, ACT parser, shared date normalizer, CTND parser
-- and after the second deploy the operator re-scanned both jars
from 2026-08-06. Both cleared the guard, and the DB read-back shows
both stored rows byte-identical to the fixture-case values,
including CTND's full-precision 2.7841 total-terpenes over the
rounded 2.78 cover -- D130 doing in production exactly what it was
ratified to do. Five labs now parse.

**The architect ran the observation runs itself, and every prompt
shipped tested bytes.** New working rhythm, promoted from last
session's one-round-trip pattern: the architect clones origin, runs
the repo's own extractor, key function, and full suite in its own
environment, applies the intended edits there, and authors the
prompt from the tested files with pre-computed blob hashes. The
blob-hash channel then compares two independent constructions of
the same bytes -- architect's clone against implementer's worktree
-- and matched on every commit today, at staging and again at HEAD.
The suite ran 77 -> 88 -> 102 -> 107 -> 121 across the arc, each
transition predicted from an architect-side run before the prompt
shipped.

**CTND's extraction produced three distinct token-displacement
artifacts, and each got a different answer.** Superscript digits
detach: the three delta-THC rows arrive identically named, handled
by the operator's positional ruling below. The superscripted carene
row fragments, and a truncated capture could land on a canonical
name the row did not print whole -- guarded by a space lookbehind.
And an unconsumed absence cell's LOQ token glued onto the next
row's name, silently swallowing Eucalyptol's ND record with no
error surface -- D124's shift class in a new form, caught only
because the architect's probe compared output row counts against
the document, guarded by a second lookbehind and commented in the
module. The pattern to carry: this extractor displaces tokens, and
every capture that survives does so by refusing to match rather
than by guessing.

**The error copy became true for every path.** The empty-parse
guard fires for both the jar-QR and file-picker routes, so its
file-picker advice was wrong for a user holding a jar. The
operator-ratified replacement names the actual state and promises
nothing about retention. Its own commit, device-gated with a
screenshot, resolving a contradiction between the design doc's
non-goal and the prior handoff's ride-along ruling -- the ruling
recorded in this session's DECIDEs.

## Refuted hypotheses / corrections

Architect's, in order:
1. Carried the prior handoff's "HEAD's parent is bfc6ae4" into
   Phase A and refuted it against origin: the parent was 8fe4c21.
   Ninth instance of that session's error family, in the line the
   spec exists to police.
2. Flagged D129's "8 of the 17" as internally inconsistent with
   its nine entries. Observation refuted the flag, not the doc: 17
   counts the terpene names printed with measured values, 8 counts
   the prefix-caused failures among them, and Borneol is the ninth
   entry for a different cause. The doc was right; the architect's
   tension claim was the error.
3. Wrote "predicted 66" for a grep line number that had never been
   executed -- a hand-derived number, one commit after promoting
   the rule that forbids exactly that. Observed 65. The implementer
   resolved it correctly against the matching full-file hash and
   showed the arithmetic.
Self-caught before any prompt shipped: a test-insert boundary
constructed with a double blank line, rebuilt a second time to the
byte-identical wrong file (the unchanged full-file hash was the
tell), correct on the third; and a python edit whose escaping did
not match the file's bytes, refused by its own assert rather than
mis-landed.

Implementer's slips: three assertions about deploy state ("still
owed", "covers these commits"), which is outside worktree-only
evidence in either direction. After the second, every commit prompt
carries an explicit no-deploy-claims Rules line, and the slip did
not recur under it.

Implementer's catches, all correct: the line-65 resolution above;
an unprompted self-note that the commit body's device-gate sentence
was architect-carried text it reports as committed, not verified;
unique-anchor pre-verification before every multi-file edit.

Operator channel: one cat -A paste truncated mid-trailer at "Co".
The tail re-observation settled it as paste truncation, not a
commit defect -- the artifact settles it, never the paste.

## Ratified decisions

- The pasted-not-retyped rule is in CLAUDE.md Prompt conventions
  (d45710e): prose claims are excerpted from executed output, and
  ratified content travels inside the prompt.
- The unsupported-lab error copy landed as its own commit
  immediately after slice (c) -- resolving the contradiction
  between the design doc's non-goal ("not a parser change") and
  the prior handoff's ride-along phrasing, honoring both. The
  ratified string: "Cultivar doesn't support this lab's reports
  yet." Nothing implying retention, which stays a banked DECIDE.
- Delta-THC positional attribution, operator ruling: the three
  identically-named delta rows attribute by document position --
  8, 9, 10, the order the document prints and its own Definitions
  formula corroborates -- as transcription-by-position, and only
  when exactly three such rows appear; any other count stores
  none, failing closed to omission rather than misattribution.
  Grounds: the Delta-9 value (5.73 on this fixture) is worth
  keeping. Architect recommended omission; dissent recorded,
  ruling followed, both the attribution and the fail-closed guard
  pinned by a dedicated test.
- Slice (d) split into (d1) shared month-name date normalizer and
  (d2) parser, on D125's precedent: shared normalization changes
  separately from the parser that motivated it.
- Deploys batch per arc segment: one deploy after (d2) carried
  both functions commits. Per-commit deploys remain available on
  operator request.

## Open items

**Runnable now: nothing drafted.** The entry point below needs no
prompt until a document exists.

**Blocked:** nothing.

**Banked (new this session):** the guard's heading/body pairing --
"Couldn't read this COA" frames a read failure over a body that now
frames lab support; implementer flagged it, operator saw the pair
at the device gate and proceeded; one string if it ever grates. The
9R/9S delta isomer rows are not stored (hyphen-fragmented names,
both < LOQ on the fixture) -- omission by the same fail-closed
posture, revisit only if one ever carries a value. Whether
superscript detachment should be fixed once in extractText rather
than handled per-parser -- an extractor-level design question,
touch nothing until a third document exhibits it. CLI drift:
supabase 2.112.0.

**Banked, carried:** a second COA from ACT and from CTND -- every
rule in the parser designs is generalized from exactly one document
per lab, and with both parsers live, the operator's next import of
either lab is free promotion evidence. The WebView download
amendment for Drive-hosted COAs. The parse-failed-PDF
pending-support shelf DECIDE (touches D87's no-orphans ground).
The second Green Analytics fixture; Rainbow Runtz upper-case
strain; the Gelato row's four title-cased analyte names;
canonicalize-at-read; stale hasher comment in
add-to-shelf-modal.tsx; fresh-checkout tsc dependency on generated
typings (re-observed this session); DRS Testing walk detail;
support-copy reword window; the seven reference screenshots (one
shows the email); "Expo Starter" web tab chrome; empty-shelf double
statement; authenticated TRUNCATE; off-shelf log;
preference_summary view; never_again; retirement last-log step;
third retirement reason; Android; app-code test wiring; un-retire;
5-point scale resolution; user-authored custom tags;
EXPLAINERS.closing line 3; the 220ms bloom window;
Alert-under-external-dismissal; anon-grants durable ACL;
commit-body/doc phrase collisions; the download-event prong.

## Working rhythm

Unchanged in the large, from CLAUDE.md and handoff-specs 4, with
one promotion-grade addition: architect-side observation runs, as
described in the arcs. The standing preamble's status expectation
is adapted to the standing noise (seven ?? lines pinned exactly,
never "silent"), and every commit prompt now carries the explicit
no-deploy-claims Rules line. The three-deep commit check and the
two-channel push verification ran on all seven commits and matched
every time; the tail-check rule caught one real paste truncation.

## Entry point

A second COA from any lab already parsed. Every rule flagged as
generalized from one document stays flagged until a second document
exists, and with five parsers live the evidence is free: the next
jar the operator scans from any known lab either confirms the
rules or refutes one, and either outcome is the next arc's Phase A.
No prompt is owed until a document arrives.

The product finding handoff-specs 4.7 asks for: five feat commits,
two docs commits, and the strongest product result available -- the
two jars that died in the empty-parse guard on 2026-08-06 imported
on 2026-08-07 with correct chemistry, verified against the lab
documents by test and against the database by read-back. The
verification apparatus and the product moved together today.
