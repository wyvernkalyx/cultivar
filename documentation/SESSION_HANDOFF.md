# Cultivar — Session Handoff

_Written 2026-07-15, against HEAD `ccd9a22`, pushed and verified
(`d0a2e81..ccd9a22 main -> main` observed; this session also observed
`ed7538b..d0a2e81` — three pushes counting the handoff to come)._
_**The repo is authoritative over this document.** Every state claim below is
a prediction to falsify, not a fact to trust._

_Concrete refutations from this session, so this preamble is read and not
skimmed:_
_(1) **The architect's byte-compare gate was silently defeated by its own
delivery channel.** The scoring-lexicon persistence prompt required a diff
against "the operator-provided file"; the artifact arrived inline in the
prompt message, so the implementer transcribed it and the diff proved
repo-copy == its own transcription — the transcription step sat inside the
trust boundary instead of under the gate. The implementer flagged it instead
of vouching past it; closure required an after-the-fact sha256 comparison
against the architect's original (`bc09a3f7…`, matched). Countermeasure
ratified below: verbatim-persistence prompts embed the expected sha256._
_(2) **The operator's "they are anonymous to us" premise was refuted.** RLS
scopes users from each other, not from the operator, who can read every row
today. This killed a maybe-meds argument and is now a recorded posture in
`scoring-lexicon.md` (medications excluded; revisit bar is an architecture
where the operator cannot read the field)._
_(3) **Zero Phase A refutations this session — a first.** Every audit value
and every new-this-session pin matched. Noted so the next session does not
mistake a clean audit for a reason to skim: the byte-compare defeat above
happened the same day._

_Begin with the Phase A audit below. **Run it in Git Bash (`MINGW64`), from
`/d/Projects/...`, never WSL.** Try to break it._

---

## Start here (Phase A, read-only)

Open **Git Bash**, confirm `uname -s` starts with `MINGW`,
`cd /d/Projects/Cultivar/cultivar`, then:

```
bash scripts/session-audit.sh > ../audit.txt 2>&1
echo "exit: $?"
```

Paste `audit.txt` whole. Expected values, each a prediction that can be
wrong:

| Check | Expected |
|---|---|
| [1] branch | `main` |
| [2] HEAD | If this handoff is NOT yet committed: `ccd9a22`, subject `docs: design the scoring lexicon (D46)`, parent `d0a2e81`. If committed: a `docs: session handoff` commit whose **parent is `ccd9a22`**. |
| [3] ahead of origin | **0** |
| [4] working tree | **clean** if this handoff is committed; else exactly ` M documentation/SESSION_HANDOFF.md`. **If `.env` appears, stop everything.** |
| [5] `.env` ever committed | `(never committed)` |
| [6] client path | `src/lib/supabase.ts` tracked; `lib/` count **0** |
| [7a/b] `.gitignore` blob | line 34 `.env*`, line 35 `!.env.example`, LF. Line 40 `example` banked. Unchanged. |
| [8] unstable flags | `(none)` |
| [9] `npm test` | **36 passed**, 1 suite. No code touched this session (docs-only). |
| [10] `deno test` ingest-coa | **5 passed**. Functions untouched. |
| [11] `deno check` | tail-silence is the standing observation — **declared permanent this session** (adopted per the prior handoff's terms; the operator did not object). Stop counting sessions. |
| [12] `tsc --noEmit` | `(no output)`, exit 0. |
| [13] `expo lint` | **1 error, 0 warnings** (`use-color-scheme.web.ts`). |
| [14] `expo install --check` | jest 30 / @types/jest 30 misaligned — expected, do not fix. |
| [15] trailers | **exactly ONE, parsed** (D35). Script's stale expectation text: tolerated **permanently**, bundled with [11]'s disposition. |

**New this session, not covered by the audit script:**

- `git show HEAD:documentation/design/scoring-lexicon.md | wc -l` → **196**
- `git show HEAD:documentation/design/scoring-lexicon.md | sha256sum` →
  `bc09a3f7e8e2bdcfa538d8c49bfc9f265501c600dab8cab0a0175c9dd936c68e`
  (byte count 10078) — the verified architect-original hash.
- `git show HEAD:documentation/design/confirm-edit-screen.md | grep -Fc 'not yet built'` → **0**;
  same blob, `grep -Fxc 'Slice 6c landed at \`9e3124a\`.'` → **1**; `wc -l` → **277**.
- `git log --oneline -1 -- documentation/design/scoring-lexicon.md` →
  `ccd9a22 docs: design the scoring lexicon (D46)`.

**Database state (standing rule: Phase A predicts repo state, never
user-data state):** this session was docs-only — no gate ran, no app was
opened, no row was written or deleted. The shelf is whatever the slice-9
session left it.

**If any of these don't match, the repo wins — re-baseline before
proceeding.**

---

## What shipped (newest first)

- `ccd9a22` — docs: design the scoring lexicon (D46) — new 196-line
  `documentation/design/scoring-lexicon.md`, byte-verified against the
  architect's original by sha256.
- `d0a2e81` — docs: mark slice 6c implemented in confirm-edit-screen.md
  (the session opener; four-line status-block flip, the only stale text a
  whole read surfaced).
- Scope note: `ed7538b` (the prior handoff) and everything before it are
  covered by the previous handoff, superseded by this file. Session start
  for this scope = `ed7538b`.

---

## The arcs

**The 6c flip ran exactly as the prior handoff prescribed** — whole read,
two false claims found (both in the lines 3–6 status block; the D43 section
itself carried no implementation claim and needed nothing), four-line
replacement, criteria simulated against the authored blocks before the
prompt shipped, committed and pushed in two round-trips. Ten minutes, as
predicted.

**The scoring lexicon was designed end to end in conversation and shipped
as `scoring-lexicon.md` (D46).** The shape it took and why: the survey
splits into a lazy path (two taps: overall word + intent chip — a complete
log, not a degraded one) and a rich path (fit, context, alcohol — all
optional), chosen per session with no mode setting, because the operator's
first requirement was "recording must never be a chore." The score comes
from the overall word alone on both paths — composite scoring was rejected
because it makes a lazy and a rich log of the same experience score
differently, poisoning the average that drives book placement. The 5-point
fully-labeled word scale is the psychometric consensus (reliability peaks
at 5–7 points, fully-labeled beats numeric, odd counts give an honest
midpoint) and 5 beat 7 on two Cultivar grounds: impaired-logger cognitive
load, and point-count = book-count = a shelf readable at a glance. The
operator authored the five words ("I hated it / No / Meh / Yes / I loved
it", hidden values 1–5). Intent won question two over an effect vocabulary
("sleepy/creative") because intent is what the onboarding survey mirrors,
what expectation-vs-reality needs, and what the quadrant's x-axis is built
from; effect banks for v2 with its named counterargument recorded
(retrospective intent is softer than fresh effect report). The operator's
intent-shelf and Gartner-quadrant ideas were resolved as **lenses over the
one true shelf**, never a second organizing spine — books-as-intents
collides with the ratified one-book-one-mood identity three ways
(multi-purpose COAs need two books; purpose and quality mix in one
dimension; mood stops meaning quality). The operator's own later doubt
("forcing categories we don't fully understand") turned out to be an
argument against the intent-shelf, not against ratified books — bands
presume nothing about what "good" means. Iterate-from-use was ratified as
the method: the skeleton (6 items, listed in the doc) is durable; every
vocabulary is v1 provisional under `lexicon_version`, which exists
precisely so revision cannot corrupt history.

**The trust-boundary incident (preamble 1) is the session's process
story.** The persistence prompt's byte-compare gate assumed file-on-disk
delivery; inline delivery downgraded it to a transcription self-check. The
implementer's report named the downgrade precisely instead of claiming the
gate passed. Closure was mechanical: architect computed sha256 of the
original, operator hashed the committed blob, match observed, push then
authorized. The lesson is now a rule (Working rhythm below).

---

## Refuted hypotheses / memory corrections

- **"The operator-provided file is present" as a precondition** (architect)
  — defeated by inline delivery; the prompt failed to anticipate its own
  delivery channel (preamble 1). Fixed by rule, below.
- **"Users are anonymous to us"** (operator) — refuted: RLS scopes users
  from each other, not from the operator (preamble 2). Now load-bearing in
  the meds exclusion.
- **The marker-vs-claim limit re-confirmed on its own turf:** the
  architect's three grep patterns caught only line 3 of the 6c staleness;
  the second false claim ("designed below and not yet built", line 6)
  matched none of them and was found by the whole read — exactly the
  failure mode `CLAUDE.md` documents. The whole-read step was already
  prescribed and did its job.
- **Still true:** parse trailers, never count; blob reads via
  `git show HEAD:`; report-body-or-nothing (held on all three reports,
  zero vouching — one report exceeded the bar by self-flagging a gate
  downgrade); criteria executed before shipping (all three prompts'
  criteria simulated against authored text first; all passed live).

---

## Ratified decisions

D1–D45 stand. New this session:

- **D46 — the scoring lexicon:** full grounds in
  `documentation/design/scoring-lexicon.md` at `ccd9a22`. Skeleton
  (durable): score from the overall word alone on every path; overall word
  is the product's only mandatory field; append-only sessions storing raw
  answers + computed score + `lexicon_version`, immutable scores,
  recompute only by deliberate ratification; four distinct fact classes
  (intent / fit / context / co-consumption); five fully-labeled points =
  five books, compendium as a sixth visual state that is not a band;
  `never_again`/`average_score` confirmed as proposed (NA is a standing
  verdict, never a survey answer). Provisional (v1): all vocabularies.
  Excluded by posture: medications (revisit bar: operator-unreadable
  architecture). Two architect defaults flagged and accepted at commit,
  revisable like any v1 vocabulary: fit as 3-point (No / Sort of / Yes);
  fit skipped when intent is "just because."
- **Ruling — the [11] `$?` chore and [15] stale script text are
  permanent dispositions.** Adopted per the prior handoff's stated terms
  (operator did not object at the adoption point). The session count ends
  at ten. Tail-silence plus criteria-time `deno check` runs are the
  standing observation.
- **Ruling — verbatim-persistence prompts are self-verifying:** any prompt
  that persists architect-authored content byte-identical must embed the
  expected sha256 (and byte count) of that content in the prompt itself,
  so the gate holds regardless of delivery channel. Applied first to this
  handoff's own commit prompt.

---

## Open items

### Runnable now
- **The session-logging design pass** — the survey UI/mechanic over the
  now-designed lexicon (see Entry point).

### Blocked
- Books / moods / bands / Never Again — **no longer blocked on the lexicon
  design**; now blocked on session logging existing (schema + UI for
  sessions must land before any average exists to band).
- In-stock / possession — blocked on schema; owns the remove-vs-delete
  distinction. Unchanged.
- Onboarding survey implementation — ratified as concept (D46); blocked
  behind session logging (it mirrors the session survey, which must exist
  first).

### Banked (new this session)
- **Effect vocabulary** ("sleepy/creative") — rich-path candidate, lexicon
  v2; counterargument recorded in the doc.
- **Multi-intent** — v2, if lived usage shows genuinely dual-purpose
  sessions.
- **The quadrant** (per-intent quality x fit scatter), **the intent lens**,
  **confound discounting**, **expectation-vs-reality** — named future
  consumers; the lexicon captures their data now.
- **Promoting the expectations-never-outcomes discipline into
  `product-metaphor.md`'s discipline list** — optional `docs:` amendment.
- **Meds revisit bar** — user-only architecture (client-side encryption or
  local-only), its own design pass with its own threat model, only on
  lived demand.

### Banked (carried)
- Parser brand-sludge / `g CBDVa` cleanup; Kaycha blank-brand defect (two
  fixtures; RAINBOW RUNTZ counter-evidence); guard layout centering;
  `identifyLab` brittleness; envelope-unwrap redesign + D33
  `functions.invoke` migration; dashboard-only auth config; Resend domain
  verification; deploy reproducibility; `--no-lock`; url-polyfill;
  `.gitignore:40`; terpene whitelist; CRLF warnings (tolerated, fired as
  always); `unrs-resolver`; `npm audit` template vulns; no Storage bucket /
  `pdf_url`; payload-shape validation; template orphans (`hint-row`,
  `animated-icon`, `explore.tsx`); keyboard-behind-footer (tolerated by
  D43/D45); Stack conversion; `position` column; server-side session
  revocation declined; `#e5484d` error-color literal (two files; token at
  a third use); mid-gate freeze prior (Metro-reload favored, unconfirmed).

---

## Working rhythm (only what is in flux)

Stable method lives in `CLAUDE.md` and
`documentation/process/handoff-specs.md`.

- **New: the sha256 rule for verbatim persistence** (ratified above) —
  embed the content hash in the prompt; a byte-compare against a
  transcription is not a gate.
- **Directed-repro rule, stills-as-evidence, full-length criteria
  simulation, report-body-or-nothing:** all held; all carried unchanged.
- **Docs-only sessions are real sessions:** this one shipped two commits
  and a ratified decision with zero code and zero device gates. The gate
  type for a design-pass session is the operator reading and ratifying the
  doc — which happened in-conversation, question by question, before a
  line was authored.

---

## Entry point

**The session-logging design pass.** It is the single next move because it
is the first consumer of D46 and the last blocker before the product's
second half exists: sessions must be loggable before any score, average,
band, book, or mood can be real, and `product-metaphor.md` already reserves
the interaction ("a draggable, playful mechanic over the scoring lexicon —
design pass pending the lexicon"; the lexicon no longer pends). The pass
opens with whole reads of `scoring-lexicon.md` (the contract it implements)
and `product-metaphor.md` (the feel it must honor), then designs: the
survey UI (five word-buttons + intent chips, the two-path flow), where
logging launches from (the in-stock card is the metaphor doc's answer, but
no possession state exists — expect this pass to force the sessions-table
schema design and possibly surface the in-stock question early), and the
session slice boundaries (schema first as its own gated slice, then UI).
It is design-only until a doc is committed; document-before-implement is
not waived for the fun slice.
