# Session handoff -- written 2026-08-03, session of 2026-08-03

Write-last: this file is committed only after every commit below was
pushed and sync-confirmed by the operator, with origin independently
verified through the architect's mirror. The repo adjudicates all
state claims; this file predicts, it does not testify.

Carried-context refutations from this session, so the next one
calibrates: the architect stated schema-grants-posture.md at 171
lines (it was 170, never observed, caught by the implementer's own
arithmetic); pinned the hand-count rule to Commit conventions on
first attempt (it lives in Prompt conventions; the pre-ship gate
execution caught it); and shipped a worktree-sha256 criterion that
cannot pass on a tracked CRLF checkout (details below). Begin with a
read-only Phase A audit.

## What shipped -- five commits, each pushed with 0 0 observed

- a5a7229  feat: in-app COA PDF viewer (D106 slice B)
- dbfe1cc  chore: add react-native-webview 13.16.1 (D106 slice A)
- 4ce82cd  docs: ratify D106, the in-app PDF viewer
- 70d394c  docs: promote four standing rules to CLAUDE.md
- 79fd962  feat: revoke anon from public, durably (D105)

## The arcs

**D105, anon revoked durably.** The banked D87.4 rot finding is
discharged: anon holds zero privileges on everything in public, and
postgres's default ACL there no longer grants it, so future
migration-created relations are born locked. supabase_admin's
default ACL is the recorded, unreachable residual (zero members --
observed, not assumed). Gates were control-paired through the
architect's MCP channel: anon SELECT succeeded with zero rows
before, failed 42501 after; a probe table was born without an anon
ACL entry. Migration operator-applied; ledger 15/15 with the
directory. The migration SQL was dry-run against the live database
inside BEGIN/ROLLBACK before the prompt shipped -- a form worth
reusing.

**The promotion pass.** Four rules into CLAUDE.md, each having cost
real session time: hand-count coverage of the architect's own text,
npx supabase as the CLI form, MCP execute_sql's last-result-only
behavior, and the doubled-D87 citation rule.

**D106, in-app PDF viewer.** Split slices per the native-module
rule: manifest chore, operator's EAS build (npx eas-cli build
--platform ios --profile development), then the viewer feat.
WKWebView rendered the PDF on the first binary -- the named
react-native-pdf fallback was not needed. Safari hop deleted;
absent state unchanged; mechanical three-step device gate.

## Refuted hypotheses / corrections -- read before trusting anyone

Architect's, five:
1. The 171-line count (above).
2. The wrong section pin (above).
3. The worktree-sha criterion: sha256sum against a TRACKED file's
   worktree can never equal the blob hash on the operator's
   autocrlf=true checkout. The D105 files passed it only because
   they were freshly created LF. Identity criteria for tracked
   files read `git show :<path>` or `HEAD:<path>`, or normalize
   with `tr -d '\r'`. PROMOTION CANDIDATE, one instance.
4. A grep -rc criterion predicted "0" as its output shape; the tool
   emits one path:count line per file. Property held; shape wrong.
5. Slice B's criteria named two false Safari comments; the file
   held a third (pdfInFlight). The implementer's end-to-end read
   caught it -- a grep proves a token absent, never a claim absent,
   exactly as the handbook says.

Implementer conduct, two contrasting cases, both accepted:
- It proceeded PAST a failed criterion (the sha above) on its own
  three-hash parse evidence. The result was correct; the deviation
  from STOP-on-failure is recorded as a rule tension, not resolved.
  The architect's lean: the rule stays absolute.
- It STOPped correctly on a stray untracked 0-byte file named
  `main` at repo root (a refname/path ambiguity hazard); the
  operator confirmed empty and removed it. Origin unknown; the
  shape of a stray shell redirect.

Operator-side: a fifth collapsed gate verdict ("all gates passed"
at D105 device step 2, while the database showed the log step had
not run -- session_entries still 21). The mechanical one-step
regime held; the log landed only when its step was actually issued.

## Ratified decisions

- D105.1-.5 (grounds in schema-grants-posture.md, D105 section).
- D106.1-.4 (grounds in dashboard.md, Amendments 2026-08-03).
- Banked with D105: authenticated's TRUNCATE on all seven tables
  (not RLS-gated; unreachable via PostgREST today).

## Open items

**Runnable next (design first, nothing drafted):** the operator's
dashboard gripe list -- see Entry point.

**Blocked:** none.

**Banked:** open-in-browser affordance in the viewer (D106.3);
blob-hash identity criteria promotion (one instance; below the
corrected-twice bar); D-registry renumber for the doubled D87 (the
citation rule is the standing workaround); authenticated TRUNCATE;
off-shelf log (D101); preference_summary view (D98, render cost
only); never_again; retirement last-log step; third retirement
reason; Android (now carrying D106.1's named WebView-PDF cost);
app-code test wiring (when a slice needs it).

**Milestone:** real-session remains UNFIRED. All 23 raw entries are
test data per the standing ruling until the operator declares
otherwise.

## New standing facts

- EAS dev build form that worked: `npx eas-cli build --platform ios
  --profile development` (the CLI, like supabase, is npx-only).
- The Supabase CLI access token had expired (401); `npx supabase
  login` + `link` restored it. Environmental, not a rule.
- The seven reference/handoff/0N-screens.png files remain untracked
  in the operator's worktree; the next arc's design references live
  partly in them. Committing the relevant one(s) to reference/ is
  the next session's call.

## Phase A for the next session -- falsifiable, observed 2026-08-03

- HEAD: this handoff's own docs commit; its parent is a5a7229
  (feat: in-app COA PDF viewer). Predict the subject: "docs: session
  handoff 2026-08-03 -- D105, promotions, D106". Sync 0 0 after the
  operator's push. If HEAD is neither, work continued -- reconcile.
- git status --porcelain: the seven ?? reference/handoff lines, or
  fewer if the operator prunes them.
- Migrations: 15 on disk (name-form count), 15 in the ledger.
- Jest: 52 (architect re-measures against origin; the operator
  machine is a prediction).
- CLAUDE.md: 322 lines. dashboard.md: 247 lines, 14 headings.
- DB at close: coas 5, session_entries 23 raw / 12 current,
  retirements 2, storage objects 2, favorites 2, anon grants in
  public 0. Growth is a finding, not an error; all test data.

## Entry point -- the operator's design gripe list, 2026-08-03

Lived demand fired for the first time since the dashboard arc
closed: the operator compared production against the designer
reference (annotated screenshots, green = target, red = current)
and named two changes plus one wording rule. Next session ratifies
the design (D107 is believed next-free -- verify by reading, not
by this claim), then slices:

1. **Header redesign.** Replace the email row and the "Add to
   shelf" button with the designer's compact header: CULTIVAR
   wordmark left, pill button right. The pill's label is "Add" or
   "Add Flower" -- operator to rule; "Add COA" is rejected. Open
   sub-question: where sign-out lands (the settings gear is the
   natural candidate; production already renders one).
2. **Shelf section row.** An "ON SHELF - N" / "Off-shelf (N) >"
   row directly under Your Preferences and above the first card.
   This supersedes the quiet-footer placement ratified in the D101
   amendment -- the supersession must be recorded in dashboard.md
   when ratified, not silently.

Both are UI-visible Tier 2 slices behind one docs commit; no schema,
no native modules, no EAS cycle. The screenshots are the spec until
the docs commit lands.
