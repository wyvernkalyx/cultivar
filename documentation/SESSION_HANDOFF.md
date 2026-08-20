# SESSION_HANDOFF

Status: WRITE-LAST. Committed as this session's final act, 2026-08-20
(the session opened 2026-08-19 afternoon, the same day a477427
closed, and ran past midnight). HEAD at write time is 23b0f01 (D149
feat); this commit rides on top.

## Preamble -- argue against yourself first

The finding this file must carry at full strength: A PUSH CARRIED
MORE THAN WAS AUTHORIZED, AND IT REACHED ORIGIN. git push origin main
is branch-scoped; the architect authorized the docs commit 123812d,
then waived ordering ("order doesn't matter") while the ungated Tier
2 feat 0aff1b2 sat on local main. The push published the feat before
its device gate. The gate passed afterward -- benign by luck, not
design. The correction was promoted to CLAUDE.md the same session
(push authorization is ref-scoped, names the exact old..new movement,
runs only when local HEAD equals the authorized commit, never bundled
alongside pending build work) and every later push named its movement
and landed exactly it. Trust a push only by its observed movement
line. Second finding, lower stakes, three occurrences: the
operator-placement half of the file-carrier flow is the fragile half
-- one carrier was fed before placement, one never arrived, and one
of a two-file message arrived alone. Every case was a clean
implementer STOP on PRECONDITION 2, zero bytes moved. Correction
standing: one carrier file per chat message.

## Entry point

Ranked backlog rank 5: splash dark sub-key (the splash config's dark
variant; needs one EAS cycle, so it opens with the operator's build
appetite). If no EAS appetite at open, rank 6 instead: dead chrome
chore, pure JS (citation: the three consumerless coa-detail style
keys badge/meta/sourceLab, 2026-08-18 audit). Operator-parallel,
no architect dependency: the OPEN DATA READS below.

## Start here (Phase A, read-only)

