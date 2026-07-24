# SESSION_HANDOFF -- written 2026-07-24 against pushed HEAD `f72739e`

The repo is authoritative over this document. Begin with a read-only
Phase A audit (`bash scripts/session-audit.sh`, Git Bash only) and try
to break every claim below before doing anything else.

This file supersedes the handoff committed at `82437d0`.

## Preamble -- refutations and lessons

1. **The architect committed a prediction as an observation, into
   permanent history.** The checkbox commit body was authored with
   "clean on both panel screens" before any panel-2 observation
   existed, sequenced behind a "send only after" condition in chat that
   nothing enforced. The implementer flagged it post-commit; the body
   was amended pre-push to claim only observed state; the panel-2
   visual pass arrived afterward and made the original claim true --
   which is luck, not process. Standing form: **a commit body's gate
   claims are written from pasted verdicts only.** If the verdict is
   not in the architect's channel, the body says less.
2. **A conditional fork shipped to the operator channel and both
   branches executed** -- an amend prompt ran even though its
   triggering condition (a failed panel-2 verdict) never obtained.
   Cost benign only because the amended body strictly underclaims.
   Operator blocks carry no decisions; forks resolve in the architect
   channel before anything ships.
3. **Architect carried copies are stale -- second consecutive
   session.** The architect's project-knowledge CLAUDE.md predated
   `3182393`. Promoted from lesson to standing assumption: doc-editing
   prompts are authored only against a pasted `git show HEAD:<path>`
   blob; the paste is a precondition, not a courtesy.
4. **Four architect instrument defects, one genus** (commands and
   criteria untested against what runs them): (a) a bare-token
   `reanimated` grep tripped on `expo.autolinking.exclude` config --
   the exact malformed class the discriminating-forms rule bans,
   authored by the rule's author; (b) the exclude key was asserted as
   `expo.install.exclude` -- it is `expo.autolinking.exclude`
   (package.json:58); (c) a precondition anchor beginning with `-` was
   issued without the `-e` form and `grep -F` aborted exit 2 -- the
   implementer repaired with `-e` (credited, not a violation);
   (d) stat/status criteria were written as exact-output while
   autocrlf emits a `warning: LF will be replaced by CRLF` line first
   on touched files. Criterion form: **the numbers line matches, never
   exact output.**
5. **A doc pointer was wrong**: a prompt sent the reader to
   session-logging.md for the D83 block; D83 lives in
   art-direction.md (:174-178). The implementer proceeded rather than
   STOPping -- correct, since the block existed and was findable; the
   pointer was wrong, not reality.
6. **Bank item 1 carried a false label for two sessions**: the
   checkbox is a D82.1 (grammar) / D83 (treatment) surface. D78 gave
   the panels toggle semantics only. "Still broken" also implied a
   prior fix; none ever existed -- no lineHeight was ever authored.
7. **grep SIGABRT recurred on the implementer's machine** (multi `-e`
   case-insensitive pattern against art-direction.md, exit 134);
   ripgrep fallback used. Banked, not promoted -- uncertainty banks.
8. **The implementer fabricated nothing** and made six credited calls:
   `git log -S` verification of a commit-body historical claim before
   committing it; the `-e` instrument repair; declining an unnamed
   comment edit; declining unjustified geometry tuning; the gate-claim
   flag (refutation 1); an unprompted tree-sha invariance proof across
   the amend (`5d926c1` before and after).

## Start here (Phase A, read-only) -- every line is a falsifiable prediction

