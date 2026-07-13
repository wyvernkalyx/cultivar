# Cultivar — Session Handoff

_Written 2026-07-13, against HEAD `2cec835`, pushed and verified (`459cb1a..2cec835 main -> main` observed; this session also observed `2642827..ea9e54e`, `ea9e54e..a882ad3`, `a882ad3..75bf461`, `75bf461..459cb1a` — five pushes)._
_**The repo is authoritative over this document.** Every state claim below is a prediction to falsify, not a fact to trust._

_Concrete refutations from this session, so this preamble is read and not skimmed:_
_(1) **A device gate was reported passed and the database refuted it.** The 6b gate came back as an aggregate "all gates passed"; the read-back showed ONE coas row — the 6a curl insert — where two were predicted. The device insert had never happened. Root cause, owned by the architect's own spec: the confirm button was placed "at the bottom of the editor, below Safety," which puts it below the fold inside the modal's ScrollView — the operator had never seen it. Three hypotheses were drawn (RLS user mismatch / no insert / stale token) and one privileged SQL query (pg join to auth.users) settled it: one row, correct owner. The re-gate then produced the real observations, including the one the pipeline exists for: a user-cleared Humulene reading back NULL among 15 ND rows. Consequence, now a rule: **per-step verdicts are mandatory for UI gates; aggregate verdicts are not evidence.** Two aggregates were offered this session; one was false._
_(2) **The architect's 6a build prompt contained a half-true claim about SQL semantics.** "A missing or null array key must insert zero child rows (SRF strictness covers this)" — SRF strictness covers only the MISSING key (`payload->'x'` on absence → SQL NULL → zero rows). An explicit JSON-null value yields jsonb 'null' and `jsonb_array_elements` raises "cannot extract elements from a scalar" — a clean atomic abort, not zero rows. The implementer dissected this precisely; the case is unreachable from the real client and the committed `coa-insert.md` makes no such claim, so the defect lived and died in the prompt._

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
| [2] HEAD | If this handoff is NOT yet committed: `2cec835`, subject `feat: shelf compendium list on the home screen (slice 7)`, parent `459cb1a`. If committed: a `docs: session handoff` commit whose **parent is `2cec835`**. |
| [3] ahead of origin | **0** |
| [4] working tree | **clean** if this handoff is committed; else exactly ` M documentation/SESSION_HANDOFF.md`. **If `.env` appears, stop everything.** |
| [5] `.env` ever committed | `(never committed)` |
| [6] client path | `src/lib/supabase.ts` tracked; `lib/` count **0** |
| [7a/b] `.gitignore` blob | line 34 `.env*`, line 35 `!.env.example`, LF. Line 40 `example` banked. Unchanged. |
| [8] unstable flags | `(none)` — note the new migration is SQL; the grep still covers `supabase/`. |
| [9] `npm test` | **36 passed**, 1 suite. Parser untouched; re-observed at the slice-7 build criteria. |
| [10] `deno test` ingest-coa | **5 passed**. Function untouched since deploy; carried. |
| [11] `deno check` | exit 0 by inference; script still lacks `$?` echo (SIXTH session). Banked chore. |
| [12] `tsc --noEmit` | `(no output)`, exit 0. Re-observed at slice-7 criteria. |
| [13] `expo lint` | **1 error, 0 warnings** (`use-color-scheme.web.ts`). Re-observed at slice-7 criteria — held only because the implementer restructured an async effect body to promise-callback form mid-slice (see Arcs). |
| [14] `expo install --check` | jest 30 / @types/jest 30 misaligned — expected, do not fix. |
| [15] trailers | **exactly ONE, parsed** (D35). Script's expectation text still stale; banked. |

