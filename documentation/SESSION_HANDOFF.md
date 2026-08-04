# Session handoff -- 2026-08-04

The repo is authoritative over this document. This session's own example:
the incoming architect's carried copy of this very file predicted HEAD as
the 2026-08-03 handoff commit and 15 migrations; observed reality was
702da3b (five commits past it), 16 migrations, and an uncommitted D110
slice 5 in the tree -- the prior session continued past its handoff
without amending it (a 4.5 violation, cost paid in reconciliation time).
And this paragraph's own first draft said "four commits past it" against
a rev-list of five -- caught by the implementer before commit
(refutation 8). Begin with a read-only Phase A audit.

## Start here (Phase A, read-only)

- HEAD's parent is a0b4c8e (feat: D114). Predicted subject of the handoff
  commit itself: "docs: session handoff 2026-08-04 -- D110 closed,
  D113-D114 shipped". Sync 0 0 after the operator's push. If HEAD is
  neither, work continued past this handoff -- reconcile before
  proceeding.
- git status --porcelain: exactly seven ?? reference/handoff/0N-screens.png
  lines (N=1..7), the standing noise.
- Migrations: 16 on disk by name-form count, 16 in the ledger.
- npm test -> 52 passed (npm test, never npx jest). npx tsc --noEmit -> 0.
  npx expo lint -> 1 error 0 warnings, template file only.
- DB via MCP, observed 2026-08-04 post-D114-gate: coas 6, session_entries
  39 raw / 3 current, retirements 7 (4 reason Profile reset, 1 from
  today's device gate), profile_resets 1, favorites set 3,
  sum(on_shelf_count) 1, storage objects 3, anon grants in public 0.
If any of these do not match, the repo wins -- re-baseline before
proceeding.

## What shipped (newest first)

- a0b4c8e feat: retire is destructive-styled and card-reachable (D114)
- c4a9a8e feat: favorite is a card control on both surfaces (D113)
- fc148a3 docs: amend dashboard.md with D113-D114 (card favorite, retire discoverability)
- cdecc16 feat: profile reset UI from the account sheet (D110 slice 5)

Three product commits to one docs commit -- the 4.7 ratio leaned product
for the first time, driven entirely by first real usage.

## The arcs

**D110 close-out.** The prior session ended mid-slice without a handoff:
slice 5 (reset UI) sat uncommitted while slices 1-4 were pushed. The
operator ran a real profile reset and ~3 real sessions from that
uncommitted code via Metro on 2026-08-03. This session diagnosed the
slice (Phase A confirmed it as exactly the ratified slice 5 plus two
in-service ride-alongs), gated it retroactively -- operator testimony
for the UI half, MCP forensics for the server half (12 tombstones at one
created_at, 4 system retirements matching the pre-reset shelf sum, 5-key
snapshot) -- and shipped it as cdecc16. Grounds for retroactive rather
than re-run gating: re-running the reset would tombstone the operator's
real sessions, and undo is banked.

**D113-D114, born from first real usage.** The operator could not find
retirement and wanted the buy-again control on the card. Phase A refuted
the architect's model on both counts (see refutations) and reclassified
the report as a discoverability defect: the retire control existed but
sat last on the longest screen, styled as the PDF link's twin, under the
accent Log bar; the favorite chip existed but was display-only and
absent when unanswered. The fix shape: shared writer-plus-ritual modules
(coa-favorite.ts new, promptRetire beside retireCoa), cards receive
callbacks and never writers, archive excluded by prop omission with
count checks as defense in depth, one question wording everywhere with
Skip-vs-Clear kept distinct by operator ruling.

**Milestone: first real usage happened.** 2026-08-03, ~3 sessions on a
freshly reset profile, MCP-observed. The oldest open milestone is
closed. Current-session rows are real data now; the all-test-data
assumption in prior handoffs no longer holds.

**QR-import recon (design not started).** Operator: package QRs never
reach a COA directly -- age gates, summary pages, per-provider landing
pages. Architect fetched a live 1a4.com landing URL: JS-rendered SPA,
empty shell server-side. Server-side URL-to-PDF resolution is dead as
the primary path. Leading design: scan QR -> in-app WebView -> user
clicks through -> app detects a loaded PDF and offers one-tap import ->
Edge Function fetches the PDF URL server-side into the existing ingest
pipeline. Cost: camera scanner and WebView are both native modules --
one combined dependency chore commit, one EAS build, then code.

## Refuted hypotheses / corrections -- read before trusting anyone

Architect's, eight, all caught by the implementer or a gate:
1. H1: believed retirement reachable only via the survey and absent from
   the detail. Both clauses false -- the survey never had it; the detail
   has had it since slice 6 (1802dbf).
2. H2: believed favorite settable only in the retirement prompt. False --
   the direct detail control predates it and implements D91 exactly.
3. Cited the reset's 4 retirement rows as evidence retire_coa works.
   Wrong per D110.1: reset inserts its events directly. The real
   evidence is the slice 6 gate record.
4. D113 prompt's gate enumeration anticipated setFavorite hits in both
   lists while the same prompt's extraction clause mandated the build
   that removes them. Implementer read the enumeration as an upper
   bound and refused to add redundant references to satisfy a count.
5. D114 prompt: "minimum fields the confirm copy needs" against a
   five-field enumeration including favorite, which nothing reads.
   Kept per enumeration, documented as named-but-unread.
6. D114 prompt: "moved verbatim in behavior" contradicted its own
   onDone-on-failure clause. Implementer followed the explicit clause;
   the delta (failed retire now refetches) was ratified as better.
7. Absolute non-ASCII gate (expect 3, control 0) written against a file
   carrying 21 pre-existing non-ASCII bytes the architect had read in
   diffs that same session. Unmeetable by construction. Implementer
   pre-measured the delta (21 -> 24, exactly the glyph), proceeded, and
   reported. Delta-with-control is the only sound form for this gate.
8. This handoff's first draft stated the stale-handoff distance as four
   commits; rev-list measures five. The architect does not hand-count,
   including in the sentence written to demonstrate repo-over-memory.

Implementer's, self-corrected: one line-count misreport (625 for a
624-line doc), caught and corrected in its own next report.

