# Cultivar — Session Handoff

_Written 2026-07-12, against HEAD `1024c3f`, pushed and verified (`4457c37..1024c3f main -> main` observed this session; earlier, `81cf5c7..4457c37` also observed)._
_**The repo is authoritative over this document.** Every state claim below is a prediction to falsify, not a fact to trust._

_Concrete refutations from this session, so this preamble is read and not skimmed:_
_(1) **The architect's first live probe of the unknown-lab arm was contaminated by its own author.** To exercise "a PDF from no known lab," the architect chose the project roadmap printed to PDF — the one document in the project most likely to name both labs. `identifyLab` matched `DRS Testing` in its prose and returned a fully-empty parse under `sourceLab: "drs-confident"`, HTTP 200. The accident was more informative than the intended probe: it proved the empty-parse state occurs under a KNOWN lab tag, which killed "check `sourceLab === 'unknown'`" as a guard design before it was ever proposed. Probe inputs must be checked against the matcher they exercise._
_(2) **The architect committed the exact substring-surprise error one prompt after re-reading the rule that names it.** A `grep -c 'slices 5–6' → 0` criterion was written over the whole file to verify a one-paragraph edit; HEAD had a second, legitimate occurrence at line 105 inside a section the same prompt froze. The implementer's STOP caught it. The corrected rule (in Working rhythm below) is mechanical, not aspirational: execute every grep criterion against the text it gates before the prompt ships. It caught a third defect the same day._

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
| [2] HEAD | If this handoff is NOT yet committed: `1024c3f`, subject `feat: guard empty COA parses before review (slice 5a)`, parent `4457c37`. If it HAS been committed: a `docs: session handoff` commit whose **parent is `1024c3f`** — its own sha unknowable here. |
| [3] ahead of origin | **0**. Non-zero = an unpushed commit; that is the finding, not an error. |
| [4] working tree | **clean** IF this handoff is already committed. If written-but-uncommitted, expect exactly ` M documentation/SESSION_HANDOFF.md` and nothing else. **If `.env` appears, stop everything.** |
| [5] `.env` ever committed | `(never committed)` |
| [6] client path | `src/lib/supabase.ts` tracked; `lib/` count **0** |
| [7a/b] `.gitignore` blob | line 34 `.env*`, line 35 `!.env.example`, LF. Line 40 bare `example` is template detritus (banked). Unchanged this session. |
| [8] unstable flags | `(none)` |
| [9] `npm test` | **36 passed / 0 failed**, 1 suite. Parser tree untouched this session; the count was observed at the session-start audit (HEAD `81cf5c7`) and is carried as a prediction, not re-observed post-5a — Jest's roots do not reach `src/`. |
| [10] `deno test` ingest-coa | **5 passed / 0 failed**. Function untouched this session (source read for the unknown-lab arm; not edited). Same carry caveat as [9]. |
| [11] `deno check` | exit **0** by inference only — the script STILL does not echo `$?`; silence observed a fourth session. The one-line `chore:` stays banked. |
| [12] `tsc --noEmit` | `(no output)`, exit **0**. Re-observed post-5a this session. |
| [13] `expo lint` | **1 error, 0 warnings**, file `use-color-scheme.web.ts`. Re-observed post-5a. Ceiling, not target. |
| [14] `expo install --check` | `jest@30.4.2` / `@types/jest@30.0.0` misaligned — expected, do not fix. `expo-document-picker` must NOT be flagged. |
| [15] trailers | **exactly ONE, parsed: generic Claude only** (D35, now four exemplars). The audit script's own expectation text may still say two — script staleness, banked; the parse output is the observation. |

**New this session, not covered by the audit script** (each standalone; expected hit counts stated, never "nothing else"):
- `git grep -n "ReviewOrGuard" -- src/` → exactly **2** hits, both in `src/components/add-to-shelf-modal.tsx` (definition + seam usage).
- `grep -c "sourceLab" src/components/add-to-shelf-modal.tsx` → **0** (the guard must not consult it; note `coa-review.tsx` legitimately renders it, so this check is scoped to the modal file, not `src/`).
- `git show HEAD:documentation/design/confirm-edit-screen.md | grep -Fxc '## Empty-parse guard (slice 5a)'` → **1**; same for `'## Editing interactions (slice 5b)'` → **1**.
- `git show HEAD:documentation/design/confirm-edit-screen.md | grep -c 'slices 5–6'` → **0** (en dash; HEAD before this session had exactly two occurrences, both removed).
- `git ls-files documentation/design/` → the same four files: `add-to-shelf-navigation.md`, `coa-ingest-transport.md`, `confirm-edit-screen.md`, `product-metaphor.md`.

