# Session handoff -- written 2026-08-03, second session of 2026-08-03

Write-last: this file is committed only after every commit below was
pushed with 0 0 observed through both channels. The repo adjudicates
all state claims; this file predicts, it does not testify.

Carried-context refutations from this session, so the next one
calibrates -- seven architect items, the most in one session yet:
a predicted heading count of 14 against an observed 15 (authored
after the heading existed); a predicted zero-hit D107 grep that
forgot the handoff sentence that prompted it; Phase A measured
tests with raw npx jest and read 48 failures that npm test (the
repo's own script, which carries --experimental-vm-modules) shows
green at 52; an ASCII dirty control written with hex escapes this
printf does not interpret (octal is the working form); a grep -A3
context window one line short of the property it gated; a bare-token
gate criterion tripped by the build's own comment (now promoted, see
below); and a dashboard.md line count stated as 324 in chat when
arithmetic on observed diffstats gives 322. Begin with a read-only
Phase A audit.

## What shipped -- five commits, each pushed with 0 0 observed twice

- e574954  docs: D107-D109 post-implementation record; gated-string
           promotion
- df0eb62  feat: compact preference summary, mock-faithful (D109)
- 234fe8e  feat: shelf section row replaces quiet footer link (D108)
- 108f934  feat: compact header with gear account sheet (D107, D107.1)
- c31ca71  docs: ratify D107-D109 -- header, shelf row, compact summary

Three product commits, two docs commits -- the handoff-specs 4.7
ratio pointed the right way for the first time.

## The arcs

**D107/D107.1, compact header.** Email row and Add-to-shelf button
deleted; CULTIVAR wordmark + gear + "+ Add" pill. The ratified
"already rendered" gear premise was refuted by recon: no gear
existed in app code -- the on-device gear was Expo's dev-menu
button, confirmed at the gate. Built net-new in the header (operator
option 1a). First iOS SymbolView render in this app; autolinking
held on the existing binary, no EAS cycle. The remount-key pattern
(modal + shelfVersion in HomeScreen) was preserved deliberately.

**D108, shelf section row.** Pure shelf-list.tsx relocation: both
counts already existed in state, zero query changes. The row renders
outside the summary's null conditional (loading-flash cost named and
accepted). Gate ruling: both labels Dash.accent, overruling the
muted default. Supersession of D101's footer recorded in Amendment 1
by pointer, per the standing rule.

**D109, compact summary.** Mock-faithful (option a) made it a
three-file slice against the ratified "display-only" language --
corrected in the post-implementation record, not silently. ShelfList
gained onSummary; the handler is useCallback-stable because load()
now depends on it, and an inline arrow would refetch the shelf on
every screen render (implementer-caught; prompt was wrong twice in
that step). formatRange, truncate2, analyteRange, buildSummary
shipped byte-identical, diff-gated -- the live ND-annotated string
is the D109.1 implementation and was never touched.

## Refuted hypotheses / corrections -- read before trusting anyone

Architect's, seven: the preamble list, in session order. Two are
promotion-relevant: the bare-token criterion became the CLAUDE.md
gated-string rule (e574954); the npm-test instrument is a standing
fact below and a promotion candidate at one instance.

Implementer conduct, three accepted deviations, all correct:
- useCallback stabilization beyond the prompt's literal inline arrow
  (necessary; the prompt's stated behavior was preserved, its
  literal instruction was not).
- A stale Sora-800 comment corrected when the constant landed beside
  it (a false claim would otherwise sit above new code).
- Refused to reword a comment to dodge the malformed gate 6;
  reported the construct-form re-run instead. The extra check in the
  close run -- verifying the record's repo-checkable claims before
  committing them while declining to vouch for device observations
  -- is the conduct bar for future docs commits.

Operator-side: two collapsed verdicts ("All gates passed" at the
D108 gate before per-step rulings arrived; proceeding past the
green-confirmed conditional at the D108 commit). Both recovered by
the mechanical one-step regime; the count across sessions is now
seven.

## Ratified decisions

- D107, D107.1, D108, D109 with post-ratification rulings: gear
  net-new in header (1a); "+ Add" label; sign-out behind the gear;
  glyphs are the shipped middle dot and U+203A chevron; zero
  off-shelf hides the right half; rung words dropped from mini bars;
  both section-row labels accent; empty-state branch untouched;
  mock-faithful subtitle placement (a). Grounds in dashboard.md
  D107-D109 amendments + post-implementation record.
- CLAUDE.md promotion (e574954): authored text must not quote a
  gated string.

## Open items

**Runnable now:** nothing drafted. The dashboard arc is closed.

**Blocked:** none.

**Banked:** committing the seven reference/handoff 0N-screens.png
(operator to vet for personal info first -- one shows the email);
"Expo Starter" web tab-bar template chrome; empty-shelf double
statement (ON SHELF - 0 above the empty-state copy -- unreachable
in current data); npm-test-as-Phase-A-instrument promotion (one
instance); grep -A-context-derived-from-block-length rule (one
instance); octal-only printf escapes as the standing control form
(one instance, already used in three prompts); blob-hash identity
promotion (carried); D-registry renumber for doubled D87 (carried);
authenticated TRUNCATE; off-shelf log; preference_summary view;
never_again; retirement last-log step; third retirement reason;
Android; app-code test wiring.

## New standing facts

- expo-symbols SymbolView renders on iOS on the existing dev binary
  (autolinked; gearshape confirmed at the D107 gate).
- The Phase A test instrument is npm test, never raw npx jest -- the
  script carries --experimental-vm-modules, without which unpdf's
  dynamic import fails all 48 fixture tests.
- Newsreader_400Regular_Italic and Sora_800ExtraBold are both
  registered and now consumed in index.tsx.

## Phase A for the next session -- falsifiable

- HEAD: this handoff's own docs commit; its parent is e574954
  (docs: D107-D109 post-implementation record). Predict the subject:
  "docs: session handoff 2026-08-03 -- D107-D109 shipped". Sync 0 0
  after the operator's push. If HEAD is neither, work continued --
  reconcile before proceeding.
- git status --porcelain: the seven ?? reference/handoff lines.
- Migrations: 15 on disk (name-form count), 15 in the ledger
  (ledger observed at close).
- Tests: npm test -> 52 passed (the instrument matters; raw npx
  jest reads 48 failures by design of the environment, not the code).
- CLAUDE.md: 329 lines (observed at e574954). dashboard.md: 322
  (arithmetic on observed diffstats 247+48+27; implementer confirms
  at persist).
- DB at close, observed via MCP 2026-08-03 second session: coas 5,
  session_entries 23 raw / 12 current, retirements 2, storage
  objects 2, favorites 2, anon grants in public 0, ledger 15.
  Unchanged across the whole session -- UI-only work, and the
  device gates wrote nothing.

## Entry point

The verification apparatus is in its best-observed order -- seven
architect refutations were all caught before they cost anything,
and the product:docs commit ratio finally leans product. The one
milestone that has now outlasted three full arcs is unchanged:
**no real session has ever been logged.** All 23 raw entries are
gate taps. The dashboard the operator asked for is shipped and
matches the mock. The next unit of product progress is not a prompt:
it is the operator consuming something real and tapping a verdict,
which will fire lexicon v4 vocabulary, session_current, the summary
card, and the card footer against their first honest datum. If that
surfaces a gripe, that gripe is the next arc. D110 is believed
next-free -- verify by reading, not by this claim.