| check | expected |
|---|---|
| branch | `main` |
| HEAD | a `docs:` commit, subject `docs: session handoff at f72739e`, parent `f72739e`. Below it, newest first: `f72739e`, `37c4796`, `82437d0`, `b94bb21`, `9336f54`, `ef67af5`, `0250988`. |
| `git rev-list --left-right --count origin/main...HEAD` | `0	0` after the operator pushes the handoff commit. |
| `git status --short` | clean. Under `--ignored`, six `!!` lines (observed this session): `.env`, `.expo/`, `audit.txt`, `expo-env.d.ts`, `node_modules/`, `supabase/.temp/`. |
| migrations | `ls supabase/migrations/ \| grep -Ec '^[0-9]{14}_'` -> `7`; newest `20260724163428_rename_spark_main_goal_d85.sql`. |
| tests | `npm test` -> 52 passed (NEVER `npx jest`; it drops the vm-modules flag). Deno 5 passed (observed at this session's open, not re-run since). |
| `npx tsc --noEmit` | exit 0 |
| `npx expo lint` | 1 error, 0 warnings (template baseline), exit 1 |
| Supabase, observed this session | view grants 8 rows x priv_count 7 (anon ALL is the recorded wart; tightening banked); `session_entries` two-name IN-list (`main_goal`,`spark`) -> exactly `main_goal`; rows >= 169 (169 at close; growth is operator usage); newest at close entry_no 240, `lexicon_version=3`. |
| Supabase, carried NOT re-observed this session | six tables `rowsecurity=t`; 9 policies, `session_entries` exactly INSERT + SELECT; both views `security_invoker=true`. Last observed in the `b94bb21` session. Re-observe via the `[16]` block -- which still lacks the grants and IN-list queries (entry point). |
| newest `coas` row | Rainbow Runtz `S01-RARU`, now carried two sessions unobserved (no ingest). |
| client | `src/lib/lexicon.ts:6` `LEXICON_VERSION = 3`; `grep -rn -i "spark" src/` -> no output, exit 1; `grep -c "main_goal" src/components/session-ladder.tsx` -> 22 (observed pre-fix; the checkbox diff touched no main_goal line). |
| checkbox fix | `grep -c "checkMark" src/components/session-ladder.tsx; echo "exit: $?"` -> 2, exit 0; same form for `checkGlyph` -> 0, exit 1; for the U+2713 character -> 0, exit 1. |
| Reanimated posture | manifest: `node -p` over dependencies + devDependencies filtered `/reanimated\|worklets/i` -> `[]`; `grep -rn "^import .*reanimated\|^import .*worklets" src/` -> no output, exit 1. The string `react-native-reanimated` DOES appear at package.json:58 inside `expo.autolinking.exclude` -- config, not a dependency; a bare-token grep trips on it (refutation 4a). |

If any of these don't match, the repo wins -- re-baseline before
proceeding.

## What shipped (newest first)

- (this handoff commit) -- the write-last close, no code.
- `f72739e` -- **feat:** multi-select checkbox drawn, text glyph
  dropped. Root cause was dual: `checkGlyph` inherited lineHeight 24
  from ThemedText's `default` type block into a 17pt content box, and
  Sora_600SemiBold carries no U+2713 (cmap glyph id 0 -- the
  implementer parsed the shipped TTF), so an iOS fallback face drew
  the ink with unspecified placement. Fix: a View-drawn check (two
  borders, -45deg) -- the font-dependence class removed, not patched.
  Architect geometry shipped verbatim, zero tuning. Device-gated:
  one, two, and three selections clean with screenshots, deselection
  intact, panel-2 visual pass, read-back 143 -> 169 reconciled against
  an exploratory walk (~1 completed log plus toggle play; plausible,
  not exact -- the operator did not count taps). Amend history:
  supersedes unpushed `3ba0ccf` (message-only amend, tree sha
  invariant; see refutation 1).
- `37c4796` -- **docs:** promotion pass #2. The seven standing forms
  from the `b94bb21` handoff into CLAUDE.md (presence-gate
  case-discipline + `-e`, name-form counts, worktree-only implementer
  claims, numbered runnable operator blocks, blob-hash identity,
  `npm test` as the only Jest invocation) plus retirement of the
  twice-rotted ADAPT test count (36 -> 40 -> stale against 52; rot
  history implementer-verified via `git log -S`: `afaf0e0`,
  `44872df`) for a number-free form that cannot rot again.

Three pushes observed this session, each closing to `0	0`:
`82437d0..37c4796`, `37c4796..f72739e`, and (this handoff, predicted)
`f72739e..<handoff sha>`.

## The arc

Phase A closed 17/17 observed with zero handoff refutations -- the
first fully clean table -- though closing it took three mid-audit
instrument repairs, and the audit script covers roughly half the
table (hence the entry point). The promotion pass landed with two
operator-ratified additions. The checkbox arc then ran the method end
to end: a read-only diagnostic that refuted the carried D78 label and
found the second root cause the hypothesis missed (the missing glyph
in Sora's cmap), an architect-decided fix approach (drawn geometry
over a lineHeight patch or an icon dependency, precisely because the
cmap finding made any font-rendered character hostage to iOS fallback
resolution), a device gate with screenshots at one, two, and three
selections, and a read-back reconciliation. The session's protocol
product is refutation 1: the gap between "authorized in prose" and
"observed" can open inside the architect's own commit bodies, and the
two-phase structure catches it only if the implementer's report-back
is honored as a real channel.

## Ratified decisions

- **Rotting-count retirement and the seventh-form promotion folded
  into the promotion commit** -- operator yes/yes on explicit
  questions, not architect discretion.
- **Drawn check over lineHeight patch or icon library** -- grounds:
  Sora lacks U+2713 entirely, so any text solution renders one
  character in an unspecified fallback face; drawn geometry is
  deterministic and adds no dependency. D83's "dark check glyph"
  wording names no codepoint (verified against art-direction.md
  before the change).
- **No third amend; the true underclaim ships** -- `f72739e`'s body
  claims panel-2 persistence via read-back plus the shared render
  path; the visual pass arrived after the amend. A true underclaim in
  permanent history beats body churn. The full gate record lives
  here.
- **errorBadge twin banked, not folded** -- one concern per commit.
- **The 97-char line and the D83 code comment left untouched** -- no
  line-length gate exists, and "glyph" is the doc's own ratified
  wording.

## Open items

**Entry point (runnable now)**
- **Audit-script pass** (`scripts/session-audit.sh`, one `chore:`
  commit): add the migration name-form count; exit statuses for
  deno_check and expo_lint; the D85 client greps; the checkMark rows;
  the grants and IN-list queries to the `[16]` manual block; document
  `count_lib`. Grounds: the instrument covers roughly half the
  Phase A table, its gaps cost three mid-audit repairs this session,
  and the pass is mechanical -- no design owed.

**Blocked / unresolved**
- Supabase MCP connector still sees zero projects (untouched; the
  operator paste channel carried all SQL cleanly again).

**Banked (prioritized; carried unless noted)**
1. **Glossary tap-surface UI** (D85 slice 3) -- next after the entry
   point; needs its own design pass. The 27 ratified entries exist;
   the surface does not.
2. **anon-grants tightening** on both views (its own decided slice).
3. NEW: **errorBadge twin** (session-ladder.tsx ~:1210-1222): the
   identical inherited-lineHeight-24 defect, milder -- `!` is present
   in Sora (no fallback face), content box 20pt, ~4pt overflow,
   probably invisible in practice. Gating requires provoking the
   error banner on device.
4. NEW: **grep-SIGABRT / ripgrep-fallback standing form** -- exit 134
   recurred on the implementer's machine; the handbook's bare-grep
   forms run on a binary that aborts. Candidate promotion once the
   failing pattern class is characterized.
5. Survey copy review (v3 helper copy still says "The itch it
   scratched" under a Main Goal title; error banner; "Overall" sweep;
   closing copy).
6. Live `Tested`-branch observation (carried, opportunistic).
7. COA PDF persistence in Supabase Storage (carried; backfill demand
   stands).
8. Section 8A `Relaxed` collision: the banked effects vocabulary
   shares a term with the live Energy axis; the effects slice
   inherits it knowingly.
9. The freeze: **six** consecutive clean gated walks; accumulating
   toward close.
10. Supabase RLS/policies/invoker re-observation -- fold into the
    `[16]` block extension in the entry point; carried unobserved one
    session.
11. Carried untouched: glossary-adjacent doc consolidation; COA age
    as a personal signal; axis deselection-to-null; G11; G12;
    `formatIsoDate` duplication; "Expo Starter" branding; detail
    read/edit; home-zone parking; shelf sort-by-band; license
    extraction + NY OCM import; haptics; Resend domain verification;
    quadrant/intent-lens/confound discounting; anchor-collision
    residual (D69); `auth-resp.json` at the repo parent.

**Closed this session**: checkbox glyph overflow (was bank item 1,
relabeled D82.1/D83 per refutation 6); Main Goal screen title (was
bank item 4 -- renders "Main Goal", operator-observed; the last
unobserved pixel of the D85 device gate).

## Working rhythm

Stable method lives in CLAUDE.md and handoff-specs.md, now including
the seven promoted forms. In flux this session, adopted: commit-body
gate claims are written from pasted verdicts only; operator blocks
carry no branches -- forks resolve in the architect channel first;
the architect authors doc edits only against pasted blobs (standing
assumption after two consecutive stale-copy sessions); stat/status
criteria match the numbers line, never exact output.

## Entry point

**Audit-script pass.** One `chore:` commit extending
`scripts/session-audit.sh` per the entry-point item above. The
instrument's gaps are now the largest single source of Phase A
friction, and the pass is mechanical with zero design owed. Then the
glossary tap-surface design pass (bank item 1). Not a menu: absent an
operator redirect, this is the move.
