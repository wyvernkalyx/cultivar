# Cultivar — Session Handoff

_Written 2026-07-13, against HEAD `5a2f93f`, pushed and verified (`97e0974..5a2f93f main -> main` observed; this session also observed `a2d0ca2..97e0974` — two pushes)._
_**The repo is authoritative over this document.** Every state claim below is a prediction to falsify, not a fact to trust._

_Concrete refutations from this session, so this preamble is read and not skimmed:_
_(1) **The architect authored file edits against a terminal paste and the repo refuted them.** The slice-8 docs prompt (v1) reconstructed `shelf.md` from the operator's `cat` paste; the paste had silently dropped every blank line (56 reconstructed vs 71 real), Edit 1's OLD block spanned a blank line that wasn't in the reconstruction, and Claude Code's STOP-on-contradiction fired — correctly, changing nothing. Rule extracted: **a terminal paste is a lossy channel for blank lines; edit anchors must come from the blob (`git show HEAD:<path>`) or be adjacency-free (single whole lines, substrings, or implementer-verified blocks).** The v2 prompt was rebuilt adjacency-free and executed clean._
_(2) **A destructive device gate was run under an aggregate "all passed" and deleted the wrong row.** The operator ran the slice-8 gate without per-step verdicts; the delete landed on Cosmic Cereal (`edb3dc6c`, the step-5 survive-target) instead of the sludge-branded `d6ba53e7` (the step-3 target). Caught because the step-4 orphan read-back returned the target's full baseline counts — impossible after a real cascade delete. Third session-event where the aggregate-verdict rule was the thing that slipped. The gate was re-run with position-and-brand target identification and closed clean; Cosmic Cereal was recovered by re-adding its PDF (new id `7bb5f095`). Hardened again, with a new clause: **the reviewer reconstructing verdicts from screenshots does not count as verdicts — the operator's per-step attestation is the artifact that carries ordering, and without it the gate does not close.**_

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
| [2] HEAD | If this handoff is NOT yet committed: `5a2f93f`, subject `feat: delete from shelf (slice 8)`, parent `97e0974`. If committed: a `docs: session handoff` commit whose **parent is `5a2f93f`**. |
| [3] ahead of origin | **0** |
| [4] working tree | **clean** if this handoff is committed; else exactly ` M documentation/SESSION_HANDOFF.md`. **If `.env` appears, stop everything.** |
| [5] `.env` ever committed | `(never committed)` |
| [6] client path | `src/lib/supabase.ts` tracked; `lib/` count **0** |
| [7a/b] `.gitignore` blob | line 34 `.env*`, line 35 `!.env.example`, LF. Line 40 `example` banked. Unchanged. |
| [8] unstable flags | `(none)` |
| [9] `npm test` | **36 passed**, 1 suite. Parser untouched; re-observed at slice-8 build criteria and at session close. |
| [10] `deno test` ingest-coa | **5 passed**. Function untouched; carried. |
| [11] `deno check` | exit 0 by inference; script still lacks `$?` echo (SEVENTH session). Banked chore. |
| [12] `tsc --noEmit` | `(no output)`, exit 0. Re-observed at session close. |
| [13] `expo lint` | **1 error, 0 warnings** (`use-color-scheme.web.ts`). Re-observed at session close. |
| [14] `expo install --check` | jest 30 / @types/jest 30 misaligned — expected, do not fix. |
| [15] trailers | **exactly ONE, parsed** (D35). Script's expectation text still stale; banked. |

**New this session, not covered by the audit script:**
- `grep -Fc "onLongPress" src/components/shelf-list.tsx` → **1** (the Pressable; the prop is named `onDelete` by design — intent at the prop, gesture at the Pressable).
- `git grep -c "Remove from shelf?" -- src/` → **1** (the confirm title, in `shelf-list.tsx`).
- `grep -Fxc '## Delete-from-shelf (slice 8, D42)' documentation/design/shelf.md` → **1**.
- `wc -l < documentation/design/shelf.md` → **130** (labeled prediction: 71 − 6 + 65; never verified directly).
- `grep -Fxc '# Shelf' documentation/design/shelf.md` → **1** (doc retitled; it now spans slices 7–9).

**Database state (observed at session close, NOT predictable as counts):** shelf holds **3 rows** — `7bb5f095…` Cosmic Cereal (21/13/10 child counts; a RE-ADD, so its id differs from any earlier record of Cosmic Cereal), `e3c91b9f…` and `abe82f1f…` Animal Face / Moby & Zeke (20/16/8 each). Deleted this session: `edb3dc6c…` (Cosmic Cereal original — the wrong-target accident, cascade observed 0/0/0) and `d6ba53e7…` (the sludge-branded gate row — the intended slice-8 delete, cascade observed 0/0/0). **Phase A predicts repo state, never user-data state** (standing rule). Note all three current rows say "Animal Face" or have distinct strains; if gate targets ever collide on strain again, identify by position + brand line — the confirm dialog names strain only (banked defect).

