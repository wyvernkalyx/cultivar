# Cultivar — Session Handoff

_Written 2026-07-12, against HEAD `8a0d331`, pushed and verified (`7d11904..8a0d331 main -> main` observed this session; earlier, `2a513ca..7d11904` also observed)._
_**The repo is authoritative over this document.** Every state claim below is a prediction to falsify, not a fact to trust._

_Concrete refutations from this session, so this preamble is read and not skimmed:_
_(1) **The slice 3 byte-transport design was refuted by the first device gate.** The plan was `fetch(file://uri)` → `.blob()` → request body. On this stack the file read succeeds but React Native cannot construct a `Blob` from an ArrayBuffer — the screen showed the exact throw. The fix (ArrayBuffer as the body directly) passed the full gate. The refutation is recorded in `documentation/design/coa-ingest-transport.md` with a fallback ladder. Do not reintroduce a Blob at that seam._
_(2) **The prior handoff's parser key claim did not survive contact with live output.** It said the parser emits `sourceLab`; the live ingest response observed on the iPhone shows the key `lab` (alongside `brand`, `strain`, `batch`, `totalThcPct`, `totalCbdPct`, `totalTerpenesPct`, `cannabinoids[{name,pct}]`, …). At least one carried key name was wrong. Slice 4's design MUST open by reconciling `documentation/design/confirm-edit-screen.md` field names against a fresh live dump — do not design the structured render from remembered keys._
_(3) **Third recorded instance of Claude Code vouching instead of observing:** the slice 3 commit-verification report elided the commit body as "[body as prescribed — full text in the tool output above]". The push was held; `git log -1 --format=%B | cat` was demanded and read line-by-line before authorization. This is now a pattern, not an incident: any criterion whose evidence is "this text matches" must be satisfied by the raw text in the message, never a reference to it._

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
| [2] HEAD | If this handoff is NOT yet committed: `8a0d331`, subject `feat: pick a COA PDF and ingest it live, raw JSON on screen (slice 3)`, parent `7d11904`. If it HAS been committed: a `docs: session handoff` commit whose **parent is `8a0d331`** — its own sha unknowable here. |
| [3] ahead of origin | **0**. Non-zero = an unpushed commit; that is the finding, not an error. |
| [4] working tree | **clean** IF this handoff is already committed. If written-but-uncommitted, expect exactly ` M documentation/SESSION_HANDOFF.md` and nothing else. **If `.env` appears, stop everything.** |
| [5] `.env` ever committed | `(never committed)` |
| [6] client path | `src/lib/supabase.ts` tracked; `lib/` count **0** |
| [7a/b] `.gitignore` blob | line 34 `.env*`, line 35 `!.env.example`, LF. Line 40 bare `example` is template detritus (banked). |
| [8] unstable flags | `(none)` |
| [9] `npm test` | **36 passed / 0 failed**, 1 suite. Parser tree untouched this session. |
| [10] `deno test` ingest-coa | **5 passed / 0 failed**. `ingest-coa/index.ts` untouched this session. |
| [11] `deno check` | exit **0**. Note: the audit script does not echo `$?` for this step — silence observed again this session; a script improvement is banked. |
| [12] `tsc --noEmit` | `(no output)`, exit **0**. |
| [13] `expo lint` | **1 error, 0 warnings**, file `use-color-scheme.web.ts`. Ceiling, not target. |
| [14] `expo install --check` | `jest@30.4.2` / `@types/jest@30.0.0` misaligned — expected, do not fix. `expo-document-picker` must NOT be flagged. |
| [15] trailers | exactly two, parsed: generic Claude + `Claude Opus 4.8 (1M context)`. |

