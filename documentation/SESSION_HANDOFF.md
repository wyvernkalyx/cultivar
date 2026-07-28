# Session Handoff

Written 2026-07-28, after `0705eef` landed and pushed. Supersedes `dc74d38`.
Three versions of this file shipped on 2026-07-27; each went stale inside its
own session. That is a property of writing it last, not an accident.

**The repo is authoritative over this document.** Everything below can be
wrong. Begin with the read-only Phase A audit and try to break it.

## Preamble -- argue against yourself

The architect read `CLAUDE.md` end to end, declared the read complete, and had
read a stale copy. Its project-knowledge snapshot was one commit behind the
repo. On that basis it predicted that `CLAUDE.md` still quoted `36 passed`,
and asserted that the previous handoff's claim to the contrary was probably
false. The handoff was right. The handbook had dropped the number precisely
because it rots, and the architect proved the point by reciting it.

The fix was mechanical: hash the copy, find the commit whose blob matches,
read the delta to HEAD, apply it, and confirm the reconstruction hashes to the
blob the operator observed. That is now the standing move whenever an
architect-side copy of a repo file is load-bearing.

Six architect predictions were refuted this session and every one was caught
by a gate or by the implementer. None reached a commit. The next session
should assume the same: **the architect's criteria are the weakest link in
any prompt it writes.** Write the falsification case first, in the prompt,
before the expected value.

## Start here (Phase A, read-only)

Every line is a falsifiable prediction. If any does not match, the repo wins.

- Branch `main`.
- **HEAD is the commit that lands this document.** `git log -1 --format=%s`
  -> `docs: session handoff 2026-07-28`. Its parent,
  `git rev-parse HEAD~1`, is `0705eef723a2ddb6eec8c013676674044140646a`.
  If HEAD is neither, work continued past this handoff -- reconcile before
  proceeding. (This form is D from `dac6f0a`: a write-last handoff cannot
  name its own HEAD, because the sha it would name is its own parent.)
- `git fetch origin` then
  `git rev-list --left-right --count origin/main...main` -> two zeros,
  tab-separated: nothing ahead, nothing behind.
- `git status --porcelain` -> silent. There is no noise to ignore on this
  repo; a clean worktree really is empty output.
- `npm test` -> `Test Suites: 1 passed`, `Tests: 52 passed`, exit 0.
  **Measured at `9d66c49` this session, not recalled.** Nothing committed
  since touches `src/` or the parser, so it should still hold -- but measure,
  do not assume. Use `npm test`, never `npx jest`.
- `npx tsc --noEmit` -> 0 errors, exit 0.
- `npx expo lint` -> 1 error, 0 warnings, exit 1, the template file
  `src/hooks/use-color-scheme.web.ts`. That IS the baseline, exit code
  included.
- `ls supabase/migrations/ | grep -Ec '^[0-9]{14}_'` -> 10.

Database, project `zmmlgatxckplfzqyexjb`. **Schema shape only. Row counts are
deliberately absent from this audit** -- see Working rhythm.

- `coas` -> 19 columns, including `pdf_object_path`, `pdf_sha256`,
  `on_shelf_count` (not null, default 1), `favorite`. Two named check
  constraints: `coas_pdf_sha256_hex_check` and
  `coas_on_shelf_count_nonneg_check`.
- Two indexes on `coas` from D88.2: `coas_created_by_pdf_sha256_idx` (partial,
  `where pdf_sha256 is not null`) and `coas_created_by_lab_batch_idx`.
- `coa_retirements` exists, `rowsecurity = true`, exactly two policies:
  INSERT with `with_check` only, SELECT with `qual` only. No UPDATE, no
  DELETE. One named check constraint,
  `coa_retirements_reason_nonempty_check`.
- `storage.buckets` -> one bucket, `coa-pdfs`: `public = false`,
  `file_size_limit` 10485760, `allowed_mime_types` `{application/pdf}`.
- `storage.objects` -> four policies, all `to authenticated`, all keyed on
  `bucket_id = 'coa-pdfs' and (storage.foldername(name))[1] = auth.uid()::text`.
  SELECT and DELETE carry `using` only, INSERT carries `with check` only,
  UPDATE carries both. Zero objects.
- Migrations applied: 10, latest version `20260728000000`.

**Everything in the database is test data.** Not a hedge -- the operator's
position, stated plainly: the app is nowhere near production use, and the
contents of `coas` and `session_entries` are disposable. Do not build an
argument on a row, do not count them in an audit, and do not ask the operator
about them.

## What shipped

Newest first. Eight commits, `9d66c49..0705eef`, all pushed and sync
verified, plus the commit landing this document.

