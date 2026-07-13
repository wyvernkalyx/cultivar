# Cultivar — Session Handoff

_Written 2026-07-13, against HEAD `cefd02b`, pushed and verified (`cccca70..cefd02b main -> main` observed this session; earlier, `d7501af..cccca70` also observed)._
_**The repo is authoritative over this document.** Every state claim below is a prediction to falsify, not a fact to trust._

_Concrete refutations from this session, so this preamble is read and not skimmed:_
_(1) **The architect shipped a criterion bound it never executed, inside a prompt claiming all criteria were executed.** The D38 docs prompt's criterion 5 asserted "exactly one `###` line total"; the HEAD blob already carried `### ND grouping (…)` at line 78 — present in the architect's own local blob copy, which was grepped for four other strings but never for `^###`. The implementer caught it, restated the bound correctly, and shipped anyway (the protected property held). Fourth instance of the unexecuted-criterion class, first post-rule — the rule as written was followed for the greps that ran and defeated by a clause that never ran. Refinement in Working rhythm below._
_(2) **The chat → Claude Code delivery channel truncated a commit prompt mid-sentence** — cut after the first `git add` line, no message, no criteria. The implementer stopped correctly after read-only verification, staged nothing, and the re-delivered prompt executed cleanly. Both directions of the paste channel are now known-lossy (last session it was Code → chat dropping raw output). Countermeasure proposed in Working rhythm._

_Begin with the Phase A audit below. **Run it in Git Bash (`MINGW64`), from `/d/Projects/...`, never WSL.** Try to break it._

---

## Start here (Phase A, read-only)

Open **Git Bash**, confirm `uname -s` starts with `MINGW`, `cd /d/Projects/Cultivar/cultivar`, then:

```
bash scripts/session-audit.sh > ../audit.txt 2>&1
echo "exit: $?"
```

Paste `audit.txt` whole. Expected values, each a prediction that can be wrong:

| Check | Expected |
|---|---|
| [1] branch | `main` |
| [2] HEAD | If this handoff is NOT yet committed: `cefd02b`, subject `feat: editable COA draft replaces read-only review (slice 5b)`, parent `cccca70`. If it HAS been committed: a `docs: session handoff` commit whose **parent is `cefd02b`** — its own sha unknowable here. |
| [3] ahead of origin | **0**. Non-zero = an unpushed commit; that is the finding, not an error. |
| [4] working tree | **clean** IF this handoff is already committed. If written-but-uncommitted, expect exactly ` M documentation/SESSION_HANDOFF.md` and nothing else. **If `.env` appears, stop everything.** |
| [5] `.env` ever committed | `(never committed)` |
| [6] client path | `src/lib/supabase.ts` tracked; `lib/` count **0** |
| [7a/b] `.gitignore` blob | line 34 `.env*`, line 35 `!.env.example`, LF. Line 40 bare `example` is template detritus (banked). Unchanged this session. |
| [8] unstable flags | `(none)` |
| [9] `npm test` | **36 passed / 0 failed**, 1 suite. Parser tree untouched this session; re-observed at the 5b build's criterion 3 against the working tree at what became `cefd02b`. |
| [10] `deno test` ingest-coa | **5 passed / 0 failed**. Function untouched this session; observed at this session's start audit (HEAD `d7501af`), carried as a prediction since. |
| [11] `deno check` | exit **0** by inference only — the script STILL does not echo `$?`; silence observed a fifth session. The one-line `chore:` stays banked. |
| [12] `tsc --noEmit` | `(no output)`, exit **0**. Re-observed post-5b (build criterion 1). |
| [13] `expo lint` | **1 error, 0 warnings**, file `use-color-scheme.web.ts`. Re-observed post-5b (build criterion 2). Ceiling, not target. |
| [14] `expo install --check` | `jest@30.4.2` / `@types/jest@30.0.0` misaligned — expected, do not fix. `expo-document-picker` must NOT be flagged. |
| [15] trailers | **exactly ONE, parsed: generic Claude only** (D35, now six exemplars). The audit script's own expectation text may still say two — script staleness, banked; the parse output is the observation. |

