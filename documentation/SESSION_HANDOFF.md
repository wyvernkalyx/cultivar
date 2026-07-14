# Cultivar — Session Handoff

_Written 2026-07-14, against HEAD `9e3124a`, pushed and verified (`ababe82..9e3124a main -> main` observed, rev-list 0 observed; this session also observed `9ef0b8d..ababe82` — two pushes)._
_**The repo is authoritative over this document.** Every state claim below is a prediction to falsify, not a fact to trust._

_Concrete refutations from this session, so this preamble is read and not skimmed:_
_(1) **The architect's derived diff-stat missed by one for a reason it had not anticipated.** The docs-prompt prediction was 55 insertions / 8 deletions with a stated contingency (a blank line hidden inside the deleted status block); actual was 54/8, deletions exactly 8 — the contingency never fired and the paste channel was vindicated on that stretch. The miss was in the architect's own simulation tool: splitting the authored insert on newlines produced a phantom empty line from the file's terminal newline (49 counted, 48 real). Rule extracted: **diff-stat derivations must account for the derivation tool's own mechanics — a trailing newline is an edit mechanic too.** The implementer caught and reconciled it exactly._
_(2) **The vouching construction fired twice in one session** — both the docs build report and the feat build report wrote "full diff pasted whole in the tool output above," which stops at Claude Code and reaches the architect not at all. Both times the diff was demanded and came back clean, but twice in one day graduated the countermeasure from re-request to prompt text: **report-back criteria now state explicitly that output goes in the report body, and that "in the tool output above" does not satisfy the criterion.** The slice-6c commit prompt carried it; every future build and commit prompt does too._

_Begin with the Phase A audit below. **Run it in Git Bash (`MINGW64`), from `/d/Projects/...`, never WSL.** Try to break it — noting that this session's Phase A broke nothing at all, which itself refuted the streak-based prior that a handoff always fails somewhere. Zero breaks is a legitimate outcome; it is not the expected one._

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
| [2] HEAD | If this handoff is NOT yet committed: `9e3124a`, subject `feat: confirm action bar (slice 6c, D43)`, parent `ababe82`. If committed: a `docs: session handoff` commit whose **parent is `9e3124a`**. |
| [3] ahead of origin | **0** |
| [4] working tree | **clean** if this handoff is committed; else exactly ` M documentation/SESSION_HANDOFF.md`. **If `.env` appears, stop everything.** |
| [5] `.env` ever committed | `(never committed)` |
| [6] client path | `src/lib/supabase.ts` tracked; `lib/` count **0** |
| [7a/b] `.gitignore` blob | line 34 `.env*`, line 35 `!.env.example`, LF. Line 40 `example` banked. Unchanged. |
| [8] unstable flags | `(none)` |
| [9] `npm test` | **36 passed**, 1 suite. Parser untouched; re-observed at slice-6c build criteria. |
| [10] `deno test` ingest-coa | **5 passed**. Function untouched; carried. |
| [11] `deno check` | exit 0 by inference; script still lacks `$?` echo (EIGHTH session). Banked chore — the count is becoming its own argument. |
| [12] `tsc --noEmit` | `(no output)`, exit 0. Re-observed at slice-6c build criteria. |
| [13] `expo lint` | **1 error, 0 warnings** (`use-color-scheme.web.ts`). Re-observed at slice-6c build criteria. |
| [14] `expo install --check` | jest 30 / @types/jest 30 misaligned — expected, do not fix. |
| [15] trailers | **exactly ONE, parsed** (D35). Script's expectation text still stale; banked with [11]. |

**New this session, not covered by the audit script:**
- `grep -Fc "ScrollView" src/components/coa-editor.tsx` → **3** (import, opening tag, closing tag on its own line).
- `grep -Fc "resultBody" src/components/add-to-shelf-modal.tsx` → **2** (one JSX usage, one style key).
- `grep -Fxc '## Confirm action bar (slice 6c, D43)' documentation/design/confirm-edit-screen.md` → **1**.
- `grep -Fc 'Status: implemented through slice 6b' documentation/design/confirm-edit-screen.md` → **1**; `grep -Fc 'remains slice 6' <same file>` → **0** (two stale claims corrected at `ababe82`).

**Database state (observed at session close, NOT predictable as counts):** shelf holds **4 rows** — `3f8f3729…` Permanent Shade (Kaycha; 21/13/10; added 7/14 via the slice-6c gate; **blank brand line — the Kaycha brand defect re-observed on a second fixture**), `7bb5f095…` Cosmic Cereal (21/13/10), `e3c91b9f…` and `abe82f1f…` Animal Face / Moby & Zeke (20/16/8 each). Do not confuse row `abe82f1f` with commit `ababe82` — the prefixes nearly collide. **Phase A predicts repo state, never user-data state** (standing rule).

