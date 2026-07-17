# SESSION_HANDOFF — written 2026-07-17 against pushed HEAD `be880b2`

The repo is authoritative over this document. Begin with a read-only
Phase A audit (`scripts/session-audit.sh`, Git Bash only) and try to
break every claim below before doing anything else.

This file supersedes the handoff committed at `d5eaec7` (the scoring
arc's record), which went stale within hours because the same chat
session continued past it — a handoff describing a moved repo is the
trusted-narrative failure mode by definition, so it is replaced whole.
The scoring arc's full record remains retrievable:
`git show d5eaec7:documentation/SESSION_HANDOFF.md`.

## Preamble — carried context was wrong this session; assume this doc is too

Concrete refutations from the continuation this file covers:

1. **The architect shipped a gate script whose SQL steps carried no
   SQL.** The operator stalled at "in SQL editor" with no query to run.
   Fix, now standing: any gate step that says "check the database"
   embeds its query verbatim — one reusable query beats nine implied
   ones.
2. **The architect's build prompt would have shipped a visual defect**:
   the card's pending condition (`inFlight && pendingIntent === null`)
   would have rendered the card translucent during rich-phase inserts.
   The implementer caught it by deriving `inFlight` from a five-value
   source discriminator — the prompt's suggested single `'rich'` source
   was also insufficient (it could not route pending state to the right
   control). Both accepted as better than spec.
3. **"Same inline error" was an underspecification that would have
   failed invisibly**: the home-zone error slot is off-screen in the
   rich phase. The implementer added a second render site for the same
   state. A spec that names a mechanism must check the mechanism is
   on-screen everywhere it is needed.
4. **The duplicate-handoff incident** (prior arc's close): the handoff
   landed at two paths because the placement instruction was written
   cleverly (`design/../`), and the commit prompt uniquely lacked a
   status precondition, so the duplicate was invisible until criterion
   time; the stray file then vanished before the operator's `rm` ran
   (actor unestablished, filed as a maybe). Lessons, both applied in
   this file's own commit prompt: one literal path, always a status
   precondition.

## Start here (Phase A, read-only) — every line is a falsifiable prediction

| check | expected |
|---|---|
| branch | `main` |
| HEAD | a `docs:` commit, subject `docs: session handoff at be880b2`, parent `be880b2`; its own sha unknowable here. Below it, newest first: `be880b2`, `acaad8c`, `d5eaec7`, `9f46d98`, `f16b1d6`, `dd30ddf`. |
| `git rev-list --count origin/main..HEAD` | **0** after the operator pushes the handoff commit; **1** means the push has not run — a finding, not an error. |
| `git status --short` | `?? audit.txt` only (the audit's own exhaust; gitignore fix banked) |
| `ls supabase/migrations/` | exactly four files; newest `20260716162520_create_scoring_views.sql` (no migrations in this continuation — the rich path added zero schema) |
| Jest | 36 passed (observed at the rich-path build criteria) |
| Deno | 5 passed — **not run this continuation**; carried, weaker than usual |
| `npx tsc --noEmit` | exit 0 (observed at the rich-path build) |
| `npx expo lint` | 1 error, 0 warnings (template `use-color-scheme.web.ts`) |
| audit script item [14] | still stale-annotated: four drift lines. Tolerate; re-annotation banked. |
| `grep -n '2026-07-15' documentation/design/session-logging.md` | exactly one hit, **now at line 269** (the unbanking pointer added two lines above it; the hit is the schema-doc reference, correct and deliberate) |
| `grep -Fxc '## D64 — Placement: a second phase of the same logging surface' documentation/design/rich-path.md` | 1 |
| `grep -c 'FITS' src/lib/lexicon.ts` | >= 1 (the fit vocabulary landed beside INTENTS) |
| Supabase (SQL editor, privileged) | pg_tables: 6 tables, all `rowsecurity = true`. pg_policies: 9 rows; `session_entries` exactly INSERT + SELECT. pg_views: `session_current` + `coa_session_stats`, both `reloptions` containing `security_invoker=true`. pg_indexes on `session_entries`: 4 rows incl. `session_entries_chain_idx`. Row count: ~71+ entries of disposable gate data (last observed entry_no 71); exact count not predicted. |

If any of these don't match, the repo wins — re-baseline before proceeding.

## What shipped (newest first)

- `be880b2` — feat: the rich path — fit, context, co-alcohol behind
  More (D64–D66; device-gated with the chain rows in the SQL editor
  corroborating every write rule step by step)
- `acaad8c` — docs: design the rich path (D64–D66) + the unbanking
  pointer in session-logging.md
- Continuation opened at `d5eaec7` (the scoring-arc handoff commit).

## The arc — the rich path (D64–D66)

The lexicon's three optional questions got their surface. The walk-in
lean (render below the chips) was killed by three concrete findings
from whole reads before any code: the chip row's permanent-mount rule
would force permanent rung compression (inverting D51's target-size
grounds); context is free text and a keyboard over the drag surface
violates D49's premise; fit is conditional and conditional rendering
on the ladder is the exact reflow class the mounting rule exists to
kill. The ratified shape: a **More** affordance appears with the chip
row and swaps the surface to a rich phase that **replaces** the ladder
render whole — no rungs on screen means conditional rendering is
allowed there. Back swaps home with the card still on its rung; all
state (shared values included) lives above the swap, so remount
restores pixel-identically. Each answer is its own revision insert
through the one `insertEntry` pipeline (D65): full-snapshot carry, one
in flight, same abort and inline error, revert-by-derivation on
failure — except the context draft, the one value that cannot revert
by derivation and is restored explicitly. **D66**: a chip tap that
changes intent sends `fit: null` — fit is intent-relative and carry
must not attach an old answer to a question never asked; the old fit
survives beneath; re-drags carry all three rich fields untouched.
`FITS` and `AIMLESS_INTENT` (typed against `INTENTS` so the spelling
cannot drift) landed in `lexicon.ts` — one source. Alcohol writes null
or true only; a mis-tap is stuck true until deselection is designed —
named accepted cost. The lazy path is physically unchanged, re-proven
at the gate (entry 71: four NULLs, exactly day-one shape).

The gate's strongest evidence was the data: rows 63–68 reconstruct the
script in order (all-null entry, intent lands, fit answered with carry,
context added, alcohol added, then intent change with fit NULL and the
old fit preserved one row down). Observed database state adjudicated,
and it corroborated seven of nine steps independently of operator
memory.

## Refuted hypotheses / memory corrections

- All four preamble items; plus:
- The architect's walk-in placement lean (below the chips) was wrong,
  and the component blobs falsified it before code — the whole-read
  discipline paid for itself in one pass.
- **The quadrant's data preconditions are now fully met**: intent,
  overall, and fit are all being recorded. The quadrant, intent lens,
  and confound discounting move from "blocked on capture" to
  "capturable, banked on demand" — a status change, not a plan.

## Ratified decisions

- **D64** — placement: a second phase of the same logging surface
  behind More; replace, don't squeeze. Grounds: lazy path untouched,
  no rung compression, no keyboard over the drag, capture at the
  moment, dismissal loses nothing (D47 substrate).
- **D65** — each rich answer is its own revision insert, full-snapshot
  carry, D54/D55/D57 grammar reused wholesale; deselection banked with
  the stuck-true alcohol cost named; empty-string context never
  recorded (null stays null — recorded = chosen).
- **D66** — an intent change nulls fit; re-drags carry fit untouched;
  the re-opened fit question is correct, not a bug.
- All as leans, 2026-07-16/17, operator revision expectation standing.

## Open items

**Runnable now**
- The brand-sludge slice (the entry point below).

**Blocked**
- Reanimated strict-mode warning: one Metro stack-trace capture.

**Banked (prioritized)**
1. UI/art pass — operator-deferred; now also owns: More/Back affordance
   forms, the phase-swap animation, band-word treatment,
   `session_count` display, chip styling, echo treatment, feel
   constants, tap-vs-drag re-open.
2. Alcohol/chip deselection-to-null — stuck-true cost live in the
   product now.
3. Detail-view session read/edit surface — banked again by name in
   rich-path.md; the day-after-editing case, its own pass with its own
   read.
4. Home-zone parking after a confirmed entry + on-device verification
   of soft-delete-returns-to-untried (needs the delete gesture).
5. Shelf sort-by-band — a product decision, undecided.
6. Audit chore bundle: gitignore `audit.txt`, re-annotate [14], add the
   handoff-table print (six sessions carried).
7. Doc micro-amendments: entry-1 intent note; scoring-read status-line
   rewrap.
8. tsconfig/Metro sticky-resolver landmine → `CLAUDE.md` on second
   bite.
9. Haptics — batch with the next build-forcing dependency.
10. Gear-icon confirmation on non-dev builds (carried).
11. Resend domain verification (carried).
12. Quadrant / intent lens / confound discounting — capturable now;
    build on lived demand.

## Working rhythm

Stable method lives in `CLAUDE.md` and
`documentation/process/handoff-specs.md`. In flux and worth keeping:
(a) gate steps embed their SQL verbatim; (b) when a build adds a new
insert/action source, every existing pending-state condition is audited
against it — the derived-`inFlight` lesson; (c) handoff commit prompts
always carry a status precondition and placement instructions name one
literal path; (d) plain operator language in gates, numbers stated
where arithmetic is the target (carried from the scoring gate).

## Entry point

**The brand-sludge slice.** The parser's brand field carries
header/footer sludge ("Adult Use Powered by Condent LIMS 1 of 8"
prefixing "Moby & Zeke, LLC") that is now rendered on five user-facing
surfaces — the shelf card, the ladder card, the delete dialog, the
echo screen's card, and the detail view — and it appears in every gate
screenshot. This is a **pure-logic slice**: the gate is Jest, pasted
raw, against the parser at
`supabase/functions/_shared/coa/` and its fixtures — the cheapest gate
type in the project, aimed at its most visible defect. Open with a
read-only Phase A pass over the brand-extraction code path and the
Kaycha fixture that produces the sludge; the fix must be
fixture-driven (a failing test first, from the real PDF's text), and
the slice also owns a decision the code cannot make: what happens to
the existing rows' brand values (data-fix vs. re-ingest vs.
leave-and-let-die — test-phase data is disposable by ratified ruling,
but the operator's real COAs are the ones wearing the sludge). Not a
menu: absent an operator redirect, brand sludge is the move.