**Gate assets:** unchanged at `/d/Projects/Cultivar/` (repo parent, untracked, deliberate — the neutral.pdf convention). **Open hygiene item: `auth-resp.json` in that directory almost certainly holds an OTP access + refresh token pair; the architect recommended deleting it and never received confirmation. Check and delete.**

**If any of these don't match, the repo wins — re-baseline before proceeding.**

---

## What shipped (newest first)

- `5a2f93f` — feat: delete from shelf (slice 8; device-gated per step after a false start — see Arcs)
- `97e0974` — docs: design slice 8 delete-from-shelf (D42; landed on the v2 prompt after v1's correct STOP)
- Scope note: `a2d0ca2` (the prior handoff) and everything before it are covered by the previous handoff, superseded by this file. Session start for this scope = `a2d0ca2`.

---

## The arcs

**Slice 8 was designed from observations, not memory, and the design survived contact.** The delete needed no RPC: the schema already carried `on delete cascade` on all three child FKs (migration lines 60/66/72, grep-observed) and the `coas_all_own` policy is `for all using (auth.uid() = created_by) with check (…)` (lines 53–54, sed-observed after the architect refused to write the clause from the policy's name alone). D42's shape: long-press → native destructive `Alert.alert` naming the strain (fallback "this COA" — the blank-brand lesson applied preemptively) → client `supabase.from('coas').delete().eq('id', id)` → refetch on success, alert-and-leave-alone on failure. Cascade deletions are referential actions, not user statements — child-table RLS does not re-gate them; the DELETE policy on `coas` is the only gate. Long-press over swipe: zero new dependencies, zero card chrome (discipline 2 intact), undiscoverability accepted at n=1 with the visible affordance assigned to the card detail view (renumbered slice 9). Implementer judgment approved and kept: `onDelete` prop naming, promise-callback form matching the file idiom, and superseding the stale "non-interactive" comment in the same pass the design doc superseded the same sentence.

**The docs prompt cycle produced the session's best process artifact: a STOP that was right.** v1's Edit 1 failed verbatim-match because the architect's HEAD reconstruction (from a terminal paste) had no blank lines. The v2 rebuild made every anchor adjacency-free and pushed six anchor-precondition greps into the prompt itself. Two criterion-authoring lessons landed alongside: a diff-stat bound must be derived by summing every edit's line mechanics (C12 said ≤4; actual was exactly 6 — Edits 3 and 4 replace lines just as surely as the block edits), and even a correct implementer's summary arithmetic can be off by one while git's observed numbers reconcile exactly — the observation is what settles, never the narration.

**The gate closed only after the evidence discipline was enforced twice.** First the elided diff: the build report marked the card-body re-indent "byte-identical, pasted in tool output above" — which stops at Claude Code. The reviewer demanded the whole diff before authorizing a destructive gate; it was clean, but the demand stands as precedent: **diffs reach the reviewer whole; elision plus a fidelity claim is vouching.** Then the wrong-target delete (preamble refutation 2). The re-run gate closed with per-step evidence: confirm render screenshot, cancel control read-back, delete of `d6ba53e7` with zero-orphan read-back plus surviving-COA control, offline failure branch (airplane icon in-frame, fetch-failed alert, row persisted, DB unchanged), and the add regression doubling as Cosmic Cereal's recovery.

---

## Refuted hypotheses / memory corrections

- **Terminal paste = HEAD blob** (architect) — FALSE; blank lines dropped silently. Anchors from the blob or adjacency-free. (Preamble 1.)
- **"All passed" (slice-8 gate, aggregate)** — unverifiable and materially wrong: the delete had hit the wrong target. Caught by the orphan read-back returning baseline counts. Third strike for aggregate verdicts; reviewer-reconstructed verdicts explicitly do not count. (Preamble 2.)
- **C12 deletion bound ≤4** (architect) — actual 6; the bound skipped two single-line edits. Diff-stat criteria are derived by summing edit mechanics, not eyeballed.
- **Implementer reconciliation "57-line section + blank = 58"** — off by one (section is 56); git's 65/6 reconciled exactly against the authored texts. Correct trees can ship with incorrect narration.
- **Sentinel transliterated** (architect) — the ASCII-composed commit prompt turned `— END OF PROMPT —` into hyphens; the implementer correctly reasoned truncation-vs-transliteration but flagged it. Ruling: **the sentinel is a fixed em-dash byte pattern in every prompt; ASCII discipline applies to commit message content only.** Both encodings now deliberately coexist in commit prompts.
- **Operator hypothesis "files above repo root are an error"** — refuted from the prior handoff's own text: repo-parent placement is the deliberate neutral.pdf convention (unstageable by construction). One real item found in the review: `auth-resp.json` (see Start here).
- **Project-knowledge doc copies said "exactly two trailers"** — stale on D35; repo `CLAUDE.md:93` and `handoff-specs.md:124` verified amended to exactly one. In-context copies of governed docs are snapshots; the repo text governs.
- **Claude Code conduct: strong again** — the v1 STOP was exactly right (refused to improvise an unambiguous-intent match because the prompt forbade it), anchor verification was thorough, the comment-supersession judgment call was correct and disclosed, and item-5 reporting caught the architect's C12 error and the sentinel drift. One correction issued: elided diff hunks (now a standing rule).
- **Still true:** parse trailers never count; blob reads via `git show HEAD:`; per-step verdicts with read-backs for every DB-writing gate; probe inputs validated against mechanisms; Phase A predicts repo state only.

---

## Ratified decisions

D1–D41 stand. New this session:

- **D42 — delete-from-shelf (slice 8):** long-press affordance + native destructive confirm naming the strain and what is destroyed; client-side DELETE, no RPC (cascade FKs are the atomicity, `coas_all_own` is the only gate); success refetches via load, failure alerts and changes nothing; card detail view renumbered to slice 9. Grounds in `documentation/design/shelf.md` at `97e0974`; landed `5a2f93f`; device-gated per step including zero-orphan read-back and offline failure branch.
- **Ruling — sentinel byte pattern:** `— END OF PROMPT —` (em dashes) in every prompt, unconditionally; never transliterated by other encoding constraints.
- **Ruling — diffs reach the reviewer whole:** an elided hunk plus a fidelity claim is vouching; the destructive-gate bar is a full raw diff read by the architect.
- **Ruling — verdicts are the operator's:** per-step verdict lines accompany gate evidence or the gate does not close; reviewer reconstruction from screenshots is diagnosis, not attestation.

---

## Open items

### Runnable now
- **Below-the-fold confirm fix — the entry point** (see below). Caused the 6b false gate; every future editor gate flows past it.

### Blocked
- Books / moods / bands / Never Again / session logging — blocked on the **scoring lexicon design pass** (its own dedicated session; the heart of the product).
- In-stock / possession — blocked on schema; **now also owns the remove-vs-delete distinction** (operator's live catch during the gate: "the shelf shows active product — removing from the shelf is not the same as deleting forever." The compendium-record vs physical-possession split is exactly the metaphor's territory).

### Banked (new this session)
- **Confirm dialog title/semantics gap** — "Remove from shelf?" over a permanent-delete body; title should say what the body means (candidate: "Delete COA?"). Folds with:
- **Strain-ambiguous confirm** — three live cards read "Animal Face"; the dialog names strain only, so it cannot disambiguate the target. Candidate: name strain + brand or strain + added date. One small slice with the retitle.
- **`auth-resp.json` at repo parent** — holds token material; delete (unconfirmed as of writing).

### Banked (carried)
- Confirm button below the fold (PROMOTED to entry point); audit script `$?` echo + stale [15] text (one chore); shelf.md `###` headings supersede the old zero-subheading convention (do not "restore" it); blank brand line on cards (re-observed on Cosmic Cereal); parser brand-sludge/`g CBDVa` cleanup; guard layout centering; `identifyLab` brittleness; envelope-unwrap redesign + D33 `functions.invoke` migration; dashboard-only auth config; Resend domain verification; deploy reproducibility; `--no-lock`; url-polyfill; `.gitignore:40`; terpene whitelist; CRLF warnings (tolerated, fired again); `unrs-resolver`; `npm audit` template vulns; no Storage bucket / `pdf_url`; payload-shape validation; template orphans (`hint-row`, `animated-icon`, `explore.tsx`).

---

## Working rhythm (only what is in flux)

Stable method lives in `CLAUDE.md` and `documentation/process/handoff-specs.md`.

- **HARDENED (third strike): per-step verdicts, operator-attested, or the gate does not close.** Screenshots are evidence; the verdict line is the attestation of order and target. Destructive gates additionally identify targets by position + brand line when strains collide.
- **New: edit anchors come from the blob or are adjacency-free.** Terminal pastes drop blank lines. Presence criteria are simulated against the authored insert, absence against the true blob — a reconstruction is not a blob.
- **New: diff-stat criteria are derived, not estimated** — sum every edit's line mechanics; single-line replacements count.
- **New: diffs to the reviewer whole; sentinel always em-dash** (both ratified above, restated here because they change prompt authoring).
- **Operator note:** long git output pages through `less` — `q` quits, `Space` pages, `/` searches; no terminal restart needed.
- The slice pattern ran once more end-to-end (design → docs commit → build → device gate → feat commit → push) including a correct implementer STOP and a gate re-run; unchanged, keep it.

---

## Entry point

**The below-the-fold confirm fix.** It is the highest-priority banked item by demonstrated cost: it manufactured the 6b false gate, and it sits in the add-to-shelf flow that every future ingestion slice gates through. The slice is small and principled — pin the confirm action outside the editor's scroll region so it is visible without scrolling, crossing the editor/modal boundary that made it its own slice rather than a tweak. It opens with a short design pass amending `documentation/design/confirm-edit-screen.md` (the action bar becomes a fixed element; the "at the bottom of the editor, below Safety" placement — the architect's own refuted spec — is superseded), then the established rhythm. The confirm-dialog retitle + disambiguation slice is the named follow-on, not part of this one. This is the single next move: the editor's confirm is the one control the operator literally could not see, and the next slice through that flow should not have to rediscover it.