**New this session, not covered by the audit script:**
- `ls supabase/migrations/` → exactly **two** files: `20260708220816_create_core_schema.sql`, `20260713170757_insert_coa_rpc.sql`.
- `git ls-files documentation/design/` → **six** files: the prior four + `coa-insert.md` + `shelf.md`.
- `git grep -n "ShelfList" -- src/` → exactly **4** hits: 3 in `src/app/index.tsx` (import, comment, keyed render), 1 in `src/components/shelf-list.tsx` (the export). Observed raw at the slice-7 criteria.
- `grep -c "CoaParseResult" src/components/shelf-list.tsx` → **0** (D41: DB shape only).
- `git grep -n "insert_coa" -- src/` → exactly **1** hit, the rpc call in `add-to-shelf-modal.tsx`.
- `grep -c "HintRow\|AnimatedIcon\|expo-device" src/app/index.tsx` → **0** (template scaffolding removed at `2cec835`; the orphaned component FILES still exist — banked chore, `explore.tsx` still imports them).

**Database state (observed this session, NOT predictable as counts):** `insert_coa` deployed (public, `payload jsonb → uuid`, **Invoker** — observed in the dashboard); schema gate CLOSED this session (five tables, RLS all, 7 policies, observed 2026-07-13). The `coas` table now holds **live user data** — rows were added and deleted during gates and exploration. **Do not write Phase A predictions about user-data row counts**; they went stale within minutes this session. The keeper provenance worth knowing: `abe82f1f…` is the 6a curl gate row (fully corrected, Humulene NULL by edit); `d6ba53e7…` is the device ND-gate row (Humulene NULL, brand left as sludge); later exploration rows are uncharacterized.

**Gate assets:** `insert-coa-gate-payload.json` and `insert-coa-broken-payload.json` at `/d/Projects/Cultivar/` (repo parent, untracked, deliberate — the neutral.pdf convention), plus `neutral.pdf` and the animal-face fixture as before.

**If any of these don't match, the repo wins — re-baseline before proceeding.**

---

## What shipped (newest first)

- `2cec835` — feat: shelf compendium list on the home screen (slice 7; device-gated per-step incl. two screenshots)
- `459cb1a` — docs: design slice 7 shelf compendium list (D41)
- `75bf461` — feat: confirm and insert from the editor (slice 6b; gated after a false pass was caught — see Arcs)
- `a882ad3` — feat: insert_coa RPC, the atomic four-table COA write (slice 6a; typed schema/infra gate incl. atomicity control)
- `ea9e54e` — docs: design slice 6 insert (D39 RPC, D40 split)
- Scope note: `2642827` (the prior handoff) and everything before it are covered by the previous handoff, superseded by this file. Session start for this scope = `2642827`.

---

## The arcs

