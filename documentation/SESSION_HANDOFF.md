# SESSION_HANDOFF — written 2026-07-17 against pushed HEAD `084542a`

The repo is authoritative over this document. Begin with a read-only
Phase A audit (`scripts/session-audit.sh`, Git Bash only) and try to
break every claim below before doing anything else.

This file supersedes the handoff committed at `7ff2593`, whose full
record remains retrievable:
`git show 7ff2593:documentation/SESSION_HANDOFF.md`.

## Preamble — carried context was wrong this session; assume this doc is too

Concrete refutations from the session this file covers:

1. **The prior handoff's entry point misattributed the brand sludge.**
   The named string ("Adult Use Powered by Condent LIMS 1 of 8"
   prefixing "Moby & Zeke, LLC") is produced by `parseDrsConfident`,
   not the Kaycha parser. "Condent LIMS" is Confident LIMS after the
   documented ligature strip — a string that cannot occur in a Kaycha
   document. A read-only Phase A pass over the fixtures falsified the
   premise before any code was written.
2. **One named defect was actually three.** The Kaycha brand path was
   defective too, twice over and differently: rainbow-runtz prefixed
   the brand with the laboratory sample ID, and the two no-dba
   fixtures emitted empty by accident rather than by contract.
3. **The architect's first fix idea was wrong.** Excluding digits from
   the DRS left character class would have broken any digit-containing
   brand. Structural anchoring on both edges (D69) retired it before
   it shipped.
4. **Audit script item [14]'s annotation is stale by two lines**: it
   predicts the jest/@types/jest pair; four drift lines were observed
   (expo-router and expo-splash-screen added). Known, tolerated,
   re-annotation still banked.

## Start here (Phase A, read-only) — every line is a falsifiable prediction

| check | expected |
|---|---|
| branch | `main` |
| HEAD | a `docs:` commit, subject `docs: session handoff at 084542a`, parent `084542a`; its own sha unknowable here. Below it, newest first: `084542a`, `7ff2593`, `be880b2`, `acaad8c`, `d5eaec7`. |
| `git rev-list --count origin/main..HEAD` | **0** after the operator pushes the handoff commit; **1** means the push has not run — a finding, not an error. |
| `git status --short` | `?? audit.txt` only (gitignore fix still banked) |
| `ls supabase/migrations/` | exactly four files; newest `20260716162520_create_scoring_views.sql` (the brand slice added zero schema) |
| Jest | **40 passed, 40 total** (was 36; four brand assertions landed at `084542a`, two of which are deliberate no-dba controls) |
| Deno | 5 passed (observed this session at the brand-slice gate) |
| `npx tsc --noEmit` | exit 0 |
| `npx expo lint` | 1 error, 0 warnings (template `use-color-scheme.web.ts`) |
| `git show HEAD:supabase/functions/_shared/coa/parseKaycha.ts \| grep -Fc '/\bdba\b\s+(.+?)\s+License\s*#/i'` | 1 |
| `git show HEAD:supabase/functions/_shared/coa/parseDrsConfident.ts \| grep -Fc '/\b\d+ of \d+\s+(.+?)\s+Contact Person/'` | 1 |
| Supabase (SQL editor, privileged) | pg_tables: 6 tables, all `rowsecurity = true`. pg_policies: 9 rows; `session_entries` exactly INSERT + SELECT. All observed 2026-07-17. Data is **post-wipe** (D70): `coas` holds only rows ingested after the wipe (one observed at close: Animal Face, brand `Moby & Zeke, LLC`, clean); `session_entries` restarts from zero. Counts will drift with normal use — the structure is the prediction, not the counts. |

If any of these don't match, the repo wins — re-baseline before proceeding.

## What shipped (newest first)

- (this handoff commit)
- `084542a` — feat: anchor brand capture on structural tokens in both
  parsers (D67–D69; full grounds in the commit body)

## The arc — the brand slice (D67–D70)

The prior entry point sent this session at "Kaycha brand sludge"; Phase
A falsified the attribution (preamble item 1) and widened the surface
to both parsers. The slice ran fixture-driven and strictly red-first:
four brand assertions landed in the parseCoa fixture table and were
observed red at 38/40 with received values matching the Phase A
extraction byte-for-byte, then both-edge structural anchors
(dba…License # for Kaycha; the N-of-M page counter…Contact Person for
DRS, LLC requirement dropped) turned the suite green at 40/40 with the
two no-dba controls guarding against over-match. The existing database
rows were resolved by wipe, not data-fix (D70): full test-data delete
with `profiles` deliberately survived, operator deploy of `ingest-coa`,
re-ingest through the app. The single strongest observation of the
session closed it: the re-ingested Animal Face row reads brand
`Moby & Zeke, LLC` clean, which simultaneously proves the wipe landed
and that the **deployed** bundle carries the fix — the old bundle would
have reproduced the sludge. The deploy output itself was never pasted;
the clean row is the stronger evidence and supersedes it.