**Deployed function: current, untouched, and freshly observed.** Two live authenticated invokes this session (D26 flow): a neutral non-COA PDF → HTTP 200, all-empty parse, `sourceLab: "unknown"` (byte-exact against the repo source's default arm); the roadmap PDF → HTTP 200, all-empty parse, `sourceLab: "drs-confident"` (the contaminated probe, preamble (1)). Both consistent with repo source — two more data points against deploy drift, still not proof.

**Schema gate (Supabase SQL editor): NOT re-observed — now FOURTH session carried.** Five tables, RLS on all five, `pg_policies` → 7 rows; migration at `supabase/migrations/20260708220816_create_core_schema.sql`. Slice 5b is client-state only and does not INSERT; the two queries are **mandatory** before slice 6.

**Gate asset:** `neutral.pdf` lives at `/d/projects/cultivar/neutral.pdf` — parent of the repo, untracked, deliberately. It is the reusable empty-parse gate input; it is also on the iPhone (Files) from this session's gate.

**If any of these don't match, the repo wins — re-baseline before proceeding.**

---

## What shipped (newest first)

- `1024c3f` — feat: guard empty COA parses before review (slice 5a; device-gated incl. control case)
- `4457c37` — docs: design slice 5a empty-parse guard and 5b editing interactions (D36, D37)
- Session start HEAD was `81cf5c7` (prior session's handoff commit). Working tree: clean once this handoff commits.

---

## The arcs

**Slice 5 opened with the mandated live observation of the unknown-lab arm, and the observations redesigned the slice.** Reading order: `ingest-coa/index.ts` (a parser throw → 400 `{error}`; non-throw → 200 `{data}`), then `parseCoa.ts`, which refuted the architect's stated 70/30 prior that unknown lab throws — it returns a fully-formed empty shell tagged `unknown`, deliberately, per its own docstring. Two live invokes followed (token captured by command substitution, never hand-pasted — see Working rhythm). The contaminated probe (preamble (1)) proved empty-parse-under-known-lab; the clean probe confirmed the unknown arm byte-exact against source. Consequence, ratified as D36: the guarded input class is the **empty parse**, never `sourceLab`, and the guard is its own slice 5a ahead of editing (5b). `identifyLab` is presence-of-string matching (`Kaycha\s+Labs`, `DRS\s+Testing`, ligature-tolerant `Con\w*dent\s+LIMS`) — cheap misidentification is a fact of the design, acceptable for v1 exactly because the guard plus the human gate sit downstream.

**The docs commit (`4457c37`) recorded D36/D37 and cost the architect two criteria defects, both caught by implementer STOPs.** First: a whole-file absence count (`'slices 5–6'` → 0) that a second, in-scope-frozen occurrence at line 105 made unsatisfiable — resolved by amending that sentence too, since it was stale on the merits, not just inconvenient (resolution (b), architect's call). Second: a presence pattern that omitted the backticks its own verbatim insert carried — the implementer preserved the content and reported the defective pattern rather than bending either. Both defects are the same class: a grep criterion never executed against the text it gates. The mechanical rule that came out of it caught a third defect before shipping (the 5a build prompt's `sourceLab` absence criterion would have failed on the architect's own explanatory comment; the comment was reworded).

**Slice 5a shipped as a routing component at the seam.** `ReviewOrGuard` in `add-to-shelf-modal.tsx`: predicate `terpenes.length === 0 && cannabinoids.length === 0` on the already-cast parse; guard renders a non-editable title + sentence with the pre-existing "Pick another" button inherited for free (it sits outside the ok/error ternary); non-empty parse falls through to `CoaReview`, untouched. The ternary still branches on `result.ok` because that narrows the `IngestResult` union for the error arm — the type-system constraint that dictated a component over a hoisted predicate. Device gate passed whole: `neutral.pdf` → guard state, `animal-face.pdf` → full review (control), picker-cancel and close/reopen regressions intact. The architect predicted the guard text would render top-aligned in the flex scroll area rather than centered; the gate passed regardless — cosmetic centering is banked if it ever grates.

---

## Refuted hypotheses / memory corrections

- **"`parseCoa` throws on unknown lab"** (architect, stated 70/30) — REFUTED by source: returns an empty shell tagged `unknown`, by design. The handler's 400 arm is for extraction/parse *throws*, a different class.
- **"Any non-lab PDF exercises the unknown arm"** — REFUTED by the contaminated probe: `identifyLab` matches lab-name strings anywhere in the text, so the roadmap PDF *is* a DRS COA to ingestion. Probe inputs must be validated against the matcher's actual patterns before spending the invoke.
- **"`sourceLab === 'unknown'` could flag the unreadable case"** — killed by the same observation before ever becoming a design: the empty parse occurs under known tags too. D36's predicate is the panel, not the tag.
- **Two criteria defects shipped by the architect and caught by implementer STOPs** (whole-file absence count unchecked against HEAD; presence pattern unchecked against its own authored insert), plus a third caught pre-ship by the new execute-before-ship rule. Same class, three instances, one day.
- **Project-knowledge copies of `CLAUDE.md`/`handoff-specs.md` went stale on D35** — both still said "exactly two trailers" at session start. Detected by blob greps (`git show HEAD:` counts → 0), predicted at ~90% and confirmed. Rule: in-context document copies are snapshots; anything convention-critical is verified against the blob before use.
- **Claude Code conduct: two exemplary STOPs** — contradiction stated precisely, resolutions offered, decision explicitly left to the architect, nothing touched either time — plus one proactive full-body read when the first commit prompt omitted it (now baked into commit prompts as a formal criterion). Zero vouching instances. Separately: the Claude Code → chat paste channel dropped raw tool output (diffs, body reads) twice; see Working rhythm.
- **Still true from prior handoffs:** Git Bash for the audit script, never WSL; native-module change → EAS build, JS-only → Metro reload (5a gated on reload); parse trailers, never count; `git show HEAD:<path> | cat` for blob reads; 6-digit OTP; gate evidence is one-line text verdicts, screenshots only for a brand-new screen's first render.

---

## Ratified decisions

D1–D35 stand. New this session:

- **D36 — the empty-parse guard is slice 5a, ahead of editing.** Predicate `terpenes.length === 0 && cannabinoids.length === 0`, checked in the success branch, independent of `sourceLab`; non-editable "couldn't read this COA" state with the existing repick affordance; own minimal UI, not coupled to the failure branch (which is banked for its own redesign). Grounds: both live observations above; an all-empty panel is not reconcilable and there is no add-row to recover with. Designed at `4457c37`, landed `1024c3f`.
- **D37 — slice 5b editing primitives.** Tap-to-edit numeric (decimal-pad) value editor, commit on blur/done: empty/whitespace → null, typed `nd`/`ND` → null, valid number → number, unparseable → revert; **an explicitly typed 0 is a legal real number** — the invariant bans fabricated zeros, not deliberate ones. No row migration during edit (grouping computed once at draft init; a reading aid, not a data property). Delete behind a confirm alert (no add-row makes deletion otherwise unrecoverable). Inline rename, commit on blur, empty reverts. Metadata free-text, string-typed, `""` never null, no validation this slice. Draft state local and id-keyed at init (names editable → name is no key; index breaks under delete); reducer vs `useState` is the implementer's choice. Grounds argued and ratified in-session; recorded at `4457c37`.

---

## Open items

### Runnable now
- **Slice 5b — editing.** The design is committed and the interaction questions are settled (D37); what remains is a short placement pass and the build prompt. **This is the entry point** — see below.

### Blocked
- Nothing hard-blocked.

### Banked
- **Unknown-lab / empty-parse path: RESOLVED as an unknown** (was banked last session as unobserved). Observed live, guarded at `1024c3f`. What remains banked from that cluster: the failure branch still renders `{error}` bodies raw, tied to the **envelope unwrap-at-the-seam redesign** and the `functions.invoke` migration (D33) — post-slice-6, low.
- **Guard layout** — text renders top-aligned in the flex scroll area, not centered. Gate passed; cosmetic; fix only if it grates.
- **`identifyLab` brittleness** — presence-of-string matching means any text mentioning a lab name is that lab's COA. Acceptable for v1 because the empty-parse guard and human gate sit downstream; that acceptance makes the guard load-bearing. Revisit only with evidence of a *wrong non-empty* parse from misidentification.
- **Stale-result race** — unchanged, still benign, still unverified-absorbed.
- **Audit script** — no `$?` echo after `deno check` (fourth session), and its [15] expectation text likely still says two trailers (D35 staleness). One `chore:`, both fixes together.
- **Parser: DRS/Confident `brand` sludge + stray `g CBDVa`** — 5b's rename and metadata edit affordances are the designed human catch; fixture-backed parser cleanup remains banked. ~12 more COAs available as fixtures.
- **Schema gate re-observation** — mandatory before slice 6 (fourth session carried).
- **Carried unchanged:** in-stock data primitive; scoring lexicon (+ `never_again`/`average_score` revisit); session-logging interaction; mood visual language; EAS-build-source unknown (commit-first remains default); dashboard-only auth config (OTP length, SMTP, `{{ .Token }}`) not in repo; Resend domain verification; config dedupe to per-function `deno.json`; deploy reproducibility (`^1` unpinned); `--no-lock` on deno check/test; url-polyfill necessity; `.gitignore:40`; terpene whitelist; CRLF-on-clone (surfaced twice this session as tolerated warnings); `unrs-resolver` allow-scripts; `npm audit` template vulns; no Storage bucket / `pdf_url`.

---

## Working rhythm (only what is in flux)

Stable method lives in `CLAUDE.md` and `documentation/process/handoff-specs.md`.

- **New, load-bearing: every grep criterion is EXECUTED against the text it gates before the prompt ships** — against the HEAD blob for absence claims, against the authored insert for presence claims. Three same-day data points: two defects shipped and caught by implementer STOPs before the rule, one caught by the rule before shipping. This subsumes last session's "grep predictions carry expected hit counts" — a stated count that was never run is still a guess.
- **New: long secrets are never hand-pasted.** Two consecutive hand-pastes of a JWT arrived corrupted (a literal `^C`, then bracketed-paste garbage). The pattern: redirect the response to a file, capture with command substitution (`TOKEN=$(grep -o '"access_token":"[^"]*"' file | cut -d'"' -f4)`), verify with `${#TOKEN}`.
- **New: raw evidence (diffs, commit bodies) reaches the architect via the operator's paste, never via the implementer's report alone.** The Claude Code → chat channel dropped raw tool output twice this session while the surrounding report survived; "pasted above" claims about content the architect cannot see are treated as unverified. Commit prompts now carry the full-body read as a formal criterion, and the operator pastes it and the diff directly.
- **New: probe inputs are validated against the mechanism they exercise** before spending a live invoke — read the matcher/parser first, then choose the input (preamble (1)).
- Carried: dump provenance named in every design pass; prompts stacking on a moving tree state their snapshot; gate evidence economy (one-line verdicts, screenshots only for a new screen's first render — exercised this session: the guard's first render got the screenshot slot, the rest were text verdicts).
- The slice pattern (survey → design note → build prompt → typed gate → separate commit prompt → body read → authorize → operator pushes) ran twice more today, including two implementer STOPs resolved by corrected prompts; unchanged, keep it.

---

## Entry point

**Slice 5b: editing.** The design is already committed (`confirm-edit-screen.md`, "Editing interactions (slice 5b)", D37) — this slice needs no ratification pass, only a **placement pass**: read `src/components/coa-review.tsx` whole (the architect has not read it this session; it is the file the diff will touch or wrap) and decide where the editing affordances live — inside `CoaReview` (mutating it from presentational to controlled) versus a new editing component that renders the same sections with inputs, with `CoaReview` retired or retained for a future read-only context. That single decision, plus the draft-state wiring in the modal (id-keyed at init per D37), is the build prompt's content. The gate is typed UI-visible, physical iPhone via Metro reload, and must exercise: the three-state invariant live (edit a value to ND and back; confirm no 0 ever appears as a stand-in; type an explicit 0 and confirm it sticks as a real value), the rename of `g CBDVa` → `CBDVa` (the real observed defect the affordance exists for), a delete behind its confirm, and the brand-sludge correction in metadata. Confirm-emit and any INSERT stay in slice 6, behind the mandatory re-observed schema gate. This is the single next move: it turns the readable screen into a correctable one, which is the entire reason the human gate exists.
