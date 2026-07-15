# SESSION_HANDOFF — written 2026-07-15 against pushed HEAD `1c93740`

The repo is authoritative over this document. Begin with a read-only
Phase A audit (`scripts/session-audit.sh`, Git Bash only) and try to
break every claim below before doing anything else.

## Preamble — carried context was wrong this session; assume this doc is too

Concrete refutations from this very session, so this warning gets read:

1. **The architect's memory said the ownership column was `user_id`.**
   The repo's convention, observed at core-schema line 39, is
   `created_by`. V1 of the schema doc carried the false name; the
   implementer's convention check caught it before commit, and the doc
   was amended to v2. Cost: one extra round-trip. Had it shipped, the
   migration would have diverged from every other table silently.
2. **A build-prompt acceptance criterion was written against one grep
   hit when two existed.** "The `Delete COA` hit" — but the confirm
   dialog title `'Delete COA?'` predates the footer button. The
   criterion's intent held by luck of line ordering; the criterion
   itself was sloppy. Architect's error, named.
3. **A report claimed "the full diff is pasted in the tool output
   above" and no diff had reached the review channel.** The reviewer
   stopped rather than authorizing on the diff's claimed existence —
   the vouching failure mode in a new costume. One paste closed it.
4. **Inline artifact delivery struck twice more** (both design docs
   arrived as text, not files). The sha256 transcribe-and-hash channel
   absorbed both byte-exactly. Treat inline delivery as the norm, not
   the exception; every architect-authored file ships with its hash.

## Start here (Phase A, read-only) — every line is a falsifiable prediction

| check | expected |
|---|---|
| branch | `main` |
| HEAD | a `docs:` commit, subject `docs: session handoff at 1c93740`, **parent `1c93740`**. Its own sha is unknowable here. Below it: `1c93740` (parent `9eaf483`), `9eaf483` (parent `97b1b45`), `97b1b45` (parent `b28318f`), `b28318f` (parent `302843c`). |
| `git rev-list --count origin/main..HEAD` | **0**, *after* the operator pushes the handoff commit. If it prints 1, the push has not run — that is the finding, not an error in this table. |
| `git status --short` | clean |
| `ls supabase/migrations/` | exactly **three** files; newest `20260715185455_create_session_entries.sql` |
| Jest | 36 passed (untouched all session) |
| Deno | 5 passed |
| `npx tsc --noEmit` | exit 0 |
| `npx expo lint` | 1 error, 0 warnings (template `use-color-scheme.web.ts`) |
| audit script item [14] | **known-stale annotation**: it predicts two outdated packages (jest pair) but four appear — `expo-router` and `expo-splash-screen` patch drift. Observed identical on 2026-07-14 and -15: registry drift, tolerate. Re-annotation banked. |
| Supabase (SQL editor, privileged) | pg_tables: **6** tables, all `rowsecurity = true`, newest `session_entries`. pg_policies: **9** rows — the 7 pre-existing plus `session_entries_insert_own` (INSERT) and `session_entries_select_own` (SELECT). Any UPDATE/DELETE policy on `session_entries` means the append-only invariant was breached — stop everything. Observed 2026-07-15 post-`db push`. |

If any of these don't match, the repo wins — re-baseline before proceeding.

## What shipped (newest first)

- `1c93740` — feat: session_entries table, the append-only session chain (D52-D53) — **applied to production and gated on observed state**
- `9eaf483` — docs: design the session_entries schema (D52-D53)
- `97b1b45` — feat: session-logging ladder spike (no persistence) — **device-gated, all steps passed**
- `b28318f` — docs: design the session-logging mechanic (D49-D51)

## The arcs

**Arc 1 — the mechanic pass and the spike.** The pass `scoring-lexicon.md`
reserved. Shape: logging launches from the card detail (D49 — gesture-clean
surface, card pre-selected, avoids resurrecting the retired long-press with
a new meaning); drop is the save (D50 — the mandatory field and the save
are one muscle motion; crash-safe; everything after the drop is a revision
on the D47 substrate); vertical five-rung ladder (D51 — the shelf
rehearsed, up = better, screen-height targets, midpoint literal). The spike
shipped with **no persistence and no chip row** — a full-screen sibling
modal (`presentationStyle="fullScreen"`), deliberately never nested inside
the pageSheet and chained through its `onDismiss`, content wrapped in
`GestureHandlerRootView` (gestures inside RN Modals are inert without it).
Both native deps were already in the SDK 56 manifest — no new EAS build was
needed, and none is needed for the wiring slice. **The gate verdict: the
drag beats tap-and-settle.** The fallback stays banked, probably forever.

