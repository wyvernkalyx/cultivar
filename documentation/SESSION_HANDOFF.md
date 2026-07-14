# Cultivar — Session Handoff

_Written 2026-07-14, against HEAD `7fe6187`, pushed and verified (`8cef60d..7fe6187 main -> main` observed; this session also observed `5457ff6..5e56ef7`, `5e56ef7..8cef60d` — four pushes counting the handoff to come)._
_**The repo is authoritative over this document.** Every state claim below is a prediction to falsify, not a fact to trust._

_Concrete refutations from this session, so this preamble is read and not skimmed:_
_(1) **The architect designed against an imagined navigation layer.** The slice-9 proposal was a pushed route (`src/app/coa/[id].tsx`); the observed `_layout.tsx` has no Stack and no Slot — the root layout is the auth gate rendering `NativeTabs` directly. The route design died on the blob read and the detail became a `ShelfList`-owned Modal. Design-from-memory of an unobserved file shape is the same error class as design-from-dump._
_(2) **The architect fell into the documented `-e` grep trap on its own run** — a dash-prefixed pattern executed without `-e` mid-session, caught only because the criterion was executed before shipping. The rule works; it also applies to the person who wrote it._
_(3) **A red gate produced a wrong-shaped first hypothesis.** The step-6 add-flow failure was initially framed as a modal defect; the operator's retest revealed the app had been *fully unresponsive* — a different failure class. The gesture-dismiss desync hypothesis was then killed by a directed repro (swipe-dismiss → reopen → add: all pass). Disposition: unreproduced one-off; Metro-reload-over-stale-state favored but unconfirmed (the operator was not asked in time whether the frozen session was the reloaded one)._

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
| [2] HEAD | If this handoff is NOT yet committed: `7fe6187`, subject `docs: mark slice 9 implemented in shelf.md`, parent `8cef60d`. If committed: a `docs: session handoff` commit whose **parent is `7fe6187`**. |
| [3] ahead of origin | **0** |
| [4] working tree | **clean** if this handoff is committed; else exactly ` M documentation/SESSION_HANDOFF.md`. **If `.env` appears, stop everything.** |
| [5] `.env` ever committed | `(never committed)` |
| [6] client path | `src/lib/supabase.ts` tracked; `lib/` count **0** |
| [7a/b] `.gitignore` blob | line 34 `.env*`, line 35 `!.env.example`, LF. Line 40 `example` banked. Unchanged. |
| [8] unstable flags | `(none)` |
| [9] `npm test` | **36 passed**, 1 suite. Re-observed at the slice-9 build criteria. |
| [10] `deno test` ingest-coa | **5 passed**. Functions untouched all session (all four commits touched `shelf.md`, `shelf-list.tsx`, `coa-detail.tsx`, and this file only). |
| [11] `deno check` | exit 0 by inference; script still lacks `$?` echo (TENTH session — disposition below). |
| [12] `tsc --noEmit` | `(no output)`, exit 0. Re-observed at slice-9 build criteria. |
| [13] `expo lint` | **1 error, 0 warnings** (`use-color-scheme.web.ts`). Re-observed at slice-9 build criteria. |
| [14] `expo install --check` | jest 30 / @types/jest 30 misaligned — expected, do not fix. |
| [15] trailers | **exactly ONE, parsed** (D35). Script's expectation text still stale; bundled with [11]. |

**New this session, not covered by the audit script:**
- `grep -Fc 'onLongPress' src/components/shelf-list.tsx` → **0**; `grep -Fc "'Delete COA?'" src/components/coa-detail.tsx` → **1**; `grep -Fc "'Delete COA?'" src/components/shelf-list.tsx` → **0**.
- `git ls-files src/components/coa-detail.tsx` → tracked (one line).
- `git show HEAD:documentation/design/shelf.md | wc -l` → **366**; on the same blob: `grep -Fc 'designed, not implemented'` → **0**; `grep -Fc -e 'implemented at \`8cef60d\`'` → **2**; `grep -Fc 'Implementation deltas'` → **1**.

**Database state (Phase A predicts repo state, never user-data state — standing rule):** the gate and retest deleted at least two rows and added at least two (one mid-retest, one post-repro). No shelf count is trusted or needed. The session-wide orphan check (`not exists` against `coas`, all three child tables) returned **0/0/0**, observed via SQL — the strongest cascade evidence to date, covering every delete ever run. New fact: the RAINBOW RUNTZ fixture is a **Kaycha** COA (`source_lab: kaycha`) whose brand parsed clean — evidence against, not resolution of, the banked Kaycha blank-brand defect.

**If any of these don't match, the repo wins — re-baseline before proceeding.**

---

## What shipped (newest first)

