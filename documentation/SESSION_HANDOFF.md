# Cultivar — Session Handoff

_Written 2026-07-11, against HEAD `543081e`, pushed and verified (`074ac07..543081e main -> main` observed this session)._
_**The repo is authoritative over this document.** Every state claim below is a prediction to falsify, not a fact to trust._

_Concrete refutations from this session, so this preamble is read and not skimmed:_
_(1) **Claude Code twice reported a committed blob as "pasted above / byte-identical" when the raw text was NOT in the delivered message.** Both times the architect held the push and demanded `git show HEAD:<path> | cat`; both times the real paste then arrived clean. The lesson is load-bearing: a summary asserting a blob matches is **not** the blob. For any read-the-committed-blob gate, demand the piped `cat` output and read the actual lines. A vouch is not an observation._
_(2) "`npx expo install` removed 30 packages" looked like a dependency deletion; it was **npm pruning extraneous on-disk `node_modules` to lockfile state.** The lockfile diff was a pure 10-line insertion — one dep added, none removed. Do not read npm's package-count chatter as lockfile truth; read the lockfile diff._
_(3) The session ran as **Fable 5** (operator `/model` switch) while every commit trailer names `Claude Opus 4.8 (1M context)` per CLAUDE.md's current convention. Committed as-authorized; the operator does not want model-level provenance re-litigated. Banked: CLAUDE.md could drop the model-specific trailer entirely._

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
| [2] HEAD | If this handoff is NOT yet committed: `543081e`, subject `docs: add product-metaphor north-star doc`, parent `074ac07`. If it HAS been committed: a `docs: session handoff` commit whose **parent is `543081e`** — its own sha unknowable here. |
| [3] ahead of origin | **0**. Non-zero = an unpushed commit; that is the finding, not an error. |
| [4] working tree | **clean** IF this handoff is already committed. If written-but-uncommitted, expect exactly ` M documentation/SESSION_HANDOFF.md` and nothing else. **If `.env` appears, stop everything.** |
| [5] `.env` ever committed | `(never committed)` |
| [6] client path | `src/lib/supabase.ts` tracked; `lib/` count **0** |
| [7a/b] `.gitignore` blob | line 34 `.env*`, line 35 `!.env.example`, LF. Line 40 bare `example` is template detritus (banked). |
| [8] unstable flags | `(none)` |
| [9] `npm test` | **36 passed / 0 failed**, 1 suite. Parser tree untouched this session. |
| [10] `deno test` ingest-coa | **5 passed / 0 failed**. |
| [11] `deno check` | exit **0, no errors**. Output line is cache-dependent (silent warm, `Check <path>` cold) — NOT a signal. |
| [12] `tsc --noEmit` | `(no output)`, exit **0**. |
| [13] `expo lint` | **1 error, 0 warnings**, file `use-color-scheme.web.ts`. Ceiling, not target. |
| [14] `expo install --check` | `jest@30.4.2` / `@types/jest@30.0.0` misaligned — expected, do not fix. **`expo-document-picker` must NOT be flagged** (confirmed this session it is not). |
| [15] trailers | exactly two, parsed: generic Claude + `Claude Opus 4.8 (1M context)`. |

**New this session, not covered by the audit script:** `expo-document-picker@~56.0.4` is now in `package.json` dependencies (committed `074ac07`). Verify: `git grep -n "expo-document-picker" package.json` → 1 hit; `git grep -n "expo-document-picker" src/` → **no hits** (added-but-unwired; nothing imports it yet). Its native side is compiled into the EAS dev build now installed on the iPhone.

**Schema gate (Supabase SQL editor): NOT re-observed this session.** Carried forward unverified: five tables in `public` (`profiles`, `coas`, `coa_terpenes`, `coa_cannabinoids`, `coa_safety`), RLS on all five, `pg_policies` returns 7 rows. The migration that defines them is tracked at `supabase/migrations/20260708220816_create_core_schema.sql` (confirmed present this session). Re-run the two queries before any slice that INSERTs — none of the runnable-now slices do.

**If any of these don't match, the repo wins — re-baseline before proceeding.**

---

## What shipped (newest first)

- `543081e` — docs: add product-metaphor north-star doc
- `074ac07` — chore: add expo-document-picker dependency (native-module slice; **device-gated** — EAS dev build succeeded, app loaded on the physical iPhone incl. sign-in/OTP)
- `f18a7e5` — docs: add confirm/edit screen design doc (+ CLAUDE.md `documentation/design/` pointer)

Prior HEAD at session start was `4ab722f`. Working tree: clean once this handoff commits.

---

## The arcs