Prior-session conduct finding: work continued past the 2026-08-03
handoff without amendment (4.5), ending in an uncommitted slice and a
handoff wrong by construction. Cost was real; recorded without blame --
the mechanism (amend or write-last) exists and was simply not run.

## Ratified decisions

- D113, D114: dashboard.md tail amendment (fc148a3) carries decisions
  and grounds. Post-ratification rulings absorbed into the commits:
  converged question copy (one wording, Skip only at retirement),
  archive exclusion by prop, RetireTarget keeps its unread field,
  failed-retire refetch, strain-name menu title, baseline U+2026 glyph.
- Retroactive gate for cdecc16: testimony plus MCP forensics accepted in
  lieu of re-run where re-running destroys real data.
- favorites_cleared stays unsurfaced (cdecc16 body records it).
- Un-retire: BANKED with grounds -- no lived instance of a mistaken
  retirement; the only count-raising path is the dedupe modal's
  bought-another, and that is accepted until demand exists.

## Promotion candidates for CLAUDE.md (next docs pass)

- Non-ASCII file gates state the DELTA with a paired control (HEAD vs
  worktree equal, or HEAD~1 vs HEAD plus expected delta), never an
  absolute count. Two instances 2026-08-04: the dashboard.md equality
  gate (clean) and refutation 7 (absolute form, failed). Meets the
  corrected-twice bar.
- Carried from prior handoff: npm-test-as-Phase-A-instrument (one
  instance), grep-context rule, octal printf control form, blob-hash
  identity, D-registry renumber for doubled D87.

## Open items

**Runnable now:** QR-import design doc -- recon complete (see arc), no
prompt drafted yet; drafting it is the entry point.

**Blocked:** mood-capture design (two bipolar axes vs tags vs both) --
blocked on an operator decision the architect has framed but not
received. Relevant tension, recorded so it is not re-derived: the
operator simultaneously wants more resolution (sliders, doubts the
5-point scale) while real data volume is ~3 sessions; continuous
capture is harmless to the math and favored by recover-later
asymmetry, but any new axis amends the ratified lexicon (D85 family),
and the doc governs.

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
Android; app-code test wiring; un-retire path (2026-08-04, grounds
above); 5-point scale resolution (operator's own doubt, banked by
operator ruling; re-examine before the friend cohort onboards -- a
scale change costs nothing at 3 sessions and a lot at 1000);
session-logging mood axes and tags (moves to Blocked the moment the
operator decides; listed here so it survives if Blocked is cleared).

## Working rhythm

Unchanged from CLAUDE.md and handoff-specs 4. One live observation: the
operator-pasted-my-DECIDE-as-a-prompt event (2026-08-04) was handled
correctly by the implementer (STOP, no rules header) -- if it recurs,
consider a standing one-line prompt header even on DECIDE messages.

## Entry point

Draft the QR-import design doc. It is the largest friction named from
first real usage ("I never know where to find the COA on my iPhone"),
the recon is done, the design shape is chosen pending validation
against the operator's other lab providers, and its first commit is a
Tier 1 docs slice requiring no build. The mood-capture DECIDE should be
put to the operator at the same session's start, so its design can
proceed if the QR arc stalls on the EAS build.
