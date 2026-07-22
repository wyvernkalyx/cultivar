# SESSION_HANDOFF -- written 2026-07-22 against pushed HEAD `1398dd1`

The repo is authoritative over this document. Begin with a read-only
Phase A audit (`bash scripts/session-audit.sh`, Git Bash only) and try
to break every claim below before doing anything else.

This file supersedes the handoff committed at `6be881c`.

## Preamble -- refutations and lessons, stated so they cannot be re-carried

1. **The ratified ASCII gate was vacuous.** The prior session's command
   (`git log -1 --format=%B | LC_ALL=C grep -n $'[\x80-\xff]'`) returns
   exit 1 on files od-verified to contain em dashes (GNU grep 3.11); every
   pass it ever produced observed only the protected case, and the prior
   handoff's "the em dash would have been caught by one grep" was false.
   Replacement, ratified and used at three commit gates this session, the
   control proven on MINGW64 each time:
   control `printf 'ctl \342\200\224\n' | LC_ALL=C tr -d '\0-\177' | wc -c`
   -> `3`, then gate `git log -1 --format=%B | LC_ALL=C tr -d '\0-\177' |
   wc -c` -> `0`. **An ASCII gate is trusted only after its dirty control
   fails in the same shell that runs it.** Corollary found the same hour:
   the architect's first dirty control was itself broken (`printf '\xe2'`
   wrote literal characters in that shell) -- controls get od-verified too.
2. **Two architect prompt premises refuted by the Phase A inventory**:
   "no date rendered in the client" was false as written (`Added
   <created_at>` at three sites), and the "Edge Function insert path" item
   presupposed an insert that does not exist -- ingest-coa is
   parse-and-return; the client calls `insert_coa` after human confirm
   (D33/D39). The prediction's core (no COA-sourced date anywhere) held.
3. **`pg_get_functiondef` omits `SECURITY INVOKER`** because invoker is
   the default; the architect's gate prediction failed on that literal.
   Standing form for function-security gates from now on:
   `select proname, prosecdef from pg_proc where pronamespace =
   'public'::regnamespace and proname = '<fn>'` -> `prosecdef = f`.
   A deparser's omission is never again the evidence.
4. **Diff non-delivery twice** (slices 2 and 4: "pasted in full above"
   with nothing above). The operator-channel re-run recovered both; the
   default routing of diffs through the operator's channel is load-bearing
   and stays. The full-file/full-diff read caught nothing false this
   session -- but it is also where the slice-4 editor scope was confirmed
   in-bounds, which no grep could have done.
5. **Slice-3 criterion wording gap**: the verbatim-base check's "every
   line except the insert column list and values rows" failed to
   enumerate the `create` -> `create or replace` line its own content
   mandated. The implementer proceeded correctly and recorded it;
   criteria must enumerate every intended difference.
6. **Mistimed read-back**: the first G5 query ran before the ingest and
   `limit 1` returned the pre-D84 Rainbow Runtz row (`null,null`,
   created 07-17). A sequencing artifact, not a failure -- and incidentally
   a correct live observation of the D84.6 backfill posture.
7. Operator said "ruby runtz"; the uploaded artifact was RAINBOW RUNTZ
   (`S01-RARU`). Resolved by reading the artifact, not the name.

## Start here (Phase A, read-only) -- every line is a falsifiable prediction

