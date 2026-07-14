# Cultivar — Session Handoff

_Written 2026-07-14, against HEAD `6104b16`, pushed and verified (`4f9a5b0..6104b16 main -> main` observed, rev-list 0 observed; this session also observed `990c62c..4f5606e` and `4f5606e..4f9a5b0` — three pushes)._
_**The repo is authoritative over this document.** Every state claim below is a prediction to falsify, not a fact to trust._

_Concrete refutations from this session, so this preamble is read and not skimmed:_
_(1) **The architect raised a false alarm against the repo and the repo won.** Phase A surfaced "exactly two co-author trailers" in the architect's project-knowledge copies of `CLAUDE.md` and `handoff-specs.md`, contradicting D35 and the parsed HEAD trailer. The architect predicted the repo files carried the stale claim; `git show HEAD:CLAUDE.md` refuted it — the repo was swept clean at D35, and the stale copies are the ones loaded into the architect's own context. Operator action banked: refresh both files in project knowledge, or this false alarm re-derives every session._
_(2) **The architect shipped a wrong criterion into its own simulation and the simulation caught it.** The docs-prompt prediction was `grep -Fc 'Remove from shelf?'` -> 1 post-edit; the authored D44 "Why" section quotes the old title, so the true value is 2. First save of a wrong *criterion* (not a wrong anchor) by executing criteria against the authored text before shipping. The same run surfaced tool mechanics: grep parses dash-prefixed patterns as options — every such criterion now carries `-e`._

_Begin with the Phase A audit below. **Run it in Git Bash (`MINGW64`), from `/d/Projects/...`, never WSL.** Try to break it. The zero-break streak is now two sessions; a third would be evidence the discipline works, not evidence the audit is soft — but read the mismatches first if any appear._

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
| [2] HEAD | If this handoff is NOT yet committed: `6104b16`, subject `docs: mark slice 10 implemented in shelf.md`, parent `4f9a5b0`. If committed: a `docs: session handoff` commit whose **parent is `6104b16`**. |
| [3] ahead of origin | **0** |
| [4] working tree | **clean** if this handoff is committed; else exactly ` M documentation/SESSION_HANDOFF.md`. **If `.env` appears, stop everything.** |
| [5] `.env` ever committed | `(never committed)` |
| [6] client path | `src/lib/supabase.ts` tracked; `lib/` count **0** |
| [7a/b] `.gitignore` blob | line 34 `.env*`, line 35 `!.env.example`, LF. Line 40 `example` banked. Unchanged. |
| [8] unstable flags | `(none)` |
| [9] `npm test` | **36 passed**, 1 suite. Re-observed at the slice-10 build criteria. |
| [10] `deno test` ingest-coa | **5 passed**. Observed at this session's opening audit; function untouched since (all four commits this session touched only `shelf.md` and `shelf-list.tsx` — diff-stats prove it). |
| [11] `deno check` | exit 0 by inference; script still lacks `$?` echo (NINTH session). Banked; the count is now its own argument for either promoting or declaring it permanent. |
| [12] `tsc --noEmit` | `(no output)`, exit 0. Re-observed at slice-10 build criteria. |
| [13] `expo lint` | **1 error, 0 warnings** (`use-color-scheme.web.ts`). Re-observed at slice-10 build criteria. |
| [14] `expo install --check` | jest 30 / @types/jest 30 misaligned — expected, do not fix. |
| [15] trailers | **exactly ONE, parsed** (D35). Script's expectation text still stale; banked with [11]. |

**New this session, not covered by the audit script:**
- `grep -Fc "'Delete COA?'" src/components/shelf-list.tsx` → **1**; `grep -Fc "'Remove from shelf?'" <same>` → **0**; `grep -Fc '${name}' <same>` → **0**.
- `git show HEAD:documentation/design/shelf.md | wc -l` → **212**.
- `git show HEAD:documentation/design/shelf.md | grep -Fc 'designed, not implemented'` → **0**; `grep -Fc -e 'implemented at \`4f9a5b0\`'` on the same blob → **2**. (Note the `-e`: dash-prefixed and backtick-bearing patterns need it or the shell/grep mangle them.)
- `git show HEAD:documentation/design/shelf.md | grep -Fxc '## Confirm dialog copy (slice 10, D44)'` → **1**.

**Database state (observed at session close via gate screenshots, NOT predictable as counts):** the gate added **RAINBOW RUNTZ / Animal House / added 7/14** through the full add flow (operator-attested), on top of the prior session's four rows — inference says five rows, but only RAINBOW RUNTZ, Permanent Shade, Cosmic Cereal, and at least one Animal Face were directly visible in the stills. The prior handoff disagreed with itself on the Animal Face count (entry point said three, its own DB block said two); never resolved, absorbed by the D44 named limit, and recorded here so neither number is trusted. **Phase A predicts repo state, never user-data state** (standing rule).