- `0705eef` -- `feat:` private COA PDF bucket and its policy surface
  (slice 3, D87)
- `dc74d38` -- `docs:` session handoff 2026-07-27 evening (revised)
- `7e8f578` -- `docs:` session handoff 2026-07-27 evening (superseded within
  the hour; see "The arcs")
- `b3016bf` -- `docs:` fix two gate defects in the D87-D91 design
- `bc7a91b` -- `feat:` COA retention and possession schema (slice 2, D87-D91)
- `3b08e68` -- `docs:` ratify D87-D91 with nine sub-decisions
- `dac6f0a` -- `docs:` a handoff's HEAD sha is its own parent
- `3c0df2b` -- `docs:` 4.4's byte-class gate pins the locale

Six documentation commits to two product commits, three of them versions of
this file. Per `handoff-specs.md` 4.7 that ratio is itself a finding, and it
is in the entry point.

## The arcs

**The ASCII gate was never portable, and its failure mode was silent.**
`handoff-specs.md` 4.4 shipped `grep -c $'[\xc2-\xf4]'` as the byte-level
gate. In the operator's shell it aborts: `grep: Invalid collation character`,
**exit 2, no stdout at all**, on dirty and clean input alike. In the
implementer's shell the identical command returns 1 and 0 correctly. One
machine, one grep binary, GNU grep 3.0. The variable is ambient `LC_CTYPE`:
the operator's shell carries `en_US.UTF-8`, the implementer's carries nothing.
Any UTF-8 ctype makes the bracket byte-range a character range, and
`\xc2`-`\xf4` are not characters. `LC_ALL=C` fixes it in both. Two
consequences worth keeping: a gate's correctness can depend on an environment
variable no prompt states, and `locale` output is not evidence for what a tool
does -- the implementer's `locale` reports `LC_CTYPE="C.UTF-8"` while its grep
behaves as plain C, which is why that same shell aborts when `C.UTF-8` is set
explicitly.

**D87-D91 were ratified, and the ratification found more than it recorded.**
The previous handoff filed slices 2-6 under Runnable now; the document said
`NOT ratified` and closed with four open questions, one of which decided a
column in slice 2's own migration. Ratifying it surfaced five defects in the
document, two of which would have produced broken artifacts: an INSERT policy
specified with `using` (PostgreSQL rejects it on `for insert`), and a schema
gate whose control could not fail. Both were fixed in `b3016bf`. The three
remaining are stale prose and are banked.

**Slice 2 shipped, applied, and gated with a control that means something.**
The document's control -- "an attempted UPDATE fails" -- does not fail: RLS
with no UPDATE policy filters the row and reports zero rows affected without
raising, and against an empty table zero is what a working policy returns too.
The corrected probe runs as `authenticated`, inserts a row, confirms it
visible, then attempts UPDATE and DELETE, and rolls back:
`inserted=1, visible=1, updated=0, deleted=0`. The insert is what makes the
two zeros mean "no policy" instead of "empty table." All three named check
constraints were probed against real rows and all three rejected: whitespace
`reason`, a non-hex `pdf_sha256`, a negative `on_shelf_count`.

**Two schema objects were removed rather than ratified.** The migration first
carried `coa_retirements_coa_id_idx` and `coa_retirements_created_by_idx`,
copied from `session_entries`. The implementer flagged them as the only
elements not tracing to a numbered decision. A sibling's shape is not a
ratification, and nothing reads the table until slice 6, so they were deleted
and their absence recorded in the migration header. The alternative was a
documentation commit to legitimise something nothing needs yet.

**The handoff shipped, and one sentence from the operator retired it.**
`7e8f578` carried an entry point built on "log a real session" and a Phase A
block that predicted row counts, and it passed all seven of its criteria. The
operator's response was that the entire database is test data and that the
Supabase MCP access existed precisely so the architect would stop asking about
it. Both were correct; neither was visible from the repo. Recorded because the
first version was verified byte for byte and still wrong in its premise --
gates check bytes, not premises, and the premise is what a handoff is for.

**Slice 3 shipped, and the architect was wrong about whether it could.**
`storage.objects` is owned by `supabase_storage_admin`; the migration runs as
`postgres`, which is neither that role nor a superuser, and `create policy`
requires ownership. The architect had a well-grounded prediction that both
`db push` and MCP would fail and that the dashboard was the only route. A
probe that created a policy and rolled it back showed otherwise. That single
observation moved slice 3 from operator-run dashboard clicking into an
ordinary migration file, which is why the bucket and its four policies are now
reproducible from the repo rather than existing only in the remote database.