| check | expected |
|---|---|
| branch | `main` |
| HEAD | a `docs:` commit, subject `docs: session handoff at 1398dd1`, parent `1398dd1`. Below it, newest first: `1398dd1`, `17b2879`, `840c573`, `28194a5`, `6be881c`, `9ca1aa6`, `acf8dfa`. |
| `git rev-list --left-right --count origin/main...HEAD` | `0	0` after the operator pushes this handoff commit. |
| `git status --short` | clean. Under `--ignored`: `!! .env`, `!! .expo/`, `!! audit.txt`, `!! expo-env.d.ts`, `!! node_modules/`, `!! supabase/.temp/`. |
| `ls supabase/migrations/` | exactly six; newest `20260722161632_alter_coas_d84.sql`. |
| Jest | 52 passed (40 + 12 date tests; literal runs observed at slices 2 and 4). |
| Deno | 5 passed (literal run observed at session open and slice 2). |
| `npx tsc --noEmit` | exit 0 |
| `npx expo lint` | 1 error, 0 warnings (template baseline), exit 1 |
| `npx expo install --check` | jest/@types/jest plus expo patch drift; expected, do not fix |
| Supabase (four saved queries) | six tables `rowsecurity=t`; 9 policies, `session_entries` exactly INSERT + SELECT; both views `security_invoker=true`. Re-observed at open. |
| `coas` schema | `sampled_on` and `tested_on` present, `data_type=date`, `is_nullable=YES` (observed live this session). `insert_coa` `prosecdef=f`; execute grants: `authenticated`, `postgres`, `service_role`; no `anon`, no `PUBLIC`. |
| newest `coas` row | Rainbow Runtz `S01-RARU`, `sampled_on=2025-05-05`, `tested_on=null`, created 2026-07-22 -- unless operator usage added rows (a finding to record, not an error). Pre-D84 rows are all null-dated by design (D84.6). |
| `session_entries` | 130 at this session's close (observed three times, unchanged -- no session logged during the device gate). Prediction for next open: >= 130; growth is operator usage in confirms + toggle-ONs. |
| client constant | `src/lib/lexicon.ts:6` `LEXICON_VERSION = 2` |
| Reanimated posture | unchanged from prior handoff: manifest greps (`"react-native-reanimated": `, `"react-native-worklets": `) 0/exit 1; autolinking exclusion covers both; `grep -rn "^import .*reanimated\|^import .*worklets" src/` -> 0, exit 1; deleted set stays deleted. |
| slice-4 spot checks (derived from the operator-channel diff; the repo wins) | `grep -c "formatIsoDate" src/components/shelf-list.tsx` -> 3; same in `coa-detail.tsx` -> 3; `grep -c "cardDateLine" src/components/shelf-list.tsx` -> 2; `grep -c "sampledDate" src/components/coa-editor.tsx` -> 4, `testedDate` -> 4. |
| `CoaResult` | `grep -c "sampledDate" supabase/functions/_shared/coa/types.ts` -> 1; `testedDate` -> 1. |

If any of these don't match, the repo wins -- re-baseline before
proceeding.

## What shipped (newest first) -- the D84 arc, complete

- (this handoff commit) -- the write-last close, no code.
- `1398dd1` -- **feat:** D84 slice 4, client wiring + display. Step-0
  finding: the payload is rebuilt in `coa-editor` (interface, Draft,
  initDraft, emitDraft), not passed through; the two keys now ride it,
  uneditable. Shelf card follows D84.4 precedence; detail shows both
  labeled dates with `Added` as provenance; `formatIsoDate` constructs a
  local Date from parts so `YYYY-MM-DD` never shifts a day west of UTC.
  Device-gated (screenshots + raw read-back): live Rainbow Runtz ingest
  landed `2025-05-05 / null`; the `Sampled` label rendered with the
  correct day; pre-D84 rows fell back to `Added`. **The `Tested` branch
  is Jest-evidenced only** -- never observed live (banked, opportunistic).
- `17b2879` -- **feat:** D84 slice 3, migration
  `20260722161632_alter_coas_d84.sql`: `sampled_on`/`tested_on` (date,
  nullable, no defaults) + `insert_coa` recreate reading
  `sampledDate`/`testedDate` with `::date` casts. Applied to the remote
  and gated on observed SQL (columns, `prosecdef=f`, grants preserved,
  standing baseline intact, rows 130). **ingest-coa redeployed** with the
  slice-2 bundle (asset list observed to include `dates.ts`) -- the D84.5
  amendment: deployment is assigned to slice 3 operator steps.
- `840c573` -- **feat:** D84 slice 2, parser date capture. `CoaResult` +2
  fields; pure `normalizeUsDate` (2-digit pivot to 20YY, numeric bounds
  only, 3-digit years rejected by a length guard); Kaycha one regex over
  both layouts, DRS collection + report-created with `Sample Received`
  deliberately unused; unknown shell nulls. Jest 40 -> 52 including the
  rainbow-runtz null control.
- `28194a5` -- **docs:** D84 design (`documentation/design/
  coa-test-dates.md`), decisions D84.1-D84.6, ratified by the operator
  before any code moved.

Five pushes observed this session: `6be881c..28194a5`,
`28194a5..840c573`, `840c573..17b2879`, `17b2879..1398dd1`, and (this
handoff, predicted) `1398dd1..<handoff sha>`, each closing to `0	0`.

## The arc

Session opened on the `6be881c` handoff; Phase A closed 19/19 with zero
refutations (rows exactly 130 -- first open in memory with no
inter-session usage). The COA test date pass ran the full
document-before-implement cycle in one session: read-only inventory
(which refuted two architect premises and mapped the parse-and-return
seam), ratified design doc, then parser, schema, and client slices, each
gated in its own mode (tests raw; observed SQL; device walk with
screenshots and a read-back). The one protocol discovery that outranks
the feature: the ratified ASCII gate never worked, found by running its
own missing dirty control.

## Refuted hypotheses / memory corrections

