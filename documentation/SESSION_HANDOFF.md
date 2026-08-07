# Session handoff -- 2026-08-06

The repo is authoritative over this document. This session's ledger,
and it has a shape worth naming: eight architect refutations, six
of them one error in two forms -- a claim restated in prose after
the correct value already existed, and a prompt asserting a
handover that had not happened. The blob-hash, observation, and STOP channels caught
every one. A rule promoting the fix is
the first open item. Begin with a read-only Phase A audit.

## Start here (Phase A, read-only)

- HEAD's parent is bfc6ae4 (data: ACT Laboratories and CTND COA
  fixtures). Predicted subject of the handoff commit itself:
  "docs: session handoff 2026-08-06 -- v6 vocabulary shipped, two
  parsers designed". Sync 0 0 after the operator's push. If HEAD is
  neither, work continued past this handoff -- reconcile first.
- git status --porcelain: exactly seven ?? reference/handoff/
  0N-screens.png lines (N=1..7), the standing noise.
- Migrations: 17 on disk by name-form count, unchanged. No
  migration this session; D126 needed none because D119 made the
  tags column text[] rather than an enum.
- Fixtures: 7 PDFs in supabase/functions/_shared/coa/__fixtures__/,
  up from 5.
- NOT RUN THIS SESSION, carried unverified from 2026-08-05: npm
  test -> 77 passed; npx expo lint -> 1 error 0 warnings, template
  file only, exit 1; npx tsc --noEmit -> 0 in the operator's
  worktree only. The v6 slice ran tsc and lint (both matched) but
  no session this day ran the suite. Treat 77 as a carried number,
  not an observation, and re-baseline it at the start of slice (b).
