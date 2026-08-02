# Session handoff — written 2026-08-02, sessions of 2026-08-01/02

Write-last: this file was committed only after every commit below was
pushed and sync-confirmed by the operator. The repo adjudicates all
state claims; this file predicts, it does not testify.

## What shipped — the dashboard arc, complete

Eight commits, each pushed with `0 0` sync observed by the operator:

- d3d34b0  docs: dashboard design and slice plan (D98-D104)
- dae626b  feat: dashboard preference summary (D98, slice 1)
- bf8e213  feat: shelf card redesign and one-tap log (D99, slice 2)
- 8686729  feat: open retained COA PDF via signed URL (D100, slice 3)
- 165eff4  feat: off-shelf history surface (D101, slice 4)
- 00a6e9c  feat: COA detail redesign, sessions section, no delete
           (D102/D104, slice 5)
- 814eaef  feat: survey restyle onto Dash tokens (D103, slice 6)
- 82b0276  docs: dashboard arc amendments (HEAD at handoff time)

All three of the operator's original gripes are discharged: the
dashboard with preference info and richer cards, the PDF open path,
and the design pass converted to shipped UI. Zero schema changes in
the entire arc. Every slice device-gated on the physical iPhone;
slices 4-6 gated under the mechanical per-step regime.

## Operator rulings this session

