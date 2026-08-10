# Session handoff -- 2026-08-10 (design-overhaul arc, slices 1-6)

Status: WRITE-LAST, committed as this session's final act. The prior
handoff is superseded whole; its content persists in git history.

## Entry point (next session, after Phase A)

The slice-6 DEVICE GATE, pending. The worktree carries slice 6 applied
and implementer-verified but UNCOMMITTED (gate-typed commits require
their gate). Walk, per-step verdicts:
(a) any detail: gear top-right; header strain+brand only; Lab info
    block at bottom (lab/parser/dates/Added)
(b) Buy again: stated answer only, nothing tappable
(c) gear -> Edit name/brand on the stray Whole Flower row -> rename ->
    Save -> detail and list both show it
(d) gear -> Delete from stash on that same row -> confirm names it,
    NO session clause -> Delete -> closes, gone from Active
(e) on a kept row with sessions (Mule Fuel, 2): gear -> Delete ->
    confirm reads "and its 2 logged sessions" matching the same
    screen's Sessions list -> Cancel
DB pins: before {coas 18, possession {0:13,1:5}, retirements 17,
sessions 96 raw / 7 current}; after (c)+(d): {17, {0:13,1:4}, 17,
96/7} -- sessions and retirements byte-identical is half the point.
MCP read-back after verdicts; then the slice-6 commit prompt (to be
generated from the pinned hashes below), then push, then slice 7.

## Carried worktree state (Phase A must verify, not trust)

- HEAD: ddc0da8391ed05a530aff28d5ca1307450aa338a (feat: D141 survey
  restyle), pushed, sync 0 0 at session close (before the handoff
  commit this file rides in).
- Two ` M` files, LF-normalized (tr -d '\r' | sha256sum):
  src/components/coa-detail.tsx
  8b53a9ba913f4292b5ef5a12e9f33d24e6c56e8f87a8250ace15ccd0efc44bc5
  documentation/design/design-overhaul.md
  761869fba63730223a01f93cd9eb9d73b9b755d91cf5e4f943feb9eb9529c176
- Seven standing ?? reference/handoff/0N-screens.png (v1 leftovers,
  open question in the design doc).
- The slice-6 patch: /d/Projects/slice6.patch,
  68113f0240e4a798ab3e884be08e91953b2126149bd523f8444dbe9164ebc2c8
  (recovery path if the worktree is disturbed).

## Shipped this session (all pushed, origin-verified)

b84328b docs: design overhaul -- v2 reference adoption (D137-D143)
616dba7 refactor: D137 token foundation
5c0afef feat: D138 nav shell (3 tabs, FAB quick actions, Insights)
20f5e5d feat: D138 Stash shell (header, search, segments, sort pills)
75b8747 feat: D139 binary possession, D140 card half, stash copy
ddc0da8 feat: D141 survey restyle
Plus in-worktree: slice 6 (gear menu, D140 detail half, Lab info
relocation, D104 superseded by operator A2 with cascade-naming
confirm; rename sheet per operator B1; doc amendments folded).

## DB baselines (MCP-read at close)

coas 18; possession {0:13, 1:5}; retirements 17; session_entries 96;
session_current 7; lexicon v6 (the v2 reference's own vocabulary --
no migration ever existed for this arc).

## Operator rulings this session (all recorded in the design doc or
commit bodies)

Carve-outs 1-6 (2026-08-09), DECIDEs A1 (buy-again ask at retirement
only), B1 (terminology consumer-copy only), forward-only lexicon
posture (moot -- v6 identical), slice-6 A2 (Delete supersedes D104,
cascade named in confirm), slice-6 B1 (rename sheet, never the parse
editor).

## Refutation ledger -- 18 architect errors, 0 escaped to origin

By catching instrument: implementer STOPs (7): F3 %B arithmetic,
worktree-hash-on-tracked (autocrlf), gated-token quoting + bare-token
scans, C4 over-broad unexecuted scan, carried-content pin missing,
re-issue without reset precondition, 10-vs-11 path prose count.
Device gate (3): Slot array-style crash, search close (impure
updater), Log Session label in circle. Architect self-catches /
output comparisons (8): Hangul byte, v1-supersession claim, fabricated
%B pin (#9), hand-counted heredoc line count, fabricated blob pin
(#17, same class as #9 post-countermeasure), miscounted edit-script
assertion, wrong-baseline uniqueness check, "10 files" inventory
propagation. Gravest: #18 -- push authorization written around a sha
never observed (report content not visible; authorized anyway).
Content was verified end-to-end by independent clone fetch; the
authorization sentence was the only broken link.

## Promotion candidates for CLAUDE.md (ratify next session)

1. Hash-channel arithmetic, per channel, explicit: worktree sha256 =
   first placement only; tracked-file verification = staged/committed
   blob only; %B pin = message bytes + one appended newline.
2. Expected values in prompts are inserted by SUBSTITUTION from
   computed variables, never typed -- no exceptions, including
   one-line fix prompts (#9 and #17 prove the exception is the hole).
3. Authorizations QUOTE, never state: the authorized sha is pasted
   from the report's F1 line; if F1 is not visible verbatim, no
   authorization is written. The operator's push line (old..new) is
   compared against the authorization as a named step.
4. Deletion gates use `git ls-tree HEAD -- <path>` (empty = deleted),
   never worktree ls.
5. Executed-before-shipping applies to the TRUE precondition baseline
   (the state the implementer will hold), not HEAD and not the
   architect's post-edit tree.
6. Re-issued build prompts carry a reset precondition naming exactly
   what they replace (the 4a-2 form).
7. Prompts that amend the doc they implement instruct read-the-doc
   POST-apply (implementer observation, slice 6).

## Standing notes

- Per-step device verdicts remain the ratified rule; this session
  accepted two aggregates (recorded as such in commit bodies) and
  photographic evidence twice (superior; encourage).
- The floating gray/blue gear in gate screenshots is the Expo
  dev-client menu bubble, not app UI.
- Re-parse stays banked (design doc non-goal). Insights content is
  slice 7 (aggregation lib first, Jest-gated, then UI + counter view
  sans brightness). Slice 8 is the D143 native rebuild (expo-haptics,
  expo-brightness), last by design, operator EAS build required.
- adjustsFontSizeToFit on survey chips is iOS-reliable only; the
  gated platform. Android remains explicitly unconfirmed.
- The architect's clone workflow (public repo) is the standing
  rhythm: author, test, hash, ship patches; verify origin after push.