**Hygiene closed:** `auth-resp.json` at repo parent was deleted this session (`grep -ic auth` → 0 observed). Server-side session revocation was offered and **not performed** — the refresh token in that file remains redeemable until it rotates or the session is revoked. Deliberate operator choice at n=1, recorded, not forgotten.

**If any of these don't match, the repo wins — re-baseline before proceeding.**

---

## What shipped (newest first)

- `9e3124a` — feat: confirm action bar (slice 6c, D43; device-gated per step, five verdicts)
- `ababe82` — docs: design slice 6c confirm action bar (D43; also corrected two stale status claims in the same doc)
- Scope note: `9ef0b8d` (the prior handoff) and everything before it are covered by the previous handoff, superseded by this file. Session start for this scope = `9ef0b8d`.

---

## The arcs

**Slice 6c closed the loop the 6b false gate opened, and the defect was a documentation gap, not a code bug.** The read of `confirm-edit-screen.md` at HEAD found no placement spec at all for the confirm control — the "below Safety" sentence the architect remembered refuting had only ever existed in a build prompt. Unspecified placement defaulted to last-child-of-scroll-content, which is below the fold on any full panel. D43's shape: the confirm action is a fixed footer **owned by `CoaEditor`** — root becomes a flex column, internal `ScrollView` holds the five sections, the Pressable is the scroll's sibling. The lift-to-modal alternative was rejected on D38 grounds: the draft is editor-local, and the modal cannot emit it without an imperative handle or a state lift. The modal's success arm stopped wrapping `ReviewOrGuard` in a ScrollView (a flex child inside a ScrollView cannot fill the viewport) and wraps it in a plain filling View; the failure arm keeps its own ScrollView; the guard arm renders bare. Keyboard-behind-footer mid-edit is tolerated by design and was incidentally photographed working exactly as specified during the gate — the property bought is visibility **at rest**.

**The gate ran on a substituted fixture, disclosed and accepted.** The operator used a new Kaycha COA (Permanent Shade) for the full-confirm step rather than re-adding a fourth Animal Face. Same property exercised (full panel through confirm, 21/13/10 read-back matching the Kaycha signature), plus free new-fixture parser coverage, plus a second observation of the Kaycha blank-brand defect. The initial gate response was semi-aggregate ("all passed, except maybe 2 did not?"); per the third-strike rule the gate did not close until five per-step verdict lines were attested, including a deliberate re-run of step 2. Also during the gate the operator hypothesized "tapping a card should open the editor — maybe it's broken"; refuted from D42 (cards carry exactly one interaction, long-press delete) — but the instinct is demand-validation for the card detail view, slice 9.

**Simulation discipline ran full-length for the first time and mostly held.** Every anchor and criterion in the docs prompt was executed in bash before shipping: preconditions against a reconstruction (content-line counts survive the lossy paste channel), presence against the authored insert. The one miss was the architect's own tool mechanics (preamble refutation 1). Both target code files were read whole at `9ef0b8d` before the build prompt, so its Current-state block carried verbatim, checkable claims — the implementer verified all of them and reported so.

---

## Refuted hypotheses / memory corrections

- **"A handoff always breaks somewhere"** — refuted; this session's Phase A closed 15/15 audit checks plus all five new-item checks, including the previous session's own never-verified `wc -l` → 130 prediction. Zero breaks is real.
- **C8 contingency (hidden blank line in the deleted block)** — wrong suspect; deletions were exactly 8. The actual cause was the simulation's trailing-newline phantom (preamble 1).
- **"ScrollView count → 2"** (architect) — unreachable for a multi-child ScrollView; the closing tag takes its own line. Actual 3, implementer-reconciled. Presence-count predictions about code not yet written stay labeled predictions.
- **Implementer per-file stat narration wrong, totals right** — narrated modal 16/13 + editor 53/36; git's own per-file sums (31 and 87) contradict the split while the 69/49 totals reconcile. Architect's hunk-derived split (modal 21/10, editor 48/39) matches git exactly. Third instance of correct-tree-incorrect-narration; the observation settles, never the narration.
- **Operator: "clicking a card should open the editor"** — refuted from D42; the editor exists only in the import flow. Not a regression; it is the slice 9 gap, now demand-validated.
- **Diff context-line anomaly** — the feat diff paste showed an import statement split across two lines in a *context* line; a context line cannot differ from the blob, `tsc` exit 0 and the clean commit settled it as channel wrap. Paste channels mangle more than blank lines.
- **Vouching ×2** (preamble 2) — now countered in prompt text, not reviewer vigilance.
- **Still true:** parse trailers never count; blob reads via `git show HEAD:`; per-step operator-attested verdicts with read-backs for DB-writing gates; edit anchors from the blob or adjacency-free; diffs and bodies in the report body, never by reference; Phase A predicts repo state only.