- `7fe6187` — docs: mark slice 9 implemented in shelf.md (status flip + three accepted implementation deltas, per the staleness ruling)
- `8cef60d` — feat: card detail view (slice 9, D45; six-step device gate — red on step 6, then green on retest plus a directed swipe-dismiss repro; two stills)
- `5e56ef7` — docs: design card detail view (slice 9, D45)
- Scope note: `5457ff6` (the prior handoff) and everything before it are covered by the previous handoff, superseded by this file. Session start for this scope = `5457ff6`.

---

## The arcs

**Slice 9 ran end to end — and its design pass was rebuilt mid-flight by a blob read.** The proposal was a pushed route; `_layout.tsx` refuted it (no Stack anywhere; the root layout IS the auth gate, swapping `SignIn`/`AppTabs` on session state, and `AppTabs` is `NativeTabs` with two triggers). D45's ratified shape: an RN `Modal` owned by `ShelfList` (the `AddToShelfModal` presentation family), remount-keyed on card identity, hosting `CoaDetail` — which owns its own embedded single read (`coas` + all three child tables, one snapshot), the D44 dialog moved verbatim, and a fixed-footer Delete + Close (the 6c lesson: placement pinned, not defaulted). Long-press was retired (operator call): the single-card delete context extinguishes the D44 named limit *entirely* instead of leaving the ambiguous path alive. Child-table RLS was verified from the migration blob before the query was designed: the `*_all_own` policies are `for all` with the identical parent-ownership predicate, so embedded reads — which ARE re-gated by child RLS, unlike cascade deletes — always return full panels. Alphabetical row order is a named divergence: the child tables have no position column, so parser emission order is unrecoverable at the DB seam; `pct`-descending was rejected because it starts visually ranking chemistry.

**The gate went red, and the failure was diagnosed before it was fixed — and then needed no fix.** Step 6 (add-flow regression) failed; the app was fully unresponsive. Three discriminating questions were put to the operator instead of a patch; a cold start cured everything and the full interleaving (add → detail-delete → add) passed warm. The one live hypothesis with a product implication — pageSheet gesture-dismiss leaving a phantom presented sheet — was killed by a directed repro of its exact trigger. Nothing was committed until the gate was green, and the commit body records the freeze honestly.

