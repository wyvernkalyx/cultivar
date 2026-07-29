# Session Handoff

Written 2026-07-29, after `1802dbf` pushed, sync observed `0 0`, and
the slice 6 docs commit landed. Supersedes the 2026-07-28 night
handoff (amended at `24f2ad6`), consumed in full.

**The repo is authoritative over this document.** Begin with the
read-only Phase A audit and try to break it.

## Preamble -- argue against yourself

The prior handoff's "session_entries 0 rows, still" was false when it
was written: ten rows existed, timestamped thirty hours before the
handoff, all 2026-07-27 gate taps on the legacy RUNTZ row. The word
"still" was the tell -- a Phase A line carried forward instead of
observed. Also this session: the architect predicted the Q2-Skip arm
would wrongly write null (it did not, in the diff or on the device),
guessed a column name that does not exist, and miscounted its own
UNION's columns -- both caught by the database in seconds. The
operator's third collapsed "all gates passed" arrived where per-step
pauses were specified; read-backs found nothing hidden this time, but
the favorite-toggle steps ended state-identical to untouched and are
therefore unverified as ever having run. Verdicts summarize;
databases testify.

## Start here (Phase A, read-only)

Every line is a falsifiable prediction. If any does not match, the
repo wins -- re-baseline before proceeding.

- Branch `main`. HEAD is the commit that lands this document; predict
  its subject: `docs: session handoff 2026-07-29`. Its parent is the
  docs commit `docs: close slice 6 into the record; promote the -iF
  grep rule`, whose parent is
  `1802dbf65e45c54f1f1e4623490f4e9c0d1f91b9` (feat: slice 6). If HEAD
  is none of these, work continued -- reconcile before proceeding.
- `git fetch origin` then
  `git rev-list --left-right --count origin/main...main` -> `0 0` if
  the post-handoff push happened; `0 1` or `0 2` means it did not --
  a finding, not an error.
- `git status --porcelain` -> silent.
- `npm test` -> 52 passed. Never `npx jest`. Report the Tests: line,
  not a tail that drops it (a `tail -3` did exactly that this
  session).
- From supabase/functions/ingest-coa:
  `deno test --allow-read --no-lock` -> 6 passed.
- `npx tsc --noEmit` -> 0 errors. `npx expo lint` -> 1 error 0
  warnings (template file), exit 1.
- `ls supabase/migrations/ | grep -Ec '^[0-9]{14}_'` -> 13.
- NEVER combine `-i` with `-F` in grep on this machine: SIGABRT exit
  134. Now in CLAUDE.md.
- Database, project zmmlgatxckplfzqyexjb (architect observes over
  MCP): `coas` 5 rows -- Animal Face 1/fav null, Cosmic Cereal 1/fav
  null, legacy RUNTZ (hash null) 1/fav null, new RUNTZ (hashed) 1/fav
  null, Permanent Shade count 0 favorite TRUE. `coa_retirements` 2
  rows, both Permanent Shade, reasons Smoked it all then Gave up on
  it. `session_entries` 10 rows (2026-07-27 gate taps, legacy RUNTZ;
  the count is 10, not 0). `retire_coa` prosecdef = f, ACL
  authenticated/postgres/service_role. Three indexes on
  `coa_retirements` (pkey + two FK). Migrations ledger 13.
- `grep -rnF ".rpc(" src/` -> 3 sites (insert_coa,
  find_coa_duplicates, retire_coa). `grep -rnF ".from('coas')" src/`
  -> 6 sites. The client's DB surface also includes the
  `coa_session_stats` read (shelf-list) and `supabase.storage`
  (coa-pdf-storage.ts); the two greps do not bound it.

## What shipped

- (this commit) -- docs: session handoff 2026-07-29
- (parent) -- docs: close slice 6 into the record; promote the -iF
  grep rule
- `1802dbf` -- feat: retirement + favorite (slice 6, D89-D91)

## The arcs

**Slice 6 end to end in one session.** Recon (shelf-list.tsx pasted
for the first time), two operator rulings, build, MCP schema and
behavioral gates, device gate, commit, push. The retention and
possession arc (D87-D91) is closed: every slice of
coa-retention-and-possession.md is implemented and gated.

**The behavioral probe grew impersonation.** A rolled-back DO block
setting `role` and `request.jwt.claims` exercised the full RLS
surface -- owner retirements, floor, append-only negative controls,
empty-reason and non-owner rejections -- with no operator SQL and no
persistent writes. Tier 3's observed-SQL gate ran entirely over MCP,
with the live re-read (count back to 2, zero events) proving the
rollback.

**The grant contradiction resolved by observation.** The build prompt
said grant service_role; the repo's grant form does not; the
implementer followed the repo and flagged it. pg_default_acl showed
public-schema functions get EXECUTE for anon/authenticated/
service_role at creation -- so the revoke-only form yields exactly
find_coa_duplicates' ACL, confirmed byte-identical post-apply. The
banked default-ACL rot mechanism, observed from the creation side.