**New this session, not covered by the audit script** (each standalone; expected hit counts stated; grep predictions were verified against the pasted file contents before this handoff shipped — the paste, not the repo, so they remain predictions):
- `git grep -n "CoaEditor" -- src/` → exactly **3** hits: **1** in `src/components/coa-editor.tsx` (the `export function CoaEditor` line), **2** in `src/components/add-to-shelf-modal.tsx` (the import; the `ReviewOrGuard` non-empty-arm render).
- `git ls-files src/components/ | grep -c "coa-"` → **1**, and the one hit is `coa-editor.tsx`. `git ls-files src/components/coa-review.tsx` → empty (deleted at `cefd02b`; history is the archive).
- `grep -c "sourceLab" src/components/add-to-shelf-modal.tsx` → **0** (unchanged invariant: the guard must not consult it; `coa-editor.tsx` legitimately renders it).
- `grep -c "detectedAtInit" src/components/coa-editor.tsx` → **4** (interface field, init assignment, two `AnalyteSection` filters) — the frozen-grouping invariant's fingerprint. If this is 0, the D37 no-migration invariant has been refactored or lost; read the file before proceeding.
- `git show HEAD:documentation/design/confirm-edit-screen.md | grep -Fxc '### Placement (slice 5b, D38)'` → **1**.
- `grep -Fc 'neither yet implemented' documentation/design/confirm-edit-screen.md` → **0** (the stale status claim, removed at `cccca70`).

**Schema gate (Supabase SQL editor): NOT re-observed — now FIFTH session carried, and it is no longer deferrable.** Slice 6 (the entry point) writes to the database; the two queries are **mandatory before any slice-6 build prompt exists**:
```
select tablename, rowsecurity from pg_tables where schemaname='public' order by 1;
select tablename, policyname, cmd from pg_policies where schemaname='public' order by 1,2;
```
Expected: five tables, RLS true on all five, 7 policy rows. Migration at `supabase/migrations/20260708220816_create_core_schema.sql`. The SQL editor runs privileged, so `pg_policies` is the observation — row counts prove nothing about RLS.

**Gate assets:** `neutral.pdf` and `animal-face.pdf` — `neutral.pdf` at `/d/projects/cultivar/` (parent of repo, untracked, deliberate) and on the iPhone (Files); `animal-face.pdf` is the contract fixture.

**If any of these don't match, the repo wins — re-baseline before proceeding.**

---

## What shipped (newest first)

