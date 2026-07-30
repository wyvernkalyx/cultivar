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

## Amended 2026-07-29 (per handoff-specs 4.5)

Work continued past this handoff in the same session:

- `5388b15` -- `chore:` drop dormant `coas.pdf_url` (the Runnable-now
  item, discharged). Migration `20260729114855` applied and verified;
  the design doc's four pending-removal passages closed in the same
  commit. Phase A deltas: migrations name-form count is now 14, the
  ledger 14, and `coas` has 18 columns.
- Refuted (architect): the commit prompt claimed THREE pending-removal
  passages; the implementer's STOP located FOUR -- the D87 body carried
  an independent live claim. The architect had inventoried from a
  prior flag instead of reading the document, on the very file class
  whose sibling proved greps miss claims. The STOP, with passage
  bytes and gate math in the report, is the discipline working.
- The stale untracked d:/Projects/Cultivar/CLAUDE.md (parent
  directory, old handbook copy, readable by Claude Code) was deleted
  by the operator. Hazard closed.
- Entry point unchanged: log real sessions. This session's ledger:
  two build arcs, zero real sessions -- the 4.7 ratio, noted.

## Amended 2026-07-29, evening (per handoff-specs 4.5)

The session continued well past the first amendment. Ruling of
record: the operator superseded the entry point -- follow-ups and
MVP feature work proceed BEFORE real-session logging ("the app is
still not great"); the operator's concrete gripe list is still owed
and remains the input the feature phase needs.

Shipped since the first amendment:

- `7243a44` -- `feat:` absent text fields are null, never '' (D97,
  end to end: parser, both type mirrors, editor binding and emit
  normalization, sentinel, tests). Deployed to ingest-coa and
  device-gated; two pre-existing '' brand rows normalized to null
  by operator-run UPDATE (2 rows, read back). The deployed function
  now emits D97 nulls.
- `925a368` -- `docs:` D84 per-assay derivation reopened and closed
  against (the chat ratification conflicted with standing
  D84.2/D84.3 and was void where it conflicted; extraction recon
  re-derived grounds the registry already held); D97 ratified in
  its own doc (text-field-absence.md); CLAUDE.md gained the
  read-before-numbering rule.

Refuted, architect, one root cause -- asserting document or file
state without reading the artifact -- FIVE times in one day, now a
CLAUDE.md rule: a four-passage inventory claimed as three; the
D-number D84.5 assigned while occupied; the D97 Boundary section
describing as pending a null contract coa-dedupe.ts already
carried; and two more inside this very amendment's first draft,
caught by the implementer's pre-append verification -- a stale
line-number citation (the Parser contract passage sits at line 100
at HEAD; it was line 79 until 925a368's own insertion moved it, so
the citation aged inside the same commit chain being documented)
and a wrong D68 inventory. Adjacent case: the recon "discovery"
that the 2025 layout renders Analyzed Date empty was already
recorded in coa-test-dates.md's Parser contract section.

D68 status, correctly inventoried: D68 no longer governs anything.
Its code citation (parseKaycha.ts) was rewritten to D97 in 7243a44;
its one surviving mention is the supersession note at
text-field-absence.md:26, created by 925a368.

Gate-form lessons banked into working rhythm: deno eval lost its
permission flags in Deno 2 (runs all-permissions; use deno run for
flag-scoped work); a consuming global regex under-reports scans --
count occurrences by indexOf; cwd-sensitive test runs use the
subshell form (cd dir && ...) so greps after them cannot run
against a wrong root (one corrupted grep batch, self-caught).

Supabase MCP connector FAILED mid-gate and is unresolved in this
conversation: "server isn't responding" x3, then after reconnect
"permission denied" on a bare select 1, unchanged after a full
re-auth whose consent screen showed the correct org and read-write
scope. Suspected stale conversation-level binding. FIRST ACT of the
next session: probe select 1 over MCP; if it fails on a fresh
conversation, the grant itself is broken -- escalate at Supabase's
authorized-apps page. Interim evidence path used and valid:
operator-run dashboard SQL, output pasted whole.

Phase A deltas: HEAD chain 7243a44 -> 925a368 -> 0acd328. Jest
still 52 (two brand expectations flipped to null; four sentinel
assertions added inside the existing unknown-lab test). Database:
brand is null on Cosmic Cereal and Permanent Shade, no '' text
fields anywhere in coas; counts unchanged 5 coas / 2 retirements /
10 sessions. New doc: text-field-absence.md.

Queue, in ratified order: Deno lockfile chore (runnable now);
anon-grants durable fix (needs a short design ratification --
pg_default_acl, not revoke-only); doc-drift Tier 1 pass
(session-logging.md / scoring-lexicon.md eight-phase survey;
stale Observed-baseline passage). Banked for the feature phase:
shelf freshness indicator (>3 months, tested_on ?? sampled_on);
firstMatch consolidation refactor. The off-shelf history surface
and the 9d66c49 UI items still wait on the operator's gripe list.

## Amended 2026-07-30 (per handoff-specs 4.5)

The repo is authoritative over this document. Carried context was
wrong twice this session, both architect-side: the opening Phase A
predicted HEAD 0acd328 by misreading the prior amendment's
newest-first chain as oldest-first (actual HEAD 57aa544, which
reconciles exactly once the notation is read correctly); and the
carried claim "coa-pdfs bucket has no writer yet" was refuted by
observation -- the ingestion writer is live, 2 storage objects,
pdf_object_path populated on 2 of 5 coas rows. Begin the next
session with a read-only Phase A.

Shipped:

- `de5b71b` -- `docs:` dashboard design reference package
  (reference/handoff/: 7 screen/flow/token PNGs,
  cultivar-reference.html, cultivar-reference.md, design-brief.md
  as provenance). Pushed, observed 57aa544..de5b71b, rev-list 0 0.

The arc: the operator's gripe list (the owed input, superseding
entry point per the evening ruling) named three things -- a
dashboard with preference info and richer cards, no way to open
the stored COA PDF, and a design pass with a user-flow diagram.
Resolution shape: architect authored a fenced design brief
(personal-empirical boundary, data contract from observed schema,
D85 vocabulary verbatim, ND/null first-class, RN constraints);
operator ratified with one amendment (survey screens restyle-only
-- theme may change, mechanics/vocabulary/rung-order may not);
Claude Design produced the package; architect reviewed it against
the fences (clean) and it landed with the brief as provenance. Why
that shape: design exploration is cheap outside the build-gate
loop, but only inside a fence a design tool cannot cross.