- All database session data is test data ("don't worry about test
  data", 2026-08-01). The real-session milestone remains UNFIRED
  until the operator declares otherwise — no session in the DB is
  evidence of it.
- Slice order, PDF-open-v1 (signed URL to Safari), client-side
  preference summary, and no-delete were ratified 2026-08-01; D104's
  removal ruling and the archive treatment (line-only marker, quiet
  footer link) 2026-08-02. All recorded in dashboard.md's Amendments.

## Refutation record — read before trusting this architect

Seven architect claims or predictions were refuted this session, all
caught by gates, the implementer, or the database:

1. session_entries predicted 11, observed 12 (mooted by the
   test-data ruling, but the prediction was wrong).
2. shelf-list.tsx predicted 487 lines; 479. Derived from the --stat
   histogram (insertions PLUS deletions) instead of observed.
3. The slice 2 prompt omitted D102's card truncation requirement;
   the implementer caught it by reading the governing docs.
4. D104 was authored and ratified on the false premise that no
   delete UI existed. It did (detail view, D42/D45 lineage).
5. The slice 4 prompt silently overrode reference 03's ratified
   archive styling; implementer flagged; operator re-ratified the
   prompt's version at the gate.
6. The slice 6 prompt said "Dash untouched" while a criterion
   required editing Dash's own comment; the comment also carried a
   false claim about Sora 800 (fixed).
7. The amendment prompt predicted 10 headings from a hand-count of
   nine prior sections; the doc has twelve. Second hand-count
   failure in one session.

The byte-identity sha gates caught nothing because they never had
to: both times a count failed, the sha over architect-materialized
bytes was right. Hand-counts over the architect's OWN authored text
are the open hole; see promotion candidate below.

Operator-side: a fourth collapsed gate verdict occurred (slice 2,
"all passed" including a step the database showed never ran). The
banked tripwire fired: **device gates are now mechanical — one step
per message, each requiring an operator paste before the next.**
This regime ran slices 4-6 and stands.

## New standing facts

- Architect evidence channel: the GitHub mirror is cloned in the
  architect's container (repo synced to project knowledge). It
  observes origin and blob content only — never worktree, index, or
  unpushed state, which remain operator-paste territory. Jest was
  re-measured there (52 passing at every slice), Node 22/Linux —
  evidence about the code, weaker evidence about the operator's
  machine.
- Supabase MCP stable all session; all row counts and gate
  predictions were architect-side reads.
- CLAUDE.md promotion candidate, strengthened by refutations 2 and
  7: "the architect does not hand-count" must explicitly cover
  counts derived from the architect's own authored or supplied
  text — both failures were self-authored-text counts.

## Carried defects and vestiges (not banked — these are debts)

- `onDeleted` is a vestigial required prop on CoaDetail; two-line
  retirement in shelf-list.tsx and off-shelf-list.tsx.
- `coa_session_stats` is still fetched by shelf-list's load() and
  read by nothing (bands getter elided in slice 2). Next detail or
  stats consumer reads it or the select is dropped.
- `terpeneHue` exists as two identical file-local copies
  (preference-summary.tsx, shelf-card.tsx). Consolidation target:
  beside the grouping functions in src/lib/card-data.ts.
- A null strain renders a blank line on TWO surfaces: shelf-card.tsx
  and coa-detail.tsx (the latter introduced in slice 5, carrying the
  old header's behavior forward; caught at handoff audit). The survey
  already holds the right precedence (strain ?? brand ?? ''); the
  pending copy decision should adopt it rather than invent a second
  rule.

## Banked (unchanged unless noted)

- In-app PDF viewer (D100; native-module/EAS split rule applies).
- Log on off-shelf detail, on lived demand (D101).
- preference_summary view, on measured render cost only (D98).
- Anon-grants durable fix: its own slice, never a rider; the
  pg_default_acl rot finding stands.
- Retirement last-log step; never_again; Android layouts.

## Phase A for the next session — falsifiable, observed 2026-08-02

- HEAD: this handoff's own docs commit; its parent is 82b0276
  (docs: dashboard arc amendments). Predict the subject:
  "docs: session handoff 2026-08-02 -- dashboard arc closed".
  Sync 0 0 after the operator's push.
- `git status --porcelain`: EITHER the seven
  `?? reference/handoff/0N-screens.png` lines OR silent if the
  operator runs the optional `rm reference/handoff/0?-screens.png`.
- dashboard.md: 218 lines, 13 `^## ` headings.
- Migrations: 14 on disk, 14 in the ledger.
- Jest: 52 (architect re-measures against origin; operator-machine
  state is a prediction, not an observation).
- DB at handoff time: coas 5, session_entries 21 raw / 11 current,
  retirements 2, storage objects 2, favorites 2. Growth is a
  finding, not an error; all of it is test data per the ruling.

## Next entry point — operator's choice, no arc committed

Candidates, in the architect's recommended order: (1) a small
`chore:` tidying slice discharging the carried defects above in one
commit — the null-strain copy decision split out so it never blocks
the other three; (2) the anon-grants durable fix; (3) whatever the
operator's lived use of the shipped dashboard surfaces as the next
gripe list — the arc just closed is the first time the app matches
the product on the operator's phone, and lived demand has been the
best prioritizer this project has.

## Amendment -- 2026-08-02, tidy slice (appended after push of d0fb55c)

All four carried defects above are DISCHARGED:

- ad59087  refactor: retire dead prop, dead stats select, consolidate
           hue helpers
- d0fb55c  feat: state absent strain on the card and detail header

Corrections to the text above, which stands as written for the record:

- The terpeneHue consolidation landed in src/constants/theme.ts, not
  card-data.ts -- destination re-ratified 2026-08-02 (both helpers
  are pure Dash token lookups; verdictHue, found triplicated during
  the slice audit, consolidated with it).
- The null-strain remedy suggested above (adopt the survey's
  strain ?? brand precedence) was REFUTED: both surfaces already
  render brand on their own line, so the fallback would print it
  twice. Ruling 1a instead: D97 parity -- 'Strain not reported' in
  an absent style differing from the present style only in color.

Refutation record, this session -- all three the architect's:

1. The null-strain remedy premise above, as recorded.
2. The commit A build prompt omitted off-shelf-list.tsx from its
   change list while its own preconditions and criteria required
   editing it; the implementer resolved it from the criteria and
   flagged it.
3. The commit B prompt (first issue) gated on a bare token
   (color: Dash.textMuted) that shelf-card's stylesheet trips
   eight times; the implementer STOPped at the precondition.
   Fourth recorded instance of the non-discriminating-form class;
   the rule already stands in CLAUDE.md -- an application failure,
   not a missing rule.

Also removed with the dead select: its comment's false claim that
the coa_session_stats select stayed for the detail view (the detail
fetches session_current itself). The false claim predated this
session.

The absent-strain device gate ran on a probe row: one COA's strain
flipped to null and restored through the architect's MCP channel,
both updates value-predicated, one row returned each. DB counts
after restore are identical to this handoff's Phase A values:
coas 5, session_entries 21 raw / 11 current, retirements 2,
storage objects 2, favorites 2.

Entry point unchanged in kind: the anon-grants durable fix is the
top remaining banked item, or whatever the operator's next lived-use
gripe list surfaces. The dashboard arc's debts are cleared; nothing
stacks on this amendment.
