# SESSION_HANDOFF

Status: WRITE-LAST. Committed as this session's final act, 2026-08-22
(session opened 2026-08-21 on the dcc9759 handoff). HEAD at write time
is c057a5a (D152 glossary); this commit rides on top.

## Preamble -- argue against yourself first

Five commits pushed, four authorized pushes, every movement line
observed, sync 0 0 after each. (This line first said "three" -- the
architect counted authorizations from memory; the ledger below,
built from pasted movement lines, says four. The implementer caught
the contradiction pre-commit; the count-from-memory is the error
class, candidate 5's territory.) No bytes reached origin unauthorized.
The failures this session were of three kinds and two of them are the
architect's. (1) THE ARCHITECT GATED THE WORD, NOT THE RULE: the
D150 copy criterion grepped only "batch" -- the term that prompted the
rule -- and the rule's other violator ("strains", two sites on the
same screen) shipped past a green gate to the device, where the
operator's screenshot caught it. Same class again one carrier later:
the shelf card's "Terpenes not reported by lab." was false copy for a
rows-without-total product, pre-existing since D101, cloned into the
new Insights code by the architect without questioning it. (2) THE
ARCHITECT RULED ON AN UNVERIFIED DIAGNOSIS: the implementer reported
the cd prefix "stripped by the harness" from a test that could not
discriminate (run from the target directory), and the architect
accepted it and ruled a pwd-only substitute, which detected a
wrong-directory unzip AFTER the write instead of preventing it. The
decisive test (run cd from the parent) was one command and was not
asked for. Nothing entered the repo; six stray files landed in the
parent and were deleted by ruling. (3) The architect cited operator
Explorer-screenshot evidence in a ruling to the implementer without
naming its source channel; the implementer correctly noted it could
not corroborate. Trust a ruling's evidence only if it names where the
observation lives.

## Entry point

Reduce Motion Scope B is again the ranked entry point (doc first; no
doc exists; re-ratify Scope B -- still one sentence of carried
memory). BUT the operator's stated priorities have moved: this
session was cut from operator concerns (Insights readability,
onboarding/learning curve, import coverage, tester distribution), not
from the ranked list. At open, ask before assuming rank 7. Two
operator-named arcs are banked and larger than any ranked item:
import coverage (how many real products yield no COA PDF -- the
existential question; a tester tally is the cheapest measurement) and
COA copy-on-share between users (shape ratified as banked: recipient
gets their own copy; RLS untouched).

## Start here (Phase A, read-only)

- origin/main at write time = c057a5aca25a6665360035a06fa6b8f5d9de429f
  (movement line 0205fac..c057a5a, rev-list 0 0). This handoff commit
  rides on top, pushed as the final act; at next open expect
  origin/main = the handoff commit, sync 0 0.
