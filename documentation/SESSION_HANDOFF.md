# Session handoff -- 2026-08-04 (second)

The repo is authoritative over this document. This session's opening
Phase A verified all of the prior handoff's predictions clean -- and the
session still produced nine architect refutations, including two chat
hand-counts of the day's own commit total ("nine", "ten") against
rev-lists of six and seven. Begin with a read-only Phase A audit.

## Start here (Phase A, read-only)

- HEAD's parent is 8dfded2 (feat: slice d). Predicted subject of the
  handoff commit itself: "docs: session handoff 2026-08-04 second --
  QR docs+deps, effects shipped end to end". Sync 0 0 after the
  operator's push. If HEAD is neither, work continued past this
  handoff -- reconcile before proceeding.
- git status --porcelain: exactly seven ?? reference/handoff/0N-screens.png
  lines (N=1..7), the standing noise.
- Migrations: 17 on disk by name-form count, 17 in the ledger.
- npm test -> 52 passed. npx tsc --noEmit -> 0. npx expo lint -> 1 error
  0 warnings, template file only.
- DB via MCP, observed 2026-08-04 post-slice-(d) gates: coas 6,
  session_entries 57 raw / 11 current, 8 of the 11 at lexicon_version 5,
  tombstoned chains 14 (12 profile-reset, 2 slice-(d) discards),
  retirements 7, storage objects 3, anon grants in public 0.
- EAS build status: UNKNOWN. The operator was asked to run the build
  after 635ac01 and never pasted a result. Do not assume it ran; ask.
If any of these do not match, the repo wins -- re-baseline before
proceeding.

## What shipped (newest first, seven commits -- rev-list verified at
commit time, not hand-counted)

- 8dfded2 feat: post-close bloom, outcome-from-state, discard, closing header (slice d)
- 8f11374 feat: closing-screen effect tags and lexicon v5 (D119, D120)
- 2e80a5b docs: rewrite session-entries column table to live schema
- 610d299 feat: effects column and session_current republish (D119, D121)
- 635ac01 chore: QR slice (b) -- expo-camera dep and config plugin (D118)
- 16cb0c2 docs: session effects tags design (D119-D121)
- 03a503f docs: QR import design (D115-D118)

## The arcs

**QR import, D115-D118 (docs + deps shipped; slice (c) waits).** Design:
scan -> in-app WebView -> user clicks through -> URL-detect ->
CLIENT-SIDE download into the unchanged ingest pipeline. D116 supersedes
the recon's Edge-Function fetch with grounds: D87.4 uploads from the
client cache URI at save, so the client needs the bytes regardless; no
SSRF surface; RN fetch has no CORS. Named shared risk: cookie-gated PDF
URLs fail either design; fallback (WebView-native download) is a doc
amendment, never improvisation. Slice (b) shipped one new native module
(expo-camera 56.0.8 -- react-native-webview was already pinned at HEAD)
plus the config plugin: ratified camera permission copy, iOS microphone
suppressed via the strict === false deletion branch (omission would have
written the default string), Android RECORD_AUDIO suppressed. Slice (c)
is pure design-complete but double-blocked: the EAS build boot gate
(status unknown) and the operator's per-provider QR walks, both
operator-side.

**Effects tags, D119-D121, end to end in one day.** Operator ruled
tags-only, then a 20-tag vocabulary (Spacey/Forgetful split by ruling;
other slash forms are permanent synonym-pair tokens). D119: one flat
valence-free text[]; groups are presentation only; the same effect flips
valence by session, the score carries the judgment. D120: closing
screen, one insert on Close carrying tags + notes (D95's exception
extended to the screen). D121 migration replaced session_current IN
PLACE with effects appended last -- replace-not-drop preserved ACLs (the
D105 anon revocation re-observed 0 post-apply) and never touched
coa_session_stats; both views re-observed security_invoker=true.
LEXICON_VERSION moved 4->5 with the UI, not the schema: the version
stamps what the user was SHOWN, and the pre-UI 2026-08-04 session
correctly reads 4 in the live data.