**Slice 6 opened by closing the five-session schema-gate carry, then ratified the RPC.** Both SQL-editor queries pasted whole (five tables, RLS true on all, 7 policy rows), the core-schema migration read end to end the same day — the mapping was designed from a read schema, not memory. D39: `insert_coa(payload jsonb) returns uuid`, security invoker so RLS stays load-bearing, plpgsql body as the atomic four-table transaction, no exception handler BY DESIGN (a constraint failure aborting whole IS the contract), grants to `authenticated` only, mapping at the seam. The typed gate ran as five operator paste-back steps: db push (with tolerated Docker-cache noise), dashboard observation (Database → Functions, not Edge Functions — the operator initially checked the wrong page), D26 token capture, live invoke returning a uuid, read-back (20/16/8, edited-Humulene AND the parser's own `total_cbd` NULL), and the atomicity control: a safety row missing `status` → Postgres `23502`, HTTP 400, exactly one coas id remaining, zero orphans. Gate payloads were derived by running the repo's real parser over the fixture via Node type-stripping — no hand-written analyte values, provenance corroborated by the recovered brand sludge.

**Slice 6b shipped clean and gated dirty — the false pass is the session's most important event.** The code was right on first review (emission strip-by-construction, error state separated from `result` so the draft survives failure, guard branch gaining no confirm path). The gate came back "all gates passed"; the read-back said one row. Dissection: three hypotheses, one privileged SQL join settled it — no device insert had ever occurred, because the confirm button (placed per the architect's own spec at the editor's bottom, inside the ScrollView) renders below the fold and had never been seen. The re-gate then observed everything for real, including a second sequencing confusion: the operator's airplane test toggled airplane BEFORE picking, producing the ingest failure branch (screenshot: monospace network error, no editor) instead of the confirm-error path; re-instructed with exact ordering, then passed. The user-made ND closed last: Humulene cleared on-device, read back as 15 nulls with Humulene in the list, against the earlier 14-null control proving the RPC doesn't blanket-null.

**Slice 7 landed D38's prediction and retired the template.** `shelf.md` designed the compendium under the metaphor's disciplines — neutral by construction (zero sessions exist), null totals render ND, `created_at` desc only with discipline 1 explicitly extended from coloring to ordering — and `product-metaphor.md`'s stale "active path" paragraph was corrected in the same docs commit. The build removed the Expo hero/hints from `index.tsx`, added `ShelfList` reading DB shape (snake_case columns; `CoaParseResult` banned from the file — the read-only consumer D38 predicted, vindicating the CoaReview retirement), refetch via an onClose-bumped remount key. Implementer course-correction worth keeping: the first `load` draft was an async effect body, tripping `react-hooks/set-state-in-effect` (lint 2 > baseline); restructured to promise-callback form matching the template's own `getSession().then()` pattern, baseline restored. Gate: screenshots at 2:27 and 2:28 showing a genuinely new COA (Cosmic Cereal) appearing on modal close without restart, with ND and a real CBD value (`0.0852%`) rendering side by side — the three-state invariant visible in one frame.

---

## Refuted hypotheses / memory corrections

- **"All gates passed" (6b, aggregate)** — FALSE; refuted by read-back. Root cause the architect's below-the-fold button spec. Per-step verdicts now mandatory (see Working rhythm).
- **SRF half-truth in the 6a prompt** (architect) — preamble (2). Missing key → zero rows; explicit JSON-null → clean atomic abort. Committed docs never carried the error.
- **"Both shelf rows show the corrected brand"** (architect's slice-7 gate prediction) — WRONG: `d6ba53e7` was inserted with the sludge brand (the operator's ND run corrected Humulene but not the brand). Predictions about user-owned data are stale on arrival; Phase A predicts repo state only.
- **Criterion count miss** (slice 7, `ShelfList` hits predicted 3, actual 4 — a comment): the binding clause (files) held; counts about not-yet-written code are predictions by nature and were labeled so.
- **Operator dashboard navigation**: Postgres functions live at Database → Functions, not Edge Functions — checked wrong page once, corrected.
- **Airplane-test sequencing**: toggling airplane before the pick exercises the ingest failure branch, not confirm error. The test's value is in the ORDER: online pick → edit → offline → confirm.
- **Claude Code conduct: excellent throughout** — the SRF dissection, the lint course-correction with the template's own pattern cited, byte-faithful verbatim inserts five times, zero vouching, and the sentinel confirmed present in every prompt that carried it (no truncations this session).
- **Still true:** parse trailers never count; blob reads via `git show HEAD:`; in-context doc copies stale on D35; probe inputs validated against mechanisms; long secrets by command substitution (exercised again for the token, 922 chars clean).

---

## Ratified decisions

D1–D38 stand. New this session:

- **D39 — insert mechanism: single Postgres RPC** (`insert_coa(payload jsonb) returns uuid`, security invoker, atomic plpgsql body, mapping at the seam, grants to authenticated only). Grounds in `documentation/design/coa-insert.md` at `ea9e54e`; landed `a882ad3`; gate-observed live including the atomicity control.
- **D40 — slice split 6a/6b, 6a gates first; gate row kept** as the first genuine shelf entry (operator may delete; the duplicate `ad93b685` WAS deleted via authenticated REST, HTTP 204 — incidentally observing RLS-scoped cascade from a user token).
- **D41 — slice 7 shelf compendium**: home screen becomes the shelf, template scaffolding removed, DB-shape reads, neutral cards, created_at desc only (chemistry orders nothing), refetch on modal close + pull-to-refresh. Grounds in `documentation/design/shelf.md` at `459cb1a`; landed `2cec835`.

---

## Open items

### Runnable now
- **Delete-from-shelf — the entry point** (see below). Lived demand is concrete: junk rows accumulate from gates and exploration, and today the operator deletes them by hand-built curl.

### Blocked
- Books / moods / bands / Never Again / session logging — all blocked on the **scoring lexicon design pass** (the heart of the product; its own dedicated session).
- In-stock — blocked on schema (no possession state).

### Banked (new this session)
- **Confirm button below the fold** — caused the false gate; the fix (action pinned outside the scroll region) crosses the editor/modal boundary and is its own small slice, not a tweak. High priority among banked.
- **Confirming-window race variant** — Pick-another mid-insert abandons an in-flight rpc; unlike the ingest race, a row IS inserted when this fires. Adjoins the banked stale-result race; this is the arm that matters if ever fixed.
- **Blank brand line on cards** — empty metadata renders an empty line (Cosmic Cereal). Cosmetic.
- **Template orphans** — `hint-row.tsx`, `animated-icon.*`, `explore.tsx` (which still imports them). One `chore:`.
- **Docker-cache warning on `supabase db push`** — "failed to cache migrations catalog… docker_engine" is caching noise on a successful push; tolerated class.
- **MinTTY/node pipe quirk** — `stdin is not a tty` when piping curl into `node -e`; countermeasure is file + `require()`, used successfully twice.

### Banked (carried)
- Audit script `$?` echo + stale [15] text (one chore); parser brand-sludge/`g CBDVa` cleanup (~12 fixtures available; the editor affordances are the live human catch, now exercised in production data); guard layout centering; `identifyLab` brittleness; envelope-unwrap redesign + D33 `functions.invoke` migration (failure branch still renders raw `{error}` — observed live this session in the airplane screenshot); dashboard-only auth config; Resend domain verification; deploy reproducibility; `--no-lock`; url-polyfill; `.gitignore:40`; terpene whitelist; CRLF warnings (fired on every commit this session, tolerated); `unrs-resolver`; `npm audit` template vulns; no Storage bucket / `pdf_url`; payload-shape validation (banked with envelope-unwrap).

---

## Working rhythm (only what is in flux)

Stable method lives in `CLAUDE.md` and `documentation/process/handoff-specs.md`.

- **HARDENED: per-step verdicts are mandatory for UI gates.** An aggregate "all gates passed" is not evidence; two were offered this session and one was false. The checklist numbers the steps; the verdict names them. Screenshots stay reserved for first renders.
- **HARDENED: every DB-writing gate includes a read-back.** The read-back, not the screen, caught the false pass. For inserts: row presence, the invariant values (NDs as NULL), and where applicable a control (the 14-vs-15 Humulene pattern).
- **New: Phase A predicts repo state, never user-data state.** Shelf rows changed between a read-back and its gate within minutes.
- **Sentinel confirmed working**: `— END OF PROMPT —` carried in every prompt this session; the implementer verified it each time; zero truncations. Keep it.
- **Every-clause rule held** (post-edit simulations run for both docs passes; the slice-7 count miss was a labeled prediction about unwritten code, which the rule permits — the binding clause was executed).
- **Operator hand-holding pattern**: for multi-step credentialed flows, one action per message with an expected output and a stop condition beats a block of steps; the token flow succeeded on this pattern after two quoting failures cost nothing.
- The slice pattern ran three more times (6a, 6b, 7) including a full typed schema/infra gate executed as operator paste-backs; unchanged, keep it.

---

## Entry point

**Delete-from-shelf.** The lived demand is already here: gate and exploration rows accumulate (the sludge-branded `d6ba53e7` sits on the shelf now), and deletion currently requires the operator to hand-build an authenticated curl — which was done once this session (`ad93b685`, HTTP 204, cascade observed). The slice is small but principled: a data-destroying affordance on the card (the shelf's first interaction), behind a confirm that names what it destroys (the COA and all its analyte rows — sessions don't exist yet, so no history is at stake, which is exactly why NOW is the cheap time to build it), DELETE via the client with RLS scoping, list refetch on completion. It opens with a short design pass amending `shelf.md` (cards gain exactly one interaction; the non-interactive claim is superseded), then the established rhythm. The below-the-fold confirm fix is the named follow-on, not part of this slice. This is the single next move: the shelf just became real, and a shelf you can't take things off of isn't yours.
