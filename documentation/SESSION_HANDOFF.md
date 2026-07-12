# Cultivar — Session Handoff

_Written 2026-07-12, against HEAD `8f2ba20`, pushed and verified (`ffbbb49..8f2ba20 main -> main` observed this session; earlier, `754966d..ffbbb49` also observed)._
_**The repo is authoritative over this document.** Every state claim below is a prediction to falsify, not a fact to trust._

_Concrete refutations from this session, so this preamble is read and not skimmed:_
_(1) **Slice 4's first device gate refuted the architect's cast.** `IngestResult.json` is the transport envelope `{data: <parse>}`, not the parse object — the screen crashed at `safety.map` with every property read undefined. The envelope was documented in the prior handoff's own D33 grounds and in `coa-ingest-transport.md`, and the architect still designed the cast from a local `parseCoa()` dump instead of the seam's payload. The `as` cast silenced `tsc` at exactly the divergence; the device gate caught what the type checker was told to ignore. Lesson, promoted below: design-from-dump must name WHICH dump — the parser's output and the seam's payload are different objects._
_(2) **The session's opening premise was itself refuted, in the useful direction.** The prior handoff asserted "at least one of {handoff summary, design doc} is stale" over `lab` vs `sourceLab`. Neither was: they are two coexisting keys with different meanings (`lab` = "DRS Testing", display name; `sourceLab` = "drs-confident", parser-dispatch enum), both declared in `types.ts`, and the design doc already handled both correctly. The prior on-device observation "the key is `lab`" was true but incomplete — an enumeration that ended in an ellipsis got remembered as exhaustive._

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
| [2] HEAD | If this handoff is NOT yet committed: `8f2ba20`, subject `docs: single generic co-author trailer (D35)`, parent `ffbbb49`. If it HAS been committed: a `docs: session handoff` commit whose **parent is `8f2ba20`** — its own sha unknowable here. |
| [3] ahead of origin | **0**. Non-zero = an unpushed commit; that is the finding, not an error. |
| [4] working tree | **clean** IF this handoff is already committed. If written-but-uncommitted, expect exactly ` M documentation/SESSION_HANDOFF.md` and nothing else. **If `.env` appears, stop everything.** |
| [5] `.env` ever committed | `(never committed)` |
| [6] client path | `src/lib/supabase.ts` tracked; `lib/` count **0** |
| [7a/b] `.gitignore` blob | line 34 `.env*`, line 35 `!.env.example`, LF. Line 40 bare `example` is template detritus (banked). |
| [8] unstable flags | `(none)` |
| [9] `npm test` | **36 passed / 0 failed**, 1 suite. Parser tree untouched this session. |
| [10] `deno test` ingest-coa | **5 passed / 0 failed**. `ingest-coa/index.ts` untouched this session (read for the envelope precondition; not edited). |
| [11] `deno check` | exit **0** by inference only — the script still does not echo `$?` for this step; silence was observed again this session. The one-line `chore:` fix stays banked. |
| [12] `tsc --noEmit` | `(no output)`, exit **0**. |
| [13] `expo lint` | **1 error, 0 warnings**, file `use-color-scheme.web.ts`. Ceiling, not target. |
| [14] `expo install --check` | `jest@30.4.2` / `@types/jest@30.0.0` misaligned — expected, do not fix. `expo-document-picker` must NOT be flagged. |
| [15] trailers | **exactly ONE, parsed: generic Claude only.** CHANGED from the prior handoff's two — D35 landed this session. If the audit script's own expectation text still says two, that is script staleness, not repo drift; the parse output is the observation. |

**New this session, not covered by the audit script** (each standalone; write expected hit counts, not "nothing else" — see refutation on the `SUPABASE_URL` grep below):
- `git grep -n "coa-review" -- src/` → exactly **1** hit: the import in `src/components/add-to-shelf-modal.tsx`.
- `git grep -n "CoaParseResult" -- src/` → hits in exactly **2** files: definition/export in `src/components/coa-review.tsx`, import + envelope cast in `src/components/add-to-shelf-modal.tsx`.
- `grep -c "No implementation yet" documentation/design/confirm-edit-screen.md` → **0** (Status line now says partially implemented).
- `grep -ci "exactly two co-author" CLAUDE.md` → **0**; `grep -c "Opus" CLAUDE.md` → **0** (D35).
- `git ls-files documentation/design/` → the same four files as last session: `add-to-shelf-navigation.md`, `coa-ingest-transport.md`, `confirm-edit-screen.md`, `product-metaphor.md`.

**Deployed function: current, untouched.** No redeploy occurred or is needed. The live deployed response was observed on-device this session rendering through the new structured view — including `source: drs-confident`, which converts the prior session's `sourceLab`-in-live-response inference into observed fact.

**Schema gate (Supabase SQL editor): NOT re-observed — third session carried.** Five tables, RLS on all five, `pg_policies` → 7 rows; migration at `supabase/migrations/20260708220816_create_core_schema.sql`. Slice 5 (editing) is client-state only and does not INSERT; the two queries become **mandatory** before slice 6.

