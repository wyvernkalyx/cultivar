# Session handoff -- written 2026-09-02. Read this before touching anything.

Two arcs ruled, three commits shipped and pushed, zero errors reached
origin. The web promotion is real: D164 slice 2 is live at HEAD and
the operator imports COAs from a desktop browser now.

## Shipped (all on origin, each two-channel verified)

1. e0b7c4e3 docs: process corrections -- [ADAPT] Jest 179/5, the Deno
   standing form (invocation + cwd + flag), five standing forms
   promoted into CLAUDE.md, cwd-reset banked in follow-ups.md.
2. 6ad0cd9f docs: confirm-dialog design -- D164 rulings a-g,
   operator-ratified 2026-09-01, status line records it.
3. d19ff387 feat: appAlert + D88 in-modal arm (D164 slice 2) --
   device- and browser-gated, per-step verdicts, MCP read-backs on
   prediction.

## Operator rulings this session (verbatim where short)

- Web promotion: option 1, dialog-first, two arcs.
- "1" on public web: kalyxjournal.com becomes a real surface (land,
  log in, profile, import) -- overturns two D163 non-goals by
  operator authority; recorded in the D164 doc. Arc B doc owed.
- D164 a-g: "ratified a-g and saved the file".
- Device gate step 6 (corrected-report tap): "waive".
- Architect direct repo reads (fresh clone per session): "Yes! please".
- cwd-reset DECIDE: defaulted to bank after four unanswered asks;
  trigger armed in follow-ups.md line 14.

## Phase A predictions -- verify against the live repo before any work

1. origin/main HEAD carries this handoff; parent is
   d19ff387ed87632ac06fd17a2ca68196d0e33bda (feat, D164 slice 2),
   then 6ad0cd9f9b6dbd175b4c54e0631917d99e23bd31,
   e0b7c4e3cfb8a58c0fb58adae2af7b8852aa5c33,
   17423abb394fbb59f86402c6d3be7dcfd16b820c.
2. `grep -rn 'Alert\.alert(' src/ | wc -l` -> 20 across 7 files:
   app-alert.tsx 1 (the passthrough), src/app/index.tsx 5,
   coa-detail.tsx 6, coa-retire.ts 4, coa-restock.ts 2,
   session-ladder.tsx 1, shelf-card.tsx 1. Grep exit 0, captured
   un-piped.
3. Jest: 179 tests / 5 suites, exit 0. Lint: exactly one error
   (react-hooks/set-state-in-effect, use-color-scheme.web.ts), 0
   warnings, exit 1.
4. Deno (implementer or operator machine only; jsr is unreachable
   from the architect container): `deno test --allow-read
   ingest-coa/` with cwd `supabase/functions/` -> ok | 20 passed | 0
   failed, exit 0. Both halves of the invocation are load-bearing
   (CLAUDE.md [ADAPT]).
5. Blob pins at HEAD (git show <rev>:<path> | tr -d '\r' |
   sha256sum): CLAUDE.md 487 lines,
   3f5ed11950ddda858436036698bc0137e53478b160e6b80c441232e23ff6e600;
   documentation/design/confirm-dialog.md 103 lines,
   20c0dc51f152028516ff4114cd77f42b680abdabbcd58b876017b2c767f739c4;
   documentation/follow-ups.md 14 lines,
   fb13605f39bd2918aa37375d0c5c1dfca462ad8bea90869d319d132c32ae5d63;
   src/lib/app-alert.tsx 181 lines,
   35c5ae2d56346e40ac66457a5b9386b5501e48b42e545c657eec151df1d3627b.
6. MCP (project zmmlgatxckplfzqyexjb): coas 19, coa_restocks 6,
   coa_retirements 20; newest restock 2026-09-02 targets Cosmic
   Cereal, whose on_shelf_count is 1. Sherbadelic on_shelf 1, White
   Choc Chip 0, Fuel Pump 1 (the carried "Fuel Pump remains 0" claim
   was stale this session; re-observe, never trust carried counts).
