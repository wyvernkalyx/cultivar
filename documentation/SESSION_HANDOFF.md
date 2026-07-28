# Session Handoff

Written 2026-07-28 evening, after `b669814` landed and pushed, sync
observed `0 0`. Supersedes the 2026-07-28 morning handoff (parent
`0705eef`), which this session consumed in full.

**The repo is authoritative over this document.** Begin with the read-only
Phase A audit and try to break it.

## Preamble -- argue against yourself

The architect's project-knowledge copy of `CLAUDE.md` failed its hash check
against HEAD, and the architect predicted the standard failure: a stale
copy, with the bucket sentence as the delta. Refuted twice in one probe.
The copy was content-identical -- the mismatch was CRLF line endings, which
match no committed blob -- and the false sentence ("the bucket is not yet
created") was live at HEAD. The comforting hypothesis was that the
architect's picture was behind; the true one was that the handbook itself
was wrong, fixed in `5f9254d`. Corollary now standing: a `NO MATCH` from
the blob-hash loop is uninterpretable until line endings are normalized.

Carried memory was a full arc stale this session (it described the D79
survey work as current). The repo won on every disagreement.

## Start here (Phase A, read-only)

Every line is a falsifiable prediction. If any does not match, the repo wins.

- Branch `main`. **HEAD is the commit that lands this document.**
  `git log -1 --format=%s` -> `docs: session handoff 2026-07-28 evening`.
  Its parent, `git rev-parse HEAD~1`, is
  `b669814ecc330b96fd3a778085f6386de1b6b5fd`. If HEAD is neither, work
  continued past this handoff -- reconcile before proceeding.
- `git fetch origin` then
  `git rev-list --left-right --count origin/main...main` -> two zeros,
  tab-separated: nothing ahead, nothing behind.
- `git status --porcelain` -> silent.
- `npm test` -> `Test Suites: 1 passed`, `Tests: 52 passed`, exit 0.
  **Measured at `b669814` this session.** Never `npx jest`.
- `npx tsc --noEmit` -> 0 errors, exit 0.
- `npx expo lint` -> 1 error, 0 warnings, exit 1, the template file. That
  IS the baseline, exit code included.
- `ls supabase/migrations/ | grep -Ec '^[0-9]{14}_'` -> 10. No migration
  landed this session.
- Database, project `zmmlgatxckplfzqyexjb`, schema shape only, unchanged
  from the morning handoff: `coas` 19 columns with both named checks and
  both D88.2 indexes; `coa_retirements` two policies (INSERT/SELECT);
  bucket `coa-pdfs` private, 10485760, pdf-only; four `storage.objects`
  policies. Row counts deliberately absent; everything in the database is
  test data.
- `grep -rn "pdf_object_path" src/ | wc -l` -> nonzero now (slice 4
  landed); `grep -rn "pdf_url" src/` -> no output, exit 1, still.

## What shipped

Newest first, all pushed, sync verified, plus the commit landing this
document.

- `b669814` -- `feat:` retain COA source PDFs in Storage (slice 4, D87)
- `b9e7fdf` -- `docs:` D87.4 after-save sequencing + slice 4 observed
  constraints
- `daeef78` -- `docs:` tidy D87-D91 design to match shipped slices 1-3
- `5f9254d` -- `docs:` ADAPT-3 bucket claim amended to match 0705eef

Three docs commits to one product commit -- but the product commit is the
first `src/` change in three sessions, and the docs commits were its
prerequisites, not its substitutes. The 4.7 ratio finding is answered,
not merely restated.

## The arcs

**A false sentence in the handbook, found by hash, located by refutation.**
`CLAUDE.md` at HEAD claimed the bucket did not exist while the architect
observed it over MCP. The blob-hash standing move surfaced it; the
architect's stale-copy hypothesis obscured it until the history loop
returned `NO MATCH` and the diff showed line endings only. Fixed first
(`5f9254d`) because slice 4's implementer would otherwise read a handbook
contradicting its own prompt -- a correct STOP waiting to happen.

**Slice 4 shipped against a doc that was made true first.** Tidying pass
(`daeef78`, five stale passages including the status line), then D87.4
recorded with the recon facts (`b9e7fdf`), then code. The recon
(read-only Phase A at `5f9254d`) established the facts the build leaned
on: neither the PDF bytes nor the picked URI survive the parse step; the
returned RPC id is exactly what the D87.1 path needs; `.storage` ships in
the installed client, so no new package and no EAS rebuild; one delete
call site, fire-and-forget.

**The review catch: `remove()` lies by omission.** Supabase Storage
`remove()` reports a policy refusal and an already-absent object alike as
`error: null` with empty `data`. The built `removeCoaPdf` trusted the
error alone -- a blocked removal would have returned ok and left a silent
orphan, against D87's surfaced-never-swallowed. Amended before the gate:
zero-removed is failure. Same class as SQLSTATE-without-SQLERRM, which the
morning handoff documented and the architect still failed to carry across
to the Storage API when writing the build prompt. The class transfers;
the lesson evidently must be re-derived per API surface unless written
down -- hence this paragraph.

**Device gate with per-step MCP read-backs, first live DELETE policy
exercise.** Save observed writing object and path (shape
`{uid}/{coa_id}.pdf` exact, application/pdf, ~647KB); delete observed
removing row then object, bucket back to 0, no orphan; legacy null-path
delete clean, Storage untouched. The Storage DELETE policy passed its
first exercise through the only path that can test it.

## Refuted this session

Architect's unless noted.

1. **The architect's `CLAUDE.md` copy matched a pre-`0705eef` commit.**
   No committed blob matches it; the difference is CRLF, the content is
   HEAD's. The false sentence was at HEAD.
2. **Project-knowledge sync might normalize line endings** (raised as a
   caveat). It demonstrably does not for two of three files, which match
   their blobs byte-for-byte; why `CLAUDE.md` alone synced CRLF is
   unexplained and banked.
3. **Carried memory's picture of the project** (D79 survey as latest
   work). A full arc stale.