**If any of these don't match, the repo wins — re-baseline before proceeding.**

---

## What shipped (newest first)

- `6104b16` — docs: mark slice 10 implemented in shelf.md (self-created staleness, corrected in-session)
- `4f9a5b0` — feat: confirm dialog copy (slice 10, D44; four-step device gate, two steps by screenshot)
- `4f5606e` — docs: design confirm dialog copy (slice 10, D44; also corrected two stale slice-8 status claims)
- Scope note: `990c62c` (the prior handoff) and everything before it are covered by the previous handoff, superseded by this file. Session start for this scope = `990c62c`.

---

## The arcs

**Slice 10 ran end to end in one session — design, docs, build, gate, feat, and a staleness correction the session itself caused.** D44's shape: title "Delete COA?" (the old title contradicted its own permanent-delete body), and a line-echo body that repeats the pressed card's displayed identity — strain, brand, added date, in the card's own order and format — then the unchanged destruction sentence. The dialog's real job was reframed during design: not disambiguation in the abstract, but letting the user verify they pressed the card they meant, which is why the echo mirrors the card rather than composing a sentence. Nulls: strain falls back to "this COA"; a null/blank brand omits its line entirely (Permanent Shade was the live control). The named limit is recorded in `shelf.md`: identical-display duplicates cannot be disambiguated by any copy — position is the only distinguisher and a modal cannot convey it — accepted at n=1 because slice 9 deletes from a single-card context where ambiguity is impossible. One deliberate behavior delta beyond copy, found by reading the old code: it tested `trim()` but rendered the *untrimmed* strain; the new code renders trimmed, per the doc, and the feat commit body names it. Landing `4f9a5b0` made `shelf.md`'s two "designed, not implemented" claims false; per the practice ratified at `ababe82`, they were flipped at `6104b16` in the same session that broke them rather than banked.

**Simulation discipline gained a runtime dimension.** Before the build prompt shipped, the authored dialog logic was *executed* (node), not just grepped: real strain+brand produced the three-line echo; null strain plus whitespace-only brand produced the fallback with no brand line and no gap — the gate's control case passed in simulation before it passed on the device. The same pre-ship runs caught a wrong criterion (preamble 2) and a grep mechanics trap (`-e` for dash-prefixed patterns). Diff-stat predictions hit exactly on all three commits (84/2, 13/4, 2/2).

**The screenshot channel is now cheap, and the gate got better for it.** The operator supplied two stills unprompted ("easier to add screenshots") — refuting the carried belief that screenshot transfer is slow enough to design gates around one-line verdicts. Steps 1–2 of the D44 gate closed on photographic evidence (title, echo lines, and the absent-brand control all legible in the stills); steps 3–4 closed on operator attestation against two named questions. Future UI gates may request stills for copy verification, not just first renders.

---

## Refuted hypotheses / memory corrections

- **"The repo's `CLAUDE.md` carries stale two-trailer claims"** (architect) — refuted by the blob; the architect's project-knowledge copies are the stale ones (preamble 1). Until refreshed, distrust context copies of `CLAUDE.md`/`handoff-specs.md` on anything D35-adjacent.
- **`'Remove from shelf?'` post-edit count → 1** (architect) — refuted in simulation; 2, because the D44 rationale quotes the old title (preamble 2).
- **iOS multi-line `Alert.alert` body might center illegibly** (architect, flagged at gate-setup) — refuted by screenshot; left-aligned and legible.
- **Implementer ahead-of-remote narration, twice in one session** — reported "two ahead" then "three ahead" when observed push output proved one each time. Fifth recorded instance of correct-tree-incorrect-narration, and the first two against *remote* state the implementer has never observed. Rule, now standing: **the implementer's remote-state claims are never evidence; only push output and rev-list are.** Push-range outputs doubled as the refutation both times (`4f5606e..4f9a5b0`, `4f9a5b0..6104b16`).
- **"Screenshot transfer is slow; design gates for one-line verdicts"** (carried from prior sessions) — refuted by practice; the operator now sends stills easily.
- **Prior handoff's internal Animal Face count discrepancy** (three vs two) — caught, never resolved, deliberately absorbed: the D44 design handles duplicates via the named limit regardless of the true count.
- **Old confirm code trimmed the strain** — false; it tested trim and rendered untrimmed. Fixed and named in `4f9a5b0`'s body.
- **Still true:** parse trailers never count; blob reads via `git show HEAD:`; report-body-or-nothing (held on all five reports this session, zero vouching); Phase A predicts repo state only; diff-stat derivations account for the derivation tool's own mechanics.

---

## Ratified decisions

D1–D43 stand. New this session:

- **D44 — confirm dialog copy (slice 10):** title `Delete COA?`; line-echo body (strain / brand / `Added <date>` in the card's own format, blank line, unchanged destruction sentence reading "this COA"); null/blank strain → "this COA", null/blank brand → line omitted entirely; strain renders trimmed (deliberate delta, named in the feat body); named limit on identical-display duplicates accepted with slice 9 as the real fix; remove-vs-delete boundary held. Grounds in `shelf.md` at `4f5606e`; landed `4f9a5b0`; statuses trued at `6104b16`. Numbering ruling: slice 10 executed before slice 9 — slice numbers are identifiers, not a schedule.
- **Ruling — self-created staleness is corrected in-session:** a commit that falsifies a doc's status claims obligates the same session to flip them (as `6104b16` did), not bank them.
- **Ruling — implementer remote-state claims are never evidence:** ahead-of-remote counts, sync status, and anything about origin come only from observed push output and `rev-list`.
- **Accepted practice — screenshots as gate evidence:** stills are welcome for copy verification and controls, not only first renders; per-step verdicts still required where a still can't carry the step (cancel persistence, regressions).
- **Accepted practice — criteria are executed before they ship, including runtime:** grep criteria run against the text they gate; behavioral claims in authored code run under node where feasible; dash-prefixed grep patterns always carry `-e`.

---

## Open items

### Runnable now
- **Slice 9 — card detail view: the entry point** (see below).

### Blocked
- Books / moods / bands / Never Again / session logging — blocked on the **scoring lexicon design pass** (its own dedicated session; the heart of the product).
- In-stock / possession — blocked on schema; owns the **remove-vs-delete distinction**. D44 deliberately did not preempt it; the dialog is honest about today's permanent delete, nothing more.

### Banked (new this session)
- **Operator: refresh `CLAUDE.md` and `handoff-specs.md` in project knowledge** — the architect's copies predate the D35 one-trailer sweep and will re-derive the same false alarm every session until current.
- RAINBOW RUNTZ / Animal House fixture landed via the gate's add-flow regression — a new brand on the shelf; whether it exercises new parser paths (lab unknown from the stills) is unverified and should not be claimed.

### Banked (carried)
- Audit script `$?` echo + stale [15] text (one chore; NINTH session — promote next session or declare it permanent and stop counting); parser brand-sludge/`g CBDVa` cleanup; Kaycha blank-brand defect (two fixtures); guard layout centering; `identifyLab` brittleness; envelope-unwrap redesign + D33 `functions.invoke` migration; dashboard-only auth config; Resend domain verification; deploy reproducibility; `--no-lock`; url-polyfill; `.gitignore:40`; terpene whitelist; CRLF warnings (tolerated, fired on every diff/commit this session as always); `unrs-resolver`; `npm audit` template vulns; no Storage bucket / `pdf_url`; payload-shape validation; template orphans (`hint-row`, `animated-icon`, `explore.tsx`); shelf.md `###` headings convention stands; keyboard-behind-footer mid-edit (tolerated by D43); server-side session revocation declined for the deleted `auth-resp.json` tokens.

---

## Working rhythm (only what is in flux)

Stable method lives in `CLAUDE.md` and `documentation/process/handoff-specs.md`.

- **New: runtime simulation** — where authored code has checkable behavior (null paths, string assembly), execute it before the build prompt ships; greps alone missed nothing this session but would not have caught a logic error.
- **New: implementer remote-state rule** (ratified above) — review every report's closing narration against observed push state before repeating it.
- **Screenshot-friendly gates** — request stills where they carry the verdict; keep per-step attestation for what stills can't show.
- Report-body-or-nothing held on all five reports with zero re-requests; unchanged, keep it.

---

## Entry point

**Slice 9 — the card detail view — opening with a design pass, not a build prompt.** It is next in queue, it carries live operator demand (the "tapping a card should do something" instinct at the 6c gate), and it retires the D44 named limit by giving delete a single-card context where ambiguity is impossible. The design pass re-reads `documentation/design/shelf.md`, `documentation/design/confirm-edit-screen.md`, and `documentation/design/product-metaphor.md` at HEAD, then settles at minimum: what the detail view shows (the card's identity plus, presumably, the full analyte panels — which means the first client read of the three child tables; the read path and its RLS posture need stating), how it is reached (tap — which supersedes D42's "exactly one interaction" rule and must be amended in `shelf.md` the same way slice 8 superseded slice 7's non-interactive cards), where the visible delete affordance lives on it (D42 assigned it here), and whether the D44 dialog is reused verbatim from the detail context (recommendation: yes — same component, same copy; the identity echo is redundant there but harmless and keeps one dialog). Integrity disciplines carry: ND renders `ND`, never 0; untried stays neutral — the detail view shows lab facts, no scores, nothing mood-like, because the scoring lexicon is not designed. This is the single next move.
