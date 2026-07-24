# SESSION_HANDOFF -- written 2026-07-24 against pushed HEAD `b94bb21`

The repo is authoritative over this document. Begin with a read-only
Phase A audit (`bash scripts/session-audit.sh`, Git Bash only) and try
to break every claim below before doing anything else.

This file supersedes the handoff committed at `a8482a2`.

## Preamble -- refutations and lessons, stated so they cannot be re-carried

1. **The architect's project-knowledge copy of CLAUDE.md was stale, and
   an end-to-end read of it produced a confident false claim** ("none of
   the three rules appears in any form" -- the repo already carried the
   discriminating-forms bullet). Reading a stale artifact carefully is
   still reading the wrong artifact. Standing form: state claims about
   repo files come from repo blobs (`git show HEAD:<path>`), never from
   carried copies. The implementer proceeded past that contradicted
   precondition without reporting it (violation, recorded), which forced
   a mid-flight merge of overlapping rules.
2. **Six architect instrument/prompt defects, one genus: commands and
   criteria not tested against the shell or document that runs them.**
   (a) `grep -F` patterns starting with `-` abort exit 2 without `-e`;
   (b) unquoted `--format=%h %p %s` passes `%p %s` as pathspecs;
   (c) a case-sensitive presence gate returned 0 against SPARK/Spark --
   presence gates need the same case-discipline as absence gates, since
   an under-matching 0 is indistinguishable from genuine absence;
   (d) `npx jest` drops `--experimental-vm-modules` and produces 48
   spurious failures -- `npm test` is the only correct invocation;
   (e) a prompt's annotation instruction contradicted ratified D85.2
   ("historical blocks left verbatim") -- the doc governed, the edit was
   reverted; (f) a revert-exception named a string its target never
   carried. **Adjudication precedent from (e): when a prompt and a
   ratified doc conflict, the doc wins; the implementer flags the fork
   and the architect rules -- exactly what happened.**
3. **The implementer fabricated unobserved state four times**: "N
   commits ahead of origin" twice (both wrong -- pushes it never saw had
   closed), "the migration remains unapplied" and "the device gate is
   still owed" once each (both events had already happened). Standing
   rule, now in the commit-prompt boilerplate: **the implementer reports
   the worktree and nothing beyond it -- no claims about origin,
   database, or device, in either direction.** Asserting the negative
   ("not yet applied") is as fabricated as asserting the positive.
4. Against that: **two model STOPs** (the unplaced glossary file; the
   missing migration timestamp prefix) -- contradicted precondition,
   halt, numbered report, nothing touched. The timestamp STOP also
   exposed that **a bare directory entry count cannot detect a malformed
   name**; the audit-worthy form is a name-form count
   (`ls supabase/migrations/ | grep -Ec '^[0-9]{14}_'`).
5. **autocrlf, nine files this session**: filtering is checkout-side,
   so index and commit blobs stayed LF and every hash chain held -- but
   after any fresh clone or checkout on this machine, worktree sha256
   will not reproduce. **File identity is the blob hash:
   `git show <rev>:<path> | sha256sum`.** Worktree hashes are valid only
   for first-placement verification.
6. **Grants prediction refuted**: `anon` holds ALL seven privileges on
   both views (Supabase default privileges), as does `authenticated`.
   Latent, not live (invoker + RLS zeroes anon; the DISTINCT-ON view is
   not auto-updatable), but contrary to expressed posture. Recreation
   reproduced the observed set by design; tightening is BANKED as its
   own slice, never a side effect.
7. **Operator steps go in numbered runnable blocks, never prose.** Two
   placement defects (the glossary file never placed; the migration
   timestamp never applied) trace to operator instructions buried in
   prompt preambles.

## Start here (Phase A, read-only) -- every line is a falsifiable prediction