---

## Ratified decisions

D1–D42 stand. New this session:

- **D43 — confirm action bar (slice 6c):** fixed footer owned by `CoaEditor`, outside any scroll region, visible without scrolling whenever the editor renders; internal ScrollView holds the sections; modal success arm unwraps to a plain filling View, failure arm keeps its ScrollView, guard arm bare; lift-to-modal rejected on D38 grounds; keyboard-behind-footer mid-edit tolerated. Grounds in `confirm-edit-screen.md` at `ababe82`; landed `9e3124a`; five-step device gate closed with per-step attestation.
- **Ruling — report-body-or-nothing:** every build and commit prompt's report-back explicitly requires diffs and commit bodies pasted in the report body; "in the tool output above" is named in the prompt as non-satisfying.
- **Ruling — derivation-tool mechanics count:** diff-stat derivations account for the tool's own artifacts (trailing-newline phantom lines included), and per-file splits are reconciled against git's per-file numbers, not the implementer's narration.
- **Accepted practice — disclosed fixture substitution:** a gate step may run on a different fixture of the same input class when disclosed; it was accepted here because it strictly added coverage.

---

## Open items

### Runnable now
- **Confirm-dialog retitle + strain disambiguation — the entry point** (see below). The slice-8 delete dialog in `shelf-list.tsx`: title says "Remove from shelf?" over a permanent-delete body, and it names strain only while three live cards read "Animal Face."
- **Slice 9 — card detail view** (next in queue; newly demand-validated by the operator's own gate-time instinct; owns the visible delete affordance per D42).

### Blocked
- Books / moods / bands / Never Again / session logging — blocked on the **scoring lexicon design pass** (its own dedicated session; the heart of the product).
- In-stock / possession — blocked on schema; owns the **remove-vs-delete distinction**. The dialog retitle above makes the dialog honest about *current* behavior (permanent delete); it does not resolve, and must not preempt, the compendium-vs-possession split.

### Banked (new this session)
- Kaycha blank-brand defect re-observed on a second fixture (Permanent Shade card) — strengthens the parser-cleanup case.
- Keyboard covers the fixed footer mid-edit — tolerated by D43, documented, photographed; becomes a defect only if a future gate shows it eating a confirm.

### Banked (carried)
- Audit script `$?` echo + stale [15] text (one chore; EIGHTH session — promote soon or admit it is permanent); parser brand-sludge/`g CBDVa` cleanup; guard layout centering; `identifyLab` brittleness; envelope-unwrap redesign + D33 `functions.invoke` migration; dashboard-only auth config; Resend domain verification; deploy reproducibility; `--no-lock`; url-polyfill; `.gitignore:40`; terpene whitelist; CRLF warnings (tolerated, fired again ×3 this session); `unrs-resolver`; `npm audit` template vulns; no Storage bucket / `pdf_url`; payload-shape validation; template orphans (`hint-row`, `animated-icon`, `explore.tsx`); shelf.md `###` headings convention stands (do not "restore" zero-subheading); blank brand line on cards; server-side session revocation declined for the deleted `auth-resp.json` tokens.

---

## Working rhythm (only what is in flux)

Stable method lives in `CLAUDE.md` and `documentation/process/handoff-specs.md`.

- **New: report-body-or-nothing** (ratified above) — already in the slice-6c commit prompt; carry it into every prompt's report-back section verbatim.
- **New: simulate with the tool's mechanics in view** — the pre-ship simulation caught every anchor and missed only its own newline artifact; keep the full-length simulation, add the artifact check.
- **New: reconcile per-file stats from hunks, not narration** — third correct-tree-wrong-narration instance; git's numbers are on the same line as the claim they refute.
- The slice pattern ran end-to-end twice this session (docs commit and feat commit, each with its own gate and push) with zero implementer STOPs needed; unchanged, keep it.

---

## Entry point

**The confirm-dialog retitle + strain disambiguation slice** (tentatively slice 10; numbering is the design pass's call). It is the smallest runnable item, it closes the two named defects in the D42 dialog — a title ("Remove from shelf?") that contradicts its own permanent-delete body, and a target line (strain only) that cannot disambiguate three live "Animal Face" cards — and it was the named follow-on when 6c was scoped, deliberately excluded then to keep one concern per slice. Candidate shape from the prior session, not yet ratified: title "Delete COA?", target named as strain + brand or strain + added date. It opens with a short design pass amending `documentation/design/shelf.md` (the D42 section owns the dialog), ratifying the exact title and target format before any build prompt exists. One boundary to hold in the design pass: this slice makes the dialog *honest about what the code does today*; the remove-vs-delete semantics split stays blocked on the in-stock/possession work and must not be smuggled in here. Slice 9 (card detail) is next behind it and now carries live operator demand. This is the single next move.