Ratified (grounds in de5b71b commit body): all-time session summary
on dashboard; Sessions above Cannabinoids in detail; Safety as one
verbatim-count line plus Show assays; sticky Log bar on detail;
Loved-sessions lab-concentration module as v1 preference summary.
Also ratified in chat: survey restyle-only scope;
top-3-by-concentration as the v1 "relevant terpenes" definition;
one-tap log lands directly on the survey verdict screen.

Banked this session: retirement last-log flow step (a Claude Design
invention; retirement stays the ratified two-question survey;
trigger: lived demand). Binding at implementation, recorded so it
is not lost: preference-summary ranges compute over reported values
only -- ND is annotated alongside, never folded in as a zero lower
bound.

Open rulings the operator never answered (re-ask, do not assume):
1. Delete COA button -- coas carries an ALL policy; delete orphans
session history and fights the retention design. Architect
recommends demote-to-bad-ingest or drop. 2. The operator's brief
amendment list had an empty item 2, never filled in.

Observed database state (architect, over MCP -- the grant is intact
on a fresh conversation; the prior failure is attributed, not
proven, to stale conversation binding): 5 coas / 2 retirements /
session_entries 11 by per-coa sum (10 on legacy RUNTZ, 1 on hashed
RUNTZ -- the +1 was logged by the operator at 11:21 while capturing
screenshots; whether it was a real session or a screenshot tap is
an open question only the operator can answer). Migrations ledger
14. coas 18 columns, pdf_url absent. storage.objects in coa-pdfs:
2. The RR duplicate rows are NOT a dedupe defect: the second row
predates hashing (pdf_sha256 null) and a null hash cannot collide.

Phase A for the next session: parent of the handoff commit is
de5b71b; predict this amendment's commit subject, not its sha; if
HEAD is neither, work continued -- reconcile first. git status
--porcelain: silent if the operator ran the optional duplicate
cleanup (rm of the seven NN-screens.png), else exactly those seven
?? lines and nothing else. Jest 52 is carried from the prior
handoff, not re-observed this session -- re-measure, don't recall.

Ratio note (4.7): one docs commit, zero product code. Expected --
this session's job was turning the gripe list into a ratified
design direction -- but the next session must convert it.

## Entry point (supersedes prior)

Author the dashboard implementation design doc and slice plan from
reference/handoff/ (design-brief.md plus cultivar-reference.md are
the inputs), ratify, then build in slices. Natural slice seams, to
be ratified not assumed: preference summary module; card redesign
plus one-tap log; off-shelf surface (banked item, trigger fired);
COA PDF viewer (read path only -- the writer is live; note the
native-module / EAS-build split rule if a PDF view dependency is
needed). The Delete COA ruling belongs in the same ratification
pass.