## Refuted this session

1. Prior handoff (architect): session_entries 0 -- actually 10; the
   line was carried, not observed.
2. Architect, twice: the predicted Q2-Skip write-null defect never
   existed -- not in the diff, not on the device.
3. Architect: coas.product_name (the column is strain); a UNION
   column miscount. DB-caught in seconds; normal operating condition.
4. Operator: third collapsed "all gates passed" where pauses were
   specified. Nothing hidden this time; the toggle steps are
   unverifiable from end state. Three instances now.
5. Prompt defect (architect): the -iF grep form cannot run here.
   Implementer isolated it with a known-present-token control --
   the decisive line -- and it is promoted to CLAUDE.md.
6. Architect: recon locate form (git ls-files | grep -i shelf)
   over-fetched ~600 doc lines; scope `git ls-files 'src/**'` when
   the target is a component.
7. Q3 hypothesis KILLED: tested_on nulls are not a legacy artifact.
   A fresh 2026-07-28 ingest of the RUNTZ document still yields
   tested_on null while Permanent Shade's fresh ingest carries both
   dates. Layout-specific extraction gap; joins the Q4 parser pass,
   banked.

## Ratified this session

- **Off-shelf display** (operator, 2026-07-29): count-0 rows filtered
  DB-side (`.gt('on_shelf_count', 0)`). Named cost: an off-shelf COA
  is unreachable in the UI (favorite unsettable, detail unviewable)
  until a history surface exists. Data intact, access deferred.
- **Retirement copy** (operator, 2026-07-29): as shipped. Retire a
  package; You'll still have N on your shelf / This takes it off
  your shelf; Smoked it all / Gave up on it / Cancel; Would you buy
  it again? Yes / No / Skip.
- Architect calls, operator-unvetoed: chained Alert.alert;
  `retire_coa` carries reason + decrement only while favorite is a
  client update in both contexts (the D88.6 revisable-state
  precedent); tapping the active choice clears favorite to null; the
  xN badge renders only above 1.
- Implementer deltas accepted: Q1 echo is strain and brand without
  the Added line; Q2 has no body; iOS button close refetches twice.

## Open items

**Runnable now**

- `pdf_url` removal -- gate long satisfied; its own `chore:` with a
  migration, gated on a grep over src/.

**Blocked**

- Dashboard / preference summary: on real sessions existing.
- Store-inventory matching: on menu-side chemistry data.

**Banked**

- Real-session milestone: see Entry point. Everything else defers to
  it.
- Q4 representation ('' where absence should be null) + Q3's
  layout-specific tested_on gap -- one parser pass, together.
- Deno lockfile adoption -- its own `chore:`.
- anon grants: ALL on the two scoring views AND (default-ACL, now
  mechanism-observed) table privileges on coa_retirements; latent
  behind RLS; a durable fix must handle pg_default_acl, not just
  revoke.
- Collapsed-verdict pattern, three instances: if a fourth occurs,
  make the pauses mechanical (numbered gate steps each requiring an
  operator paste before the next is issued).
- Design doc Observed-baseline passage stale; aged again this
  session; one passage, re-observe or mark historical next tidying
  pass.
- Off-shelf history surface (reads coa_retirements; would also
  restore access to off-shelf COAs). Trigger: lived demand.
- Prior banked UI items from 9d66c49; multi-match row picker; third
  retirement reason; supersession; re-parse from retained PDFs;
  grep 3.11-vs-3.0 pin in CLAUDE.md; session-logging.md /
  scoring-lexicon.md still describe the eight-phase survey.

## Working rhythm

`handoff-specs.md` 4 governs. In flux:

- src/ recon baselines: 3 `.rpc(` sites, 6 `.from('coas')` sites,
  plus the coa_session_stats read and supabase.storage -- name the
  whole surface, not just the greps.
- Behavioral probes run architect-side over MCP with role +
  jwt-claims impersonation, always rolled back, always re-read live
  after.
- Per-step device read-backs mandatory; three collapsed verdicts on
  record.
- Deno tests with --no-lock until the lockfile decision.

## Entry point

**Log real sessions.** The standing milestone is now the only thing
in front: no real (non-gate) session has ever been logged, and the
entire apparatus -- ingestion, dedupe, retention, retirement,
scoring views, the survey -- is built, gated, and waiting on use.
The next move is not a build prompt. It is the operator living with
the app: real products, real sessions, real retirements. Defects
found in use, the Q3/Q4 parser pass, and the pdf_url chore are the
work that falls out of that; the dashboard unblocks only when
sessions exist. If the next session opens with another build prompt
instead of usage findings, that is the 4.7 ratio failing and it
belongs in that handoff's preamble.
