# SESSION_HANDOFF — written 2026-07-16 against pushed HEAD `37bf9eb`

The repo is authoritative over this document. Begin with a read-only
Phase A audit (`scripts/session-audit.sh`, Git Bash only) and try to
break every claim below before doing anything else.

## Preamble — carried context was wrong this session; assume this doc is too

Concrete refutations from this very session:

1. **A ratified design ground was physically false.** D50's v1 grounds
   claimed "no window exists between the drop and the save." The save is
   a network insert; the window is real. The doc was written as if the
   save were local. Corrected in v2 (D54: the drop is the save
   *attempt*; crash-safety holds from confirmation). If a ground can be
   falsified by physics, re-derive it before building on it.
2. **The architect authored three-plus defective acceptance criteria in
   one day.** (a) Build 1 v1's file-list criterion could be satisfied by
   an untracked ambient `.d.ts` the diff never showed — the implementer
   flagged the evasion. (b) Build 1 v2's "no untracked files" was
   unsatisfiable as written: the prompt itself prescribed a new file and
   forbade staging. (c) The chip-fix prompt suggested a border/bold
   treatment that violated its own no-reflow requirement. (d) The 3a
   commit prompt was never amended after Prompt A changed the tree, and
   a verbal patch in chat does not reach the implementer — it STOPped
   twice, correctly, until the prompt file itself was amended. The
   prompt is the contract; chat is not.
3. **The report channel dropped "pasted above" content four times**
   (two commit bodies, two diffs). Countermeasure, now standing: the
   implementer never pastes commit bodies — the operator runs
   `git log -1 --format=%B | cat -A` and pastes that; on any dropped
   diff, the operator runs `git diff` and pastes raw. `cat -A` is the
   standard body read: a plain `cat` paste once arrived with all blank
   lines collapsed and could not distinguish a mangled commit from a
   mangled channel.