**Slice (d): the operator's gate caught a real defect, and the fix
reshaped dismissal.** Page-1 Close after a Back announced 'cancelled'
about a session already on the shelf (tap-is-the-save had already
written it). Fix: outcome derives from STATE (lastConfirmed), never from
the control that fired. Closing from the top keeps a rated session
(operator ruling). Page-1 Close on a rated session asks Keep/Discard;
Discard appends a D52 soft-delete tombstone through the one insert
pipeline, fail-closed -- D52's append-only delete acquiring its UI,
deliberately NOT a new D-number. Every write now states deleted
explicitly. CloseOutcome gained 'discarded' (a discard writes a row;
reporting it 'cancelled' would be a false report). onLoggedChange prop
added and KEPT despite the host dismissal path being iOS-unreachable
(fullScreen has no interactive dismissal): the code states truth on
every platform. Also in (d): bloom relocated off closing to a post-close
transient over opaque Dash.bg with tap-anywhere skip ("never eats a tap"
honestly translated to "costs at most one tap" under an opaque ground);
closing's header became "Anything else? (optional)" in the heading
idiom, knowingly amending D81 for that one screen; closing's middle
renders nothing, keeping only the bottom-anchor flex slack.

**session-entries-schema.md rewrite.** Its "table below still describes
the live schema" had been false since the survey-cut migration applied
-- the rewrite that doc promised from the applying commit never landed.
Corrected, late, with the correction paragraph saying so. Table now
matches the MCP-observed live schema including notes and effects.

## Refuted hypotheses / corrections -- read before trusting anyone

Architect's, nine, caught by the implementer, a gate, or the operator:
1. D120 draft claimed the required path "stays exactly one tap" against
   four ratified/observed two-tap statements (survey-cut.md:85, :354,
   :446; session-ladder.tsx:442). Implementer STOPped a Tier 1 combined
   prompt on it -- the STOP is the only human-free check Tier 1 has, and
   it worked.
2. QR deps prompt treated react-native-webview as a new install; it was
   pinned at HEAD. Manifest delta was one package, not two.
3. Effects build prompt said "19 tags" and "Off-Key eight" against the
   doc's 20/nine -- the architect hand-counted the pre-split vocabulary
   after authoring the split. Implementer built the doc per the
   conflict rule.
4. Predicted session count 3->5 at the slice (c) gate; observed 6. The
   operator logged three sessions, not the requested two. Benign;
   testimony-vs-observation discrepancy recorded, not resolved.
5. A reanimated absence gate used a bare token and collided with the
   repo's own autolinking EXCLUSION -- the already-promoted
   import-construct rule, violated by its author. Discriminating forms:
   dependency-entry grep on package.json + src/-scoped grep.
6. A VERIFY glob (src/app/**/*.tsx) matched nothing; grep exited 2,
   masked by 2>/dev/null -- the vacuous-gate family, again.
7. Cited coa-detail.tsx as the two-button Alert precedent; it has none.
   The idiom lives at coa-editor.tsx:247-249. Cosmetic; the built shape
   was the intended one.
8. Asserted art-direction.md and survey-cut.md "may carry pre-existing
   non-ASCII"; both are pure ASCII at HEAD. The delta gate degenerated
   to absolute-zero and still held.
9. Chat prose said "nine commits" then "ten commits" shipped; rev-list
   at those moments read six and seven. Hand-counting, in the session
   where the no-hand-count promotion sat banked.

Also recorded: three-then-four phrase-level edit targets spanned line
wraps (now a standing form, see prompts); a tail -3 criterion truncated
the very line it gated; one implementer-report diff hunk arrived
MANGLED IN TRANSIT (shelf-list onRequestClose minus-line showed the
post-edit call) and was caught by whole-diff review plus an operator
paste -- transport corruption, not an implementer defect, and the
whole-diff rule is what caught it.

Operator's catch: the page-1-Close-after-Back defect (arc above). Three
reviewers missed it; the device gate did not.

## Ratified decisions

