# SESSION_HANDOFF

Status: WRITE-LAST. Committed as this session's final act, 2026-08-10.
HEAD at write time is 7301e617 (slice 7b-ii); this commit rides on top.

## Preamble -- argue against yourself first

Carried context lost an entire arc this session: the architect's memory
opened naming "search (client-side filter)" as the entry point and knew
nothing of the design overhaul. The handoff caught it. Trust this file
and the repo; treat every remembered number as stale until re-measured.
Concrete refutation from this session: the handbook's "52-test suite"
was re-measured at 136 before slice 7a and stands at 161 now -- the
recorded number was not just stale but load-bearing-wrong, and only the
baseline run caught it. DB pins go stale by DESIGN on live-use tables:
the operator logs real sessions between sessions. Pin structure and
invariants; re-verify per-target counts at gate time, which is what
saved the slice-6 walk.

## Entry point

D143 -- the design overhaul's last slice: manifests (`chore:`),
operator EAS rebuild, then haptics + brightness (`feat:`, device gate).
The Counter view ships today WITHOUT brightness copy because the claim
would be false until this slice lands it. Before any further delete
ships anywhere: the coa_retirements cascade ruling (below).

## State at close (all verified at origin)

- At write time origin/main = 7301e6176c89881883be552876ed29a9a47ee91d
  (verified); this handoff commit rides on top and is pushed as the
  session's final act. At next open expect origin/main = the handoff
  commit, sync 0 0.
- This session's commits, oldest first:
  00a9dcc7 feat: COA detail v2 (slice 6, gear/rename/named delete confirm)
  2cf89f6c chore: extend Jest discovery to src/lib/insights
  0edc9edc feat: D142 Insights aggregation library (slice 7a)
  afef6476 feat: D142 library extension for the Insights UI (slice 7b-i)
  7301e617 feat: D142 Insights tab and Counter view (slice 7b-ii)
- Worktree at close: clean except seven untracked
  reference/handoff/0N-screens.png (operator gate screenshots, kept
  untracked on standing ruling) plus local dev config
  (.claude/settings.local.json, .claude/skills/), never staged per
  [ADAPT] item 5.
- Jest: 161 tests / 3 suites (parser, discovery canary, insights).
  npm test only, never bare npx jest. Lint baseline: exactly 1 error,
  template src/hooks/use-color-scheme.web.ts. tsc: 0 errors.
- DB at close (MCP read, stale on arrival by design): coas 15,
  possession {0:13, 1:2}, retirements 16, session_entries 90,
  session_current 4 (3 Loved, 1 Neutral). No favorite=true rows.

## The accident record (durable also in 00a9dcc's body)

During the slice-6 gate, three COAs were deleted where one was
intended: Gregg's Flower (intended), Mule Fuel (2 real sessions
destroyed), Stank Breath. One coa_retirements row was destroyed by the
coa_id CASCADE -- proving the "append-only" table is append-only at the
policy surface and not through the cascade path. Operator ruling 3:
losses accepted, no restore. The identity echo in the delete confirm
(names strain + brand) shipped as the countermeasure, ratified after
the accidents.

## Ruling owed next session (blocking further delete work)

coa_retirements.coa_id ON DELETE behavior: restrict (delete blocked
while retirement history exists) vs cascade-by-design (record the
ground) vs orphan-preserving redesign. Evidence: retirements 17 -> 16
during the accidents. Migration tier if restrict is chosen.

## Standing rules earned this session (promote to CLAUDE.md next pass)

1. Prompt-carried file bodies are ALWAYS inline in the prompt --
   never "assembled" by the operator from chat history, never
   referenced as arriving separately. Two violations this session,
   both caught by implementer STOP.
2. Carried bodies use DECODED characters only. The implementer cannot
   reliably emit backslash-u escape sequences (transcription, not
   tooling -- its own correction); source files may carry raw UTF-8.
   The commit-message ASCII gate governs messages, not source.
3. Bodies the editor tool cannot emit (backslash-u escapes) travel
   as operator-run quoted heredocs, hash-gated, implementer-verified.
   ASCII and decoded-unicode bodies go inline through the implementer
   prompt regardless of size. The operator terminal has its own paste
   length limit (hit 2026-08-10) -- heredocs are the fallback channel,
   not the default.
4. npx expo lint runs in the architect's clone before any UI bytes
   ship -- alongside tsc and the suite. One lint-gate failure shipped
   this session because the architect skipped it.
5. Narrowing/scope claims in prompts are verified in the target scope,
   not a neighboring one (the confirmDelete TS18047 STOP).
6. Commit-prompt preconditions must pin the pre-commit state (HEAD +
   status); a replayed commit prompt was refused cleanly by exactly
   those preconditions. Keep them discriminating.

## CLAUDE.md corrections owed (exact text, promotion is mechanical)

[ADAPT] item 1: replace the 52-test claim and the blanket "a test
under src/ is silently never run" with: "161 tests / 3 suites as of
2026-08-10. Jest roots cover the parser tree AND src/lib/insights
(pure TS only, no RN/Expo imports; discovery canary guards the
wiring). A test anywhere else under src/ is still silently never run."

## Banked follow-ups (no urgency order)

- Counter/Share parity structurally enforced: Counter consumes a
  library-composed fact line instead of composing its own (7301e617).
- CoaDetail docblock still describes the confirm as count-only.
- Confusable same-name rows (two Permanent Shades, two Animal Faces):
  a disambiguation cue on list rows; a wrong-row open happened even
  with the identity echo downstream.
- Delete-confirm UX watch: if accidents recur under the named copy,
  candidates are type-to-confirm on session-bearing rows or Retire
  promoted over Delete.
- App rename collision-check (Cultivar shortlist) still open.

## Unexercised arms, carried honestly

Populated buy-again and populated avoid profile (no qualifying rows
exist; they populate with real use -- first retirement answering Yes,
first Disliked/Hated session). The all-ND fact line. The null-strain
confirm and share fallbacks. All code-read-verified only.

## Refutation ledger, this session

Architect errors: 5 (confirmDelete narrowing claim; carried-content
placeholder; assembly-by-proxy repeat; unexecuted lint gate; handoff
authored at repo root against the canonical documentation/ path). All
caught pre-origin -- three by implementer STOP, one by the lint gate
the implementer enforced. Implementer self-correction: its commit-body
claim "editor decodes escapes" was wrong mechanism (it decoded during
transcription); rule unchanged, cause corrected here since the message
is immutable. Operator verdict corrected by DB once ("4e passed" vs
three deletions). One implementer protocol deviation, correct in
outcome: it resolved the handoff-path contradiction and proceeded
where the rule says STOP -- outcome accepted, precedent not. Zero
errors reached origin.