- origin/main at write time = 23b0f01a146e6ac19f0fdb2093f325398c0d4d6d
  (observed push line c975f88..23b0f01, rev-list 0 0). This handoff
  commit rides on top, pushed as the final act. At next open expect
  origin/main = the handoff commit (subject predicted: "docs: session
  handoff -- D148 and D149 shipped; push scope breached, promoted"),
  sync 0 0. Otherwise reconcile before proceeding.
- Worktree: clean except the standing two untracked
  (.claude/settings.local.json, .claude/skills/). The operator also
  holds OUTSIDE the repo, all inert and deletable at will:
  d147-s3v2.patch, d148-dashboard.md, d148-preference-summary.tsx,
  claude-md-promotions.md, d149-history-cards-collapse.md,
  d149-shelf-card.tsx, d149-shelf-list.tsx.
- Toolchain at the last gates: tsc 0; lint exactly the baseline
  (1 error, 0 warnings, exit 1, template use-color-scheme.web.ts,
  now recorded in CLAUDE.md); suite 170 tests / 4 suites. Migrations:
  19, measured this session (no schema work; re-measure).
- DB: NOT read this session (no MCP call, no session-writing gates).
  Last pinned numbers predate b252a97. Re-measure before any claim.
- Architect-clone environment note: under npm ci --ignore-scripts the
  container's tsc reports TS2882 on the @/global.css side-effect
  import (theme.ts). Environment artifact, stable pre- and post-edit;
  the implementer's tsc 0 is authoritative and held all session.

## What shipped (newest first; shas from pasted output)

23b0f01 feat: D149 -- History cards collapse to strain and brand
c975f88 docs: D149 -- History cards collapse, design ratified
ac3cc25 docs: standing-rules promotion pass -- carriers, gates, push scope
0aff1b2 feat: D148 -- remove the sessions flank from the compact summary
123812d docs: D148 -- sessions flank removed from the compact summary

Four pushes, each verified by movement line: a477427..0aff1b2 (the
breached one -- two commits, one ungated at push time), 0aff1b2..ac3cc25,
ac3cc25..c975f88, c975f88..23b0f01. All synced 0 0.

## The arcs

D148 (complete). The SESSIONS - ALL-TIME flank left the compact
summary; verdict bars and BUY AGAIN stand; three falsified comments
rewritten in-slice; styles.flank died with its only consumer;
sessionCount survives as the empty-branch gate. Amendment in
dashboard.md with the supersession pointer inside the D109 bullet.
Device gate PASS on all three steps; screenshot cross-check was
internally consistent digit for digit (distribution 3/2/2/0/0 = 7 =
subtitle count). Layout (bars at the card's left edge) ACCEPTED by
ruling; revisit banked on "if it grates".

D149 (complete). History-segment cards rest collapsed (strain +
brand + chevron, one 44pt press target that expands rather than
opens); expanded = the unchanged D101 card plus a nested collapse
control; state session-local, reset by refetch and segment switch
(ratified v1 cost); Active untouched by prop omission. New doc
documentation/design/history-cards-collapse.md; scoped supersession
of D101's same-card-language rule, grounds against grounds recorded.
Device gate steps 1-5 PASS; step 6 (VoiceOver) SKIPPED by ruling.
Status-line amendment ruled NOT owed at the feat commit -- two
witnesses (architect and implementer, independent re-reads) found no
doc sentence the code falsifies; the D133b precedent requires one.

Promotions pass (complete). Eleven rule sites into CLAUDE.md,
including the BLOCKING file-carrier rule, one-slice-one-carrier,
hunk reconciliation, control-read + tr-only gate form, heterogeneous
endings, installed-source, pre-executed criteria, site-list gates,
the new ref-scoped push rule, the lint baseline, and [ADAPT] 170/4.

## Refuted hypotheses / memory corrections

- Carried memory opened with "D147 slice 2 in progress at close":
  false. D147 had shipped whole. One session of drift, settled by
  the handoff blob at Phase A.
- The architect's first D148 grounds assumed the summary card
  rendered on the Stash dashboard beside its subtitle: refuted by
  grep before any text shipped -- insights.tsx is the only render
  site, and the grounds were rebuilt on the observed screen.
- A predicted expandedHistory grep count of 5 was wrong by
  arithmetic-from-memory; the executed value is 2 (case sensitivity
  excludes setExpandedHistory). Executed-not-predicted criteria
  caught it before the prompt shipped -- the promoted rule paying
  for itself the day it landed.

## Operator rulings this session

Entry rulings: ALL-TIME flank removed (grounds verbatim in the D148
amendment); collapsible cards = the History TAB (the rank-8 surface
note resolved; the architect's first framing of the question pointed
at the wrong surface and the operator's stated grounds corrected
it). The 0N-screens banked item CLOSED: the operator checked before
deletion; per ruling they are not referenced again -- this line is
the record and the last mention. D149 ratified by executing the
carrier placement (the ratification-is-the-act form, recorded). D148
layout accepted; D149 gate step 6 skipped; both banked below.

## Refutation ledger, this session

Architect (count = list length): the superseded grep-form ASCII gate
authored fresh despite last session's ledger -- its control failed
to fire and control-pairing caught it (self-caught, nothing
shipped); the wrong-surface D148 grounds draft (self-caught
pre-ratification); the PUSH-SCOPE BREACH (reached origin; closed
benign after the gate; rule promoted same session); the
delivery-gap class, three occurrences (fed-before-placed;
never-arrived; one-of-two-arrived) -- implementer STOPs, zero bytes
moved; ratification prose reaching the implementer as if it were a
prompt (operator cross-wire the architect's unlabeled DECIDE
enabled; the day-old file-carrier rule fired on its own author).
Five classes, one reached origin, zero reached ratified bytes.
Implementer: 0 errors. Catch credits: three PRECONDITION-2 STOPs;
the prose-carrier STOP citing the just-landed rule; the lint
baseline noun correction (error, not warning -- now in CLAUDE.md);
the PIPESTATUS[0] discipline on piped gates; the required-read
freshness re-check (read hashes re-verified against an unmoved
HEAD); the independent status-line re-read. Operator: 0.

## Promotion candidates (new; all carried candidates were promoted)

1. One carrier file per chat message -- multi-file attachments
   survive download unreliably (three delivery gaps, one session).
2. Piped gates read exit codes from PIPESTATUS[0], never a bare $?
   after a pipe (implementer, D149 feat pass).
3. A required read is current only while HEAD's blob hash matches
   the hash read; re-verify on reuse instead of assuming
   (implementer pattern, D149 feat pass).
4. Ratification texts are operator-only and say so in their first
   line; a build prompt is identified by its precondition block and
   terminal sentinel (the cross-wire class).

## Banked follow-ups (ranked backlog, then unranked)

Ranked: 5 splash dark sub-key (the entry point); 6 dead chrome
chore (citation above); 7 Reduce Motion Scope B. Rank 8 shipped
this session as D149.

New banked this session:
- formatPct rounds (toFixed) where the card family truncates
  (truncate2, D102); whether D147 ratified its own precision form is
  a docs question for the next insights touch. Low stakes: the
  rendered 1.42-2% matches the formatter as written and its gate.
- D149 collapsed-row VoiceOver + the carried ProfileGroups VoiceOver
  + Counter view / Share exercise: ride the next touch of either
  file's gate.
- Layout revisit triggers, both operator-owned: D148 bars at the
  left edge; D149 collapse snap (LayoutAnimation banked, one ruling
  if it grates). Expansion-state persistence banked on lived demand.

Carried: OPEN DATA READS (operator): spot-check the Caryophyllene
group against a lab sheet; rule on the Limonene-dominant Loved batch
(real preference surprise vs COA audit -> ingestion audit item if
miskeyed). Share text still consumes the pooled top-3 (D147
non-goal, pointer in the doc). The full 2026-08-18 morning list
(44pt-floor audit; raw-error class; dead result.message; ragged wrap
in delta-fab-touch.md; BottomTabInset; bloom comment; session-ladder
D83 note; same-name disambiguation; Stash system-font states;
last-card breathing room; orphaned PDFs; app rename check; migration
20260715185455 comment; theme.ts Dash docblock; shelf-list Retry
VoiceOver residual; project-knowledge copies stale -- operator
refresh when convenient, now SIX sessions).

## Working rhythm

Stable method lives in CLAUDE.md, which grew eleven rule sites this
session. Deltas: whole-file carriers went 4-for-4 on content (every
staged and committed blob matched its architect-tested hash, first
attempt) while all three failures this session were the delivery
half -- hence candidate 1. The clone pre-executed tsc and the suite
for both feats; zero implementer-side criterion corrections for the
second consecutive session. Conditional ref-scoped pushes held for
every push after the breach. Non-ASCII in a carrier is pinned by
exact byte count when deliberate (the D149 doc's title em dash,
census 3, located by the implementer to the byte).