4. **`git diff <path>` shows an untracked file's content** (implicit in a
   criterion the architect wrote). It prints nothing, exit 0 -- silent
   success, the class the same prompt was fixing. Implementer flagged it
   and substituted a `--no-index` snapshot taken before editing.

## Ratified this session

- **D87.4** (operator, 2026-07-28): slice 4 sequencing is after-save
  update. `insert_coa` unchanged; upload keyed by the returned id;
  `pdf_object_path` written by follow-up update. Grounds in the design
  doc: an insert-time path records a reference to an object that does not
  exist yet -- the fabrication class -- and costs a migration. Named,
  accepted cost: failure between upload and update leaves a null path and
  possibly an orphan, detectable and repairable, unlike its inverse.
- **Docs-before-build sequencing for this slice** (operator): tidy pass
  and amendment landed before the build prompt.
- **Architect-owned prompt-authoring rules, adopted after defects, all
  observed this session:** heredocs left-aligned always; supplied
  insertion text is byte-verbatim or explicitly delegated for re-wrap,
  never both; presence anchors wrap-safe or explicitly exempt from
  wrapping; new-file evidence is `cat` or `--no-index` snapshot, never
  `git diff <path>`; commit-prompt staging gates check presence of staged
  forms (`A `, `M `), not absence of unstaged ones.

## Open items

**Runnable now**

- **Slice 5, dedupe** (entry point, below).
- **`pdf_url` column removal.** Its gate is now satisfied: recon at
  `5f9254d` observed `grep -rn "pdf_url" src/` empty, exit 1. Still its
  own `chore:` with a migration; do not fold into slice 5.

**Blocked**

- Dashboard / preference summary: on real sessions existing.
- Store-inventory matching: structurally, on menu-side chemistry data.

**Banked**

- The design doc's Observed-baseline block is stale in three places
  (bucket rows, `coas` index list, column count) -- one passage, one fix:
  re-observe or mark historical. Next tidying pass.
- "PDF not removed" alert cannot distinguish refusal from prior absence;
  zero-removed is all the API reports. Intended, documented here so it is
  not re-litigated as a bug.
- Two `RAINBOW RUNTZ` duplicates remain (was three; one deleted as the
  gate's legacy control). Dedupe slice may absorb them or they may be
  deleted; decide when slice 5 is live.
- `anon` ALL grants on the two views + `coa_retirements`; latent.
- FK-supporting indexes on `coa_retirements`, with slice 6.
- `CLAUDE.md` grep 3.11 pin vs installed 3.0; unresolved.
- CRLF project-knowledge sync oddity (refuted item 2).
- Prior banked UI items from `9d66c49` (keyboard accessory bar, Close
  spinner, tap-outside-dismiss, `CO_CONSUMPTION`, pairwise comparison at
  depletion, `tested_on` null / `brand = ''` parser gaps, unknown-lab 200,
  terpene whitelist drops) -- all still banked.
- Doc drift: `session-logging.md` / `scoring-lexicon.md` still describe
  the eight-phase survey.

## Working rhythm

`handoff-specs.md` 4 governs. In flux:

- The LF->CRLF warning at `git add` is now the expected case on every
  tracked-file edit on this machine; its **absence** is the anomalous
  signal. Blob evidence (numstat, staged-blob greps) settles content.
- `src/` baseline for recon greps: **four** `.from('coas')` sites
  (detail select, detail delete, shelf select, lib update), one `.rpc`.
- Device gates: per-step verdicts remain mandatory, and the paste-back
  data lines (ids, names) are load-bearing even when the verdict feels
  sufficient -- this gate stayed unambiguous only because exactly one row
  could carry a path.
- DB observation stays the architect's job over MCP; repo state arrives
  only through the operator. Unchanged and load-bearing.

## Entry point

**Slice 5, dedupe.**

The design doc's order, and the next thing that stops a live defect: the
two remaining RUNTZ duplicates exist because ingest cannot recognize a
re-upload. Scope per D88/D88.1-D88.3: hash on ingest, both match signals
(content hash; natural key treating `''` as absent), the three-outcome
prompt, never a silent merge. The dedupe lookup runs server-side scoped
by explicit `created_by`, never RLS (D88.1). Device gate exercises all
three outcomes plus the no-prompt control, per the design doc's gate
spec. Open questions 2-4 in the design doc touch this slice -- Q2 (the
duplicates) is answerable at gate time; Q4 (`brand = ''`) is already
half-answered by D88's empty-string-as-absent rule.

Slice 4's pattern held: recon first if the ingest path needs mapping
beyond what the 5f9254d recon covered (it mapped save, not the Edge
Function's internals), then docs amendment if any fork surfaces, then
build. The apparatus is in order and, as of this session, applied to
things that run.