- D115-D118 (qr-import.md) and D119-D121 (effects-tags.md) carry
  decisions and grounds; slice (d)'s four rulings are in survey-cut.md's
  2026-08-04 amendment tail; the bloom placement supersession is in
  art-direction.md's amendment.
- Post-ratification rulings absorbed into commits: recordAudioAndroid
  false (no platform records audio); 'discarded' as a third
  CloseOutcome; explicit deleted on every write; onLoggedChange kept;
  Dash.bg (not #000) as the transient's ground; discard-dialog copy
  approved as built; 'note'->'closing' InsertSource rename; Off-Key as
  one rendered group; package-lock.json diff-stat exemption (explicit
  architect ruling for machine-generated lockfiles, not a precedent for
  authored files).
- Keyboard-scroll defect (carried from 2026-07-27): RESOLVED by
  operator observation at the slice (d) gate -- the note field scrolls
  into view now that the tags give closing scroll slack.

## Promotion candidates for CLAUDE.md (next docs pass)

- Phrase-level edit targets against the ~70-column doc family are
  written as LINE-ANCHORED BLOCKS, never sentence fragments; every
  phrase-gate assumes wrap-spanning. Four instances 2026-08-04. Over
  the bar.
- The architect does not hand-count -- now including commit totals in
  chat prose (refutations 3 and 9 this session; carried instances
  prior). Over the bar.
- Carried: non-ASCII delta-with-control form; npm-test-as-Phase-A
  instrument; grep-context rule; octal printf control form; blob-hash
  identity; D-registry renumber for doubled D87.

## Open items

**Runnable now:** the doc-staleness pass -- one Tier 1 commit bundling:
art-direction.md status line (unaware of its 2026-08-04 amendment);
survey-cut.md status line (no pointer to its new tail);
session-entries-schema.md "Column decisions" bullets (still name the six
retired classes); effects-tags.md's "if this document shipped, that
check passed" sentence (reads stronger than the re-check it records).

**Blocked:** QR slice (c) -- on the EAS build boot gate (status UNKNOWN,
ask the operator) and the operator's per-provider QR walks (click path +
final PDF URL per lab, appended to qr-import.md before the slice is
prompted). Both operator-side; the architect owes nothing until they
land.

**Banked:** committing the seven reference screenshots (operator to vet;
one shows the email); "Expo Starter" web tab chrome; empty-shelf double
statement; authenticated TRUNCATE; off-shelf log; preference_summary
view; never_again; retirement last-log step; third retirement reason;
Android (note: expo-camera plugin writes android.permission.CAMERA;
RECORD_AUDIO suppressed; barcodeScannerEnabled's ABSENCE from
Podfile/Gradle properties is the enabled state -- do not misread a
prebuild); app-code test wiring; un-retire; 5-point scale resolution
(re-examine before friend cohort); user-authored custom tags (entry
surface); EXPLAINERS.closing line 3 -- return it to closing's vacated
middle or retire it (copy decision, operator's); the 220ms
invisible-but-armed bloom window (flagged, accepted, unexercised); the
Alert-under-external-dismissal interaction (unreachable in ordinary
use, unexercised); source_url on coas (defused by D87 retention);
commit-body/doc phrase collision ("no platform records audio" -- any
future gate on it pins the doc path); anon-grants durable-ACL solution
(pg_default_acl rot, carried); CLAUDE.md promotion pass itself.

## Working rhythm

Unchanged from CLAUDE.md and handoff-specs 4. Two live observations:
Tier 1's only defect check is the implementer's STOP -- refutation 1
proved it load-bearing, so Tier 1 prompts should keep stating explicit
STOP conditions rather than relying on goodwill. And a prompt that
self-retracts an instruction inline was followed correctly once
(2026-08-04, tombstone commit prompt) but the implementer flagged the
skim hazard; prefer clean re-issues.

## Entry point

Run the doc-staleness pass (Runnable above): four small amendments, one
Tier 1 commit, no build, no operator dependency. It clears every stale
status claim the session accumulated while QR slice (c)'s two blockers
(EAS build status, provider walks) sit with the operator. Ask about the
EAS build in the same breath -- its status is the one fact this handoff
could not observe.
