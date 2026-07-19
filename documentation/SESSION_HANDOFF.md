# SESSION_HANDOFF -- written 2026-07-18 against pushed HEAD `a22f74f`

The repo is authoritative over this document. Begin with a read-only
Phase A audit (`bash scripts/session-audit.sh`, Git Bash only -- the
script was rewritten this session; see What shipped) and try to break
every claim below before doing anything else.

This file supersedes the handoff committed at `3497b6b`, whose full
record remains retrievable:
`git show 3497b6b:documentation/SESSION_HANDOFF.md`.

## Preamble -- carried context lost again; assume this doc is fallible too

This session's Phase A matched its handoff on every repo claim -- the
first clean open in three sessions -- and the carried context still
broke three times the moment it was tested against text instead of
state:

1. **"no implementation exists" was a phantom quote.** The prior
   handoff listed it as a stale line in `scoring-lexicon.md` and
   `rich-path.md`. The string exists in neither file and never did at
   any greppable form. Dropped from the sweep; recorded here so it is
   never hunted again.
2. **product-metaphor's "five tables" detail was fabricated.** The
   section WAS false (it claimed sessions blocked on the lexicon after
   session logging shipped), but the remembered specifics were not in
   the file. The lesson compounds: a carried claim can be right in
   verdict and wrong in every particular.
3. **The D76 `Amends skeleton` line-split was a non-issue.** Both
   `Amends` hits on the HEAD blob are whole lines. Closed, no edit.