Also settled in-session, banked not built: the generalization story for
unseen brands is (a) structural anchors, never brand-content patterns
(D69); (b) the confirm/edit screen as the guarantee; (c) a future
licensees table keyed on the license number — the one identifier that
survives extraction rigidly — so a brand confirmed once prefills
forever (open item 13).

## Refuted hypotheses / memory corrections

- All four preamble items. The five-surfaces framing of the sludge
  survives; only its producer was misattributed.
- "Existing rows need a data-fix UPDATE" — mooted by the operator's
  disposability ruling; the wipe was simpler and gated more (D70).

## Ratified decisions

- **D67** — for Kaycha licensees of the form `X LLC dba Y`, the brand
  is the dba tail (`Y`). Grounds: consumer-facing name; a verbatim
  substring of the document, not a fabrication; confirm/edit absorbs
  residual ambiguity.
- **D68** — Kaycha documents with no dba token emit an empty brand.
  Grounds: empty is honest; confirm/edit fills it; two fixture tests
  pin it as a deliberate contract and double as over-match controls.
- **D69** — brand captures anchor both edges on document-structural
  tokens, never brand content, across all parsers. Grounds: the
  observed defects were earliest-start walks into header text from
  unanchored left edges; structural anchors generalize to unseen
  brands including digit-containing ones. Named residual risk,
  accepted under lived-demand: a brand containing the literal anchor
  text (" License #" / " Contact Person") truncates at the collision;
  no such fixture exists.
- **D70** — existing sludge rows: wipe the test data whole rather than
  data-fix or re-ingest-in-place; `profiles` survives (auth identity,
  not test data). Grounds: test-phase data is disposable by standing
  operator ruling, and the wipe + deploy + re-ingest path exercises
  the full pipeline end-to-end, gating the deployed parser — which a
  data-fix could not.

## Open items

**Runnable now**
- Kaycha production verification (the entry point below). Operator-run,
  no prompt needed.

**Blocked**
- Reanimated strict-mode warning: one Metro stack-trace capture.

**Banked (prioritized)**
1. UI/art pass — operator-deferred; owns More/Back affordance forms,
   phase-swap animation, band-word treatment, `session_count` display,
   chip styling, echo treatment, feel constants, tap-vs-drag re-open.
2. Alcohol/chip deselection-to-null — stuck-true cost live in the
   product now.
3. Detail-view session read/edit surface — its own pass with its own
   read.
4. Home-zone parking after a confirmed entry + on-device verification
   of soft-delete-returns-to-untried (needs the delete gesture).
5. Shelf sort-by-band — a product decision, undecided.
6. Audit chore bundle: gitignore `audit.txt`, re-annotate [14] (four
   drift lines now observed), add the handoff-table print.
7. Doc micro-amendments: entry-1 intent note; scoring-read status-line
   rewrap.
8. tsconfig/Metro sticky-resolver landmine → `CLAUDE.md` on second
   bite.
9. Haptics — batch with the next build-forcing dependency.
10. Gear-icon confirmation on non-dev builds (carried).
11. Resend domain verification (carried).
12. Quadrant / intent lens / confound discounting — capturable now;
    build on lived demand.
13. License-number extraction as a first-class parsed field + a
    `licensees` table keyed on license number, populated by
    confirm/edit — wrong-once-never-again brand prefill. Behind it,
    the NY "Current OCM Licenses" open dataset import; concrete
    trigger is multi-state onboarding or entity-name prefill demand.
    Registries resolve legal entities, not brands — confirm/edit
    stays the brand source of truth.
14. Anchor-collision residual risk (D69) — revisit only on a real COA
    exhibiting it.

## Working rhythm

Stable method lives in `CLAUDE.md` and
`documentation/process/handoff-specs.md`. In flux and worth keeping:
(a) gate steps embed their SQL verbatim; (b) when a build adds a new
insert/action source, every existing pending-state condition is
audited against it; (c) handoff commit prompts always carry a status
precondition and placement instructions name one literal path;
(d) plain operator language in gates, numbers stated where arithmetic
is the target; (e) NEW — the operator's independent paste of
`git log -1 --format=%B | cat -A` before push authorization ran its
first full cycle this session and matched the implementer's report
byte-for-byte; keep both channels — the gate's value is its
existence; (f) NEW — an evidence-form substitution is acceptable when
argued equivalent (a `jest -t` filtered run stood in for absent
per-test verbose lines; sound because the assertions are byte-exact).

## Entry point

**Kaycha production verification.** D67 (dba tail) and D68 (empty on
no-dba) hold Jest evidence only; the deployed function has been
observed end-to-end solely on the DRS path (Animal Face). The move:
the operator re-ingests the remaining real COAs through the app — at
least one Kaycha document with a dba licensee and, if on hand, one
without — then pastes one SQL-editor select over `coas`
(`select id, strain, brand from coas order by created_at;`) to the
architect. Predictions, falsifiable: dba documents show the tail only;
no-dba documents show an empty brand awaiting confirm/edit; no row
shows a sample-ID or header prefix. Cheap, operator-only, and it
closes the slice's last open edge. Not a menu: absent an operator
redirect, this is the move.
