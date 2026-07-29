# Session Handoff

Written 2026-07-28 night, after `e136103` landed and pushed, sync
observed `0 0`. Supersedes the 2026-07-28 evening handoff (parent
`b669814`), consumed in full.

**The repo is authoritative over this document.** Begin with the
read-only Phase A audit and try to break it.

## Preamble -- argue against yourself

Eight architect assertions were refuted by artifacts this session, in
four classes. The most instructive: the 5a build prompt ordered the
hash computed "after a successful parseCoa over the exact bytes already
in scope" -- physically impossible, since unpdf detaches the request
buffer, and the literal implementation hashed the empty string. The
architect asserted a runtime property it had never observed; the
implementer's probe refuted it. The most embarrassing: a criterion
grepping for a phrase its own supplied text wraps across a line break,
inside the very commit that promotes the sibling rule about
bare-identifier counts. The operator's collapsed "all gates passed" was
also refuted by read-back: outcome 3's write had not happened (a wrong
button or a skipped step -- benign, thirty seconds to catch, one step
to redo). Verdicts summarize; databases testify.

## Start here (Phase A, read-only)

Every line is a falsifiable prediction. If any does not match, the repo
wins -- re-baseline before proceeding.

- Branch `main`. HEAD is the commit that lands this document.
  `git log -1 --format=%s` -> `docs: session handoff 2026-07-28 night`.
  Its parent, `git rev-parse HEAD~1`, is
  `e1361032c1a34c6c5ab5b874f3510312e4d6ef37`. If HEAD is neither, work
  continued past this handoff -- reconcile before proceeding.
- `git fetch origin` then
  `git rev-list --left-right --count origin/main...main` -> `0 0`,
  tab-separated. This assumes the push that follows this commit
  happened; `0 1` means it did not -- a finding, not an error.
- `git status --porcelain` -> silent.
- `npm test` -> `Test Suites: 1 passed`, `Tests: 52 passed`, exit 0.
  Never `npx jest`.
- Deno: from supabase/functions/ingest-coa,
  `deno test --allow-read --no-lock` -> `6 passed | 0 failed`, exit 0.
  WITHOUT `--no-lock` the run generates an untracked `deno.lock` and
  dirties the tree; lockfile adoption is banked, not decided.
- `npx tsc --noEmit` -> 0 errors, exit 0. `npx expo lint` -> 1 error,
  0 warnings, exit 1, the template file. That IS the baseline.
- `ls supabase/migrations/ | grep -Ec '^[0-9]{14}_'` -> 12.
- Database, project `zmmlgatxckplfzqyexjb` (architect observes over
  MCP): `coas` 5 rows -- Animal Face (count 1), Cosmic Cereal (1),
  legacy RAINBOW RUNTZ (hash null, count 1), new RUNTZ (64-hex hash,
  path set, count 1), Permanent Shade (64-hex hash, path set, count
  2). Two `storage.objects` in `coa-pdfs`, zero orphans in either
  direction. `find_coa_duplicates` and `insert_coa` both
  `prosecdef = f`; `find_coa_duplicates` grants
  postgres/authenticated/service_role only. `session_entries` 0 rows,
  still.
- `grep -rnF ".rpc(" src/ | wc -l` -> 2. `grep -rnF ".from('coas')"
  src/ | wc -l` -> 5. `grep -rn "pdfSha256" src/` -> hits only in
  `components/add-to-shelf-modal.tsx` and `lib/coa-dedupe.ts`.

## What shipped

Newest first, all pushed. Post-handoff addendum: `0e64c57`
(`chore:` enforce operator gate as policy in `.claude/settings.json`;
15 Claude Code deny rules for push / credentialed supabase / eas /
`.env` reads; activated and enforcement-proven -- a denied `git push
--dry-run` was blocked, `git status` ran). Sync of `CLAUDE.md` and this
file postdates it.

- `e136103` -- `docs:` close slice 5 into the record; construct-count
  grep rule promoted to CLAUDE.md
- `a273931` -- `feat:` dedupe prompt on ingest (slice 5c, D88)
- `5e7e37e` -- `feat:` dedupe lookup RPC + insert_coa pdf_sha256
  (slice 5b; two migrations, one gate-caught fix)
- `3336d51` -- `feat:` ingest-coa returns pdfSha256 (slice 5a, D88.5)
- `1097d85` -- `docs:` ratify D88.4-D88.6, slice 5 recon, status line

Three product commits, three docs commits, one feature end to end:
designed, ratified, migrated, fixed, deployed, device-gated, live.

