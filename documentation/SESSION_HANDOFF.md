# SESSION_HANDOFF

Status: WRITE-LAST. Committed as this session's final act, 2026-08-13.
HEAD at write time is 14bee9e2 (rank 2 feat); this commit rides on top.

## Preamble -- argue against yourself first

Three refutations from this session. First: the architect opened
with BOTH carried memory and its project-knowledge handoff copy
stale -- neither knew the 2026-08-12 second session existed, and
"rank 2" meant nothing to either; Phase A caught the drift before
any claim shipped. Second: the architect predicted at 85% that the
rank-2 audit's line numbers had not drifted; the F1 comment fix
(8634a51) had moved both coa-detail sites +1, and the ruling's
re-verify clause is what caught it. Third: the implementer's
protrusion-band fall-through residual (stated during the D146
re-spec) was refuted on device by gate step 6 -- the band is
inert. The device settles what code reading cannot. Trust this
file only through its Phase A predictions.

## Entry point

Rank 3: D137 completion (typeset), noted in the prior backlog as
the item that unblocks most P1s. Its Phase A reads the D137 doc
and the typeset state at HEAD before anything else -- this
session's drift lesson twice over: enumerate, then claim. The
session ratio was healthy for the second time running (two
product feats, two docs commits that served them); keep it
pointed at product.

## Start here (Phase A, read-only)

- origin/main at write time = 14bee9e209e7664e06f0fc4f1bf8734b7906f4f0
  (observed push line aae82b3..14bee9e, rev-list 0 0). This
  handoff commit rides on top, pushed as the final act. At next
  open expect origin/main = the handoff commit (subject predicted:
  "docs: session handoff -- ranks 1 and 2 retired, D146 closed"),
  sync 0 0. If HEAD is neither, work continued past this handoff
  -- reconcile before proceeding.
- Worktree: clean except the standing two untracked
  (.claude/settings.local.json, .claude/skills/).
- Toolchain, re-measured at both build gates this session: 161
  tests / 3 suites (npm test, never bare npx jest); tsc 0 errors;
  lint exactly 1 error (template use-color-scheme.web.ts).
  Migrations: 19 well-formed names.
- DB: NOT read this session -- no MCP call was made, and the
  device gates were failure-path gates (airplane mode), so no
  known successful writes. The last pinned numbers are the
  2026-08-12 handoff's, stale by design. Re-measure before any
  claim.
- If any of these don't match, the repo wins -- re-baseline
  before proceeding.

## What shipped (newest first; four commits, shas from pasted output)

14bee9e feat: rank 2 -- authored error copy at the seven audited alert sites
aae82b3 feat: D146 -- FAB touch geometry: responder aligned with paint
e319119 docs: D146 amendment -- paint/layout split; navigator constraint recorded
f143996 docs: D146 -- FAB touch geometry: two-layer bar aligns responder with paint

## The arcs

D146 (rank 1, retired). The device-observed FAB dead zone was
pinned by read-only audit to a paint-only translateY on the inner
View: 10pt of crown falling through to content, 8pt dead, 18pt
phantom hot below. Ruled: keep the proud look (variant 1b). The
first-ratified mechanism (outer container wrapping an inner
painted row) died against expo-router 56.2.14 -- trigger discovery
unwraps exactly one asChild layer and recurses only into Fragments
and TabLists, so nested triggers build a zero-screen navigator;
the asChild style merge also leaks the TabList's row direction.
Doc amended BEFORE the feat (document-before-implement held under
pressure). Shipped shape: single flex container, absolute painted
backdrop from the protrusion line down, spacer holding the old
flex slot at 72x56, FAB riding a full-width touch-transparent
absolute layer -- centering by flex alignment, deliberately not
percentage insets, which resolve against the content box under
YGErrataAll while the origin is the border edge (18pt off-center,
implementer-proven from Yoga source). Six-step device gate passed
per-step on both routes, including step 6's inertness check.

Rank 2 (retired). Phase A re-verified the audit's seven sites and
caught the +1 drift; operator ratified seven authored bodies, ruled
raw text dropped entirely and scope held at seven. Every body
states only what the transaction facts support (the Phase A report
carries them site by site). Two title collisions resolved: the
pre-read site no longer claims a reset failed before one was
offered; the favorite site states the split truth (retirement
recorded, answer lost). Airplane-mode gate exercised sites 1, 3,
5, 7 with recovery; sites 2, 4, 6 review-gated by ruling and
carried below as unexercised arms.

## Refuted hypotheses / memory corrections

- Carried memory and project knowledge were both one-plus sessions
  stale at open (see Preamble); the repo blob settled it.
- "The audit line numbers have not drifted" -- refuted; F1 moved
  both coa-detail sites +1.