**If any of these don't match, the repo wins — re-baseline before proceeding.**

---

## What shipped (newest first)

- `8f2ba20` — docs: single generic co-author trailer (D35)
- `ffbbb49` — feat: structured read-only render of the ingest result (slice 4; device-gated, incl. one refuted-and-fixed envelope cast)
- Session start HEAD was `754966d` (prior session's handoff commit). Working tree: clean once this handoff commits.

---

## The arcs

**Slice 4 opened by refuting its own entry premise.** The mandated key-name reconciliation (read-only Claude Code dump of `parseCoa(extractText(animal-face.pdf))` diffed against `confirm-edit-screen.md`) found no staleness: `lab` and `sourceLab` coexist with different meanings, and the doc already treated both correctly. The real drift was internal — the doc's display-only section named DB snake_case columns (`source_lab`, `total_thc`, …) despite its own parser-key framing. D34 fixed that, named the per-item `pct` key, and recorded the render decisions. Every quantitative prediction in the doc (20/16 analytes, 6/2 detected, 14/14 ND, 8 safety rows) was confirmed by the dump, and the ND invariant passed with a 28-row null control set.

**The build shipped through one device-refuted design — the architect's, not the implementer's.** `CoaReview` (`src/components/coa-review.tsx`) is props-only and presentational: five sections (metadata, totals, terpenes-before-cannabinoids, safety — terpene profiles are the product's signal), detected rows in parser emission order, ND rows collapsed-never-hidden under a count control, `null` rendered as the literal string `ND` everywhere including `totalCbdPct`. The type is a local mirror of the observed parse shape — server types under `supabase/` must not enter the Metro bundle (accepted duplication debt). First gate crashed on the envelope cast (preamble (1)); the fix unwraps `(result.json as {data: CoaParseResult}).data` inline where `result.ok` is already narrowed, and the refutation is recorded in `coa-ingest-transport.md`. Second gate passed whole: full structured render of animal-face live, both ND groups expand/collapse with `g CBDVa` visible as `ND`, cancel/close/reopen/repick/tabs intact. The failure branch of `done` is untouched.

**D35 landed as its own arc.** The model-specific second trailer went stale on its first model change (`CLAUDE.md` named Opus 4.8; this session's architect was Fable 5), its attribution precision was illusory (architect and implementer are separately-versioned models; it named only one), and it cost a handbook edit per release. One generic trailer, permanently, forward-only; `CLAUDE.md` and `handoff-specs.md` §3.4 both updated; the parse-never-count rule and its `90bad0a` example survive verbatim. `8f2ba20` is the convention's first exemplar.

---

## Refuted hypotheses / memory corrections

- **"`IngestResult.json` is the parse object."** REFUTED on-device: it is the envelope `{data: <parse>}`; the parse object never appears un-enveloped on the client. Recorded in `coa-ingest-transport.md`. The design error was dump-provenance confusion: props were designed from the local parser dump, which has no envelope. Any future design-from-dump must name which seam's payload it describes.
- **"At least one of {prior handoff, confirm-edit doc} is stale on `sourceLab`."** REFUTED — the premise was wrong, not either document. Two coexisting keys; see preamble (2).
- **"Values observed on-device prove client-path fidelity"** (prior session's claim) — weakened one structural level: values were observed, the payload's top-level shape never was; the raw-JSON view displayed the envelope unremarked. Value fidelity held; the shape claim was never actually made by the evidence.
- **The `SUPABASE_URL` grep prediction failed a strict reading** while its intended property held: "an export, an import + usage, nothing else" met 5 hits, because `EXPO_PUBLIC_SUPABASE_URL` contains the search string. Predictions about grep output must state expected hit counts, not "nothing else." (Applied to this handoff's own grep list above.)
- **Inference graduated to fact:** `sourceLab` is present in the live deployed response — observed on-screen (`source: drs-confident`) this session.
- **Claude Code conduct: zero vouching instances this session** (streak broken in the good direction), and two unprompted correct behaviors worth trusting slightly more: it converted the architect's push authorization into a `rev-list → 0` observation before staging on it, and its inline-cast deviation from the fix prompt's example was better than the example and disclosed as a deviation. One judgment call to watch: it proceeded past a status-file-set contradiction because the extra entry was explainable (a prior fix's file). Sound here; the countermeasure is on the prompt author — prompts stacking on a moving tree must state their snapshot moment and explicitly tolerate known later-arriving entries, so STOP stays sharp for unexplained contradictions.
- **Still true from prior handoffs:** Git Bash for the audit script, never WSL; native-module change → new EAS build, JS-only → Metro reload (slice 4 gated on reload); parse trailers never count; `git show HEAD:<path> | cat` for blob reads; 6-digit OTP; screenshots from the iPhone are painful — gates are now written so one-line text pass/fail verdicts suffice except for the first render of a brand-new screen.

---

## Ratified decisions

D1–D33 stand. New this session:

- **D34 — `confirm-edit-screen.md` speaks parser-key space throughout.** Display-only metadata names are `sourceLab` / `totalThcPct` / `totalCbdPct` / `totalTerpenesPct`; DB column mapping belongs to the insert slice and the doc says so generically (no literal snake_case tokens, keeping absence greppable); analyte-row prose names the `pct` key; a "Slice 4 read-only render (landed)" subsection records section order and ND treatment; the Status line reads partially-implemented. Landed `ffbbb49`.
- **D35 — exactly one co-author trailer, `Co-Authored-By: Claude <noreply@anthropic.com>`, permanently.** Forward-only; existing commits stand under the convention of their time. Grounds in the arc above and in `8f2ba20`'s body. Resolves the long-banked "CLAUDE.md model-trailer simplification."

---

## Open items

### Runnable now
- **Slice 5 — editing** (metadata free-text, analyte name/value/delete with the three-state rule). **This is the entry point** — see below.

### Blocked
- Nothing hard-blocked.

### Banked
- **Unknown-lab path behavior post-slice-4 is UNKNOWN** (changed this session): D28's note "renders as raw JSON today" is stale — the raw view is gone. An unknown-lab request now lands either in the failure branch (if the function 4xxs) or as a near-empty `CoaReview` (if it 200s with nulls); nobody has observed which. Slice 5's design pass should check the function's unknown-lab arm read-only. The honest blocking state remains its own slice before slice 6 ships.
- **Envelope unwrap-at-the-seam redesign** (new, sharpened): move the unwrap into `src/lib/ingest-coa.ts` so no consumer sees the envelope — and consider BOTH arms together (`{data}` on success, `{error}` bodies rendering raw in the failure branch today). Related to, and should be decided alongside, the banked `functions.invoke` migration (D33). Post-slice-6, low.
- **Stale-result race** — NOT verified absorbed by slice 4's rewrite; the state machine is unchanged, so the race likely persists with the structured view now receiving the late result. Still benign; fix only if it annoys.
- **Audit script: no `$?` echo after `deno check`** — observed silent again. One-line `chore:`. The script's [15] trailer expectation may also now be stale against D35 — check when touching it.
- **Parser: DRS/Confident `brand` sludge + stray `g CBDVa`** — now rendered verbatim in the structured UI (observed on-device). The confirm/edit screen (slices 5–6) is the human catch; fixture-backed parser cleanup remains banked. ~12 more COAs available as fixtures.
- **Carried unchanged:** in-stock data primitive; scoring lexicon (+ `never_again`/`average_score` revisit); session-logging interaction; mood visual language; EAS-build-source unknown (commit-first remains default); dashboard-only auth config (OTP length, SMTP, `{{ .Token }}`) not in repo; Resend domain verification; config dedupe to per-function `deno.json`; deploy reproducibility (`^1` unpinned); `--no-lock` on deno check/test; url-polyfill necessity; `.gitignore:40`; terpene whitelist; CRLF-on-clone; `unrs-resolver` allow-scripts; `npm audit` template vulns; no Storage bucket / `pdf_url`. REMOVED from banked: model-trailer simplification (resolved, D35).

---

## Working rhythm (only what is in flux)

Stable method lives in `CLAUDE.md` and `documentation/process/handoff-specs.md`.

- **New: dump provenance is named in every design pass.** "Designed from the dump" is incomplete; the parser's local output and the seam's client payload are different objects. Any props/shape design states which one it derives from, and a cast at a seam is treated as an assertion needing its own observation, not a formality.
- **New: prompts stacking on a moving tree state their snapshot.** Current-state blocks written mid-loop name the moment they describe and explicitly tolerate known later-arriving entries (e.g. a parallel fix's file), so the STOP-on-contradiction rule stays reserved for unexplained drift.
- **Grep predictions carry expected hit counts** — "nothing else" is not a prediction, it's an invitation to a substring surprise.
- **Gate evidence economy:** operator text pass/fail per numbered item is the standard; screenshots only for the first render of a new screen or visible defects.
- The slice-N pattern (survey → design note → build prompt → typed gate → separate commit prompt → body read → authorize → operator pushes) ran twice more today including a mid-loop device refutation; unchanged, keep it.

---

## Entry point

**Slice 5: editing, inside the confirm/edit screen design.** Open with a short design pass that (a) re-reads `documentation/design/confirm-edit-screen.md` whole — it changed this session (D34) and is the governing spec; (b) checks, read-only, what the deployed function's unknown-lab arm actually returns, because the raw-JSON fallback that used to make that path legible is gone and its current behavior is unobserved (see Banked); and (c) settles the editing primitives before any build prompt: controlled-input strategy for metadata free-text, the three-state value editor (number ⇄ ND, never 0-as-default), and row delete/rename mechanics — the doc specifies WHAT is editable; the interaction HOW is the open design question. The gate is typed UI-visible: physical iPhone via Metro reload, and must include the three-state invariant exercised live (edit a value to ND and back; confirm no `0` ever appears as a stand-in). Confirm-emit and any INSERT stay in slice 6, behind the re-observed schema gate. This is the single next move: it turns the readable screen into a correctable one, which is the entire reason the human gate exists.