## The arcs

**Slice 5 in one day, recon-first.** The Phase A recon mapped what the
5f9254d recon had not: `ingest-coa` is identity-blind (no client, no
env read, no uid reaching the handler), which turned D88.1's
conditional into D88.4's ruling -- the lookup is a security invoker
RPC, not Edge Function code. Every later fork resolved against recon
facts rather than assumptions.

**The schema gate caught a real defect before any client existed.** As
first applied, `find_coa_duplicates` returned NULL instead of false
for a signal flag whenever its comparison touched a NULL column on a
row the other signal selected -- SQL three-valued logic. JS would have
coerced the null falsy and the lie would have shipped invisibly. Fixed
by `create or replace` in a second migration; both committed together.
Applied-but-uncommitted is a normal intermediate state under the
gate-before-commit rhythm; the migrations ledger
(`supabase_migrations.schema_migrations`) is the arbiter of what
actually ran, and it settled a scrollback-paste ambiguity this session
(each version present exactly once, no duplicates).

**unpdf detaches the request buffer.** Post-parse, the PDF bytes are
zero-length server-side; the hash must be computed before extractText.
Anything wanting the bytes later re-reads the cache URI -- the
mechanism behind D88.5's named hash/object mismatch risk. Recorded in
the design doc's slice 5 gate record.

**The device gate as designed, plus one extra save.** All three
outcomes, both signals, no-prompt control, airplane-mode fail-closed.
The operator's collapsed verdict hid one missing write (outcome 3);
the per-step MCP read-back caught it; one re-run closed it. Per-step
read-backs are load-bearing even when the verdict feels sufficient --
now with a second observed instance.