7. Operator worktree standing noise: `git status --porcelain` is the
   SET {?? .claude/settings.local.json, ?? .claude/skills/}. Not
   silent. Every status expectation names this noise or STOPs
   spuriously.
8. Operator .env key probe (operator-run):
   curl auth/v1/settings with the anon key -> external-providers
   JSON, not a 401.
9. The D88 arm renders in-sheet on iPhone and web; the manual-entry
   duplicate path renders it too (implementer catch, slice-2 build
   report 5.2, now in the commit body of d19ff387).

## Queue, in ruled order

1. D164 slice 3: mechanical appAlert swap in the six remaining files
   (19 sites). Gates per ruling e (regression device pass, browser
   retire-flow + one error path); end-state absence gate per ruling f
   (`Alert.alert(` in src/ reaches exactly 1, live-target control).
   Precondition: prediction 2 above holds.
2. Arc B design doc (D165 candidate): the public web surface. Must
   answer, with operator input: what "profile" shows; age-gate
   positioning in front of a public login (attestation copy is
   ratified, statement_version 1); Cloudflare deploy mechanics (the
   MCP connector is read-only -- it cannot deploy; path unknown);
   the nested-button web hardening (prediction: shelf-card.tsx line
   274 card Pressable with nested button-role Pressables, console
   error observed 2026-09-02, pre-exists slice 2); expo web output
   is static per app.json.
3. Age-gate UI arc -- likely now a dependency of Arc B; sequencing
   DECIDE for the operator.
4. History segment search/filter (banked).
5. Wordmark token canonicalization; icon display name and
   camera-permission dialog observation at next EAS dev build
   (carried).

## Error ledger

Architect: 7. (1) P2 pin-form misread, self-caught same batch; (2)
vacuous pipeline exit capture, self-caught; (3) invented Deno
invocation -- corrected twice, promoted to CLAUDE.md in e0b7c4e3;
(4) unobserved status-set expectation in a shipped prompt,
implementer-caught; (5) stale spike-era "two Alert sites" claim in a
draft doc, self-caught by control sweep pre-ratification; (6)
ratified-in-chat rulings shipped in a carrier still marked pending,
implementer-caught; (7) gate-4.1 arithmetic contradicting gate 4.2
plus no STOP clause on gate 4, implementer-caught.
Implementer: 0 errors, 4 credited catches (the two STOPs above, the
gate arithmetic, and the manual-entry duplicate-path design hazard),
2 correct STOPs executed to the ratified read-only-diagnose form.
Errors reaching origin: 0.

## Findings bank (rulings owed, promotion candidates)

- gitignore the two .claude/ paths? Operator DECIDE; own Tier 1
  commit if yes.
- handoff-specs 4.3 says commit-prompt status is "silent" -- refuted
  by the standing noise; amend when handoff-specs is next touched.
- Ratification-in-chat must trigger a bytes amendment before any
  carrier ships. Happened once, caught once (error 6). Promote to
  CLAUDE.md if it recurs.
- Web-E2E harness (Playwright + MCP read-backs) as a candidate arc
  after Arc B -- operator wish 2026-09-02, browser gates are already
  script-shaped; the iPhone gate stays human (Windows, no simulator).
- A spike doc's observed-surface corrections are snapshots of its
  own HEAD. Re-sweep at current HEAD before authoring any doc that
  carries them (lesson of error 5).
- Deno count line now lives in CLAUDE.md [ADAPT] with invocation,
  cwd, and flag attached, because a count without its command is
  meaningless (two observed failure classes from the omissions).

## How to open the next session

Phase A against the nine predictions, in order, architect clone
first, MCP sixth, operator probe eighth. Then queue item 1. The
slice-3 prompt should carry prediction 2 as its surface
precondition and the per-file enumeration as its gate table.
