# SESSION_HANDOFF -- written 2026-07-25 against pushed HEAD `c2309f3`

The repo is authoritative over this document. Begin with a read-only
Phase A audit (`bash scripts/session-audit.sh`, Git Bash only -- the
script was extended this session, sections [1]-[19]) and try to break
every claim below before doing anything else.

This file supersedes the handoff committed at `ff0c4d5`.

## Preamble -- refutations and lessons

1. **The architect designed D86 against a false premise, and it was
   ratified before the refutation.** The carried "panels" screen was
   the pre-D82 layout; the repo has two sequenced panel phases before
   closing. The Phase A diagnostic caught it before any code moved;
   D86.6 is the correcting record, ledger held verbatim. Standing form:
   **a design pass over UI structure requires an observed-structure
   diagnostic first** -- the pasted-blob precondition generalizes from
   doc edits to code structure.
2. **The read-back prediction was mechanically naive**: 181/252
   predicted, 187/258 observed. The client inserts per answer, and the
   contrary evidence (the checkbox gate's own 143 -> 169) was in
   context and unused. Row predictions are relative AND per-answer.
3. The architect predicted a clean tree for the audit-script gate run
   while gating a worktree edit; [4] correctly showed the edit.
4. An ASCII gate shipped once without its dirty control (the exact
   unpaired-protected-case shape the handbook bans); the implementer
   ran the control unprompted. Every subsequent gate shipped
   control-paired, control first, same shell.
5. A bare-token `pageSheet` count predicted 1, observed 5 -- the
   prompt's own comments tripped it. Discriminating-forms failure,
   again authored by the rule's author.
6. A criterion's "in DOUBLE quotes" was ambiguous; the implementer
   resolved it correctly from the criterion's own 1-per-file spec.
7. **Paste truncation, twice in one day**: a diff's final closing
   quote; a blob's final period. The tail-check form (promotion
   candidate 1 below) was applied twice thereafter -- one catch, one
   clean pass.
8. **The implementer twice wrote "the diff is in the tool output
   above" instead of pasting it** -- blocked both times. Promotion
   candidate 3.
9. The architect's project-knowledge CLAUDE.md copy was stale a third
   consecutive session (still carries the retired 36-passed wording).
10. Credited implementer calls: the unprompted ASCII-gate control run;
    `od -c` and `git show HEAD:` byte checks of the U+2713 literal in
    worktree and committed blob; proceed-and-flag on a wrong
    final-line pointer; flagging the D86 design-vs-repo seam rather
    than adapting; resolving the sheet-reset lint collision and
    disclosing that the invariant now rests on Modal-covers-pills plus
    the inFlight binding; disclosing V4 output filtering.

## Start here (Phase A, read-only) -- every line is a falsifiable prediction

| check | expected |
|---|---|
| branch | `main` |
| HEAD | a `docs:` commit, subject `docs: session handoff at c2309f3`, parent `c2309f3`. Below it, newest first: `c2309f3`, `5751450`, `de41390`, `b70b07a`, `ff0c4d5`, `f72739e`, `37c4796`. |
| `git rev-list --left-right --count origin/main...HEAD` | `0	0` after the operator pushes the handoff commit. |
| `git status --short` | clean. Under `--ignored`, six `!!` lines (observed this session): `.env`, `.expo/`, `audit.txt`, `expo-env.d.ts`, `node_modules/`, `supabase/.temp/`. |
| script [16] migrations | `7`, exit 0; newest `20260724163428_rename_spark_main_goal_d85.sql`. |
| script [17] | `6:export const LEXICON_VERSION = 3;` exit 0; spark `(none)` exit 1; main_goal `22` exit 0 -- the 22 is PREDICTED post-D86 (the build touched the file; no hunk adds the token); re-baseline on first run. |
| script [18] | checkMark `2` exit 0; checkGlyph `0` exit 1; u2713 `0` exit 1 (D86 added `Info` as ASCII text and no check glyph). |
| tests | `npm test` -> 52 passed (NEVER `npx jest`). tsc exit 0; expo lint 1 error 0 warnings exit 1 (the script now prints both exit codes). Deno 5 passed -- observed at this session's open and NOT re-run after the D86 build (the build touched no supabase/ path). |
| client, D86 | `grep -n "export const GLOSSARY" src/lib/lexicon.ts` -> one hit at :70; 27 entries partitioned 5/4/3/4/3/3/5. `grep -c "pageSheet" src/components/session-ladder.tsx` -> `5` exit 0 -- ONE code occurrence plus four comments; the count is 5, the property is one code site (refutation 5). `disabled={inFlight}` at the four PillScreen call sites (:974, :1000, :1021, :1050 at c2309f3). `grep -rn -i "glossary" src/` now HITS -- no longer an absence gate. |
| Supabase, observed at close | `session_entries` rows 187, max entry_no 258, newest `lexicon_version=3` (growth is per-answer operator usage); view grants 8 rows x priv_count 7 (anon ALL wart carried, tightening banked); IN-list (`main_goal`,`spark`) -> exactly `main_goal`; six tables `rowsecurity=t`; 9 policies, `session_entries` exactly INSERT+SELECT; both views `security_invoker=true`; newest `coas` row Rainbow Runtz `S01-RARU` (re-observed this session). |
| MCP connector | LIVE this session after a third disconnect/reconnect; cause unobserved. Retry skeptically at open; the operator paste channel remains the documented fallback and the `[19]` manual block stands. |

If any of these don't match, the repo wins -- re-baseline before
proceeding.

## What shipped (newest first)