4. **The word-rise fix was gate-refuted** (read as an error state;
   pushed the top rung's word off-screen) and replaced by the
   operator's own design (D58, the answer echo). The gate outranks the
   lean, and this session it also out-designed it.
5. **The uuid precondition's trigger wording didn't cover reality.**
   `expo-modules-core` exists, exports `uuid.v4()`, Metro resolves it —
   and `tsc` cannot see it (nested install under `expo/`;
   lockfile-canonical). Fix: a `tsconfig.json` `paths` fallback array
   (nested first, top-level second). Landmine class: Metro's
   sticky-dependency resolver vs tsc. Promote to `CLAUDE.md` if it
   bites again.
6. **Committed docs carry a date error:** D54–D57 are recorded as
   ratified 2026-07-15 in `session-logging.md`; ratification happened
   2026-07-16. Banked one-line fix; do not trust ratification dates in
   that file without checking git history.
7. **Two gate-procedure defects, architect-owned:** (a) the failure
   gates assumed the ladder was reachable offline — it is not (no local
   cache; the shelf reads from Supabase), so the pattern is open the
   ladder first, then airplane mode from Control Center; (b) perception
   was not a first-class gate step, so the invisible selected-chip
   state nearly shipped — gate checklists must ask "can you SEE it,"
   not only "does the row exist."

## Start here (Phase A, read-only) — every line is a falsifiable prediction

| check | expected |
|---|---|
| branch | `main` |
| HEAD | a `docs:` commit, subject `docs: session handoff at 37bf9eb`, parent `37bf9eb`; its own sha unknowable here. Below it, newest first: `37bf9eb`, `c2884af`, then a `feat:` commit whose subject is `feat: delete dialog names logged sessions (D53)` (**its sha was never observed in-session — read it here and treat that as the finding channel working**), then `4034ea4`, `b33f99d`, `111de9c`, `61cfe94`, `fce00ad`. |
| `git rev-list --count origin/main..HEAD` | **0** after the operator pushes the handoff commit; **1** means the push has not run — a finding, not an error. |
| `git status --short` | clean |
| `ls supabase/migrations/` | exactly three files; newest `20260715185455_create_session_entries.sql` (no migrations today) |
| Jest | 36 passed — **not run this session**; parser untouched, so this is a carried prediction, weaker than usual |
| Deno | 5 passed — same caveat |
| `npx tsc --noEmit` | exit 0 (observed repeatedly today) |
| `npx expo lint` | 1 error, 0 warnings (template `use-color-scheme.web.ts`) |
| audit script item [14] | still stale-annotated: predicts the jest pair, four appear (expo-router / expo-splash-screen patch drift). Tolerate; re-annotation banked. |
| Supabase (SQL editor, privileged) | pg_tables: 6 tables, all `rowsecurity = true`. pg_policies: 9 rows; `session_entries` has exactly INSERT + SELECT — any UPDATE/DELETE policy there is stop-everything. Unchanged since 2026-07-15's observation; no schema work today. `session_entries` row count is unknown (gate testing appended freely; last observed 27 mid-session) — all of it disposable test data by ratified ruling. |
| `git show HEAD~1:documentation/design/session-logging.md \| sha256sum` (i.e. at `37bf9eb`) | `25bae1e06375458f95d15a002ba2f7fb67129fea7e085202a7ff182407f924a4` (v4, 293 lines) |
| `grep -c "WORD_RISE" src/components/session-ladder.tsx` | 0 |

If any of these don't match, the repo wins — re-baseline before proceeding.

## What shipped (newest first)

- `37bf9eb` — feat: answer echo — the home-zone box names the settled answer (D58)
- `c2884af` — docs: ratify the answer echo (D58); record the word-rise refutation
- `<unobserved sha>` — feat: delete dialog names logged sessions (D53)
- `4034ea4` — feat: intent chip row — taps insert revisions with carry (D56-D57), including the selected-chip token-inversion fix folded in pre-commit
- `b33f99d` — docs: ratify chip-row rendering and tap semantics (D56-D57)
- `111de9c` — feat: ladder persistence — drop and re-drag insert session entries (D54-D55), including the `tsconfig.json` paths entry
- `61cfe94` — docs: ratify the persistence contract (D54-D55)

## The arcs

**Arc 1 — the persistence contract (D54–D55).** The wiring slice opened
by falsifying its own inherited ground (refutation 1) and designing the
honest replacement: the drop is the save attempt; the card renders
pending until the insert confirms; the chip row appearing IS the
confirmation; failure returns the card to home (nothing confirmed) or
the last confirmed rung (D55), with a plain inline error and retry by
re-dropping. Load-bearing subtleties the diffs won't explain: the
`session_id` is minted lazily at the first drop and **survives
failure** — a retry after a client-side timeout lands in the same chain
and latest-entry-wins absorbs the duplicate, which is exactly why no
idempotency machinery exists (a sentence in the doc guards against
adding keys by reflex). One insert in flight at a time kills the
snapshot-ordering race class. Inserts are direct `supabase-js` writes
(the COA save's `insert_coa` RPC exists for multi-table atomicity;
sessions are one guarded table). Refs became state under
`react-hooks/refs` (lint bars ref reads in render-created gesture
closures); safe because one-in-flight forces a re-render between
inserts.

**Arc 2 — the chip row (D56–D57).** D48's "onboarding default first and
biggest" is unimplementable (onboarding banked, no default exists) and
must not be faked: seven uniform chips, seed-list order, `INTENTS`
beside `RUNGS` in `src/lib/lexicon.ts`. Tap semantics: a different chip
inserts a revision with word + score carried from last confirmed;
re-tapping the confirmed chip is a no-op; deselection-to-null is banked,
undesigned. `lastConfirmed` grew `intent`, and rung settles carry it
forward — the carry was verified in observed rows (Yes/sleep re-dragged
to Meh kept sleep). Selection derives from `pendingIntent ??
lastConfirmed.intent`, so a failed tap reverts with no revert code. The
chip row is permanently mounted and opacity-hidden: conditional
mounting would reflow the rung geometry under the just-settled card —
a lesson now reused (the echo obeys it too). Entry 1 sends
`intent: null` explicitly rather than omitting the key (identical
server result, one payload shape) — the doc's "omitted (null)" reads as
the value, not the wire shape; a micro-amendment is banked if anyone
ever cares.

**Arc 3 — the riders and the gate that redesigned one of them.** The
delete dialog grew its D53 sentence (cascade takes logged sessions).
The card-covers-rung-word defect got a first fix (word-rise) that the
gate refused — and the operator sketched the better answer at the gate:
the vacated home-zone box echoes the settled word in large type (D58).
Echo on settle only, never live-tracking the drag (ratified: bare
minimum now, art pass later); mirrors the card's pending translucency;
clears on cancel and failed first drop; shows the last confirmed word
after a failed revision; shares the box with the inline error. The
covering card is now acceptable **by design** — the box carries
legibility. Deliberate asymmetry, written down so a refactor doesn't
flatten it: the echo shows the pending claim (mirroring the card's
honesty state); the chip row appears only on confirmation (it is the
confirmation signal).

## Refuted hypotheses / memory corrections

- All seven preamble items above; plus:
- The delete confirm dialog's message before this session read
  "Deletes this COA and all of its lab data (terpene, cannabinoid, and
  safety rows). This cannot be undone." — the sessions clause is new.
- The theme token set has **no accent color** (`linkPrimary`'s blue is
  a hardcoded literal in ThemedText, not a token); `backgroundSelected`
  vs `backgroundElement` is imperceptible in dark mode. Any future
  "selected" treatment must not reach for tokens that don't exist —
  the chip row uses full text/background inversion.