**Arc 2 — the schema.** A session is an append-only chain of entries in
one table (`session_entries`): drop, chip tap, re-drag, soft delete are
all INSERTs of full snapshots; latest entry wins. **No UPDATE or DELETE
policy exists — history is unwritable by construction**, ND != 0's family.
Rejected alternative: one-row-plus-revisions-table, because its guarantee
rests on a trigger behaving. Word AND score both stored, no check tying
them (vocabulary never enters the schema). `coa_id` cascades (D53): COA
delete is the one dialog-guarded exception to soft-delete-only. Design of
record: `documentation/design/session-entries-schema.md` — its v2 quotes
observed migration lines, not memory.

## Refuted hypotheses / memory corrections

- `user_id` is not this repo's ownership column; **`created_by`** is
  (core-schema :39, full convention: `default auth.uid() references
  auth.users (id) on delete cascade`). Killed once; do not re-derive.
- The analyte parent-ownership predicate is quoted verbatim in the schema
  doc — read it there, not from memory.
- Reanimated 4.3.1 + gesture-handler 2.31.1 + worklets 0.8.3 are in the
  manifest and compiled into the current dev build. No build wait exists
  for gesture work.
- The `db push` Docker warning ("failed to cache migrations catalog") is
  cosmetic on this Windows setup — the remote apply succeeds; the
  observed-state gate adjudicates, never the CLI text.
- An unexplained gear icon appears top-right on the ladder screenshots.
  **Believed** (unconfirmed) to be the dev-client overlay bubble. If it
  ever appears in a non-dev build, that belief was wrong.

## Ratified decisions

- **D49** — logging launches from the card detail view. Grounds: card
  pre-selected, gesture-clean surface, long-press semantic collision
  avoided.
- **D50** — drop is the save; no confirm, no done button; chip taps and
  re-drags are revisions. World B (staged save) is the named fallback.
  Grounds: skeleton item 2 made physical; crash-safety; gesture honesty.
- **D51** — vertical five-rung ladder, best at top, snap-to-nearest with
  typographic swell, home zone as cancel. Tap-and-settle is the named
  mechanic fallback. Grounds: the shelf rehearsed; thumb ergonomics;
  target size as the mis-drop defense.
- **D52** — `session_entries` append-only chain; INSERT+SELECT policies
  only. Grounds: a policy that does not exist cannot be bypassed.
- **D53** — `coa_id` on delete cascade. Grounds: realistic delete is a
  mistaken ingest whose sessions are part of the mistake; restrict makes
  logged COAs permanent, a dead end.
- Ownership column naming: `created_by`, repo convention adopted verbatim
  (folded into the D52 doc v2).

## Open items

**Runnable now**
- **The wiring slice** (the entry point below). Opens with a design pass,
  not a build prompt.

**Blocked**
- Nothing newly blocked.

**Banked (prioritized)**
1. Settled card covers its rung word (spike feel defect) — fix rides the
   wiring slice.
2. Delete-dialog copy grows "...and its logged sessions" (D53
   consequence) — rides the wiring slice.
3. Brand sludge ("Adult Use Powered by ...") is now user-facing on the
   ladder chip — parser defect priority raised; still post-confirm-screen.
4. Latest-entry-per-chain read view — scoring slice; **`security_invoker
   = true` is non-negotiable** (views bypass RLS otherwise).
5. Audit script touch-up: re-annotate item [14]; add a section printing
   the handoff's own Start-here table so the architect audits against
   literal predictions (gap now three sessions old).
6. `session_id` index — when something reads by chain.
7. Haptics on the ladder — requires `expo-haptics`, a native module, a
   new EAS build. Batch with the next build-forcing dependency.
8. Gear-icon confirmation on any non-dev build.
9. Rich-path question placement (fit/context/co-alcohol surface) —
   deferred by the mechanic doc until the mechanic survived; it survived,
   so this unbanks whenever chips land.
10. Resend domain verification (carried; sender still
    `onboarding@resend.dev`).

## Working rhythm

Stable method lives in `CLAUDE.md` and
`documentation/process/handoff-specs.md`. In flux this session and worth
keeping: architect-authored files ship with an embedded sha256 and the
transcribe-and-hash contingency written into the prompt itself — inline
delivery is now the assumed channel. Commit prompts read staged blobs
(`git show :<path>`) for invariant checks, never the worktree.

## Entry point

**The wiring slice, opening with a design pass** — whole reads of
`documentation/design/session-logging.md` and
`documentation/design/session-entries-schema.md` first, then the drop
insert contract: what the ladder inserts at drop (coa_id, session_id
client-generated, overall word + score, lexicon_version 1, intent null),
what a chip tap inserts (the chip row exists only after this slice), the
honesty label's removal, the detail dialog's D53 sentence, and the failure
mode when an insert fails mid-couch (the drop must not silently lie).
That last question is new and undesigned — start there. Not a menu: the
wiring slice is the move.