**The slice 3 gate almost lied, for the second time in one day.** The first
probe reported `own_delete = refused 42501`, which reads as the DELETE policy
rejecting its own owner. It had captured `SQLSTATE` and discarded `SQLERRM`.
Re-run with the message: `Direct deletion from storage tables is not allowed.
Use the Storage API instead.` -- a Supabase trigger, not RLS. `42501` is
returned by an RLS refusal, a trigger block, and a missing grant alike, so the
code alone cannot distinguish "the protection worked" from "something else
stopped it." **`SQLSTATE` without `SQLERRM` is a vacuous gate**, exactly as
`grep -c` without its exit code is.

## Refuted this session

Architect's unless noted.

1. **`CLAUDE.md` still quotes `36 passed`.** It does not, and the previous
   handoff was right to say so. The architect was reading a copy one commit
   stale.
2. **`npm test` prints 36.** Measured: **52 passed, 1 suite, exit 0.**
3. **The byte-class grep never works.** It works fine under a C ctype. It is
   locale-dependent, and that is worse than broken, because one of its two
   behaviours is a silent abort.
4. **Forced `LC_ALL=C.UTF-8` would work in the implementer's shell.** It
   aborts there too. That refutation is what pinned the mechanism.
5. **A diffstat can be predicted from the edit script.** It cannot. A
   FIND/REPLACE pair sharing a byte-identical boundary line yields context,
   not delete-plus-add. Predicted 93/11, actual 92/10.
6. **Two grep patterns beginning with `-` shipped without `-e`,** against a
   rule already written in `CLAUDE.md`. They aborted exit 2. Reading a
   handbook end to end is not the same as applying it.
7. **`create policy` on `storage.objects` would fail from `postgres`.** It
   succeeds. Ownership, superuser status and `pg_has_role(...,'MEMBER')` all
   said no; the probe said yes. Slice 3 is a migration file because of it.
8. **`SQLSTATE` alone identifies why a statement was refused.** It does not.
   RLS refusal, trigger block and missing grant all return `42501`.
9. **The implementer reported a parent sha `7d0b346`.** It does not exist:
   `git rev-parse --verify` -> `fatal: Needed a single revision`, exit 128.
   Its "three commits ahead" was also wrong; the session range is five
   commits, `9d66c49..b3016bf`. The implementer's own report correctly
   disclaimed database and remote state in the same breath. **Ancestry claims
   deserve the same discipline as remote claims.**

## Ratified this session

- **D87-D91**, per-decision by the operator, plus **nine architect
  sub-decisions** authored under a delegation of security, performance, and
  best-practice judgment: D87.1 Storage policies written per verb with a
  pinned path shape; D87.2 bucket constrained at creation; D87.3 open
  question 1 resolved as a new `pdf_object_path` column with `pdf_url` left
  dormant; D88.1 dedupe lookup scoped to the caller explicitly, never by RLS,
  because a service-role query bypasses it; D88.2 two non-unique indexes;
  D88.3 hex-format check on `pdf_sha256`; D90.1 retirement event and
  decrement in one `security invoker` RPC; D90.2 non-empty check on `reason`;
  D90.3 the cascade hole accepted and recorded rather than closed. Grounds in
  `documentation/design/coa-retention-and-possession.md`.
- **A handoff names its own HEAD as a parent** (`dac6f0a`). Applied above.
- **Byte-level gates pin the locale** (`3c0df2b`). `LC_ALL=C`, always,
  control-paired.
- **The tool-abort exemption.** Architect-owned, not operator-ratified, and
  the operator was explicit that it did not warrant a ruling: a criterion that
  runs and contradicts its prediction is a STOP; a criterion that *aborts*
  never evaluated the property and is not a failure. Where `CLAUDE.md` names
  that abort mode and prescribes its repair verbatim, the implementer applies
  it, pastes both runs, and pairs the repaired form with a control. Any other
  repair is a STOP. It is a backstop, not a licence -- if it starts getting
  used regularly that is a finding about prompt authoring, not about the rule.

## Open items

**Runnable now**

- **Slice 4, retention.** Upload the source PDF at save time -- never at
  parse time, so an abandoned parse leaves no orphan -- write the object path
  to `coas.pdf_object_path`, and remove the object when the COA is deleted.
  D53's cascade is a foreign key and foreign keys do not reach Storage, so
  the delete path removes the object explicitly and surfaces failure rather
  than swallowing it. First app code in this arc; device-gated.
- Slices 5 and 6 follow, in the design doc's order. Neither adds a native
  module.

**Blocked**

- **The dashboard / preference summary.** Blocked on real sessions existing,
  not on engineering.
- **Store-inventory matching against favorites.** Structurally blocked: no
  consumer channel publishes per-lot terpene data.

**Banked**