- The Reanimated strict-mode warning ("Reading from `value` during
  component render", fires twice) could not be localized statically;
  best hypothesis: `useAnimatedStyle` initial updater runs relying on
  the first-render exemption, which can fail on an interrupted
  concurrent render inside the Modal. Unblock: capture the warning's
  stack trace from Metro once. No misbehavior observed.

## Ratified decisions

- **D54** — pending-until-confirmed; the chip row is the confirmation;
  dismissal and all mutations inert while one insert is in flight;
  ~10s client abort; duplicate-on-retry absorbed by the append-only
  chain (no idempotency keys). Grounds: the drop must not silently lie;
  the schema already pays for the failure mode.
- **D55** — revision failures revert to the last confirmed truth (card
  to the confirmed rung; chip selection to the confirmed intent, which
  is unselected only in the first-tap case).
- **D56** — seven uniform chips, seed-list order, no faked default;
  strings in `src/lib/lexicon.ts` as `INTENTS`. Grounds: promoting a
  chip encodes a choice the user never made.
- **D57** — different chip revises with carry; same chip is a no-op;
  deselection banked, undesigned.
- **D58** — the answer echo (operator-designed at the gate): settled
  word, large type, in the vacated home-zone box; settle-only, no live
  tracking (ratified bare-minimum); error and echo share the box.
- Adopted-as-shipped: explicit `intent: null` on entry 1; the
  tsconfig `paths` fallback array for `expo-modules-core`.

## Open items

**Runnable now**
- The scoring-slice design pass (the entry point below).
- Operator feel verdict on tap-vs-drag chips (two minutes, gates the
  entry point's first fork — see below).

**Blocked**
- Reanimated warning fix: blocked on one Metro stack-trace capture.

**Banked (prioritized)**
1. Chip-mechanic revisit — tap vs drag, raised by the operator at the
   build-2 gate **before** the selection fix; re-judge with working
   selection as the deciding input.
2. Rich-path question placement (fit/context/co-alcohol) — **unbanked
   by the prior handoff's own rule**: it deferred until chips landed;
   chips landed. Needs a design pass before any build.
3. Home-zone parking after a confirmed entry — two faces now: the card
   parks in the cancel zone contradicting the recorded truth, and chips
   can revise a session whose card sits parked. One design question
   owns both; the architect's lean is a soft-delete insert, undesigned.
4. UI/art pass — operator-deferred explicitly ("more colors, animations
   and stuff later"); includes echo treatment, chip styling beyond
   inversion, feel constants.
5. Parser brand sludge ("Adult Use Powered by ...") — priority rising
   again: now user-facing on the card chip, the ladder, the delete
   dialog, and the echo screen's card. Still post-confirm-screen, but
   barely.
6. D54–D57 ratification dates in `session-logging.md` say 07-15, should
   say 07-16 — one-line `docs:` fix, fold into the next doc touch.
7. tsconfig/Metro sticky-resolver landmine → `CLAUDE.md` if it bites a
   second time.
8. Audit script: re-annotate item [14]; add the print-the-handoff-table
   section (carried, now four sessions old).
9. Latest-entry-per-chain read view — scoring slice;
   `security_invoker = true` non-negotiable.
10. Test-data truncate decision rides the scoring slice (rows are
    disposable by ratified ruling; the shelf should not compute over
    junk).
11. `session_id` index — when something reads by chain.
12. Haptics (`expo-haptics`, native module) — batch with the next
    build-forcing dependency.
13. Gear-icon confirmation on any non-dev build (carried).
14. Resend domain verification (carried).
15. Doc micro-amendment: entry-1 intent "omitted (null)" vs shipped
    explicit null (letter-vs-wire note).

## Working rhythm

Stable method lives in `CLAUDE.md` and
`documentation/process/handoff-specs.md`. In flux this session and worth
keeping: (a) commit bodies are **operator-read**, always
`git log -1 --format=%B | cat -A`, never implementer-pasted; (b) on any
"pasted above" that arrives empty, the operator pastes the raw command
output — treat the drop as normal, not exceptional; (c) when prompt
sequencing changes after a prompt has shipped, amend the prompt file
and re-deliver — a verbal patch in chat never reaches the implementer;
(d) the sha256 transcribe-and-hash channel absorbed three byte-exact
doc transfers today and is now routine; (e) gate checklists get
perception checks as first-class steps and put the device in the
required state **before** cutting the network.

## Entry point

**The scoring-slice design pass** — the shelf finally consumes
sessions. Open with whole reads of `product-metaphor.md`,
`scoring-lexicon.md` (skeleton items 5–6), and
`session-entries-schema.md` (the banked view section), then design: the
latest-entry-per-chain read view (`security_invoker = true`,
non-negotiable), soft-delete exclusion, average and band placement,
untried-stays-neutral, and what the shelf renders per band. The pass
also owns the test-data truncate decision before anything computes over
junk rows. **One gating preamble, two minutes, before the pass starts:**
the operator's tap-vs-drag verdict on chips now that selection is
visible. If taps survive, proceed as above. If taps lose, the
chip-mechanic design pass (banked item 1) preempts scoring — that is
the only fork, and the operator's verdict closes it. Not a menu: absent
that verdict going against taps, scoring is the move.
