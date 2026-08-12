# SESSION_HANDOFF

Status: WRITE-LAST. Committed as this session's final act, 2026-08-12.
HEAD at write time is d7c1ebdb (dead-band fix); this commit rides on
top. State claims below were implementer-verified against the repo
before this commit (HEAD, worktree, shipped shas, migrations count,
delta-doc line 22).

## Preamble -- argue against yourself first

Three refutations from this session's own work. First: the synced
project-knowledge copies of this file and CLAUDE.md were one session
stale at open -- five commits of drift, caught only by the Phase A
paste; treat any off-repo copy as historical context, never state.
Second: the architect predicted the History blank space three ways
(empty-data card, invisible card, stale list measurement) and the
device refuted all three; the actual cause was container padding
reserving space for an in-flow tab bar. Third: a build prompt
asserted "operator-ruled" for a one-line headline without reading
art-direction.md, which carries a ratified wrap-never-shrink rule;
the implementer's STOP caught it. Trust this file only through its
Phase A predictions.

## Entry point

The standing-rules promotion pass (Tier 1) -- now deferred four
times and grown: the six standing rules and seven candidates from
the 2026-08-10 handoff (retrieve from commit 60a2977e's blob, never
memory), plus four new candidates from this session: (1) skill-run
prompts must state platform explicitly (context.mjs cannot infer it
without PRODUCT.md; omission silently scores against web
heuristics); (2) dead-space defects get their geometry pinned
(scrolls-with-content vs fixed-on-screen) before any hypothesis is
written; (3) range-scoped ASCII gates pair a same-file whole-count
control only when the file carries non-ASCII -- state which case
holds; (4) package presence is probed by directory, never
require.resolve (exports maps false-negative). After it lands, the
named product move is the FAB dead-zone fix (device-observed, the
app's primary control), then the remaining ranked backlog below.

## State at close (verified at origin at write time)

- At write time origin/main = d7c1ebdbfdbdc5d830df2297eb0c1a7a5aa77c33
  (observed push line 1b3b565..d7c1ebd, rev-list 0 0; corroborated
  by the implementer from the local remote-tracking ref, no fetch);
  this handoff commit rides on top and is pushed as the session's
  final act. At next open expect origin/main = the handoff commit
  (subject predicted: "docs: session handoff -- design validation
  shipped seven, dead band dead"), sync 0 0. If HEAD is neither,
  work continued past this handoff -- reconcile before proceeding.
- Worktree at close: clean except the standing TWO untracked
  (.claude/settings.local.json, .claude/skills/ -- the latter now
  contains the impeccable skill, installed this session for the
  implementer).
- Toolchain: 161 tests / 3 suites (npm test, never bare npx jest);
  tsc 0 errors; lint exactly 1 error (template
  use-color-scheme.web.ts); migrations 19 well-formed names.
  Re-measured repeatedly today at these values.
- DB reads made this session (MCP, stale on arrival by design):
  on_shelf_count partition {0:13, 1:2} (coas 15); all 13 History
  rows carry strain and totals; created_at ordering read for the
  rated-sort tail; three duplicate Animal Face rows, two RAINBOW
  RUNTZ, two Permanent Shades (one null brand). Other pins
  (retirements, session counts, favorite) were NOT re-read today --
  carry the 2026-08-11 handoff's values as stale.

## What shipped (newest first; seven commits, shas verified)

d7c1ebd feat: remove Stash bottom reservation -- the tab bar is
        in-flow
1b3b565 feat: stash card strain headline renders one line (D83
        scope amendment)
5575d5e feat: A-Z sort option; segment shadow literal tokenized
d8ec3c6 feat: D145 -- Stash header: segmented control and native
        sort menu
6c144f8 docs: D145 -- Stash header delta ratified (segmented
        control + sort menu)
e42b6f2 chore: declare dark-only appearance in app.json
ec8c178 feat: Stash message states declare Dash colors, not
        scheme-resolved

## The arcs

Design validation (the session's frame). Operator invoked the
Impeccable skill; read-only dual-agent critique + native audit ran
in-repo (findings in chat, not repo): heuristics 24/40, audit
10/20, systemic finding "semantics governed, surfaces not" -- D137
shipped half-finished (no sized type roles) is upstream of most
P1s. The bundled detector returned [] and the implementer proved
the zero vacuous by control-pairing (8 of 59 rules reachable on RN
source); a skill-run platform line is mandatory (see entry point).
The P0 (scheme-resolved text on fixed-dark grounds, 1.09:1 in
phone-Light) was device-corroborated via a forced empty state and
fixed at Scope A by ruling; dark-only declared in app.json kills
the class at platform level, gate owed at next EAS rebuild.

D145 (Stash header). Claude Design delta ratified with operator
floors (44pt hit areas, AA count label, native menu); the new
mockup superseded the v2 north-star reference screen in place by
ruling, pinned by hash on both sides. Feat shipped: two-segment
control (tab role + selected state), Sort chip opening
ActionSheetIOS (Platform-guarded), five Dash tokens. Operator then
added A-Z (null/blank strains follow named rows in fetched order,
extending the standing absence convention) and one-line card
headlines (bounded shrink to 0.7) -- the latter required a D83
scope amendment: wrap-only now explicitly governs the survey line
only, dissent recorded, survey reopening condition unchanged.
Card distillation is DEAD by ruling: D131/D132 stand.

Dead band (diagnosis arc, the session's humbling). A fixed
touch-dead band above the tab bar, both segments, surviving cold
restart. Three architect hypotheses refuted by device observation
before the geometry was pinned (fixed-on-screen, not in-flow);
Phase A2 then found it by arithmetic: index.tsx reserved
BottomTabInset+spacing (+ additive safe-area inset, ~134pt) for a
bar expo-router/ui renders in-flow -- layout had already
subtracted it. A one-line worktree-only magenta probe confirmed
ownership on device (Insights as control: same constant on
scrollable content = benign over-pad). Fix: delete the
reservation. The probe methodology is worth reusing; the
geometry-pin rule is promotion candidate 2.

## Refuted hypotheses / memory corrections

- Project-knowledge copies of governance docs were stale at open
  (five commits); repo settled it.
- Blank-space hypotheses refuted in order: empty-data card (DB
  read), invisible card (dead-to-touch), stale measurement (cold
  restart). Cause: container padding.
- The critique's claim that add-to-shelf-modal sits on a fixed-dark
  parent was false (scheme-consistent island); the P0's blast
  radius was 4 sites in one file, not codebase-wide.
- "Every row has a strain" was false (string | null, live null
  rows on four surfaces).
- "RN's default shadowColor is black" was false (default is unset;
  rendering rested on an undocumented CALayer fallback) -- resolved
  by token, not removal.
- The audit note "sort/segment state destroyed on every
  shelfVersion remount" was overstated (profile reset only;
  case-sensitive grep had hidden the setter).
- The audit's BottomTabInset note drew the wrong conclusion from
  correct arithmetic (assumed the bar overlapped; it does not).
- The draft of this handoff said "shipped eight" for seven -- a
  hand-count, corrected against git log at the verification pass.

## Operator rulings this session

Design validation preceded the promotion-pass entry point; P0 fix
Scope A (4 sites) with dark-only both-now; D145 floors + three
implementation rulings (chip prefix textMuted, post-filter strains
count, spec colors as Dash tokens); A-Z with null-partition +
shadowInk token; card headline diverges / survey stands (D83 scope
amendment, dissent recorded); Reduce Motion = Scope B (all
animation sites, prompt owed when it reaches the front); card
distillation dead (D131/D132 stand); north-star 01-stash.png
superseded in place; expandable History cards requested (delta doc
+ D-number owed before code); handoff now.

## Refutation ledger, this session

Architect errors, enumerated (count = list length): airplane-mode
gate design severed the dev-server channel the gate needed; an
unsatisfiable git-status expectation (directories are never
listed); a placement directive that ignored the delta doc's own
"replaces the previous" clause; the nullable-strain premise; the
shadow-default premise; "both docs carry non-ASCII" (one is pure
ASCII); a hand-counted accessibilityState prediction the correct
.map() implementation refutes; "operator-ruled" written against an
unread design doc (D83); a verbatim line-break that would have
split its own gate phrase across a wrap; three unpinned-geometry
predictions on the dead band; the draft handoff's shipped-commit
hand-count (eight for seven). Implementer errors, enumerated per
its own correction of this ledger's first draft: the critique's
fixed-dark-parent claim (self-caught next run); the shelfVersion
remount overstatement and the BottomTabInset wrong conclusion
(both originating in the same audit, listed above as refutations
and attributed here); plus two mid-run mechanical slips
self-caught in one arc (literal glyphs written for escape forms,
then a sed backslash-u mangling while fixing them). Operator: 0.
Zero errors reached origin; several reached the worktree and none
survived a gate.

## Banked follow-ups (ranked backlog, then unranked)

Ranked (operator-ratified order, updated): 1 FAB dead zone
(observed; after the entry point); 2 raw error copy slice; 3 D137
completion (typeset -- unblocks most P1s); 4 accessibility labels
(session-ladder first; D145 discharged this header's share);
5 splash dark sub-key; 6 dead chrome chore (web-badge, hint-row);
7 Reduce Motion Scope B (ruled); 8 expandable History (delta doc +
D-number first; collects the delta doc's false line-22
"top-terpene subline" description).

Unranked: retire BottomTabInset's last consumer (insights.tsx
over-pad) + its stale rationale comment in one chore; the bloom's
false takes-no-touches comment (three reports now); session-ladder
D83 comment lacks the scope note; same-name disambiguation
(heavier: three Animal Faces observed); Stash message states
render system font on a Sora surface (dissolves into typeset);
last-card 8pt breathing room (taste call, contentContainerStyle
only); orphaned PDFs before public release; app rename collision
check (shortlist unchanged).

## Unexercised arms (carried honestly)

Error/Retry state (arithmetic-verified only); loading-state look;
A-Z null-strain ordering, accent/case ties, device-locale
variance; narrowest card width (badge + overflow; no live
favorite); survey-side wrap divergence on device; VoiceOver
selected-state announcement; dark-only launch gate (next EAS
rebuild, which also checks D145's menu on a fresh binary).

## Working rhythm

Stable method lives in CLAUDE.md. Three deltas proven this
session: architect-run MCP carried DB observation including
mid-diagnosis reads; a worktree-only visual probe (one property,
never committed, staged-blob-gated out) is the ratified form for
layout ownership questions; device gates arrived as screenshots
plus one-line answers, with one aggregate verdict accepted and
recorded as aggregate per the standing rule.

## Amendment (2026-08-12, promotion pass)

- "Seven promotion candidates" (cited here and in the 2026-08-11
  handoff) is a phantom count: 60a2977e's blob carries six standing
  rules and one owed correction, no seven-item list. Unrecoverable.
  Promoted set: nine items (rules 2-6 from 2026-08-10, all four
  2026-08-12 candidates); rule 1 recorded as already covered by the
  carried-content bullet in Prompt conventions.
- The two owed [ADAPT] corrections were found already landed at HEAD
  3ef28f6 during this pass's blob read: commit 3099c28 ("docs:
  CLAUDE.md truth-fix -- [ADAPT] items 1 and 3 match HEAD"), a
  discharge recorded in neither this handoff nor the 2026-08-11 one.
- The seven 0N-screens.png: operator confirms the banked identity
  check ran before their removal.