Also this session, four corrections landed against the architect's own
output: gate predictions quoted absolute `entry_no` values (it is a
table identity surviving old deletions, not a per-chain counter -- all
row predictions are now relative: counts and transitions, never
absolutes); body-line-count predictions missed three pushes running and
are retired (the `cat -A` character check is the whole verification);
a prompt carved an inline exception to CLAUDE.md's check-ignore ban and
the implementer correctly refused it (see Banked item 4); and one
authored insertion contained em-dashes under its own ASCII-only rule
(the implementer's `--` reconciliation was correct).

## Start here (Phase A, read-only) -- every line is a falsifiable prediction

| check | expected |
|---|---|
| branch | `main` |
| HEAD | a `docs:` commit, subject `docs: session handoff at a22f74f`, parent `a22f74f`; its own sha unknowable here. Below it, newest first: `a22f74f`, `109f6ed`, `44872df`, `5b0aec9`, `b7c5f3c`, `1a04651`, `3497b6b` (prior handoff). |
| `git rev-list --left-right --count origin/main...HEAD` | `0	0` **after** the operator pushes this handoff commit; a nonzero right count means the push has not run -- a finding, not an error. |
| `git status --short` | clean. `audit.txt` is gitignored as of `109f6ed`; it appears only as `!! audit.txt` under `git status --ignored --short`. |
| `ls supabase/migrations/` | exactly five; newest `20260718185916_alter_session_entries_d77.sql` |
| Jest | 40 passed (last literal run: the Build B acceptance audit at `109f6ed`'s tree; unchanged by construction through `a22f74f` -- three docs/script-only commits) |
| Deno | 5 passed (same run, same caveat) |
| `npx tsc --noEmit` | exit 0 (same run; the audit script now guards against the absent-tsc false gate) |
| `npx expo lint` | 1 error, 0 warnings (template `use-color-scheme.web.ts`) |
| `npx expo install --check` | jest/@types/jest misaligned PLUS expo patch drift (constants, dev-client, router, splash-screen at last look). Expected, growing, do not fix. |
| Supabase (SQL editor, privileged; audit [16] has all three queries) | six tables `rowsecurity = t`; 9 policies, `session_entries` exactly INSERT + SELECT; both views `session_current` and `coa_session_stats` show `security_invoker=true` via the unnest/coalesce query -- a `(none)` row means the flag is LOST and the RLS bypass is live. All re-observed this session post-migration. |
| `session_entries` rows | 10 rows, `entry_no` 72-81, one chain, all `lexicon_version = 2`, top row spark `Flow` / fit NULL. Predict by count and transitions, never absolute entry_no (this session's lesson). Disposable test data; a wipe before real use is fine and would zero this. |
| client constant | `src/lib/lexicon.ts:6` `LEXICON_VERSION = 2` |

If any of these don't match, the repo wins -- re-baseline before proceeding.

## What shipped (newest first)

- (this handoff commit) -- the write-last close, no code.
- `a22f74f` -- **docs:** two rule promotions into CLAUDE.md (status-line
  rule; grep-gate discriminating-form rule). Sweep 3 of 3.
- `109f6ed` -- **chore:** session-audit.sh rewritten under the argv
  invariant (the displayed `$` line IS the executed argv or a named
  function); two-sided sync check; tsc absent-binary guard; expo check
  de-interactived via /dev/null stdin; grep exit statuses printed;
  MANUAL block carries all three schema-gate queries with a coalesce
  that renders a missing invoker flag as a visible `(none)` row.
  `audit.txt` gitignored. Sweep 2 of 3.
- `44872df` -- **docs:** false-status-line sweep across four docs:
  CLAUDE.md test count 36->40; session-logging slice 3 gains its
  four-sha shipped annotation (`111de9c`, `4034ea4`, `cae5258`,
  `37bf9eb` -- ratified after an implementer STOP; the honesty label
  died in `111de9c`, confirmed by deletion hunk); D70-D78 pointer
  amendments appended to session-logging.md and rich-path.md;
  product-metaphor's relationship section rewritten true. Sweep 1 of 3.
- `5b0aec9` -- **feat:** the session survey client reconciled to
  D70-D78. LEXICON_VERSION 2; Elite/Solid/Mid/Miss/Trash; three axis
  rows; Spark-keyed fit; context surface deleted; two toggle panels
  with null normalization. Device-gated end to end (see The arc).
- `b7c5f3c` -- **docs: D78** panel toggle deselection, appended to
  scoring-lexicon.md.
- `1a04651` -- **feat:** the D77 migration
  (`20260718185916_alter_session_entries_d77.sql`). Applied via
  operator `db push` and gated on observed state BEFORE commit: new
  column set, RLS on, 9 policies, both views' reloptions observed
  `security_invoker=true`, dropped-column count observed 0.

## The arc -- D77 made real, D78 ratified, the client caught up, the docs told the truth

Entry point executed as written: the D77 migration was authored by the
implementer from the committed design, reviewed whole, operator-applied,
and gated on observed state -- the invoker flag survived the forced view
recreate (the one live risk, and it came back clean twice: reloptions
after apply, then again with the coalesce control). The known
insert-breakage window (client sending the retired shape) was accepted
into the migration's non-goals and closed the same day by `5b0aec9`.

**D78** arose from the client design pass: the array shape dissolved the
boolean-era deselection blocker, so panels became toggles rather than
shipping a known stuck-state out of consistency ("not process over
product" -- operator's words, the ratification grounds). Sub-rule folded
in: removing the last value stores null, never `[]` (one representation
for the ratified checked-none = unanswered collapse). Scope: panels
only; axis deselection-to-null stays banked with its blocker intact.
**FITS survives** the D70-D76 supersession -- the scope retired fit's
placement and nulling rule, never its strings (recorded in D78's block).

The device gate closed on database transitions, not tap narration: entry
1 all-null at version 2; axis carry; Spark change nulling fit with the
prior fit intact beneath (row 80->81); Environment change leaving fit
untouched; last-value removal producing the null-not-empty transition
(row 77->78, single-cause, only the toggle path can produce it); the
failure path erroring inline with revert-by-derivation and the card
parked. Two prediction-form lessons came out of that gate (Preamble).

The chore bundle then cleared in three commits (What shipped). Both
`session-logging.md` and `rich-path.md` now open their superseded prose
with pointer amendments; their wholesale rewrite belongs to the wheel
pass and nothing before it.

## Refuted hypotheses / memory corrections

- The three Preamble text-refutations (phantom quote; fabricated detail;
  line-split non-issue).
- The prior session's audit ran the one-sided rev-list where the
  handoff demanded two-sided -- an instance of the echo-drift class the
  script rewrite killed.
- Absolute entry_no predictions; line-count predictions (retired).
- The architect's check-ignore carve-out (implementer right, prompt
  wrong; see Banked 4).
- The implementer's report assembly dropped its largest artifacts twice
  while asserting "pasted whole above" -- a named failure pattern now,
  not an incident. Protocol change (holds until revisited): build-prompt
  diffs are delivered via the operator's channel by default, and the
  implementer's report states the diff awaits operator paste rather
  than claiming delivery. First use executed cleanly (Build C).

## Ratified decisions

- **D78** with the null-normalization sub-rule and FITS survival, as
  above; committed at `b7c5f3c`.
- **Slice-3 annotation = four shas**, per the paragraph's own clause
  enumeration; a two-sha annotation would have contradicted the body it
  sits under (implementer STOP upheld).
- **Two CLAUDE.md promotions** (`a22f74f`): the status-line rule and the
  grep-gate discriminating-form rule. Grounds in the commit body.
- **Rule-3 banking** (see Banked 4): promotion declined on the
  operator's explicit uncertainty; tested once, below the
  corrected-twice bar.

## Landmines (new this session; carried ones live in CLAUDE.md and prior handoffs)

- **Implementer-shell grep SIGABRT (exit 134).** The system grep in the
  implementer's shell reproducibly aborts, even on plain files; its
  Grep tool works. Consequence: an absence gate (`grep -c -> 0`) in
  that environment is vacuous unless the exit status is stated -- a
  dead grep and a clean zero-hit both print nothing. Every grep
  criterion now requires the exit code alongside the result; the audit
  script prints it natively. Operator Git Bash grep is unaffected.
- **GCM cold-credential prompt at audit [3].** `git fetch origin` can
  raise the credential-manager GUI on a machine without cached
  credentials. Untested live (creds were cached); known, not yet felt.
- **Verbatim text vs ASCII-only.** An authored insertion containing
  em-dashes under an ASCII-only instruction forces the implementer to
  reconcile; the instruction wins and `--` is the rendering. Author
  ASCII in the first place.

## Open items

**Runnable now (the entry point)**
- **The wheel mechanic** -- the survey's interaction redesign, first in
  the bank for two sessions and now unblocked: the survey it replaces
  is live, gated, and truthfully documented with pointer amendments
  marking exactly the prose it will rewrite (`session-logging.md`,
  `rich-path.md`). Operator's unratified leans, carried: three-axis
  wheel (calyx-to-petal, center = null); marking-menu drill for
  families if kept; overall stays the ladder; fit ladders (ordinal);
  one-question-per-screen rhythm with Close/Next replacing More. Open
  sub-problems: thumb-reach on a 360 wheel; families-as-colour vs
  families-as-structure; the kaleidoscope easter egg (art pass; a spin
  must never select). Gate on the couch -- completion is the metric.
  Design pass first, its own `docs:`, before any build.

**Blocked**
- Reanimated strict-mode warning: one Metro stack-trace capture
  (carried).

**Banked (prioritized)**
1. **Glossary pass** -- personal-empirical rewrite of the operator's
   cross-fade/physiology material; definitions in the operator's own
   words. Population pharmacology cannot ship as written (discipline 1,
   CLAUDE.md).
2. **Transitional survey copy review** -- the axis labels and panel
   questions ("Anything else?", "How were you starting out?") are
   implementer-authored, clean of pharmacology and clinical framing,
   flagged transitional in a code comment. Reviewed at the wheel pass;
   sooner only if lived use grates.
3. **Pending-state relocation into the design doc** -- the D54 pending
   grammar's implementation moved axis/panel pending-set into the tap
   handlers (the snapshot alone cannot disambiguate which axis/value is
   pending). Accepted in review; the design doc should record it at the
   wheel pass so the doc and the code do not drift.
4. **check-ignore qualification** -- banked, not promoted; operator's
   grounds: "I honestly don't know." Promote only on a second live
   occurrence of the worktree-ignore question. Drafted text, verbatim,
   per `a22f74f`'s pointer: `git check-ignore` remains banned for
   verifying committed state. For the one question it answers correctly
   -- is this untracked working file ignored right now -- prefer the
   same evidence without it: the file absent from `git status --short`
   and present as `!!` under `git status --ignored --short`.
5. **Axis deselection-to-null** -- blocker intact (a single-select
   corrects by picking another value; null needs a distinct gesture);
   likely dissolves or resolves inside the wheel's center-is-null
   design.
6. Carried, untouched: detail-view session read/edit surface; home-zone
   parking after a confirmed entry; shelf sort-by-band; UI/art pass
   (dark default); license-number extraction + `licensees` + NY OCM
   import; haptics; gear-icon confirmation on non-dev builds; Resend
   domain verification; quadrant / intent lens / confound discounting
   (capturable now, build on lived demand); anchor-collision residual
   (D69); COA PDF persistence (Storage still has zero buckets);
   `auth-resp.json` at the repo parent possibly holding token material
   (flagged, still unconfirmed deleted).

## Working rhythm

Stable method lives in `CLAUDE.md` (now including the two promoted
rules) and `documentation/process/handoff-specs.md`. In flux this
session: (a) the diff-via-operator-channel protocol (Refuted, last
bullet) -- default until the implementer's report assembly is trusted
with large artifacts again; (b) grep criteria carry exit codes,
everywhere, both shells; (c) row-state predictions are relative
(counts, transitions), never absolute identities; (d) the architect's
channel check is character-identity via `cat -A` only -- no line-count
predictions; (e) an aggregate operator verdict was accepted once for a
schema gate whose residuals closed on single-value SQL results --
explicitly not precedent for device gates, which keep per-step verdict
lines.

## Entry point

**The wheel mechanic, design pass.** It has been the bank's top item
for two sessions; everything it depends on is now true: the survey it
supersedes is live end to end, the docs it rewrites carry pointer
amendments marking the superseded prose, and the chore debt that would
have polluted its diffs is cleared. The pass is design-only -- a
`docs:` against `session-logging.md`/`rich-path.md` territory ratifying
the wheel's skeleton (or refuting it on the couch) before any build
prompt exists. Not a menu: absent an operator redirect, the wheel
design pass is the move.