- Four items now want one tidying pass over
  `documentation/design/coa-retention-and-possession.md`: three stale
  `pdf_url` phrasings, inside D87.3, in Non-goals and in Banked; and the
  slice 3 line reading "Operator-run; no repo change beyond policy SQL",
  disproved by `0705eef`. All moot rather than false, which is why none of
  them has shipped.
- `anon` holds ALL privileges on `session_current`, `coa_session_stats`, and
  now `coa_retirements`. Latent, not live -- RLS is on and `auth.uid()` is
  null for `anon`. Three instances of one Supabase default. Must not be fixed
  inside an unrelated migration.
- FK-supporting indexes on `coa_retirements`, to land with slice 6.
- `CLAUDE.md` pins its superseded-form observation to GNU grep 3.11; the
  binary on this machine is 3.0. The pin is unreliable and unresolved.
- Removing the dormant `pdf_url` column, gated on a grep over `src/`.
- Everything still banked from `9d66c49`: input accessory bar for the
  keyboard; a spinner on Close during a slow note write; explicit
  tap-outside-to-dismiss; `CO_CONSUMPTION` returning if notes show
  confounds; pairwise comparison at jar depletion; the three duplicate
  `RAINBOW RUNTZ` rows; `tested_on` null on all five COAs and `brand = ''`
  on one; `ingest-coa` returning 200 with an empty shell on an unknown lab;
  the terpene whitelist silently dropping unrecognized analytes.
- Doc drift, low priority: `session-logging.md` and `scoring-lexicon.md`
  still describe the eight-phase survey; `scoring-lexicon.md` holds skeleton
  item 4, which D93 amended to empty.

## Working rhythm

`handoff-specs.md` 4 governs. Only what is in flux:

- **Database observation is the architect's job, not the operator's.** The
  architect has Supabase MCP and it exists precisely so the operator never
  has to query or report database state. Query it directly; never ask the
  operator what is in a table. This was the explicit reason the access was
  granted, and asking anyway wastes the operator's attention on bookkeeping.
  It does not extend to the repo: HEAD, worktree state, and test counts still
  arrive only through the operator.
- **Row counts do not belong in Phase A.** A prediction that goes stale
  whenever the operator opens the app teaches the next session that Phase A
  failures are noise to skip past, which is the opposite of what the audit is
  for. Predict schema shape, which changes only when a migration runs.
- The schema gate for slice 2 used a transactional probe run over MCP --
  insert, read, attempt UPDATE and DELETE, roll back by raising. That is the
  model for future schema gates.
- **Architect-side copies of repo files are not the repo.** Hash them against
  `git show HEAD:<path>` before treating a read as complete.
- **Predict a diffstat from the diff, never from the edit script.** Before
  predicting, check whether the FIND and REPLACE blocks share a byte-identical
  line; a shared boundary line becomes context, not delete-plus-add.
- **Any grep pattern beginning with `-` is passed via `-e`.** Already in
  `CLAUDE.md`; violated twice this session by the architect. Verify prompt
  criteria in a scratch shell before the prompt goes out.
- **A gate that reads `SQLSTATE` reads `SQLERRM` too.** `42501` is returned by
  an RLS refusal, a trigger block and a missing grant alike.
- **The architect's picture of HEAD goes stale silently.** A prompt was run
  and committed this session without its report reaching the architect, and
  the next prompt's repo-identity precondition was the only thing that caught
  it. Never carry HEAD across a turn; predict it and let it fail.
- Two environment facts, unchanged and still costly: the implementer's shell
  resets to `d:\Projects\DeadEditor` between calls, so every prompt opens
  with the repo-identity precondition; and architect-supplied files must be
  placed by the operator at a path named in the prompt.

## Entry point

**Slice 4, retention.**

Slices 2 and 3 shipped schema and a bucket. Nothing in `src/` touches either.
Slice 4 is the first code in this arc and the first thing that stops a live
defect: every COA ingested without its source PDF retained is permanently
unverifiable, and there is no re-parse path when a parser is fixed.

It is also the first slice this arc that needs the app in front of the
operator rather than a migration file, which makes it the natural opening for
a session rather than the tail of one.

Two things to carry into it. The DELETE policy on `storage.objects` has been
asserted structurally but never exercised -- direct SQL deletion is blocked by
a Supabase trigger, so the only path that tests it is the Storage API, which
slice 4 is the first to use. And the upload happens in the same user action
that commits the `coas` row, never at parse time; that ordering is the whole
of D87's orphan-avoidance and it is easy to lose while wiring a UI.

The ratio finding from `handoff-specs.md` 4.7 still stands: six documentation
commits to two product commits, three of them versions of this file. The
apparatus is in good order. It has been applied almost entirely to artifacts
describing behaviour no code has exercised.
