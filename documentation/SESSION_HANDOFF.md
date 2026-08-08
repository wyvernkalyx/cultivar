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

## Amendment -- 2026-08-07, afternoon session (cards arc; baseline moved)

Work continued past this handoff (handoff-specs 4.5). The morning
Phase A above was verified in full and then superseded in part by
operator action; this amendment is the corrected baseline. Written
against a confirmed end state: 6cef60c pushed, sync 0 0 observed.

### Start here instead (Phase A, read-only)

- The parent of the amendment commit is
  6cef60cb1b5663c85ec31857c5bb0df6086ed00b (docs:
  post-implementation record for D131-D132). Predicted subject of
  the amendment commit itself: "docs: amend session handoff --
  cards arc shipped, profile reset moved the baseline". Sync 0 0
  after the operator's push. If HEAD is neither, work continued
  past this amendment -- reconcile first.
- git status --porcelain: the seven standing ?? lines, unchanged.
- npm test -> 121 passed, observed on the D132 worktree (be8fd1b
  content) in both the operator's environment and the architect's
  fresh clone; the two commits above it are docs-only. npx tsc
  --noEmit -> 0 and npx expo lint -> 1 error 0 warnings (template
  only), both observed on the D132 worktree, operator environment.
- DB via MCP, observed at write time: coas 14, on-shelf 1 (Fuel
  Pump), per-lab act:1 ctnd:1 drs-confident:4 green-analytics:1
  kaycha:7. session_entries 83 raw, session_current 0. Retirements
  dated 2026-08-07: 9, reason "Profile reset"; lifetime
  Profile-reset rows: 13 (an earlier, smaller reset predates
  today's).
If any of these do not match, the repo wins -- re-baseline.

### What shipped since the handoff (newest first)

- 6cef60c docs: post-implementation record for D131-D132
- be8fd1b feat: top-3 cannabinoid line on shelf cards (D132)
- 94ae074 feat: terpene legend percentages on shelf cards (D131)
- 0fbd365 docs: D131-D132 -- card analyte percentages

### The arc, one paragraph

Operator request: per-analyte percentages on the shelf cards. Audit
against the ratified mock found the terpene legend percentages were
in the mock all along and the prose spec under-described it (D131,
a shipped-vs-mock gap, not new design); per-cannabinoid values on
cards were not in the mock, architect recommended detail-only,
operator overruled, dissent recorded (D132, top-3 text line, both
surfaces per D101). Every prompt shipped architect-tested bytes;
every staged and committed blob matched the architect's clone
hashes; every device-gate prediction matched digit for digit.
Corrections and the escape-normalization implementer finding are in
dashboard.md's post-implementation record -- read it before
touching these files.

### Baseline corrections (supersede the morning Phase A)

1. The operator ran a profile reset mid-afternoon: 9 retirements
   ("Profile reset", 2026-08-07), 16 session tombstones appended
   (67 -> 83 raw), session_current 16 -> 0. Confirmed by artifact
   (stored retirement reason and dated rows), not inference. The
   morning DB numbers are historical, not wrong.
2. The entry point's one-document framing is narrower than stated:
   per-lab counts show DRS (Animal Face, Fuel Pump -- two distinct
   documents) and Kaycha (five distinct documents) already carry
   second-document evidence, imported cleanly before this session.
   The one-document flag genuinely applies to ACT, CTND, and Green
   Analytics only.
3. Architect refutations this session, for calibration: carried
   memory said the session-entries effects column is effects_tags
   (live schema: effects); a file line count recalled from a view
   read 560 (blob wc -l: 559); a grep anchor drafted across a
   line-wrap failed its own uniqueness check before shipping (the
   standing single-unbroken-token rule, self-caught).

### Entry point (unchanged in kind, narrowed in scope)

A second document from ACT, CTND, or Green Analytics -- the three
parsers still generalized from one document each. DRS and Kaycha
are already multi-document. No prompt owed until a document
arrives. The 4.7 ratio for the afternoon: two feat commits, two
docs commits, and the product result is visible chemistry on every
card, gated against the database digit for digit.

## Amendment -- 2026-08-08 (D133 ratified, dashboard line shipped, two labs triaged)

Work continued past the 2026-08-07 amendment. Its Phase A is
superseded by the following; the repo wins over both.

### Start here (Phase A, read-only)

- The parent of this amendment commit is
  fdad39c4c90e37f382a2f7d2c5c8379cf7af0e1f (feat: session-derived
  effects summary line on the dashboard (D133a)). Predicted subject
  of the amendment commit itself: "docs: amend session handoff --
  D133 ratified, dashboard line shipped, two labs triaged". Sync
  0 0 after the operator's push. If HEAD is neither, work continued
  past this amendment -- reconcile first.
- git status --porcelain: the seven standing ?? lines, unchanged.
- Migrations 17 by name-form count, fixtures 7 PDFs -- unchanged;
  no migration, no fixture this session.
- npm test -> 121 passed, observed on the D133a bytes in both the
  operator's environment and the architect's container. npx tsc
  --noEmit -> 0 operator environment; fresh checkout still fails on
  the generated-typings side-effect import (re-observed 2026-08-08,
  banked item unchanged). npx expo lint -> 1 error 0 warnings,
  template file only, exit 1.
- DB via MCP, observed at write time: coas 14, on-shelf 1 (Fuel
  Pump). session_entries 85 raw, session_current 1 -- one live
  session (Loved, Fuel Pump, lexicon 6, effects Focused and
  Pain Relief / Soothed), two chain rows for it per the score-then-
  closing append (session-ladder.tsx inserts on both steps).
- Dev-client binary unchanged (2026-08-03 EAS build); D133a is
  JS-only and gated over Metro. No build owed.

### What shipped since the 2026-08-07 amendment (newest first)

- fdad39c feat: session-derived effects summary line on the
  dashboard (D133a)
- 86d829b docs: D133 -- session-derived effects summary line
  (dashboard.md amendment)

### The arc, one paragraph

Operator shared external COA-reading prose and asked for its
"result" language; comparison ratified the inversion (D133,
dashboard.md): a blend-level line derived from the user's recorded
session effects, never chemistry -- the external prose's per-terpene
pharmacology is the exact banned class, its "personal biology"
closer is our whole product. D133 landed in two passes: the first
append carried two architect defects (a Cyrillic token; v5 example
strings under a v6 claim), implementer-flagged, corrected by
restore-to-HEAD and re-append of re-ratified bytes. D133a shipped
the dashboard line and both select widenings; device gate matched a
pinned prediction derived from the live session row, character for
character, including the v6 compound-tag tie-break. Mid-session the
operator triaged two prospective labs: ACS extracts zero characters
(image PDF -- an OCR capability class, not a parser arc; banked)
and Nova Analytic extracts 19k letter-spaced characters with kerned
digraphs glued (a new extraction-artifact class; the sample is
Nova's own PT specimen, a fixture candidate never shelf data;
banked). Both fail closed today through the unsupported-lab guard,
for different reasons the one guard message does not distinguish --
the banked heading/body split gained its first real evidence.

### Baseline corrections (supersede the 2026-08-07 amendment)

1. The operator logged a real session after the reset:
   session_current 0 -> 1, session_entries 83 -> 85. The prior
   amendment's "no live mixed-version case" clause now works for
   its living: the one current row is v6; v5 history stays behind
   the reset tombstones.
2. effects-tags.md's "nothing reads effects today" went stale at
   fdad39c, one slice earlier than the ratified plan anticipated
   (the flag that assigned its amendment to D133b framed the card
   line as the falsifier; the dashboard line was). D133b still owns
   the fix per ratified slice plan -- do not trust that sentence
   meanwhile.
3. Architect refutations this session, for calibration: a Cyrillic
   token generated into ratified doc text; v5 tag strings quoted
   under an "all 14 v6 tags" claim (the D126 section was cited
   without being read); a commit body authored without the
   mandatory trailer despite the convention being read that
   morning; a DB column guessed (retired_on; live schema
   created_at), caught by the DB; a first extraction probe that
   logged the dispatcher's output but not the extractor's, making
   its "unknown lab" answer vacuous for the file with no text; a
   tsc exit code captured from the tail of a pipe rather than tsc.
4. Gate-form pins, applied in-session, handbook candidates: (a)
   line-ending gates count bytes (tr -dc CR form) -- the CR-anchor
   grep returns a false 0 on this box's GNU grep; (b) commit-message
   gates pin the git log -1 --format=%B | cat -A | sha256sum value
   directly -- %B's trailing newline makes body-file hashes
   non-comparable without arithmetic.

### Entry point

D133b: the per-COA card line, both list surfaces, one feat,
device-gated with an MCP read-back -- and its commit amends the
stale effects-tags.md sentence (correction 2). The parser flags are
unchanged behind it: a second document from ACT, CTND, or Green
Analytics. ACS needs OCR and Nova needs despacing before either is
a parser arc; neither is owed until a real jar demands it.

## Amendment -- 2026-08-08 evening (D133 complete on every surface)

Work continued past the morning amendment, same day. Its Phase A
holds except as follows; the repo wins over both.

### Start here (Phase A, read-only)

- The parent of this amendment commit is the chore commit, subject
  "chore: correct two stale status sentences (D82.1 mooted;
  onDeleted never existed)", whose own parent is
  38cd4e16dc065373a16f53e61d00c65c769633b0 (feat: D133b). Predicted
  subject here: "docs: amend session handoff -- D133 complete, card
  line live, stale-sentence sweep clean". Sync 0 0 after the
  operator's push.
