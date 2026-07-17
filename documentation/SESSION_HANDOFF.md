# SESSION_HANDOFF — written 2026-07-17 against pushed HEAD `a182117`

The repo is authoritative over this document. Begin with a read-only
Phase A audit (`scripts/session-audit.sh`, Git Bash only) and try to
break every claim below before doing anything else.

This file supersedes the handoff committed at `a182117`, whose full
record remains retrievable:
`git show a182117:documentation/SESSION_HANDOFF.md`.

## Preamble — carried context was wrong this session; assume this doc is too

This was a verification-only session: zero code commits, one entry
point closed. Even so:

1. **The architect's own paste block carried a defective criterion.**
   A missing colon (`git show HEADsupabase/...`) made `git show` fail —
   and `grep -Fc` on the resulting empty stdin printed a well-formed
   `0`. The expected value here was 1, so the failure was visible; had
   the criterion expected 0, it would have false-passed on a command
   that never read the blob. Blob-grep criteria are only sound when
   the revision demonstrably resolved (see Working rhythm, new item).
2. **The project-knowledge "PDFs" are not PDFs.** All four COA files
   in project knowledge are zip containers (per-page extracted text +
   page JPEGs + a manifest); poppler rejects them. They are sufficient
   for token-presence claims (dba present/absent) and were used for
   exactly that; they are not the bytes the app ingested, and any
   byte-sensitive claim about a source document must not treat them
   as such.
3. **Not verified this session:** the Supabase pg_tables / pg_policies
   block was never re-observed (no SQL paste of it). The structural
   row below is carried from the prior session's close, same calendar
   day, believed but unconfirmed here.

## Start here (Phase A, read-only) — every line is a falsifiable prediction

| check | expected |
|---|---|
| branch | `main` |
| HEAD | a `docs:` commit, subject `docs: session handoff at a182117`, parent `a182117`; its own sha unknowable here. Below it, newest first: `a182117`, `084542a`, `7ff2593`, `be880b2`, `acaad8c`. |
| `git rev-list --count origin/main..HEAD` | **0** after the operator pushes the handoff commit; **1** means the push has not run — a finding, not an error. |
| `git status --short` | `?? audit.txt` only (gitignore fix still banked) |
| `ls supabase/migrations/` | exactly four files; newest `20260716162520_create_scoring_views.sql` |
| Jest | 40 passed, 40 total |
| Deno | 5 passed |
| `npx tsc --noEmit` | exit 0 |
| `npx expo lint` | 1 error, 0 warnings (template `use-color-scheme.web.ts`) |
| `git show HEAD:supabase/functions/_shared/coa/parseKaycha.ts \| grep -Fc '/\bdba\b\s+(.+?)\s+License\s*#/i'` | 1 — note the colon after HEAD; a typo there fails `git show` and grep prints a spurious 0 |
| `git show HEAD:supabase/functions/_shared/coa/parseDrsConfident.ts \| grep -Fc '/\b\d+ of \d+\s+(.+?)\s+Contact Person/'` | 1 |
| Supabase (SQL editor, privileged) | pg_tables: 6 tables, all `rowsecurity = true`. pg_policies: 9 rows; `session_entries` exactly INSERT + SELECT. Last observed prior session close 2026-07-17; NOT re-observed this session (preamble item 3). `coas` holds at least three rows: Animal Face / `Moby & Zeke, LLC`, Cosmic Cereal / empty brand, RAINBOW RUNTZ / `Animal House`. Counts drift with normal use — the structure and those three brand values are the prediction. |

If any of these don't match, the repo wins — re-baseline before proceeding.

## What shipped (newest first)

- (this handoff commit)
- nothing else — verification-only session; `a182117` was already HEAD
  at open and remains the parent of this commit.

## The arc — D67/D68 production verification (entry point closed)

The prior handoff's entry point ran to completion and both predictions
held. Evidence chain, strongest form available: the source documents
themselves were checked before prediction — Cosmic Cereal is Kaycha
with no `dba` token anywhere (licensee `Etain- Buffalo`, plain);
RAINBOW RUNTZ is Kaycha with `5 PC LLC dba Animal House`, the
laboratory sample ID on the line directly above and the `Pages 1 of 2`
counter directly after `License #` — the exact geometry of both
historical brand defects at once. The operator ingested both through
the app with the brand field untouched (stated explicitly, both
times), then pasted the `coas` select: Cosmic Cereal stored an empty
brand (D68 contract, deployed-parser emission), RAINBOW RUNTZ stored
`Animal House` exactly — no dba prefix, no sample-ID prefix, no
trailing counter. D67 and D68 now hold production evidence, not just
Jest. The brand slice has no open edges.

## Refuted hypotheses / memory corrections

- Preamble items 1 and 2. No repo-state claim from the prior handoff
  broke; all thirteen Phase A predictions that were tested confirmed
  (the Supabase block was the one untested).

## Ratified decisions

- None new. D67/D68 evidence upgraded from Jest-only to
  production-observed; grounds unchanged from the prior handoff.

## Open items

**Runnable now**
- None drafted.

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
6. Audit chore bundle (grew this session): gitignore `audit.txt`;
   re-annotate [14] (four drift lines observed); add the
   handoff-table print; add lines for `ls supabase/migrations/`,
   ancestry depth (`git log --oneline -6`), and the two anchor greps
   with resolution-checked `git show`.
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
    the NY "Current OCM Licenses" open dataset import. Registries
    resolve legal entities, not brands — confirm/edit stays the brand
    source of truth.
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
is the target; (e) the operator's independent paste of
`git log -1 --format=%B | cat -A` before push authorization — keep
both channels; (f) evidence-form substitution is acceptable when
argued equivalent; (g) NEW — a blob-grep criterion is sound only if
the `git show` demonstrably resolved: a failed revision feeds grep
empty input, which prints a well-formed `0`. Expected-nonzero
criteria fail visibly by accident; expected-zero criteria false-pass
silently. Either require the fatal line to be absent from the paste,
or gate as `git show <rev>:<path> >/dev/null && git show ... | grep -Fc ...`;
(h) NEW — source-document claims verified against project-knowledge
copies must name the container format; those copies are extracted
text, not the ingested bytes.

## Entry point

**Chip deselection-to-null (banked item 2).** Highest-priority banked
item not operator-deferred, and its cost is live: a chip tapped in
error is currently stuck true, which silently corrupts logged
sessions — the one data source scoring is allowed to read.
Document-before-implement: the move is a design pass in chat, reading
`documentation/design/` (session-logging and the D56/D57 chip
semantics) plus `documentation/SESSION_HANDOFF.md`'s D55 revision
rule, ratifying the deselection semantics (tap-again-to-null vs.
explicit clear affordance, and how a deselection interacts with the
append-only revision chain), landing a `docs:` commit, and only then
a build prompt. Not a menu: absent an operator redirect, this is the
move.