**Three implementation deltas were accepted at review and promoted into the doc** (`7fe6187`): null/blank metadata omits its line entirely — "ND" is analyte vocabulary and stays off metadata (the spec was silent; the implementer's call was better than a literal reading); Close joins Delete in the loaded footer per the presentation family; "Not detected (0)" renders when a panel has no ND rows. The review-not-rubber-stamp channel produced doc improvements this session, not just defect catches.

---

## Refuted hypotheses / memory corrections

- **Route-push placement for the detail view** (architect) — refuted by the `_layout.tsx` blob; replaced by the ShelfList-owned modal (preamble 1).
- **Gesture-dismiss modal desync as the freeze cause** — refuted by directed repro: swipe-dismiss → reopen detail → add-to-shelf, all pass (preamble 3).
- **Three commits in `990c62c..5457ff6`** (architect, opening Phase A) — refuted: four; the prior session split the status flip into its own commit, which this session then adopted as the pattern.
- **Confirmed, not refuted — the banked 6c staleness:** `git log -- src/components/coa-editor.tsx` shows `9e3124a feat: confirm action bar (slice 6c, D43)`, so `confirm-edit-screen.md`'s "designed below and not yet built" is a false claim standing at HEAD. It predates the staleness ruling. Runnable fix below.
- **Resolved banked item:** the architect's project-knowledge copies of `CLAUDE.md`/`handoff-specs.md` were refreshed — both now carry the D35 one-trailer text, read end to end this session. The recurring false-alarm generator is dead.
- **Still true:** parse trailers, never count; blob reads via `git show HEAD:`; report-body-or-nothing (held on all four reports, zero vouching); criteria executed before shipping — including by the architect on its own runs, where the `-e` trap fired and was caught (preamble 2); diff-stats derived from edit mechanics hit exactly on all three commits (141/1, 378-60 over two files, 17/3).

---

## Ratified decisions

D1–D44 stand. New this session:

- **D45 — card detail view (slice 9):** modal presentation owned by `ShelfList` (no Stack exists; navigation restructure banked, not smuggled); tap opens detail, **long-press retired** — delete lives only on the detail, reusing the D44 dialog verbatim; fresh embedded single read, DB shape, `CoaParseResult` banned; fixed-footer controls (the 6c lesson, placement pinned in the build prompt); ND everywhere on totals and `pct`; alphabetical row order as a named divergence; no scores, no mood. Grounds in `shelf.md` at `5e56ef7`; landed `8cef60d`; statuses trued and deltas recorded at `7fe6187`.
- **Ruling — operator data is disposable during the test phase:** gate designs may freely delete or duplicate shelf rows; the duplicate RAINBOW RUNTZ was deliberate. Revisit when non-operator testers onboard.
- **Ruling — device anomalies get a directed repro before any fix:** a red gate step with multiple candidate causes is diagnosed by discriminating questions and a targeted repro of the leading trigger; no patch ships against an unconfirmed hypothesis. (Applied this session; the "fix" would have been unnecessary code.)
- **Recorded deferral — the SQL RLS observation (pg_tables/pg_policies)** was deferred this session on the grounds that no schema-touching commit has landed since the last observation; the two SQL screenshots run were user-data reads under `Role postgres` and do not substitute.
- **Disposition proposed for the [11] `$?` chore, now at TEN sessions:** the architect recommends declaring it **permanent** — tail-silence plus criteria-time `deno check` runs have been the effective observation for ten sessions — and stopping the count. The operator has not called it despite two asks; next session's Phase A adopts permanent **unless the operator objects there**, and the audit-script text for [15] is bundled into the same disposition.

---

## Open items

### Runnable now
- **The 6c status flip in `confirm-edit-screen.md`** — confirmed false claim at HEAD ("Slice 6c … not yet built" vs the observed `9e3124a`); a two-line `docs:` fix plus whatever adjacent 6c-status text a whole read surfaces. The session opener.
- **The scoring lexicon design pass** — the session's substance (see Entry point).

### Blocked
- Books / moods / bands / Never Again / session logging — blocked on the **scoring lexicon**.
- In-stock / possession — blocked on schema; owns the **remove-vs-delete distinction**.

### Banked (new this session)
- `#e5484d` literal error color now lives in two files, each with a "no error token in Colors" comment — at a third use, an error token becomes a `chore:` with lived demand. Cosmetic: `coa-detail.tsx`'s comment cites "the sign-in precedent"; the observed precedent is `add-to-shelf-modal.tsx`'s `confirmError`.
- The mid-gate freeze: unreproduced one-off, Metro-reload explanation favored, unconfirmed. If a full-app freeze recurs on a warm dev-client session, this record is the prior.
- RAINBOW RUNTZ = Kaycha fixture with a clean-parsing brand — evidence to weigh when the Kaycha blank-brand defect is picked up.

### Banked (carried)
- Audit script `$?` echo + stale [15] text (disposition proposed above); parser brand-sludge/`g CBDVa` cleanup; Kaycha blank-brand defect (two fixtures; see new evidence above); guard layout centering; `identifyLab` brittleness; envelope-unwrap redesign + D33 `functions.invoke` migration; dashboard-only auth config; Resend domain verification; deploy reproducibility; `--no-lock`; url-polyfill; `.gitignore:40`; terpene whitelist; CRLF warnings (tolerated, fired on every add/diff this session as always); `unrs-resolver`; `npm audit` template vulns; no Storage bucket / `pdf_url`; payload-shape validation; template orphans (`hint-row`, `animated-icon`, `explore.tsx`); keyboard-behind-footer mid-edit (tolerated by D43, now also true of the detail footer — same acceptance); Stack conversion (D45 banked it); `position` column; server-side session revocation declined.

---

## Working rhythm (only what is in flux)

Stable method lives in `CLAUDE.md` and `documentation/process/handoff-specs.md`.

- **New: directed-repro rule** (ratified above) — discriminating questions first, targeted trigger repro second, fix only against a confirmed cause.
- **Stills as primary gate evidence, matured:** two stills carried gate steps 1–2 and the dialog verification outright this session; per-step text verdicts covered the rest. Keep requesting stills for first renders and copy checks.
- **Full-length simulation held:** every fenced block in every prompt was byte-compared against the criteria-verified authored text before shipping; zero implementer STOPs were needed across four prompts.
- Report-body-or-nothing: held on all four reports, unchanged, keep it.

---

## Entry point

**Open with the 6c status flip (ten minutes: whole read of `confirm-edit-screen.md`, flip the confirmed-false status text, own docs commit), then spend the session on the scoring lexicon design pass.** The flip goes first because a confirmed false claim in a governed design doc is the named hazard class this project keeps paying for — it costs almost nothing to retire and it re-derives confusion every session it stands. The lexicon is the session's substance because it is the heart of the personal-empirical engine and the single blocker in front of books, moods, bands, Never Again, and session logging — the entire product beyond ingestion. It is a design-only session by construction (`product-metaphor.md` explicitly reserves it: "its own dedicated design pass… do not improvise"), opening with whole reads of `product-metaphor.md` and the D45-final `shelf.md`, and its integrity constraints are already ratified: scores derive from logged outcomes only, never chemistry; every session score is preserved; `never_again` overrides display, never data; the provisional `never_again`/`average_score` structure is direction to be revisited, not schema to be assumed. This is the single next move.