- (this handoff commit) -- the write-last close, no code.
- `c2309f3` -- **feat:** D86 glossary tap-surface. GLOSSARY in
  lexicon.ts (27 entries verbatim from glossary.md); Info trigger in the
  shared header, structurally absent on closing; read-only pageSheet
  Modal per phase; no new dependency, no database path. Device-gated:
  seven sheets character-identical with screenshots, pull-down,
  selection integrity, in-flight disabling verified by observed binding,
  full walk read back over the live connector (252-258, all v3),
  seventh consecutive clean freeze-watch walk.
- `5751450` -- **docs:** D86.6 erratum (seven triggers, per-phase
  sheets, partition 5/4/3/4/3/3/5) + D86.7 (Modal mechanism, GLOSSARY
  shape) after the diagnostic refuted the design premise.
- `de41390` -- **docs:** D86 design (four operator rulings): per-screen
  trigger, screen-scoped read-only sheet, verbatim content rule,
  v3-only scope.
- `b70b07a` -- **chore:** audit script extended to cover the Phase A
  table: `run_status` helper (exit codes; SIGABRT 134 distinguishable
  from a zero-hit), deno_check/expo_lint exits, sections [16]-[18],
  manual block renumbered [19] with the grants and IN-list queries.

Four pushes observed this session, each closing to `0	0`:
`ff0c4d5..b70b07a`, `b70b07a..de41390`, `de41390..5751450`,
`5751450..c2309f3`, plus (this handoff, predicted)
`c2309f3..<handoff sha>`.

## The arc

Phase A closed 24/24 with zero handoff refutations -- including, for
the first time, the Supabase set run live by the architect over the
revived MCP connector. The audit-script entry point landed with its
patterns tested in the architect's own sandbox before shipping. The
D86 arc then ran the method at full depth: design ratified, refuted by
its own read-only diagnostic before any code moved, corrected by
erratum with the ledger held verbatim, built with the 27 definitions
verified character-by-character in the architect's channel, and
device-gated with a live-connector read-back. The session's protocol
product is refutation 1: carried structural memory is as dangerous in a
design pass as a stale blob is in a doc edit, and the same
precondition -- observe first -- closes both.

## Ratified decisions

- **D86** (four explicit rulings) and **Option B -> D86.6**; **D86.7**
  records the architect-decided mechanism.
- **run_status** as the audit script's exit-printing helper.
- **The freeze defect stands at seven consecutive clean gated walks**;
  closure is a banked operator question, not assumed.

## Promotion candidates (three, ready for pass #3)

1. **Tail-check form**: never anchor a criterion or append on a pasted
   blob's final line without `tail -1 <file> | cat -A` first. Two
   proofs: one caught a real truncation, one confirmed clean.
2. **ASCII gate form**: `git log -1 --format=%B | LC_ALL=C grep -n
   '[^ -~]'` WITH its dirty control (`printf 'ctl \xe2\x80\x94\n' |
   ...`), control first, same shell; an untripped control voids the
   gate. Control-proven four times this session across two machines.
3. **Report form**: the diff is pasted in the report, never referenced
   as "in the tool output above." Two violations, both blocked.

## Open items

**Entry point (runnable now)**
- **Promotion pass #3** (one `docs:` commit to CLAUDE.md): the three
  candidates above. Precondition, non-negotiable: authored only against
  a pasted `git show HEAD:CLAUDE.md` blob (refutation 9; three
  consecutive stale-copy sessions).

**Banked (prioritized; carried unless noted)**
1. **anon-grants tightening** on both views (its own decided slice) --
   next after the entry point.
2. **errorBadge twin** (inherited lineHeight, milder; gate requires
   provoking the banner on device).
3. **Freeze closure question** at seven clean walks -- operator ruling.
4. **Reanimated-posture audit section** -- the fold-in question was
   asked and never answered; carried as banked.
5. **Audit [17] main_goal re-baseline** (predicted 22 post-D86,
   unobserved) and a candidate **glossary-verbatim script section**
   (GLOSSARY vs glossary.md identity is currently gated only at build
   time).
6. **grep-SIGABRT characterization** (exit 134 class; `run_status` now
   makes it visible wherever it fires).
7. Survey copy review (v3 helper copy under Main Goal; error banner;
   "Overall" sweep; closing copy).
8. Live `Tested`-branch observation (opportunistic).
9. COA PDF persistence in Supabase Storage (backfill demand stands).
10. Section 8A `Relaxed` collision (effects slice inherits knowingly).
11. Carried untouched: glossary-adjacent doc consolidation; COA age as
    a personal signal; axis deselection-to-null; G11; G12;
    `formatIsoDate` duplication; "Expo Starter" branding; detail
    read/edit; home-zone parking; shelf sort-by-band; license
    extraction + NY OCM import; haptics; Resend domain verification;
    quadrant/intent-lens/confound discounting; anchor-collision
    residual (D69); `auth-resp.json` at the repo parent.

**Closed this session**: glossary tap-surface (was bank item 1 --
designed, corrected, built, gated, shipped in one session); Supabase
RLS/policies/invoker re-observation (was bank item 10); the MCP
connector blocked item (live; cause of revival unobserved).

## Working rhythm

Stable method lives in CLAUDE.md and handoff-specs.md. In flux this
session, adopted: ASCII gates ship control-paired or not at all;
final-line anchors require the tail-check; the architect tests
instrument patterns (helpers, pipefail forms, exit capture) in its own
sandbox before shipping them in prompts; design passes over UI
structure open with an observed-structure diagnostic; the architect
runs Supabase read-backs directly over the connector when it is live,
with the paste channel as standing fallback.

## Entry point

**Promotion pass #3.** One `docs:` commit to CLAUDE.md landing the
three candidates, authored against a pasted blob. Then the anon-grants
tightening slice (bank item 1). Not a menu: absent an operator
redirect, this is the move.