- Worktree: clean except the standing two untracked (.claude/*).
  Outside the repo in D:\Projects\Cultivar: six carrier zips
  (d150 x4, d151, d152), prior-session files, all inert. glossary.bak
  removed by step 15.
- Toolchain at the last gates: tsc 0 (implementer); lint baseline
  unchanged (1 error, 0 warnings, exit 1, use-color-scheme.web.ts:11);
  suite 179 tests / 5 suites (was 170/4 at open; +6 D150, +3 D152;
  D151 net zero). jest.config.js roots now include src/constants.
- Migrations: 19 by name-form; no schema work this session.
- DB: read ONCE this session via MCP (coas row for the operator's
  manual "compliance test" COA: source_lab=manual, 9 reported terpene
  rows, total_terpenes null -- the row behind two gate findings). No
  writes. Re-measure before any claim.
- EAS: dev client from dd25187 unchanged; all five commits are
  JS-only and ride it via Metro reload.
- Project knowledge: REFRESHED since the prior handoff -- the stale
  phrase is gone and handoff-specs surfaces. The architect still read
  all governing files from a fresh clone; keep doing that.
- Architect clone: Node 22 (pinned 24); suite 179/5 passes there.
  TS2882 artifact remains clone-only; implementer tsc authoritative.
- The operator's data grew mid-session (8 -> 11 sessions, new logs on
  Orangutang Cookies): screenshots from different times differ
  legitimately; do not read session-count drift as a defect.

## What shipped (newest first; shas from pasted output)

c057a5a feat: terpene names open an aroma-only glossary on tap (D152)
0205fac chore: summary card drops the Loved-concentrations module (D151)
b5a95c7 chore: "product" replaces "strain" as the word for one tested item
451343b feat: Insights profile cards show one fingerprint per product (D150)
8ce9f2e docs: Insights reads like the stash -- D150-D152 design

Pushes: dcc9759..8ce9f2e, 8ce9f2e..b5a95c7 (two commits), b5a95c7..
0205fac, 0205fac..c057a5a. Each ref-scoped, two-channel verified
(implementer report + operator cat -A paste) for every non-docs body.

## The arc (complete): "Insights reads like the stash", D150-D152

One design doc, three slices, ratified 2026-08-21 and amended twice
by device-gate findings (the amendments are IN the committed doc).
D150: both Insights profile cards list one product per entry --
strain, brand, the shelf card's Fingerprint -- replacing profile
groups and the THC/CBD fact line; pure lib gains ProfileProduct +
profile.products, six Jest cases. Ruling embedded: NO BAR WITHOUT A
LAB TOTAL; the app never sums one; Fingerprint takes total: number |
null and renders legend-only when null. D151: LovedModule deleted
with its types, helpers, styles; buildSummary loses its terpenes
parameter; loadSummary/SummaryResult removed as consumerless. D152:
terpene names in every Fingerprint legend are presses opening an
aroma-only glossary sheet (29 entries, src/constants/
terpene-glossary.ts); banned-language Jest test with a control run
that MUST bite (injected "Relaxing." fails 1/179) -- the control is
part of the gate, not optional. Copy rules ratified and committed:
"product" never "batch" or "strain" for one tested item; "Strain"
survives only as the name-of-datum field label and fallback; the
Avoid card subtitle now mirrors the Target card's.

## Refuted hypotheses / memory corrections

- "Green Analytics parser needed for the operator's Gelato 33 jar":
  doubly refuted. parseGreenAnalytics.ts exists at HEAD, and the jar
  has no COA PDF at all -- its QR resolves to Metrc Retail ID
  (app.1a4.com, a JS shell; qr-import.md had already recorded the
  domain 2026-08-04, and the operator click-through confirmed no
  download offered). Banked as "Metrc Retail ID products have no
  ingestible document", a future arc (headless browser or Metrc API),
  not a parser slice.
- "FAB dead zone" and "raw error copy" as priorities: operator has
  never observed either in use; withdrawn as candidates, remain on
  the unranked list only.
- The carried Limonene data read ("Limonene-dominant Loved batch
  contradicts stated avoid"): retired by operator ruling -- the test
  data is random, not preference signal.
- art-direction.md #090d0a vs Dash.bg #0B0F0C: STILL OWED. Operator
  agreed docs-fix direction early in session but the one-line docs
  commit was never made -- it fell out of the arc. First idle Tier 1.

## Operator rulings this session

Slices A+B+glossary chosen over Reduce Motion (operator-observed
inconsistency outranks unexperienced polish). "product" ratified;
"Strain" field-label exemption ratified. No bar without a lab total
(option 1 over sum-derived bar). Compliance-test row: operator will
rename/complete the manual COA in-app (open). Glossary entries and
footer: ratified as shipped. VoiceOver gate item on D152: waived and
banked by architect ruling after operator SKIP (grounds in the
ruling, recorded verbatim in the implementer report). Weekend tester
build: MISSED -- testers left; EAS internal distribution remains the
ratified path when rescheduled (registration link, preview profile,
~15 min build; open question: does stranger sign-up work?).

## Refutation ledger, this session

Architect: the copy gate that enumerated one word (reached the
device; operator-caught); the false no-data copy cloned from the
shelf card into new code (device-gate-caught); the D150 insertion
prediction off by 11 lines (doc amendment uncounted); prettier
--write run against a repo with no prettier config, reformatting 60
untouched lines (self-caught reading insertions; reverted); the
carrier named -v2 with a rename-on-save instruction, which stranded
the amended doc in Downloads-adjacent limbo (operator-caught at the
hash gate; candidate 9); accepting the implementer's non-
discriminating cd diagnosis and ruling on it (see preamble); citing
screenshot evidence without naming the channel. Implementer: the
missing-cd git add at D151 step 8 with self-recovery where the rule
is STOP (accepted because staged-blob evidence was independent;
rule restated next prompt); the non-discriminating harness diagnosis
reported as proof (self-corrected with the decisive test one turn
later); repeated cd-prefix drops at D152 (all caught by the pwd
channel before repo damage). Implementer catch credits: the sealed
release string held against an aggregate "Pass" AND against a SKIP
smuggled as release; the wrong-directory unzip self-report with the
clobber caveat honestly stated; the classifier denial not worked
around. Operator: one aggregate "Pass" for a four-item gate;
corrected to per-step on request, and per-step held thereafter.

## Promotion candidates (carried 1-8 not yet promoted; new)

9. A copy-rule gate enumerates EVERY term the rule displaces, not the
   term that prompted the rule.
10. Carriers are named exactly as their destination basename; no
   rename-on-save instructions to the operator.
11. Implementer command form is set-then-prove: cd <repo> && pwd &&
   <cmd>; pwd must print the repo path or STOP. The per-turn cwd
   reset to the parent is real (two sessions' evidence); the
   "stripped cd" account was refuted.
12. Implementer-side unzip into the repo tree is not a ratified step:
   the permission classifier denied it non-deterministically (ran
   4x on D150/D151, denied on D152). Operator places carriers;
   implementer verifies hashes. This also matches the role split.
13. A gate-release string is sealed text; the architect changes it
   only by amending the sealed condition, never by sending a
   variant to the operator. A control gate (like the banned-language
   injection) is part of the gate: it must bite, and its restore
   must hash back to the pin.

## Banked follow-ups

Operator-named arcs (larger than ranked items; ask at open):
- Import coverage: measure how many real products yield a parseable
  COA PDF. Tester tally sheet is designed-in-principle, unbuilt.
- COA copy-on-share between users (copy semantics ratified banked).
- Onboarding: ratified strategy is scan-first + glossary-in-place
  (D152 is step one); banked ideas: sample product pre-load,
  30-second what-it-does video, one-sentence pitch reframe, watch-
  one-person-use-it session. Terpenes-by-smell strategy now has its
  first shipped artifact.
- Metrc Retail ID ingestion (headless/API; not a slice).
- Tester distribution via EAS internal (missed this weekend;
  stranger-sign-up question open).

New small banked:
- D150.1 idea, unratified: an "appears in all N Loved products"
  count line atop the Target card (a count, not a blend; legitimate).
- Share text still consumes the pooled top-3 (now doubly inconsistent
  with per-product cards); D147-banked, unchanged.
- D152 VoiceOver pass on the legend: OWED (waived, banked).
- Glossary entries absent for nine canonical names (fallback shows);
  extend only with uncontroversial aroma facts.
- Compliance-test manual COA: operator to rename/complete in-app.
- art-direction.md background line: the owed one-line docs fix.

Carried, unchanged from prior handoff: handoff-specs 3.4/4.4 refresh;
Reduce Motion Scope B (doc first); 44pt-floor audit; dead
result.message; ragged wrap in delta-fab-touch.md; BottomTabInset;
bloom comment; session-ladder D83 note; same-name disambiguation;
Stash system-font states; last-card breathing room; orphaned PDFs;
app rename check; migration 20260715185455 comment; theme.ts Dash
docblock; shelf-list Retry VoiceOver residual; formatPct rounding
docs question; D148/D149 layout revisit triggers; Counter view /
Share exercise; D149 collapsed-row + ProfileGroups VoiceOver (the
ProfileGroups component no longer exists -- the residual VoiceOver
question now attaches to ProfileProducts and the D152 sheet).

## Working rhythm

Process changes ratified and exercised this session: one doc for a
three-slice arc; build+commit prompts shipped together for pure-UI
slices, gated by operator device verdicts between; docs at one page.
Result: five commits, four pushes, one session -- against one to two
commits in the prior rhythm. Honest costs: D150 took four carriers
because the device gate kept finding real defects (the gate working),
and D152 burned three cycles on harness friction (cd/classifier),
addressed by candidates 11-12. The operator's screenshots were the
highest-yield gate instrument of the session: three of the four real
defects were caught by the operator looking at the running app.
