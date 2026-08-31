# Session Handoff

Written 2026-08-30/31, at the close of the restock session (crossed
midnight once). Repo is authoritative over every claim here; Phase A
verifies before any work begins.

## State at close

HEAD at close: the commit carrying this file, riding on 8817e837
(feat: restock UI). Sync was 0 0 after every push; three pushes this
session, all ref-scoped, Tier 2 two-channel.

Shipped end-to-end -- the restock arc, D159-D160.4, complete:
- Schema 96677f3e: coa_restocks + restock_coa RPC, migration
  20260825000001 (re-authored; the ba5625bf carrier was unrecoverable
  and its pin retired). Applied, MCP-gated: prosecdef f, two policies,
  paired probes rolled back, non-owner 42501, cap held at 1.
- Docs 1ec20528: D160.1 (web dialog is a separate arc; Android drops
  buttons past three, recorded from installed source), D160.2
  (overflow entry, tap acts), D160.3 (terminal phase, button first).
- UI 8817e837: one client module (coa-restock.ts, retire form), card
  overflow entry mirrored on the retire prop-omission scoping, fourth
  D88 outcome gated on every-match-off-shelf, restocked terminal
  phase. D160.4 ruled AT the device gate: the detail-sheet row failed
  operator review at first render (one-tap writer, scrolling sheet,
  no confirm) and was withdrawn; coa-detail.tsx shipped untouched,
  proven by blob id at HEAD = parent. v1 was gated on-device, v2 is
  v1 minus that surface plus the docs, one commit.
- Device gate, evidence not verdicts: 5 restock events in the table
  (Fuel Pump x2 -- card and fourth-button; Sherbadelic x2; White Choc
  Chip x1 on the v2 build), coas count NEVER moved off 19, control
  screenshot (three buttons on-shelf), detail first-render screenshot
  (which produced D160.4). Cap no-op is UI-unreachable by
  construction; it stays MCP-gated. Modal-terminal screenshot waived
  by operator (layout clones the shipped acknowledge arm).

Also this session, unplanned:
- Phone sign-in was dead: "Unregistered API key" -- the publishable
  key on disk had died with the 08-29 rotation. The prior handoff's
  "app proven working under it" was true of the WEB surface only; I
  carried it wider than its evidence. Fresh publishable key from the
  dashboard, curl /auth/v1/settings as the acceptance gate, phone
  signs in. The curl-with-sourced-.env form is the standing key probe.
- Operator data note: Sherbadelic and White Choc Chip were left
  on-shelf by gate testing; operator was asked to retire what he does
  not hold. Unverified at close -- first MCP read next session says.

## Standing forms adopted (bank for the CLAUDE.md touch)
- CR census: od -An -tx1 -v <f> | tr -s ' ' '\n' | grep -c '^0d'
  (the od -c | grep '\r' form is vacuous through the implementer's
  tool shell -- counts the letter r).
- Files git itself creates or edits arrive CRLF under the operator's
  autocrlf; worktree sha256 pins are valid ONLY for files the operator
  places directly. Everything else pins as a blob id
  (git hash-object --path / ls-files -s / ls-tree -r) or LF-normalized.
- ls-tree gates use -r with explicit file paths; without -r a
  directory collapses to one tree line and the gate goes vacuous.
- Status expectations are SETS, not sequences.
- "See Cultivar deltas" in the required header resolves to
  handoff-specs section 3; list handoff-specs in the read list.

## Error ledger
Architect: 8 named. Contained before any artifact: fabricated column
name (product_name), uuid prefix as uuid, fabricated 48 hex chars of a
doc hash (self-caught on re-read -- the no-fabrication class, worth
the name). Reaching prompts: vacuous CR criterion; worktree-sha pin
for a git-created file; self-contradictory precondition (expected set
omitted the carrier the next block required); false worktree-LF
assumption (fallback held in-prompt); non-recursive ls-tree gate.
Implementer: 0 errors, 5 credited catches, including the wrong-path
carrier STOP (documentation/ vs documentation/design/) and the
read-only-diagnose-then-report pattern, now ratified narrowly: on a
mismatch, diagnosis may continue only through read-only steps, the
mismatch reported first, never a write.
Operator collapsed verdicts ("everything worked") were twice unpacked
by MCP read-backs that showed half the gate unrun; the read-back is
the arbiter, keep it.

## Queue (ruled order)
1. CLAUDE.md corrections commit (Tier 1, now fat): stale [ADAPT] test
   counts (179/5, 20 Deno), the refuted cwd-reset bullet AND the same
   claim in handoff-specs 4.3 grounds, plus every standing form above.
2. Web-importer promotion DECIDE (spike doc findings are in the repo;
   D160.1 made the web dialog arc contingent on this ruling).
3. Age-gate UI slice (copy locked, statement_version 1).
4. NEW, banked from operator: search/filter reach into the History
   segment -- check filterQuery scoping in shelf-list.tsx first, it
   may already cover it.
5. Wordmark token canonicalization (three-site divergence, pending).

## Falsifiable predictions for Phase A
1. origin/main is the commit carrying this file; its parent is
   8817e837a85ec21b1f5fcb53843faf3a4cd3183c, parent's parent
   1ec2052878e7a8848ee69b8fe5635547396639e3.
2. Migrations dir: 21 name-form files; 20260825000001 present, blob
   004b13a7... at HEAD.
3. Jest 179/5 exit 0; lint 1 error exit 1 (use-color-scheme.web.ts).
4. coa_restocks has >= 5 rows; coas count is 19; Fuel Pump
   (f2503fc3) on_shelf_count 1 with >= 10 sessions.
5. Sherbadelic (8aaf506c) and White Choc Chip (95c56b6f) counts are 0
   if the operator did the truth-check retire, else 1 -- whichever is
   observed, record it, no defending.
6. restock.md is 169 lines, 4 D160.x headings, blob 15b48af1 at HEAD.
7. coa-detail.tsx blob at HEAD is f9c0dfd34ed3e542bfba60130f48ac12f9f9a28d.
8. grep -c restock src/components/coa-detail.tsx returns 0, exit 1.
9. The operator's .env key probe (curl /auth/v1/settings with sourced
   .env) returns the external-providers JSON, not a 401.

## Capability notes (architect side, verified this session)
The architect container clones the public repo, runs npm ci / Jest /
tsc / expo lint (tsc shows a spurious TS2882 on @/global.css on clean
HEAD there -- environmental, absent on the operator machine), applies
and emits patches, and reaches the DB through Supabase MCP. Deno tests
are NOT runnable there (jsr unreachable). The "no repo access" line in
the project instructions is refuted by observation; the handoff, not
that line, is the accurate account.