**New this session, not covered by the audit script** (each grep standalone):
- `git grep -n "expo-document-picker" -- src/` → hits ONLY in `src/components/add-to-shelf-modal.tsx` (the picker is now wired — changed from the prior handoff's "unwired" state).
- `git grep -n "functions.invoke" -- src/` → **no hits** (D33: raw fetch, not the SDK method).
- `git grep -n "SUPABASE_URL" -- src/` → an export in `src/lib/supabase.ts`, an import + usage in `src/lib/ingest-coa.ts`, nothing else.
- `git ls-files documentation/design/` → four files: `add-to-shelf-navigation.md`, `coa-ingest-transport.md`, `confirm-edit-screen.md`, `product-metaphor.md`.

**Deployed function: observed current this session.** The live client invoke against deployed `ingest-coa` returned the expected `{ data: … }` shape with real parsed values (2026-07-12, on-device). No redeploy occurred or is needed for slice 4.

**Schema gate (Supabase SQL editor): NOT re-observed this session** (second session carried). Five tables in `public`, RLS on all five, `pg_policies` → 7 rows; migration tracked at `supabase/migrations/20260708220816_create_core_schema.sql`. Re-run the two queries before any slice that INSERTs — slice 4 is render-only and does not.

**If any of these don't match, the repo wins — re-baseline before proceeding.**

---

## What shipped (newest first)

- `8a0d331` — feat: pick a COA PDF and ingest it live, raw JSON on screen (slice 3; device-gated incl. one refuted-and-fixed transport design)
- `7d11904` — feat: add "add to shelf" entry with placeholder modal (slice 2; device-gated)
- Session start HEAD was `2a513ca` (prior session's handoff commit). Working tree: clean once this handoff commits.

---

## The arcs

**Slice 2 settled the nav primitive by refuting the architect's first leaning.** The plan going in was "modal via a root Stack wrapper." A read-only routing survey showed the prior handoff's "two NativeTabs, no Stack" was true but structurally incomplete: the root layout is not a navigator at all — `src/app/_layout.tsx` is an auth-gated component swap (`loading`/`signedOut`/`signedIn`), with `NativeTabs` living in `src/components/app-tabs.tsx` via the `expo-router/unstable-native-tabs` import. A router modal would have required a `(tabs)`-group restructure and re-plumbing the auth gate — the only device-proven flow. D32 (ratified): component-state RN `Modal` (`pageSheet`), no routing, restructure deferred behind a named trigger ("a designed flow requires routed/pushed navigation"). Grounds: `documentation/design/add-to-shelf-navigation.md`.

**Slice 3 proved the never-run client path end-to-end, through one device-refuted design.** Transport was designed against the observed function contract (`ingest-coa/index.ts` read whole: POST + `application/pdf` + raw bytes + user JWT via `withSupabase({auth:'user'})`; `{data}` on 200, `{error}` on 405/415/400). D33 (architect-decided, operator assented): raw authenticated fetch instead of `supabase.functions.invoke` — mirrors the proven shell request, maximally observable for the riskiest slice, trivially reversible. First gate failed at byte acquisition (Blob refutation, preamble (1)); the ArrayBuffer fix passed the full six-step gate: picker cancel control, live ingest of animal-face with real values on screen (`DRS Testing`, `Animal Face`, `ANFA-003-FL8`, THC 32.69, terpenes 1.4977 — byte integrity proven by the parser itself), repeat pick, close-from-result → reopen-at-idle, tabs intact. Both banked parser defects reproduced on the live path (`brand` sludge "Adult Use Powered by Condent LIMS 1 of 8 Moby & Zeke, LLC", stray `g CBDVa` row) — the client path returns the same output as the prior shell invoke, which is itself evidence of fidelity.

**The seam layout that slice 4 builds on:** `src/lib/ingest-coa.ts` exports `ingestCoaPdf(fileUri) → Promise<IngestResult>` (a never-throwing discriminated union: `{ok:true,status,json}` | `{ok:false,status|null,body,message}`); `src/lib/supabase.ts` now exports `SUPABASE_URL` / `SUPABASE_ANON_KEY`; the modal owns a `'idle'|'picking'|'sending'|'done'` state machine with a `close` wrapper that resets state (the component stays mounted while the Modal is hidden — resetting in the close path avoids a `setState`-in-effect lint error).

---

## Refuted hypotheses / memory corrections

- **"`fetch(uri).blob()` is the byte path."** REFUTED on-device: RN cannot construct a Blob from an ArrayBuffer. `fetch(file://)` itself works; the body is the ArrayBuffer directly (lossless — RN networking base64s it internally). Fallback ladder if it ever regresses: XHR with the same ArrayBuffer, then `expo-file-system` (native module → EAS build → re-typed gate). See `coa-ingest-transport.md`.
- **"The parser emits `sourceLab`."** Contradicted by live output: the key is `lab`. The prior handoff carried `sourceLab`; either that summary or the confirm-edit doc is stale against reality. UNRESOLVED which — reconcile at the top of slice 4 (see entry point).
- **"Two NativeTabs, no Stack" (prior handoff).** True but incomplete: the root layout is an auth-gated component swap, not a navigator; `NativeTabs` is in `src/components/`, not `src/app/`, via an *unstable* expo-router import. The completion mattered — it flipped the slice 2 design.
- **Claude Code vouching, instance three:** commit body elided as "[body as prescribed]" inside an otherwise-clean verification report. The vouch can appear in ANY report section, not just blob-read gates. Countermeasure promoted to working rhythm: commit prompts now carry a `git log -1 --format=%B | cat` criterion.
- **Paste-layer artifact, benign:** blank lines in commit messages collapse in Git Bash → chat pastes. The functional check for trailer separation is `interpret-trailers --parse` succeeding, not visual blank lines in the paste.
- **Still true from prior handoffs:** Git Bash for the audit script, never WSL (plain `git` commands from PowerShell were accepted this session — fine for standalone commands, but PS shows no exit status, so empty grep output is ambiguous there); native-module change → new EAS build, JS-only → Metro reload; parse trailers never count; `git show HEAD:<path> | cat` for blob reads; 6-digit OTP.

---

## Ratified decisions

D1–D31 stand. New this session:

- **D32 — D30's nav primitive is a component-state RN `Modal` (`pageSheet` on iOS), not a routed screen.** No Stack, no route file, no change to the auth-gated root layout. Restructure-to-routing is deferred behind a named trigger: a designed flow that requires routed/pushed navigation, known at design time. Grounds and the rejected router-modal alternative: `documentation/design/add-to-shelf-navigation.md` (landed `7d11904`).
- **D33 — Slice 3's transport is raw authenticated fetch, amending D27's `invoke()` wording.** Bearer token + `apikey` + explicit `Content-Type: application/pdf` to `<SUPABASE_URL>/functions/v1/ingest-coa`. Architect-decided with operator assent (the operator explicitly delegated this call). Byte body is an ArrayBuffer (post-refutation). Grounds: `documentation/design/coa-ingest-transport.md` (landed `8a0d331`). Migration to `functions.invoke` is banked, post-slice-6, low priority.

---

## Open items

### Runnable now
- **Slice 4 — structured read-only render** (metadata / analyte / ND grouping / safety) replacing the raw-JSON view inside the modal. **This is the entry point** — see below. Its design pass opens with the key-name reconciliation.

### Blocked
- Nothing hard-blocked.

### Banked
- **Key-name reconciliation is folded into slice 4's design**, not separately banked — listed here so it isn't lost if slice 4 is re-scoped: `confirm-edit-screen.md` field names vs. live response keys (`lab` observed; `sourceLab` was carried).
- **Stale-result race** (new): swipe-dismissing while `Sending…` lets the in-flight result land in the hidden-but-mounted modal. Benign, evidence-preserving; likely absorbed by slice 4's rewrite. Fix only if it annoys.
- **Audit script: no `$?` echo after the `deno check` step** (new) — silence is currently ambiguous between warm-cache success and a swallowed failure. One-line `chore:`.
- **`functions.invoke` migration decision** (new, D33) — post-slice-6, low.
- **Unknown-lab empty-shell UX** (D28) — renders as raw JSON today; the honest blocking state is its own slice before confirm/edit ships.
- **Parser: DRS/Confident `brand` pollution + stray `g CBDVa`** — now reproduced on the live client path, verbatim on-screen. The confirm/edit screen (slices 5–6) is the human catch; the fixture-backed parser cleanup remains banked. ~12 more COAs available as fixtures.
- **Carried unchanged:** in-stock data primitive; scoring lexicon (+ `never_again`/`average_score` revisit); session-logging interaction; mood visual language; CLAUDE.md model-trailer simplification; EAS-build-source unknown (commit-first remains the default); dashboard-only auth config (OTP length, SMTP, `{{ .Token }}`) not in repo; Resend domain verification; config dedupe to per-function `deno.json`; deploy reproducibility (`^1` unpinned); `--no-lock` on deno check/test; url-polyfill necessity; `.gitignore:40`; terpene whitelist; CRLF-on-clone; `unrs-resolver` allow-scripts; `npm audit` template vulns; no Storage bucket / `pdf_url`.

---

## Working rhythm (only what is in flux)

Stable method lives in `CLAUDE.md` and `documentation/process/handoff-specs.md`.

- **Commit prompts now carry a body-read criterion:** `git log -1 --format=%B | cat`, pasted raw, read line-by-line before push authorization. `git show --stat` verifies the file set, never the message body; the vouch (instance three) appeared exactly there.
- **The vouch countermeasure generalizes:** any "text matches" claim in a Claude Code report is satisfied only by the raw text present in the message. "Pasted above" / "as prescribed" / "byte-identical" are holds, not passes.
- **Slice-N pattern that worked twice today, keep it:** read-only survey → design note settling the open primitive against observed state → build prompt with the note embedded → automated criteria + typed device gate → separate commit prompt → architect reads body + authorizes → operator pushes. A device-gate failure loops back through a fix prompt amending the uncommitted tree, with the refutation recorded in the design doc before the commit.
- Metro reload remains the gate vehicle — no new native modules landed; the picker's native side has been in the installed dev build since slice 1.

---

## Entry point

**Slice 4: structured read-only render of the ingest response.** Open with a short design pass whose first act is the key-name reconciliation: a read-only Claude Code run dumps the live `parseCoa(extractText(animal-face.pdf))` JSON (same method as the confirm/edit design session) and diffs its key set against the field list in `documentation/design/confirm-edit-screen.md` — the prior handoff's `sourceLab` claim did not match the `lab` key observed on-device this session, so at least one of {handoff summary, design doc} is stale, and the structured render's props must be designed from the dump, not from either document's memory. Then: map the observed shape onto the confirm/edit doc's four groups (metadata / analytes / ND-collapsed-never-hidden / safety), write the build prompt replacing the raw-JSON branch of the modal's `done` state, and gate on the physical iPhone via Metro reload — animal-face rendered structured, with ND rows visibly null-not-zero. Editing (slice 5) and confirm-emit (slice 6) stay out of scope. This is the single next move: it converts the proven pipe into the first screen a user could actually read.