- "The literal two-layer View tree is implementable" -- refuted
  against installed expo-router source; the trigger walk is the
  constraint, recorded in the D146 doc's Amendment paragraph.
- "left: '50%' + negative margin centers the FAB" -- refuted
  against Yoga source (YGErrataAll percentage-inset base mismatch).
- The implementer's fall-through residual for the protrusion band
  -- refuted on device by gate step 6; the band is inert. Do not
  re-litigate from code alone.

## Operator rulings this session

D146 ratified (delta-fab-touch.md), variant 1b (proud look kept)
over flush crown; D146 amendment ratified (paint/layout split;
navigator constraint recorded; useTabsWithTriggers rejected).
App-wide 44pt minimum hit-area floor RULED, audit-first: the floor
binds nothing until its own delta doc lands, and that doc's Phase A
is a read-only audit measuring every control (named suspects: the
shelf-list.tsx 6pt hitSlops). Rank-2 strings ratified as tabled;
raw error text dropped entirely; scope held at the audited seven.
Sites 2, 4, 6 review-gated by ruling, recorded as unexercised
arms. D146 gate accepted with per-step verdicts, all six steps.

## Refutation ledger, this session

Architect errors, enumerated (count = list length): the discovery
prompt placed the FAB on the Stash screen (it lives in the shared
tab bar; implementer caught); the same prompt assumed a richer
finding in 3ef28f6 than its two thin lines (implementer caught);
the D146 doc's first D145 citation widened a header-scoped ruling
app-wide (implementer caught; amended pre-push); the two-layer
tree spec was unimplementable against the installed navigator
(implementer STOP, twice, with pasted source); fabSpacer shipped
without height, which would have shrunk the bar and dropped the
hairline (implementer caught by arithmetic); "centers
deterministically" was false under YGErrataAll (implementer caught
from Yoga source). Six. One prediction miss recorded separately:
no-drift at 85% (refuted by re-verification). Implementer: 0
errors, 8 catch credits (the six above counted per catch, plus the
rank-2 drift correction and the dead-payload observation), plus
two correct STOPs on a replayed prompt. Operator: 0. Zero errors
reached origin; the one that reached a local commit (D145 scope)
was amended before push.

## Promotion candidates (next promotion pass)

1. Structural claims about third-party behavior enter a spec only
   after the installed source is read -- node_modules is the
   artifact, not the docs and not the architect's priors. Corrected
   twice this session (trigger discovery; Yoga errata), both by
   implementer source reads. Meets the corrected-twice bar.

## Banked follow-ups (ranked backlog, then unranked)

Ranked, ranks 1 and 2 retired this session: 3 D137 completion
(typeset -- unblocks most P1s); 4 accessibility labels
(session-ladder first); 5 splash dark sub-key; 6 dead chrome
chore; 7 Reduce Motion Scope B (ruled); 8 expandable History
(delta doc + D-number first).

New banked this session:
- 44pt-floor audit + delta doc slice (prerequisite of the ruled
  floor; read-only audit of every control first).
- Inline-surface raw-error class, now four specimens: coa-detail
  ~328 (query load, becomes the detail body), ~362 (PDF sign),
  ~471 (delete-succeeded-Storage-failed composite), and NEW,
  device-observed this session: the Stash screen's inline load
  error renders a raw native exception (fetch failed:
  UnexpectedException ... Promise.swift:56) -- outside the three
  audited files, ugliest specimen yet, screenshot in session
  record.
- Dead result.message payloads: profile-reset.ts, coa-favorite.ts,
  coa-retire.ts each populate { ok: false, message } that nothing
  reads after rank 2. Contract cleanup, own chore.
- Ragged paragraph wrap in delta-fab-touch.md (ratified-bytes
  artifact, cosmetic only).

Unranked, carried unchanged: BottomTabInset last consumer (its
protecting rationale is now dead -- D146 superseded the tactic);
bloom comment; session-ladder D83 scope note; same-name
disambiguation; Stash system-font states; last-card breathing
room; orphaned PDFs before public release; app rename collision
check; migration 20260715185455's superseded D53 comment.

## Unexercised arms (carried honestly)

Carried from 2026-08-12, plus new: rank-2 sites 2 (reset write
failure -- shadowed by the pre-read in any offline test), 4
(delete residual arm -- unreachable by construction while 23503
is intercepted), 6 (favorite write failure after a successful
retire). All three ship review-gated by ruling. The error/retry
state arm is now PARTIALLY exercised: the Stash inline error
rendered on device this session (see banked finding), which is
how the raw-exception specimen was observed.

## Working rhythm

Stable method lives in CLAUDE.md. Two deltas proven this session:
the read-only discovery prompt again paid for itself twice (both
D146 spec refutations cost nothing but a re-spec); and the
implementer's source-read STOPs are now the de facto gate for any
structural claim about a dependency -- promotion candidate 1
formalizes it.