**Fixtures were curated, not cleaned.** One RUNTZ duplicate deleted by
operator ruling; one retained deliberately because its null hash is
the only free exercise of the natural-key-only arm. It now has a
legitimate corrected-report sibling (outcome 3's product) -- two
`S01-RARU` rows is correct state, not leftover mess. Permanent Shade
sits at count 2, which is exactly the precondition slice 6's
retirement gate spec needs.

## Refuted this session

Architect's unless noted. Eight defects, four classes:

1. Bare-token / bare-identifier grep counts tripped by prose -- FOUR
   instances across three prompts (5b build x2, 5c commit x2).
   Promoted to CLAUDE.md at `e136103`; the class is closed by rule.
2. Hash placement "after parseCoa" -- impossible; the buffer detaches
   (implementer probe: byteLength 662519 -> 0, detached = true).
3. `find_coa_duplicates` three-valued-logic flag defect -- caught by
   the schema gate's combined-signal control.
4. A criterion phrase wrapping across its own supplied line break
   (docs pass), plus numstat deletion predictions computed from
   replaced-block line counts instead of the aligned diff. Numstat
   predictions are computed against the diff or written as
   observed-and-reported. Not yet promoted; once more and it goes in.
5. (Operator) "all gates passed" -- the database showed outcome 3
   unwritten. Benign, caught by read-back, closed by one re-run.
6. (Implementer, minor) "CLAUDE.md is already CRLF in the index" --
   autocrlf stores LF in the index; the CRLF is the worktree copy.
   Matters because it feeds the CRLF hypothesis below.

CRLF sync hypothesis, unverified, banked: the worktree is mixed --
files in fresh-checkout state carry CRLF, files rewritten by the
editor tool carry LF. Project-knowledge sync reads the worktree, which
would explain why `CLAUDE.md` alone synced CRLF while editor-rewritten
files matched their blobs byte for byte. Testable at the next sync.

## Ratified this session

- **D88.4** (operator): the dedupe lookup is a security invoker RPC,
  `find_coa_duplicates`, with `created_by = auth.uid()` as an explicit
  predicate. Grounds: `ingest-coa` is identity-blind; a Postgres RPC
  satisfies D88.1 with no disclosure surface.
- **D88.5** (operator): hash computed in `ingest-coa`, returned as
  `pdfSha256` inside `data`. Hex lowercase, D88.3's case. Named cost:
  the hash describes the parsed bytes; the upload re-reads the URI.
- **D88.6** (operator): outcome 1 is a client update, count + 1 on the
  strongest-matched row. Race named and accepted at one user.
- **Routing** (operator): strongest match wins -- hash beats natural
  key; among equal natural-key matches the pick is arbitrary and
  accepted (every such row is the same physical lot).
- **Test-data ruling** (operator): delete one RUNTZ duplicate, retain
  one as the natural-key gate fixture.
- **Fail-closed lookup** (architect call, operator-unvetoed): a dedupe
  outage is a save outage, surfaced. Exercised at the gate via
  airplane mode.

## Open items

**Runnable now**

- **Slice 6** (entry point, below).
- **`pdf_url` removal** -- gate long satisfied; its own `chore:` with
  a migration. Unchanged from the prior handoff.

**Blocked**

- Dashboard / preference summary: on real sessions existing.
- Store-inventory matching: structurally, on menu-side chemistry data.

**Banked**

- Deno lockfile adoption (a generated `deno.lock` would pin
  @supabase/server 1.3.0 and unpdf 1.6.2 against deploy) -- a real
  choice, its own `chore:`.
- Q4 representation fix: the parser emits `''` where absence should be
  null. Permanent Shade proved the absence genuine -- the document
  carries no brand line -- so `''` is honest content, wrong type. A
  parser pass of its own.
- Q3 `tested_on` nulls on legacy rows -- hypothesis: they predate a
  parser fix; fixtures parse dates correctly and new rows should carry
  them. Verify against the two new rows, then close or escalate.
- Architect hand-counting -- PROMOTED to CLAUDE.md this session. Recurred
a third time (a 15-entry deny list predicted as 14); the implementer
refused to drop a rule to match the miscount and asked for ratification,
which is the correct stop. The rule now in CLAUDE.md: array lengths and
diff-aligned line counts are gated by parse or observation, never
predicted from the supplied text.
- CRLF sync mechanism -- RESOLVED 2026-07-28. Project knowledge was
re-sourced from the GitHub connector (repo blobs), not manual worktree
uploads. The re-synced files read LF-clean, confirming the mechanism:
the old drift came from sync reading a mixed worktree; the blob path
does not. Governance files (`CLAUDE.md`, `handoff-specs.md`, this file,
two design docs) are now single-sourced from GitHub. Open sub-question,
testable next session: whether synced files refresh on demand or cache
at sync time -- until known, treat synced context as current-as-of-last
-sync, operator git output still adjudicates.
- `anon` ALL grants on the two views + `coa_retirements`; latent.
- FK-supporting indexes on `coa_retirements` -- join the D90.1
  migration in slice 6.
- `CLAUDE.md` grep 3.11 pin vs installed 3.0; unresolved.
- Multi-match row picker -- only if persistent multi-match states
  emerge beyond corrected-report pairs.
- Design doc Observed-baseline block stale (bucket rows, index list,
  column count) -- further aged by slice 5's rows; one passage,
  re-observe or mark historical, next tidying pass.
- Prior banked UI items from `9d66c49` -- all still banked.
- Claude Code v2.0.1 `sandbox.network.strictAllowlist` (denies
  non-allowlisted hosts for sandboxed commands) -- a network-egress
  primitive stronger than shell-pattern denies; future option for the
  operator-gate policy, not this pass.
- Doc drift: `session-logging.md` / `scoring-lexicon.md` still
  describe the eight-phase survey.

## Working rhythm

`handoff-specs.md` 4 governs. In flux:

- Per-step device-gate read-backs are mandatory and now twice-proven:
  a collapsed verdict hid a missing write both times the discipline
  was tested.
- `src/` recon baselines: five `.from('coas')` sites, two `.rpc(`
  sites (insert_coa, find_coa_duplicates).
- Deno tests run with `--no-lock` until the lockfile decision is made.
- DB observation stays the architect's over MCP; repo state arrives
  only through the operator. Unchanged and load-bearing.

## Entry point

**Slice 6: retirement + favorite (D90, D90.1-D90.3, D91).**

The design doc's final slice and the last thing between this schema
and real use: the two-question retirement surface, the event insert
plus decrement in ONE security invoker RPC (D90.1 -- a migration,
Tier 3 ceremony, `prosecdef = f` gate), `coas.favorite` settable from
the detail view and prompted at retirement, and the quantity badge D89
assigns to this slice. The gate spec is already written in the design
doc, and its precondition exists in live data: Permanent Shade sits at
`on_shelf_count = 2`, so retire-twice-with-different-reasons runs with
no seeding. The FK-supporting indexes on `coa_retirements` join the
D90.1 migration. Recon first, scoped small: the shelf-card badge
touches `shelf-list.tsx`, which no recon has ever pasted -- map it
before the build prompt.

After slice 6 the retention and possession arc is closed and the
standing milestone returns to the front: no real session has ever been
logged. The apparatus is in order and, two sessions running, applied
to things that run.