| check | expected |
|---|---|
| branch | `main` |
| HEAD | a `docs:` commit, subject `docs: session handoff at b94bb21`, parent `b94bb21`. Below it, newest first: `b94bb21`, `9336f54`, `ef67af5`, `0250988`, `3182393`, `a8482a2`, `1398dd1`. |
| `git rev-list --left-right --count origin/main...HEAD` | `0	0` after the operator pushes this handoff commit. |
| `git status --short` | clean. Under `--ignored`: the six `!!` lines of the prior handoff. |
| migrations | `ls supabase/migrations/ \| grep -Ec '^[0-9]{14}_'` -> `7`; newest `20260724163428_rename_spark_main_goal_d85.sql`. |
| tests | `npm test` -> 52 passed (NEVER `npx jest`; it drops the vm-modules flag and fails 48 spuriously). Deno 5 passed (observed at this session's open, not re-run since). |
| `npx tsc --noEmit` | exit 0 |
| `npx expo lint` | 1 error, 0 warnings (template baseline), exit 1 |
| Supabase | six tables `rowsecurity=t`; 9 policies, `session_entries` exactly INSERT + SELECT; both views `security_invoker=true` (re-observed after this session's drop/recreate). View grants: 8 rows x priv_count 7 (anon ALL is a recorded wart, tightening banked). |
| `session_entries` schema | `main_goal` present, `spark` absent (two-name IN-list returns exactly one row). Only CHECK: `overall_score` 1-5. |
| rows | `session_entries` >= 143 (143 at close; growth is operator usage). Newest row at close: entry_no 214, `lexicon_version=3`, Loved / High-Energy / Solo / Ease Tension / Matched. Newest v2 row: 206, strings intact under the renamed column (v2 data is never migrated -- D85.3). |
| newest `coas` row | still Rainbow Runtz `S01-RARU` (no ingest this session). |
| client | `src/lib/lexicon.ts:6` `LEXICON_VERSION = 3`; `grep -rn -i "spark" src/` -> no output, exit 1; `grep -c "main_goal" src/components/session-ladder.tsx` -> 22. |
| docs | `grep -rn -F "(since renamed by D85)" documentation/design/` -> no output, exit 1 (the annotation form was reverted; ledger held verbatim). |
| Reanimated posture | unchanged: manifest greps 0/exit 1; `grep -rn "^import .*reanimated\|^import .*worklets" src/` -> 0, exit 1. |

If any of these don't match, the repo wins -- re-baseline before
proceeding.

## What shipped (newest first) -- the promotion pass and the D85 arc

- (this handoff commit) -- the write-last close, no code.
- `b94bb21` -- **docs:** D85 living-doc pointers. Living prose renamed
  in four design docs; historical blocks byte-identical per D85.2's
  ledger boundary after the architect's ruling reverted an annotation
  draft; session-logging.md gains a dated D85 amendment block in its own
  convention; the schema doc's lexicon_version claim corrected (3 today).
- `9336f54` -- **feat:** D85 slice 2, client. `LEXICON_VERSION = 3`;
  v3 strings everywhere (hidden 5-1 UNCHANGED -- the averaging
  invariant); SPARK -> MAIN_GOAL across type, phase, payload key, flow
  logic; axis display labels Target Energy / Setting / Main Goal.
  Device-gated: full v3 session logged (8 inserts, rows 135->143, the
  delta matching the walk's tap count exactly), read-back R1 all-v3,
  R2 the v2 control row intact -- **the version-branching control case
  observed live.** Fifth consecutive clean walk (freeze posture).
- `ef67af5` -- **feat:** D85 slice 1, migration
  `20260724163428_rename_spark_main_goal_d85.sql`: drop both views
  (dependency order; `CREATE OR REPLACE` cannot rename a view output
  column), rename `spark` -> `main_goal`, recreate both from observed
  definitions with `security_invoker = true` inline, grants via default
  privileges. Applied by the operator and gated 6/6 on observed SQL.
  Note: the `npx supabase db push` output itself was never pasted --
  the gate SQL is the applied-state evidence.
- `0250988` -- **docs:** D85 design (`documentation/design/glossary.md`),
  D85.1-D85.5, operator-authored v3 vocabulary and all 27 definitions,
  ratified before any code moved. Landed via the verbatim-persistence
  protocol (sha256 `a3ff0764...`, three-link chain held).
- `3182393` -- **docs:** CLAUDE.md promotion pass: control-paired ASCII
  gate, exit-code rule merged into the discriminating-forms bullet (the
  stale-copy discovery forced the merge), `prosecdef` standing form.

Six pushes observed this session, each closing to `0	0`:
`a8482a2..3182393`, `3182393..0250988`, `0250988..ef67af5`,
`ef67af5..9336f54`, `9336f54..b94bb21`, and (this handoff, predicted)
`b94bb21..<handoff sha>`.

## The arc

Session opened on the `a8482a2` handoff; Phase A closed 18/18 with zero
refutations (rows 130->135, first observed inter-session usage). The
entry-point promotion pass landed, then the glossary pass transformed
mid-flight: the operator's review doc was not definitions but a full
vocabulary revision, reclassified as lexicon v3 (D85) -- design doc,
column-rename migration through both views, client, living-doc
reconciliation, all four gate types exercised in one arc. The 135 live
v2 rows retired "vocabularies revise freely" and forced the
version-branching rule; the arc closed with v2 and v3 rows observed
side by side. The protocol discovery that outranks the feature: the
architect's own context is a stale artifact -- repo blobs adjudicate
even against a careful full read.

## Ratified decisions

- **D85.1-D85.5** (committed at `0250988`; all slices landed and gated):
  v3 vocabulary (Loved/Liked/Neutral/Disliked/Hated; Relaxed/Active/
  High-Energy; Solo/Social; Ease Tension/Deep Focus/Appetite;
  Missed/Partly/Matched; Heavy Meal/Aromatic Foods; Thirsty/Tired/
  Wound Up), Spark -> Main Goal everywhere including the column (no
  UI/internal split -- operator overruled the architect's split),
  version-branching (v2 rows immutable; string-readers branch on
  `lexicon_version`; score averaging exempt via the stable hidden
  mapping), 27 glossary entries, the co-consumption time window.
- **Ledger boundary (D85.2)**: history is never rewritten; living docs
  point, dated blocks stay verbatim -- enforced by ruling at `b94bb21`.
- **Standing forms adopted this session**: implementer claims are
  worktree-only; `npm test` never `npx jest`; blob-hash identity for
  file re-verification; name-form counts for migration listings;
  presence gates carry case-discipline; `-e` for any grep pattern
  starting with `-`; operator steps as numbered runnable blocks.

## Open items

**Runnable now (the entry point)**
- **CLAUDE.md promotion pass #2** (one `docs:` commit): (a) worktree-only
  implementer claims, (b) `npm test` as the only test invocation,
  (c) blob-hash file identity, (d) presence-gate case-discipline +
  `-e` rule (amends the discriminating-forms bullet), (e) name-form
  counts. Five ratified forms living only in this handoff.

**Blocked / unresolved**
- Supabase MCP connector still sees zero projects (untouched; the
  operator paste channel carried all SQL cleanly again).

**Banked (prioritized; carried unless noted)**
1. NEW: **checkbox glyph overflow** on the panel toggle selected state
   (D78 surface; pre-dates D85, "still" broken per the operator; one
   small device-gated UI slice).
2. NEW: **glossary tap-surface UI** (D85 slice 3; its own design pass --
   27 entries exist and are ratified, the surface does not).
3. NEW: **anon-grants tightening** on both views (the Preamble 6 wart;
   its own decided slice).
4. NEW: **Main Goal screen title** -- ten-second opportunistic check
   next log (function proven via R1 + the D73 fit branch; the title
   render is the one unobserved pixel of the device gate).
5. Survey copy review (bank grew: v3 helper copy still says "The itch
   it scratched" under a Main Goal title; error banner; "Overall"
   sweep; closing copy).
6. Live `Tested`-branch observation (carried, opportunistic).
7. COA PDF persistence in Supabase Storage (carried; backfill demand
   stands).
8. §8A `Relaxed` collision: the banked effects vocabulary shares a term
   with the live Energy axis; the effects slice inherits it knowingly.
9. The freeze: five clean gated walks; accumulating toward close.
10. Audit-script pass (extend: name-form migration count, `npm test`
    invocation, exit statuses for deno_check/expo_lint, the D85 grep
    rows; `count_lib` semantics still undocumented).
11. Carried untouched: glossary-adjacent doc consolidation; COA age as
    a personal signal; axis deselection-to-null; G11; G12;
    `formatIsoDate` duplication; "Expo Starter" branding; detail
    read/edit; home-zone parking; shelf sort-by-band; license
    extraction + NY OCM import; haptics; Resend domain verification;
    quadrant/intent-lens/confound discounting; anchor-collision
    residual (D69); `auth-resp.json` at the repo parent.

## Working rhythm

Stable method lives in CLAUDE.md and handoff-specs.md. Proven again:
document-before-implement across a five-commit arc; architect-authored
files through the verbatim-persistence protocol (hash chains held 3/3,
worktree -> index -> blob); thin build prompts with the committed doc
authoritative -- and the ruling that the doc GOVERNS the prompt when
they conflict; diffs through the implementer's own paste twice clean
(default earned back), operator channel on standby; per-slice gate
typing (hash-chain docs / observed SQL / device walk with per-step
verdicts, screenshots, and read-back); two-channel body verification
with the control-paired ASCII gate; predictions stated before
observation, six architect defects and four implementer fabrications
recorded, two model STOPs credited; the repo adjudicates -- including
against the architect's own carried context.

## Entry point

**CLAUDE.md promotion pass #2.** One `docs:` commit, five standing
forms, no design work owed. Then the checkbox slice (bank item 1).
Not a menu: absent an operator redirect, this is the move.
