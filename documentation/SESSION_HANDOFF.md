# SESSION_HANDOFF

Status: WRITE-LAST. Committed as this session's final act, 2026-08-12
(second session this date). HEAD at write time is 8634a516 (F1 comment
fix); this commit rides on top.

## Preamble -- argue against yourself first

Three refutations from this session. First: the architect opened
holding a project-knowledge handoff one full session stale -- it knew
one 2026-08-11 handoff where two exist (14ab7bb, 00e1e9b) and nothing
of the 13-commit range 2ecafb3..3ef28f6; Phase A caught the drift,
but not before one false sentence about that range reached origin
(c47c677, erratum eb26a0e same day). Second: a discovery prompt
presented D144 slice 3 as outstanding work; it had shipped at 906d05f
a day earlier -- the implementer's STOP was correct and the "it was
finished" hypothesis had never made the architect's list. Third: the
2026-08-10 "seven promotion candidates" cited by three successive
handoffs is a phantom -- 60a2977e's blob, read directly, carries six
rules and no seven-item list. Trust this file only through its Phase A
predictions.

## Entry point

FAB dead zone (rank 1 of the ranked backlog, device-observed, the
app's primary control). This session shipped five commits, all docs --
zero product code beyond a comment. Per handoff-specs 4.7 that ratio
is the finding: the verification apparatus spent the day repairing its
own records, correctly, and the next session should open on the
product. Rank 2 is now defined (see rulings); the backlog below it is
unchanged from the prior handoff.

## Start here (Phase A, read-only)

- origin/main at write time = 8634a516b03b07df671858e18b5440d475edd397
  (observed push line eb26a0e..8634a51, rev-list 0 0). This handoff
  commit rides on top, pushed as the final act. At next open expect
  origin/main = the handoff commit (subject predicted: "docs: session
  handoff -- records repaired, rank 2 defined, product next"), sync
  0 0. If HEAD is neither, work continued past this handoff --
  reconcile before proceeding.
- Worktree: clean except the standing two untracked
  (.claude/settings.local.json, .claude/skills/).
- Toolchain, re-measured this session at the F1 build gate: 161 tests
  / 3 suites (npm test, never bare npx jest); tsc 0 errors; lint
  exactly 1 error (template use-color-scheme.web.ts; lint's own exit
  is 1 when the baseline error is present -- unmasked forms below).
  Migrations: 19 well-formed names.
- DB (MCP read at session open, stale on arrival by design): coas 15,
  possession {0:13, 1:2}, retirements 16, session_entries 92,
  session_current 5, favorite=true 0. Unchanged from the 2026-08-11
  close -- no app writes between sessions. D144 constraint state
  re-observed: both history FKs RESTRICT, three analyte FKs CASCADE.
- If any of these don't match, the repo wins -- re-baseline before
  proceeding.

## What shipped (newest first; five commits, shas from pasted output)

8634a51 docs: gear-menu comment reads the two-branch confirm (audit F1)
eb26a0e docs: erratum -- two 2026-08-11 handoffs; rank 2 defined by ruling
daec9af docs: tense-truth -- D87 regression paragraph reads as history
c47c677 docs: handoff amendment -- phantom seven, 3099c28 attributed
d4fb6e3 docs: promote nine standing rules to CLAUDE.md (2026-08-10/12)

## The arcs

Promotion pass (the entry point, executed). Nine items promoted to
CLAUDE.md: rules 2-6 of the 2026-08-10 six (rule 1 already covered by
the carried-content bullet) plus all four 2026-08-12 candidates. The
owed [ADAPT] corrections were found already discharged at 3099c28 --
a discharge no handoff recorded; the amendment (c47c677) attributes
it. The "seven candidates" both prior handoffs cited do not exist in
the blob they cite; promoted set claimed accordingly.

Delete-path audit (read-only discovery). Commissioned to find whether
the D144 follow-up slice lost its backlog slot; found instead that it
shipped (906d05f) and the prompt's premise was stale. Yield: the
delete path at HEAD is sound (one delete site; FK-distinguished
blocked copy with conditional Retire steer; explicit Storage removal,
failure surfaced; the count-guard reads the soft-delete-filtered view
with the 23503 branch as designed backstop) -- plus findings F1
(stale gear-menu comment, fixed 8634a51), F2 (present-tense-false
regression paragraph, fixed daec9af), and the seven raw-error-copy
sites that now define rank 2.

Records repair (the erratum chain). c47c677's claim "recorded in
neither this handoff nor the 2026-08-11 one" was written against a
stale copy and is false of 00e1e9b; eb26a0e corrects it and pins the
true session map (13 commits, three sessions, two handoffs dated
2026-08-11). The root in both stale-premise errors: claiming about a
range never enumerated. Rule below.

## Refuted hypotheses / memory corrections

- Two 2026-08-11 handoffs exist (14ab7bb, 00e1e9b); the architect's
  copy knew only the first.
- "The D144 follow-up lost its slot" -- refuted; it shipped (906d05f).
- "The 2026-08-10 blob is pager-truncated" (stated at 60%) -- refuted
  by wc -l 136 and a whole tail; the phantom-seven finding replaced it.
- "The [ADAPT] corrections are owed" -- refuted; 3099c28 discharged
  them a session earlier, unrecorded.

## Operator rulings this session

Promotion scope 9-of-10 with rule 1 recorded as covered; corrections
folded (then found moot); screenshots identity check confirmed done
("checked", corroborated at 00e1e9b lines 11/102/121); erratum
ratified; rank 2 "raw error copy slice" redefined by ruling to the
seven audited sites (src/app/index.tsx:75,114,161;
src/components/coa-detail.tsx:456,494; src/lib/coa-retire.ts:83,107 --
audit's line numbers, slice's Phase A re-verifies); F1+F2 folded into
a truth pass; docs: prefix ruled by content, path-agnostic (first
docs: commit under src/ is 8634a51 -- noted for any future sweep that
greps docs: expecting documentation/ paths).

## Refutation ledger, this session

Architect errors, enumerated (count = list length): a corrections
commit queued on the stale "owed" premise (self-caught by the blob
read the prompt required); "promote 8 of the 10" for 9 (hand-count,
self-caught reconciling amendment against insertions); the amendment
section contradicting the ratified insertion on rule 6 (self-caught
pre-ship); VERIFY patterns beginning with '-' shipped without -e,
violating the rule in the file under edit (implementer caught); the
discovery prompt's stale CONTEXT premise (implementer STOP); the
false "neither handoff" sentence -- REACHED ORIGIN, erratum same day
(architect-caught after the STOP forced range enumeration); a ruled
bullet shipped as a placeholder, the carried-content rule promoted
that same morning (implementer STOP); baseline verification forms
masking exit codes behind tail pipes (implementer caught, standing
forms corrected). Eight. Implementer: 0 errors, 4 catch credits, plus
one unprompted staged-blob verification per the handbook's own rule.
Operator: 0. One error reached origin; its correction shipped within
the hour.

## Promotion candidates (next promotion pass)

1. Enumerate the range first, then claim: any assertion about "the
   handoff", "the session", or a commit span is preceded by
   git log --oneline over the span. Two surfaces today, one reached
   origin -- meets the corrected-twice bar.
2. Unmasked baseline forms: `npx expo lint > <file> 2>&1; echo $?`
   then grep the file for the expected template path;
   `npm test > <file> 2>&1; echo $?` then tail -6 (suite count is
   discriminating). Pipeline-through-tail reports tail's exit and
   truncates the evidence.

## Banked follow-ups (ranked backlog, then unranked)

Ranked, carried from 3ef28f6 with rank 2 now defined: 1 FAB dead
zone; 2 raw error copy slice (defined above); 3 D137 completion
(typeset); 4 accessibility labels; 5 splash dark sub-key; 6 dead
chrome chore; 7 Reduce Motion Scope B; 8 expandable History (delta
doc + D-number first).

Unranked: unchanged from 3ef28f6 (BottomTabInset last consumer;
bloom comment; session-ladder D83 scope note; same-name
disambiguation; Stash system-font states; last-card breathing room;
orphaned PDFs before public release; app rename collision check).
One addition: migration 20260715185455's D53 cascade comment is
superseded by 20260811113039 -- historical record, expected, noted
so nobody reads migrations for current schema truth.

## Unexercised arms (carried honestly)

Unchanged from 3ef28f6 (error/retry state; loading look; A-Z
null-strain ordering ties; narrowest card; survey wrap divergence;
VoiceOver selected-state; dark-only launch gate at next EAS rebuild).
Nothing this session touched runtime behavior.

## Working rhythm

Stable method lives in CLAUDE.md. Two deltas proven this session:
span-hash verification (architect hashes ratified insertion spans,
operator extracts by diff-derived ranges with boundary lines printed
so a range slip shows as wrong text) as the partial-edit form of the
blob-hash rule; and the read-only discovery prompt as the cheap way
to be wrong -- both stale-premise errors today cost nothing because
the prompts that carried them could change nothing.