- The seven Preamble items above.
- Prior handoff's ratified ASCII gate command: superseded (Preamble 1).
- "DRS is 4-digit years": false within one document; the normalizer
  accepts both widths everywhere (encoded in D84 and the parser).
- Freeze posture: the device gate added one more clean walk on the
  existing binary -- now four gated walks, zero freezes since the
  Reanimated excision. Nothing owed until recurrence or enough clean
  walks to close.
- G11 brand/strain nullability worry: still UNOBSERVED -- carried.

## Ratified decisions

- **D84.1-D84.6** (committed in the design doc at `28194a5`; all four
  slices landed and gated).
- **ASCII gate, corrected form** (supersedes the prior session's):
  control-paired `tr` as in Preamble 1. CLAUDE.md promotion candidate,
  now alongside the construct-form absence-gate rule.
- **`prosecdef` observation** is the standing form for function security
  gates (Preamble 3).
- **Deployment rides the schema slice**: `supabase functions deploy`
  is an operator step of the slice that makes the backend live (D84.5
  amendment, recorded in `17b2879`'s message).
- **Date columns are `_on`, not `_at`** (date type, not timestamptz --
  deviation flagged and accepted).

## Open items

**Runnable now (the entry point)**
- **CLAUDE.md promotion pass** (one `docs:` commit): promote (a) the
  construct-form absence-gate rule, (b) the corrected control-paired
  ASCII gate incl. the control-must-fail-dirty requirement, (c) the
  `prosecdef` standing form. Three ratified rules now live only in
  handoffs; promotion prevents next session re-deriving the
  vacuous-gate discovery from scratch.

**Blocked / unresolved**
- **Supabase MCP connector still sees zero projects** (untouched this
  session; the operator paste channel carried all SQL cleanly, four
  saved queries plus the new date/grants observations).
- **The freeze**: four clean gated walks; accumulating.

**Banked (prioritized; carried unless noted)**
1. Glossary pass.
2. Survey copy review (error-banner copy; "Overall" sweep; "Anything
   else?"; "Saving..."; dead explainer line 3; NEW: exact strings for
   the `Sampled`/`Tested` card and detail lines, and any age-in-days
   phrasing -- D84.4 shipped plain labels deliberately).
3. **COA PDF persistence in Supabase Storage** -- promoted into the
   numbered bank this session on the operator's statement that it "will
   be a requirement" (a later phase, per the operator; not next). The
   date pass created the first concrete backfill demand: every pre-D84
   row is null-dated and recoverable only by re-ingest or a persisted
   PDF (D84.6).
4. Doc consolidation pass.
5. NEW: live `Tested`-branch observation -- one-minute opportunistic
   check the next time a Kaycha-2026 (or DRS) COA is ingested on
   device: card shows `Tested <date>`, read-back shows both dates.
6. NEW: COA age as a personal scoring signal (correlate `tested_on`
   age at session time against the user's own outcomes) -- the honest
   form of the operator's staleness thesis; depends on nothing further,
   but no copy may ever claim degradation (personal-empirical
   invariant).
7. Audit-script pass (merged items): print exit status for `deno_check`
   and `expo_lint`; extend coverage toward the Phase A rows the script
   does not observe (10 of 19 at this session's open were manual);
   document `count_lib`'s semantics (still unknown to the architect).
8. check-ignore qualification. 9. Axis deselection-to-null (blocker
   intact). 10. G11 (carried, unobserved). 11. G12 error-banner-on-device
   (never seen live). 12. `formatIsoDate` duplicated in two components --
   below the util-file threshold, recorded as a choice, revisit only if
   a third consumer appears.
13. Carried untouched: "Expo Starter" web-tab-bar branding; detail-view
    read/edit; home-zone parking; shelf sort-by-band; license extraction
    + NY OCM import; haptics; Resend domain verification;
    quadrant/intent-lens/confound discounting; anchor-collision residual
    (D69); `auth-resp.json` at the repo parent.

## Working rhythm

Stable method lives in CLAUDE.md and handoff-specs.md. Proven again this
session: document-before-implement across a four-slice arc; thin build
prompts with the committed doc authoritative; report-before-change for
unknown wiring (the step-0 payload finding); diffs through the operator
channel by default (twice load-bearing); full-diff reads at review;
per-slice gate typing (tests raw / observed SQL / device walk with
screenshots and read-back); two-channel body verification plus the
corrected ASCII gate with its platform control; predictions stated
before observation, refutations recorded, sequencing artifacts recorded
as findings; architect self-checks its own artifacts with working
instruments -- and verifies the instruments against dirty controls first.

## Entry point

**The CLAUDE.md promotion pass.** One `docs:` commit, three ratified
rules, no design work owed. Then the glossary pass (bank item 1). Not a
menu: absent an operator redirect, this is the move.