- `cefd02b` — feat: editable COA draft replaces read-only review (slice 5b; device-gated, all eight checklist steps incl. frozen-grouping)
- `cccca70` — docs: record D38 placement for slice 5b editor (+ stale status-line correction, + view-source scoped out of 5b)
- Session start HEAD was `d7501af` (prior session's handoff commit). Working tree: clean once this handoff commits.

---

## The arcs

**Phase A verified the prior handoff 20/20 — every audit-covered prediction and all five standalone checks held, including both conditional branches ([2] committed-case, [4] clean-case).** One dissolved alarm: the architect's in-context project-knowledge copies of `CLAUDE.md`/`handoff-specs.md` still say "exactly two trailers" — the known D35 staleness, re-encountered and re-dismissed via the prior session's blob-grep record plus the audit's [15] parse. In-context copies remain snapshots; convention-critical facts are verified against the blob.

**The placement pass produced D38 by reading both files whole before arguing.** `coa-review.tsx` showed `AnalyteSection` recomputing detected/ND from current values per render — same-shaped code as 5b needs, opposite invariant to D37's frozen grouping; reuse would have violated D37 silently. `add-to-shelf-modal.tsx` showed no retained pick identity at all (`phase` + `result`; the URI consumed and dropped) — which settled the remount key as a **pick counter**, since a URI keys wrongly on repick-same-file. D38: new `CoaEditor` component, `CoaReview` deleted in the same code commit, types relocate, draft inside the editor. The plausible future read-only consumer (shelf COA detail) will read DB shape, not parser shape, so retention would have been speculative scaffolding.

**The docs commit (`cccca70`) recorded D38 and cost the architect one criteria defect — the unexecuted `###` bound (preamble (1)).** The corrected bound: exactly two `###` lines, line 78 `### ND grouping (…)` pre-existing, line ~156 `### Placement (slice 5b, D38)` new. The same commit fixed a stale status line ("neither yet implemented" survived 5a's landing because the doc was amended at `4457c37`, before 5a shipped) and scoped the view-source toggle out of 5b via a Non-goals bullet.

**Slice 5b shipped as designed, with three implementer notes ratified at review.** (1) The `nd`→ND text rule is mostly unreachable on-device: iOS decimal-pad has no letters, so clearing the field is the primary ND path; the rule remains implemented for hardware keyboard/paste. (2) "Always-present" ND control means present-while-nonempty — the slice-4 landed meaning; delete every frozen-ND row and the control disappears rather than showing "(0)". (3) Two-tap keyboard flow between cells (blur commits on first tap, second tap opens the next cell) — correct behavior, `keyboardShouldPersistTaps` untouched as out of prompt scope, banked as ergonomics. Device gate passed all eight steps: editor first render (screenshot), clear-to-ND in place, explicit 0 sticks / unparseable reverts, `g CBDVa` → `CBDVa` rename, delete behind confirm, brand-sludge correction, repick freshness (the pick counter's proof), `neutral.pdf` guard as control.

---

## Refuted hypotheses / memory corrections

- **"All acceptance criteria were executed before this prompt shipped"** (architect, in the D38 docs prompt) — FALSE for criterion 5's total-count bound, which was never run against the blob that plainly refuted it. Implementer catch. The property held; the claim did not. See Working rhythm for the refinement.
- **Scrollback contamination, correctly diagnosed at ~90% and confirmed:** a paste opened with the pre-amendment design doc under a `git show HEAD:` prompt line — alarming if fresh, benign if scrollback. Byte-identity with an earlier paste (stray `^C` included) said scrollback; the 5b build prompt's precondition (`grep -Fxc '### Placement…'` → 1 at HEAD) confirmed it. Rule: a stale-looking paste is checked for byte-identity with prior scrollback before it triggers a re-baseline.
- **Both push predictions held exactly** (`d7501af..cccca70`, `cccca70..cefd02b`) — calibration data, not refutations.
- **Claude Code conduct: exemplary again.** The truncated commit prompt (preamble (2)) was handled by stopping after read-only checks with nothing staged; the criterion-5 catch was precise, restated the correct bound, and distinguished the failed bound from the held property. Zero vouching.
- **Still true from prior handoffs:** Git Bash for the audit script, never WSL; JS-only → Metro reload, native-module → EAS build (5b gated on reload); parse trailers, never count; `git show HEAD:<path> | cat` for blob reads; in-context doc copies are stale on D35 (say "two trailers"; repo says one); probe inputs validated against the matcher; long secrets never hand-pasted.

---

## Ratified decisions

D1–D37 stand. New this session:

- **D38 — slice 5b placement: new component, old one retired.** `CoaEditor` at `src/components/coa-editor.tsx`; `CoaReview` deleted in the same commit; exported parser-mirror types move with it; draft state inside the editor, initialized once, remount-keyed by a `pickId` counter in the modal (incremented once per completed pick attempt — a URI would key wrongly on repick-same-file). Grounds: grouping-invariant divergence (recompute-per-render vs frozen-at-init), structurally different props contract (id-keyed draft vs `CoaParseResult`), zero post-5b consumers with the future read-only consumer reading DB shape. Recorded in `confirm-edit-screen.md` at `cccca70`; landed at `cefd02b`.
- **D37 clarifications ratified at review (not new decisions):** "always-present" ND control = present-while-nonempty (slice-4 meaning); `nd`-text path secondary to clear-field on-device; `Number()` accepting exotica (negatives, hex) via paste is tolerated — D37 says a valid number is a valid number.

---

## Open items

### Runnable now
- **Slice 6 — confirm-emit + atomic insert.** Design pass first (the insert mechanism is undecided: the committed contract requires the four-table write to be atomic, permits a Postgres RPC, forbids assuming per-table client REST). **Hard precondition: the schema gate re-observation (see Phase A) — operator-run, before any design is trusted or any build prompt exists.** This is the entry point — see below.

### Blocked
- Nothing hard-blocked. (Slice 6 is gated on an operator action, not blocked.)

### Banked
- **Keyboard ergonomics in the editor** — two-tap flow between cells (`keyboardShouldPersistTaps` default). Cosmetic; fix only if it grates during real use.
- **ND control at zero rows** — disappears if every frozen-ND row is deleted. Ratified behavior; recorded so it isn't re-litigated as a bug.
- **Audit script** — no `$?` echo after `deno check` (fifth session), [15] expectation text likely still says two trailers. One `chore:`, both fixes together.
- **Parser: DRS/Confident `brand` sludge + stray `g CBDVa`** — the editor affordances are now the live human catch (exercised at the gate); fixture-backed parser cleanup remains banked. ~12 more COAs available as fixtures.
- **Guard layout centering** — carried, cosmetic.
- **`identifyLab` brittleness** — carried; the guard is load-bearing; revisit only on a wrong non-empty parse.
- **Stale-result race** — the pick counter incidentally tightened subtree freshness, but the race itself (a slow response landing after a newer pick) remains unverified-absorbed; carried.
- **Carried unchanged:** in-stock data primitive; scoring lexicon (+ `never_again`/`average_score` revisit); session-logging interaction; mood visual language; EAS-build-source unknown (commit-first default); dashboard-only auth config (OTP length, SMTP, `{{ .Token }}`) not in repo; Resend domain verification; config dedupe to per-function `deno.json`; deploy reproducibility (`^1` unpinned); `--no-lock` on deno check/test; url-polyfill necessity; `.gitignore:40`; terpene whitelist; CRLF-on-clone (tolerated warnings again this session, both commits); `unrs-resolver` allow-scripts; `npm audit` template vulns; no Storage bucket / `pdf_url`; failure branch raw `{error}` render (tied to envelope-unwrap redesign + D33 `functions.invoke` migration, post-slice-6).

---

## Working rhythm (only what is in flux)

Stable method lives in `CLAUDE.md` and `documentation/process/handoff-specs.md`.

- **Refined, load-bearing: a criterion is executed only when EVERY CLAUSE of it has run.** A bound stated alongside executed greps is not executed by association; shipping it makes the prompt's "all executed" claim false even when the property holds. Fifth data point in the unexecuted-criterion class, first that defeated the rule as previously worded. Mechanically: before shipping, enumerate each criterion's clauses (pattern, count, location bound, totals) and run each one; a clause that cannot be run pre-ship must be rewritten as the implementer's observation, never asserted as the author's.
- **New: prompts carry a terminal sentinel.** The chat → Code channel truncated a commit prompt mid-sentence this session (preamble (2)). Every prompt now ends with a final line `— END OF PROMPT —`; the implementer treats its absence as truncation: stop, report, change nothing. (This session's prompts predate the rule; the next prompt is the first to carry it.)
- **New: stale-looking pastes are checked for scrollback byte-identity** before triggering a re-baseline (see Refuted). A `^C` artifact or byte-exact repetition of an earlier paste is scrollback, not repo state.
- **Gate-evidence economy, tolerated deviation noted:** this session's device gate returned a single aggregate "All gates passed" rather than per-step verdicts. Accepted with a stated caveat covering the invariant steps. Preference stands: one-line verdict **per step** for the steps the slice exists for (this session: clear-to-ND-in-place, explicit-0, repick freshness); aggregate is fine for regression steps.
- Carried: raw evidence travels via the operator's paste, never the implementer's report alone; every grep criterion executed against the text it gates (now with the every-clause refinement); dump provenance named; prompts stacking on a moving tree state their snapshot.
- The slice pattern (survey → design note → build prompt → typed gate → separate commit prompt → body read → authorize → operator pushes) ran twice more today, clean both times apart from the two channel/criteria findings above; unchanged, keep it.

---

## Entry point

**Slice 6: confirm-emit and the atomic insert — but the schema gate comes first, and it is not optional.** The re-observation (two SQL queries, Supabase SQL editor, operator-run; expected five tables / RLS on all / 7 policy rows) has been carried five sessions and slice 6 is the first slice that writes; a design pass built on an unverified schema would be a trusted narrative about the database. After the gate: a design pass on the insert mechanism — the committed contract (`confirm-edit-screen.md`, "Output / insert contract") already constrains it to a single transactional write across `coas` + `coa_terpenes` + `coa_cannabinoids` + `coa_safety`, permitting a Postgres RPC and forbidding per-table client REST; what remains to decide is RPC vs Edge Function, the parser-key → DB-column mapping (explicitly the insert slice's job), and where the confirm affordance lives in the editor (an `onConfirm` prop was anticipated at D38; the editor currently has no emit). That design amends the doc, then the build prompt — with a terminal sentinel, and with every clause of every criterion executed first. This is the single next move: the editor made the record correctable; slice 6 makes it real.