**This was a design-first session — three artifacts landed before any confirm/edit UI code.** The prior handoff's entry point ("design the confirm/edit screen") was executed and then some. Two design docs now live in a new `documentation/design/` folder: `confirm-edit-screen.md` (the ingestion review screen) and `product-metaphor.md` (the app's north-star IA). Only one code commit shipped — the picker dependency.

**The confirm/edit screen was designed against the REAL parse output, not a description.** A read-only Claude Code run dumped the live `parseCoa(extractText(animal-face.pdf))` JSON and `cat`-ed the tracked schema migration. This surfaced the true field shape: parser keys (`totalThcPct`, `sourceLab`) differ from column names (`total_thc`, `source_lab`); `coas.type` has no parser source (a COA is a chemical assay, `type` is a marketing label — deferred, and arguably vestigial to the personal-empirical thesis); the panel is a fixed complete list mostly ND (14/20 terpenes, 14/16 cannabinoids null for animal-face). Design decisions locked from the real data: edit + rename + delete rows (no add-row — panel is complete, no dropped-row defect observed), rename because `g CBDVa` is a column-bleed of real `CBDVa`, ND as a first-class selectable state never coerced to 0, ND rows collapsed-but-never-hidden, view-source PDF toggle, and an **atomic insert contract** as the boundary to the (separate, later) insert slice.

**Slice 1 of the confirm/edit implementation shipped and was device-gated.** The confirm/edit build was decomposed into six slices; slice 1 is the `expo-document-picker` dependency alone, imported nowhere. Being a native module, it gated per D18 on a fresh EAS dev build (`eas build --profile development --platform ios` — profile name read from the tracked `eas.json`). Build succeeded, installed on the iPhone, app loaded through sign-in/OTP cleanly. Its native side is now in the installed build, so slices 2–3 (wiring picker + invoke in JS) reload live — **no new EAS build until another native module is added.**

**The product metaphor was worked out and ratified.** Operator-driven vision: a **shelf** of COAs; untried ones sit neutral in a **compendium**; from the first logged session a COA enters a **book** where book = score band = mood (one concept, three views), bright→wilting by the average of preserved session scores; **in-stock** marks what the user physically has; **Never Again** is a lossless display override (separate flag, never a fake score, undo-able "while high"). Integrity disciplines recorded, all of the ND≠0 family: mood from logged outcomes only never chemistry; untried is neutral never negative; override the display never the data. The scoring lexicon (survey→numbers) is explicitly OPEN, its own design pass.

---

## Refuted hypotheses / memory corrections

- **"Claude Code's 'blob pasted above / byte-identical' is evidence."** FALSE — it claimed this twice with the raw text absent from the message. Demand `git show HEAD:<path> | cat` and read the lines. See preamble (1).
- **"`expo install` removed 30 packages = deps deleted."** FALSE — npm pruning to lockfile; net one insertion. See preamble (2).
- **"Schema is dashboard-only / not in the repo."** FALSE — captured in one tracked migration `supabase/migrations/20260708220816_create_core_schema.sql` (all five tables, RLS, policies, `handle_new_user` trigger, child indexes). The banked "dashboard-only config" item is about **auth** config (OTP length, SMTP, template), not schema.
- **"`supabase.functions.invoke` exists somewhere in the client."** FALSE — zero hits repo-wide. The confirmed-live invoke in the prior handoff was operator-run from a shell with a hand-minted token. The client-side authenticated invoke has **never run** — it's an unproven path landing in slice 3.
- **Still true from prior handoffs:** Git Bash only, never WSL; native-module change → new EAS dev build, JS-only → Metro reload (D18); paste Claude Code output as text; parse trailers never count; `git check-ignore`/`git show :<path>` are tracked/index-only; 6-digit OTP (D23).

---

## Ratified decisions

D1–D26 stand. New this session:

- **D27 — The confirm/edit implementation is six device-gated slices**, smallest-risk first: (1) picker dep [shipped], (2) navigation + empty "add to shelf" destination, (3) pick → client authenticated `invoke('ingest-coa')` → raw JSON on screen, (4) structured read-only render (metadata / analyte / ND grouping / safety), (5) analyte + metadata editing (three-state, rename, delete), (6) confirm → emit corrected JSON. Grounds: four unproven things (nav, picker code, client-auth-invoke, structured render) isolated to their own gates so a failure names its cause. The insert-to-DB is a **separate slice after all six** (per the confirm/edit doc's boundary).
- **D28 — Unknown-lab empty shell: known-lab happy path first (sequencing), honest-blocking-state eventually.** `ingest-coa` returns HTTP 200 + empty shell for a lab we don't parse. Grounds: proving pick→invoke→render on a known lab is a distinct concern from the empty-shell UX. The eventual answer is an honest "we can't read this lab's format yet" state that blocks insert (never fabricate) — its own later slice, before confirm/edit "ships."
- **D29 — No historic COA values are ever hardcoded in the codebase.** Operator rule. The screen always renders live-invoke output; fixtures/PDFs are evaluated against ingested data, never baked in as constants. Consequence: slice 3 must stand up the live client invoke rather than shortcut with a pasted JSON literal.
- **D30 — "Add a COA" is a discrete enter-finish-dismiss flow ("add to shelf"), not a dwelt-in destination.** Grounds: the operator endorsed the modal-shaped Option 2 as "adding something to a shelf." The exact nav primitive (modal vs Stack route — neither exists yet; app has only two `NativeTabs`, no Stack) is settled at the top of slice 2, modal-presentation leaning.
- **D31 — Product metaphor ratified** (shelf / compendium / in-stock / book=band=mood / session=survey / Never-Again-as-lossless-override) with the three integrity disciplines. Persisted as `documentation/design/product-metaphor.md` (`543081e`). The `never_again`/`average_score` two-field structure is provisional direction, flagged for revisit at the scoring-lexicon pass.

---

## Open items

### Runnable now
- **Slice 2 — navigation + empty "add to shelf" destination.** A Home-screen entry that opens a placeholder confirm/edit screen and dismisses. Pure JS/React → **Metro reload gate, no EAS build**. First real Cultivar UI surface (Home currently shows only the Expo starter template). Settle the nav primitive (modal vs Stack route) first — a short design note, then build. **This is the entry point.**

### Blocked
- Nothing hard-blocked.

### Banked
- **Unknown-lab empty-shell UX** (D28) — its own slice before confirm/edit ships.
- **In-stock as a data primitive** — the five-table schema has no possession state; downstream of ingestion.
- **Scoring lexicon** — survey→numbers design pass; revisit `never_again`/`average_score` there.
- **Session-logging interaction** — draggable playful mechanic over the lexicon; pending the lexicon.
- **Mood visual language** — plant-health spectrum; art/design pass.
- **CLAUDE.md model-trailer simplification** — drop the model-specific trailer (operator doesn't want model provenance); a `docs:` cleanup.
- **EAS build source unknown** — HEAD vs working tree never confirmed. Commit-first adopted as default (safe under either). Confirm if it ever matters.
- **Parser: DRS/Confident `brand` pollution** (carries) — "Condent LIMS…" sludge, stray `g CBDVa`; the confirm/edit screen catches it, but a real fixture-backed cleanup remains. ~12 more COAs available as future fixtures.
- Prior banked carry forward (see `documentation/follow-ups.md`): config dedupe to per-function `deno.json`; deploy reproducibility (`^1` unpinned); `--no-lock` on `deno check`/`test`; dashboard-only auth config (OTP length, SMTP, `{{ .Token }}`); Resend domain-verified sender; url-polyfill necessity under SDK 56 + Hermes; `.gitignore:40` bare `example`; unknown-lab 200 shell; terpene whitelist; CRLF-on-clone; `unrs-resolver` allow-scripts; `npm audit` moderate template vulns; no Storage bucket / `pdf_url`.

---

## Working rhythm (only what is in flux)

Stable method lives in `CLAUDE.md` and `documentation/process/handoff-specs.md`.

- **Blob-read gates: demand `git show HEAD:<path> | cat`, read the actual lines.** Claude Code will claim "byte-identical / pasted above" without the text in the message. Held the push twice this session on exactly this. A vouch is not an observation.
- **Native side of the picker is already in the installed dev build** — slices 2–3 reload via Metro (`npx expo start --dev-client`), no EAS build until another native module lands.
- **Commit-first for native-module slices** — an unpushed commit is trivially reversible (`reset --soft HEAD~1`) and safe whether EAS builds from HEAD or the worktree (unconfirmed which).
- Run the audit in Git Bash, never WSL. Paste Claude Code output as plain text, never attached.

---

## Entry point

**Slice 2: build the "add to shelf" navigation entry and an empty placeholder confirm/edit destination.** It's the first Cultivar UI surface — the signed-in Home currently shows only the Expo starter template, and there's no Stack/modal scaffolding yet (only two `NativeTabs`). Open with a short design note settling the nav primitive (modal presentation leaning, per D30's enter-finish-dismiss shape), then build: a Home entry point that opens a placeholder screen and dismisses. Pure JS → it gates on a **Metro reload** on the physical iPhone, not an EAS build. This is the single next move: it proves navigation in isolation before slice 3 stacks the picker + the never-yet-run client authenticated invoke on top.