- Suites unchanged at the D133b gate values: 121 / tsc 0 operator
  env / lint 1-0 template. The fresh-checkout tsc failure stands.
- DB: unchanged from the morning amendment unless the operator
  logged again; the one live session (Loved, Fuel Pump, two v6
  tags) drove both device gates.

### What shipped since the morning amendment (newest first)

- (this commit's parent) chore: two stale status sentences
- 38cd4e1 feat: session-derived effects line on the per-COA cards
  (D133b) -- includes the two effects-tags.md truth amendments

### The arc, one paragraph

D133b shipped the card line to shelf and archive in the dashboard
line's register, device-gated against the one tagged session
(positive render, exact string) and thirteen untagged archive COAs
-- the strong absence state's first live instances. The operator
asked whether anything open or staged had been skipped; a
repo-wide sweep answered no ratified item, but surfaced three
stale sentences (two fixed in the D133b commit per the ratified
fold, two more in the chore -- one of them, onDeleted, false at
birth against the pickaxe). Refutation seven: an architect edit
anchor placed a style between a comment and the style it
described; implementer-flagged, re-ratified, re-pinned. The
operator double-ran the final push; the anomalous
"Everything up-to-date" was resolved by fetch plus the GitHub
event log (all pushes wyvernkalyx) -- run the conditional push
paste exactly once, since a re-run destroys its own evidence.

### Entry point

Nothing is owed. The forward queue, vetted and ranked 2026-08-08,
operator-agreed: (4) manual entry -- strongest lived demand, ACS
and Nova both fail closed on real documents, ND-vs-blank form
discipline is the design crux; (2) search -- client-side filter,
smallest slice; (1) COA photos -- expo-camera is in package.json,
binary presence unverified, card design is a visual-authority
pass; (3) cross-user COA sharing -- future; ruling sketch: share
chemistry never verdicts, copy never reference. A design pass on
any starts the D-number machinery. Parser flags (ACT, CTND, Green
Analytics second documents) stand behind all of it.

## Amendment -- 2026-08-08 night (D134 manual entry shipped, both routes)

Work continued past the evening amendment, same day. Its Phase A
holds except as follows; the repo wins over both.

### Start here (Phase A, read-only)

- The parent of this amendment commit is
  9e415065a4ea2238054714f97c45b8d334a0f420 (feat: manual COA entry,
  both routes (D134)). Predicted subject of the amendment commit
  itself: "docs: amend session handoff -- D134 shipped both routes,
  GA second document imported". Sync 0 0 after the operator's push.
  If HEAD is neither, work continued past this amendment --
  reconcile first.
- git status --porcelain: the seven standing ?? lines, unchanged.
- Migrations 17 by name-form count, fixtures 7 PDFs -- unchanged;
  no migration, no fixture this slice.
- Suites at the D134 gate values, observed on the shipped bytes in
  both environments: npm test -> 121 passed; npx tsc --noEmit -> 0
  operator environment (fresh checkout still fails the
  generated-typings side-effect import, banked item unchanged);
  npx expo lint -> 1 error 0 warnings, template file only, exit 1
  read from a redirected output file, never a pipe tail (see
  refutation 2).
- DB via MCP, observed at write time: coas 17, per-lab act:1
  ctnd:1 drs-confident:4 green-analytics:2 kaycha:7 manual:2.
  session_entries 85 raw, session_current 1 -- sessions unchanged
  all day; today's four new coas rows are two imports and two
  manual entries, no sessions.

### What shipped since the evening amendment (newest first)

- 9e41506 feat: manual COA entry, both routes (D134)
- e75b261 docs: manual COA entry design (D134) + follow-ups
  routing decision

### The arc, one paragraph

Manual COA entry shipped end to end in one day: operator-specified
form (full canonical panel, everything defaulting to Not
Available), architect pairing ratified as D134's core -- ND is a
transcribed lab attestation (stored, null pct), Not Available is
form scaffolding (never stored; emit drops untouched and unnamed
rows, failing closed to omission). Blank commits revert in manual
mode rather than landing on ND. Mid-slice the operator, holding no
copy of the document on the phone, unbanked the direct no-file
route at its first lived case: third button on the add flow's
opening screen, pdf columns NULL, retention notice suppressed
because nothing existed to retain. Both routes device-gated in one
pass; the MCP read-back matched the entered rows digit for digit
with no row stored for any of the 38 untouched names. The
architect-side construction rhythm held -- every prompt carried
executed bytes and pre-computed hashes -- and the blob-hash channel
caught the one divergence (refutation 1).

### Refuted hypotheses / corrections (calibration)

1. Architect: transcribing build-prompt EDIT 2.5 re-scoped the
   anchor and dropped a lone comment-spacer line -- prompt bytes
   diverged from the tested artifact by one line (624 vs 625).
   Caught by the blob-hash channel; converged on the implementer's
   bytes after a single-line delete reproduced its hash exactly.
   Second instance of the 2026-08-05 edited-the-excerpt class.
2. Architect: a lint gate authored as "npx expo lint 2>&1 | tail
   -3" observes tail's exit code, not lint's -- an unobservable
   criterion. Implementer-caught. Standing form now: redirect lint
   to a file (capturing lint's own exit), then read the file.
3. Architect: the session's first DB probe guessed a
   coas.retired_at column; the live schema has none (retirement
   lives in coa_retirements). Same family as the prior session's
   column guess; caught by the DB before any claim shipped.
4. Implementer's Prettier hypothesis for the hash mismatch was
   refuted by construction: no formatter ran anywhere, and the
   single-line reconstruction settled the cause. Its discipline
   (apply authored bytes exactly, adjust nothing, stop) was
   correct throughout.
5. Implementer mid-run byte correction (part-2 EDIT 1.6: a
   blank-line anchor boundary consumed one blank line) accepted
   narrowly -- convergence to the pinned architect hash with a
   full cat -A account is the only correction an implementer may
   make. Prompt-form note promoted: edit blocks end on a non-blank
   line, or state the trailing blank explicitly.
6. Architect expectation refuted at this write: coas predicted 15,
   observed 17. A second Green Analytics document (Orangutang
   Cookies / High Peaks, thc 22.27, terps 1.87) imported cleanly
   2026-08-08 18:32 -- resolving GA's one-document parser flag
   with live promotion evidence -- and the Mule Fuel jar (Florist
   Farms label) was entered manually before the gate row.

### Ratified decisions

- D134 as documented in manual-entry.md (status line flipped by
  the implementing commit), including the operator ruling that
  pulled the direct route into the slice.
- Two gate observations accepted as non-blocking, operator saw
  both: the explicit-ND analyte storage path went unexercised on
  device (zero null-pct child rows in the gate save; the emission
  path is code-identical to parsed mode, and the manual-specific
  NA/ND commit risk was covered by the blank-revert device step
  and an 11-case architect-side probe of the extracted bytes); and
  the compliance-test row carries the lab name in its brand field
  (the seam stored what was typed, which is the gated property).

### Open items

**Banked (new this slice):** the detail view's "Original COA PDF
wasn't retained." reads off-register for a never-had-a-file manual
entry -- one string, same family as the guard heading/body pairing.
The Mule Fuel row stores "Florist  Farms" with an interior double
space (D97 trims ends only) -- canonicalize-at-read family.
Exercise the explicit-ND analyte row live on the next real manual
entry (type nd on one row; read back a null-pct child).

**Banked, carried:** the standing list, unchanged.

### Entry point

The forward queue stands, minus what today satisfied: manual entry
(queue rank 1) shipped both routes, and Green Analytics left the
one-document flag set by live import -- the flags now name ACT and
CTND only. Next per the operator-ranked queue: (2) search, the
client-side filter, smallest slice. No prompt is owed until the
operator picks it up or a document arrives. The 4.7 ratio for the
slice: one feat commit, one docs commit, and the product result is
a working manual-entry path exercised twice with real jars on the
same day it shipped.