- tsc does not cover the parsers at all. tsconfig.json excludes
  supabase/functions/** outright. Parser types are checked by
  ts-jest inside npm test. A tsc pass is not evidence about parser
  code. Carried, still true, still load-bearing for the arc ahead.
- DB via MCP, observed at write time: coas 12, session_entries 67
  raw / 16 current, entries stamped lexicon_version 6 three, entries
  with a non-null effects array 7, entries with an empty effects
  array 0, distinct source_lab values kaycha / drs-confident /
  green-analytics, COAs from act or ctnd 0.
- The installed dev-client binary is the 2026-08-03 EAS build from
  dbfe1cc. It ran this session's device gate unchanged, over Metro
  reload only. No new build is owed; nothing this session added a
  native module.
If any of these do not match, the repo wins -- re-baseline.

## What shipped (newest first, five commits, plus this handoff)

- 8fe4c21 docs: ACT Laboratories and CTND parser design (D127-D130)
- bfc6ae4 data: ACT Laboratories and CTND COA fixtures
- 9eb03c3 feat: streamlined effects vocabulary v6 (D126)
- ca193d7 docs: streamlined effects vocabulary v6 (D126)
- d952ab6 docs: promote deploy step, sha, bytes-before-prompt,
  blob-hash rules

## The arcs

**Four process rules moved out of memory and into the handbook.**
The deploy step for Edge Function commits, full-length shas in
prompt preconditions, bytes-before-prompt applies to the artifact
rather than the prompt text, and the blob-hash ratification check.
All four were earned by the previous session's ledger; the fourth
had been over the bar for two sessions. The deploy command in the
Ingestion bullet is inferred from the function's path and has never
been executed by the architect's observation -- it stays an
inference until a parser arc runs it.

**The effects vocabulary was replaced end to end in one session,
and the schema did not move.** The operator asked for a streamlined
list; D126 replaced the v5 twenty-tag vocabulary with fourteen tags
in recased groups and bumped LEXICON_VERSION to 6. The whole change
was a client constant plus a version bump, which is D119's
text[]-not-enum choice paying off exactly as designed. History is
untouched: rows stamped 5 keep their v5 strings, append-only, and
the device gate confirmed the boundary in the data -- three new
rows at version 6 carrying byte-exact new strings on the closing
entry and null, not an empty array, on the session where tags were
skipped.

**D126 also revoked a standing constraint, on the record.** D119
had ruled the vocabulary feeling-words-only, naming "anxiety"
specifically as excluded. The operator overturned it: users are
self-assessing rather than taking medical advice, they record what
they experience in common vernacular, and excluding the most common
terms would be counterproductive. The revocation and its grounds
are written into the design doc rather than left as a silent
contradiction of the earlier ruling. The personal-empirical
invariant is untouched -- a logged outcome word is the user's own
report, and predictive copy still never claims a chemotype causes
anything.

**Three new jars failed to import, and the diagnosis inverted the
operator's hypothesis.** The report was that scanning had become
unreliable. It had not: on both provider-hosted jars the QR walk,
detection, download, and hash all worked, "A lab report is on this
page" fired, and the PDF reached the parse layer. Both died in the
empty-parse guard for the same reason as the Aeterna jar before
them -- no parser for the lab. The two labs are ACT Laboratories
(NY) and Certified Testing and Data (CTND), the fourth and fifth in
the corpus. The third jar, hosted on Google Drive, imported fine
through the existing file-picker fallback of last resort, and its
COA turned out to be Kaycha, a lab already read. Acquisition is not
the frontier; parser coverage is, and it advances one lab per
lived-demand request.

**The design doc was written from the repo's own extractor, not
from a lookalike.** The architect's observations on the two new
PDFs came from pdftotext, which is not what the Edge Function uses.
Rather than design patterns from it, the arc spent one round trip
on a read-only observation run: the implementer ran the repo's
extractor over both committed fixtures and pasted the header block,
a table region, and cross-fixture substring counts. That paste
refuted one architect claim outright and grounded every observed
number in the doc. Claims that could not be grounded are marked
predicted and carry gate cases rather than being quietly promoted.

**The find that justified the whole detour is in D129.** Eight of
the seventeen terpene names ACT prints do not resolve through the
shared canonical-name path, because ACT prints ASCII single-letter
prefixes (b-Caryophyllene, a-Humulene) where every other lab in the
corpus prints Greek or the full word, and terpeneKey folds Greek
only. CTND, by contrast, resolves eleven of eleven. Unaddressed,
an ACT jar's Caryophyllene would sit in the data under a second
name and never merge with the same compound on a Kaycha or CTND
jar -- cross-COA comparison fragmenting silently with no error
surface anywhere. That is the one failure class the product cannot
absorb, and it is now a slice of its own, before either parser.

## Refuted hypotheses / corrections

Architect's, in order:
1. Carried context claimed the entry point was an EAS build-status
   check and a doc-staleness pass for the QR arc. The repo refuted
   it: slice (c) had landed and an entire GA parser arc had shipped
   after it. Carried context is always potentially stale; the Phase
   A audit is what catches it.
2. Wrote "five merged, seven dropped" into ratified doc text after
   the comparison script had already produced the correct
   partition. Self-caught by running the script again.
3. Wrote "four of them gaining spaces around a slash" into the same
   paragraph. Two survivors carry a slash. The implementer STOPped
   rather than landing a false mechanical claim in a design doc.
   The corrected sentence now carries its own presence gate.
4. Described the EFFECTS array as ending at line 81 in one clause
   and named the content-anchored endpoint in another; the array
   closes at 82. Also described a seven-line insertion block as
   eight lines. Both resolved correctly by the implementer against
   the criteria and the blob hash.
5. Raised the "< LOQ" storage question as an open DECIDE twice.
   It is not open: parsePct already maps ND, NR, NT, N/A and any
   less-than capture to null, and the Analyte type's own comment
   says so. A settled invariant presented as an open ruling, twice,
   because the architect worked from memory of the code instead of
   the code.
6. Predicted CTND's "Certified" would arrive mangled by ligature
   loss and used that as the ground for choosing the CTND anchor.
   It arrives intact. What mangled was "Testing", once, in
   "Regulatory Compliance Tesng". The anchor choice survives on
   other grounds; the ground given for it was wrong.
7. Shipped this handoff's own commit prompt with the ratified text
   named but not carried -- "supplied below this prompt block" was
   prose describing a handover that did not happen, because the
   bytes went out as a download link instead. The implementer
   STOPped rather than composing 285 lines itself, which
   handoff-specs 2 forbids and which would have made the blob hash
   a check agreeing with its own guess.
8. Re-issued that prompt with the bytes moved to a file and a hash
   gate on both ends -- the right fix -- and then wrote "The
   operator has saved the ratified handoff to /d/Projects/
   handoff-new.md" in the observed voice about something not
   observed. The file was not there. The mechanism changed; the
   unverified-handover assumption did not. Caught by the
   precondition the same prompt had correctly made checkable.

Six of these eight are one error in two forms: a claim restated in
prose after the correct value already existed, and a prompt
asserting a handover that had not happened. The rule the first open
item promotes covers both forms, and the second form is worth
stating in its own words because it survived one correct fix to the
first: moving bytes into a hash-gated file did not stop the
sentence introducing them from being written as fact.

Implementer's catches, all unprompted and all correct:
- The survivors-gaining-spaces miscount, with the partition
  derived from the file's own v5 list rather than from the prompt.
- The filename for the new design doc, which the architect's
  ratified paste never specified. It chose the sibling's form and
  flagged that a rename was free until staged.
- That slice (b)'s "call the real key function first" requirement
  needs to be a numbered runnable block in the prompt, not prose in
  the doc. Adopted.
- That the "< LOQ" and ND frequency counts are predicted and gate
  nothing, and should be promoted to observed inside the slice
  (c)/(d) observation rather than by a separate run. Adopted.
- That its own extra grep used a pipeline whose reported exit codes
  belonged to tr rather than grep, so the file lists were the
  evidence and the exit codes were not. Reported against itself.

## Ratified decisions

- D126 the v6 streamlined vocabulary, fourteen tags, groups recased
  to Head Space / Body Feel / Off-Key. The D119 feeling-words-only
  constraint is revoked by operator ruling with grounds recorded.
  Groups remain presentation only; storage stays one flat
  valence-free text[].
- LEXICON_VERSION moves 5 -> 6 in the UI slice that ships the
  picker, on D121's grounds: the stamp records the vocabulary the
  user was shown.
- D127 act and ctnd become separate SourceLab members. Both
  documents are label-adjacent, so D123's positional machinery is
  not copied in.
- D128 identification anchors are the literals ACT Laboratories and
  CTND, chosen on observed cross-fixture counts and gated with a
  cross-fixture negative case.
- D129 ACT's ASCII-prefixed analyte names get explicit canon
  entries; the shared key function is not extended. Localized and
  visible over global and blind.
- D130 all capture binds to the detail tables, never the rounded
  cover panel. Repeated total labels and the two-token absence
  marker are named hazards.
- The error-copy fix rides along with slice (c) rather than
  becoming its own arc: it is one string, and slice (c) is the
  commit that makes the current message wrong for ACT jars.

## Open items

**Runnable now: promote one rule to CLAUDE.md.** Claims in prompt
prose are pasted from executed output, never retyped, and ratified
content a prompt depends on travels inside the prompt rather than
being named as arriving separately; a number or a body of text in
prose that cannot be traced to something the prompt itself carries
is a guess. Six instances this session, listed above as
refutations 2 through 4 and 7 through 8. It belongs in Prompt
conventions, beside the full-length-sha rule it generalizes. Tier
1, one prompt.

**The parser arc, slices (b) through (d)**, per the slice plan in
act-ctnd-parsers.md. Slice (b) is the canon entries and must open
with a numbered block that calls the real terpeneKey and pastes its
output before any entry is added -- the key forms in the doc are
predicted from a scratch reimplementation. Slices (c) and (d) are
the two parsers. All three are pure logic; the gate is the suite
passing, pasted raw, plus the cross-fixture identification negative
case. Re-baseline npm test at the start of slice (b), since 77 is
carried rather than observed.

**Blocked:** nothing.

**Banked (new this session, ahead of the carried list):** the
unsupported-lab error copy, which reads as file-picker advice to a
user holding a jar -- now assigned to slice (c) rather than left
loose. A WebView download amendment for Drive-hosted COAs, which
the file-picker fallback already covers at the cost of extra taps,
so it is convenience rather than capability. Whether a parse-failed
PDF should be retained as a pending-support shelf item so a future
parser makes it readable without a re-scan -- this touches D87's
no-orphans ground and needs its own DECIDE. A second COA from ACT
and from CTND, since every rule in the new design doc is
generalized from exactly one document per lab.
Carried, unchanged: the second Green Analytics fixture, for the
same reason; Rainbow Runtz upper-case strain; the Gelato row's four
title-cased analyte names; canonicalize-at-read as a real design
question; stale hasher comment in add-to-shelf-modal.tsx;
fresh-checkout tsc dependency on generated typings; DRS Testing
walk detail; support-copy reword window; the seven reference
screenshots (one shows the email); "Expo Starter" web tab chrome;
empty-shelf double statement; authenticated TRUNCATE; off-shelf
log; preference_summary view; never_again; retirement last-log
step; third retirement reason; Android; app-code test wiring;
un-retire; 5-point scale resolution; user-authored custom tags;
EXPLAINERS.closing line 3; the 220ms bloom window;
Alert-under-external-dismissal; anon-grants durable ACL;
commit-body/doc phrase collisions; the download-event prong,
unexercised because no known provider produces it.

## Working rhythm

Unchanged from CLAUDE.md and handoff-specs 4. The three-deep commit
check ran on every commit this session and matched every time,
including on two binary fixtures where it proved no text filter had
touched them. The blob-hash channel did something new on the design
doc: the architect reconstructed the ratified text independently and
the hash matched the implementer's placement byte for byte, which
is a stronger result than checking a file against itself. The
observation-run pattern is new this session and should be reused --
when the architect cannot run the tool the code runs, the honest
move is one read-only round trip rather than a doc full of
lookalike evidence.

## Entry point

The CLAUDE.md promotion pass (Runnable above). One rule, earned
four times over in this session's ledger, Tier 1, one prompt.
Doing it first means the parser arc starts with the numeric-prose
rule written down rather than remembered, and that arc is where it
matters most.

The product finding handoff-specs 4.7 asks for: this session
shipped one feat commit, one data commit, and three docs commits,
and the product moved in the way that matters -- the vocabulary the
operator types into every session is now the one he asked for, and
it is stamped so the old sessions stay readable. The parser work
did not ship code, deliberately: the arc bought grounded evidence
instead, and the D129 find is what that bought. After the promotion
pass, the next arc is the parser slices, and the strongest
candidate for the arc after that is a second COA from any lab
already parsed, because every rule flagged as generalized from one
document stays that way until a second document exists.
