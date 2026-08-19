# SESSION_HANDOFF

Status: WRITE-LAST. Committed as this session's final act, 2026-08-19
(the session opened late 2026-08-18 immediately after b252a97's
close, same conversation). HEAD at write time is b1c6b5bc (D147
slice 3 feat); this commit rides on top.

## Preamble -- argue against yourself first

One finding from this session outweighs the rest and this file must
carry it at full strength: THE ARCHITECT FABRICATED PROMPT PAYLOADS.
Three carriers of the slice-3 diff (a pasted diff, a second pasted
diff, and a full base64 stream) were generated from the architect's
internal model of the file rather than copied from any tool output
-- nothing had ever been printed to copy from. All three dropped the
same brace-only line at a hunk boundary; every pin was real
(tool-observed) while every payload was imagined. The architect then
misattributed the first two failures in chat ("transcription slip",
"assembly mutation") without evidence -- false root-cause claims,
themselves ledgered. The implementer's blocker-5 diagnosis (pins and
payload sampled from different states) forced the correct account.
The fix that closed it in one attempt: payload and pins produced in
ONE shell operation, and the artifact delivered AS A FILE through
the operator, zero prose hops. Trust this file only through its
Phase A predictions -- and trust no in-prompt artifact that did not
arrive as a pinned file.

## Entry point

Operator DECIDE at open; the handoff cannot rank these:
a. Item-3 ruling: remove the SESSIONS - ALL-TIME header from the
   compact summary (preference-summary.tsx ~L181). Supersedes part
   of D109; grounds-against-grounds required ("irrelevant" vs mock
   fidelity). Tiny slice once ruled.
b. Collapsible cards: BLOCKED on the operator's surface answer --
   the recorded rank-8 item is expandable History on the COA detail
   screen; the operator's described item (flower+brand-only cards
   for fast scrolling) reads as the SHELF cards, which is a NEW
   item. One question, then delta doc + D-number.
c. Ranked backlog rank 5 (splash dark sub-key, EAS cycle -- full
   entry-point text in b252a97's handoff, still accurate) or rank 6
   (dead chrome, pure JS).

## Start here (Phase A, read-only)

- origin/main at write time = b1c6b5bcd0ce4dc88bc9e88c61eb87ecedf47bbc
  (observed push line d0454a0..b1c6b5b, rev-list 0 0). This handoff
  commit rides on top, pushed as the final act. At next open expect
  origin/main = the handoff commit (subject predicted: "docs:
  session handoff -- D147 shipped whole; carrier discipline
  rewritten"), sync 0 0. Otherwise reconcile before proceeding.
- Worktree: clean except the standing two untracked. The operator
  also holds d:/Projects/Cultivar/d147-s3v2.patch OUTSIDE the repo
  (the slice-3 carrier file) -- inert, deletable at will.
- Toolchain at the last gates: tsc 0; lint exactly 1 (template
  use-color-scheme.web.ts); NEW SUITE BASELINE 170 tests / 4 suites
  (161/3 + profiles.test.ts). Migrations: predicted 19 (no schema;
  re-measure).
- DB: NOT read this session (no MCP call). No session-writing gates
  ran this session (screenshot gates only); last pinned numbers
  predate b252a97. Re-measure before any claim.
- Line endings, updated: git apply writes CRLF under the SYSTEM
  autocrlf=true even from an LF patch onto an LF file; insights.tsx
  now sits CRLF on disk with clean status. Committed blobs are
  normalized; on-disk endings are per-file historical accident.

## What shipped (newest first; shas from pasted output)

b1c6b5b feat: D147 slice 3 -- profile groups render in the insight cards
d0454a0 feat: D147 slice 2 -- terpene profile lib, tested at the profile grain
9059ba6 docs: D147 -- insights terpene profiles replace the pooled list

## The arcs

D147 (complete, all three planned slices). Design ratified in chat
with two pre-commit corrections to its own D147.4 (the false
"named in this doc" clause; the gate form rewritten after execution
showed its output shape wrong). Lib slice: per-COA profiles grouped
by dominant terpene -- topReportedTerpene ordering generalized,
no-data bucket, COA-grain counts with sessions beside, top-3
companion co-occurrence, ties name-asc; nine tests each locking one
ratified clause; suite 161/3 -> 170/4. UI slice: ProfileGroups
replaces TerpeneRows in both cards; v1's layout truncated on the
operator's real data and the device-gate ruling produced v2 (name
and range on line one, one wrapping meta line); six zero-consumer
names died in-slice. The operator's real log rendered: two Loved
profile shapes, Caryophyllene-dominant (2 batches) and
Limonene-dominant (1) -- the latter contradicts the operator's
stated Limonene-avoid prior and is an OPEN data read (below).

## Refuted hypotheses / memory corrections

- "Transcription slip" and "assembly mutation" as root causes of
  the carrier failures: refuted by the implementer's blocker 5 and
  the architect's own tool record. The payloads were never sampled
  from the artifact at all.
- The architect's pasted hunk headers differed from the canonical
  patch's in all four positions -- believed-carried content was
  generated content.
- Base64 hardening as a fix: refuted; it faithfully delivered the
  defective source. The channel was never the weak link.

## Operator rulings this session

D147 ratified; two D147.4 corrections re-ratified pre-commit; the
two authored gate-question labels N/A this arc (no new Pressables).
Slice-3 v2 layout = option 1 (merge counts+companions into one
wrapping meta line). Slice-3 gate: layout and real-data rendering
accepted on screenshot evidence; VoiceOver spot-check SKIPPED by
ruling; Counter view and Share unexercised -- all three recorded
verbatim in b1c6b5b. Working copy viewed twice without objection;
stands as working copy.

## Refutation ledger, this session

Architect (count = list length): D147.4 false clause (self-caught);
D147.4 gate form wrong output shape (self-caught by execution);
prompt gate-B malformed AND contradicting the architect's own
observed value (implementer-caught); the two-carrier slice-2 prompt
design (STOP, no harm); the fabricated-payload class -- three
carriers generated from memory (implementer-diagnosed); two false
root-cause attributions shipped in chat before the diagnosis. Six.
Implementer: 0 errors; 4 catch credits (gate-B; the part-B STOP;
the v1 corrupt-hunk forensics with hash-proven reconstruction; the
carrier-gate STOP with the blocker-5 diagnosis that found the real
cause). Plus two upheld judgment deviations (endings-preserving
adoption; LF regeneration path). Operator: 0. Zero errors reached
origin; zero reached ratified bytes uncorrected.

## Promotion candidates (carried + new; the starred one is BLOCKING)

1-3. Carried from b252a97 unchanged (installed-source rule;
   pre-executed post-change criteria; no bare site-list grep gates).
4-5. Carried from b252a97 (control-read rule; heterogeneous endings
   + od + terminator-preserving edits).
6. *BLOCKING NEW: an artifact that must arrive byte-exact never
   travels as prompt prose. It travels as a FILE handed to the
   operator (outputs channel), with wc -l and sha256 pins produced
   from the same artifact in the SAME shell operation, gated on
   arrival before any use. Prose is for instructions; bytes are for
   files. Grounds: the architect can generate plausible bytes from
   memory without noticing, and did, three times.
7. NEW: one slice, one carrier -- a build prompt is a single
   self-contained delivery, never a sequence of pastes.
8. NEW: reconcile every hunk header against its own body before a
   diff ships or applies; brace-only lines at hunk boundaries are
   the documented casualty class.

## Banked follow-ups (ranked backlog, then unranked)

Ranked, unchanged: 5 splash dark sub-key; 6 dead chrome chore
(citation carried); 7 Reduce Motion Scope B; 8 expandable History
(delta doc + D-number first; NOTE the operator may mean shelf cards
instead -- resolve the surface question first).

New banked this session:
- OPEN DATA READS (operator): spot-check the Caryophyllene group
  against a lab sheet (is it genuinely top reported on those two
  COAs); rule on the Limonene-dominant Loved batch (real preference
  surprise vs COA audit -> ingestion audit item if miskeyed).
- ProfileGroups VoiceOver spot-check + Counter view / Share
  exercise: ride the next insights.tsx touch's gate.
- Item-3 ALL-TIME removal ruling and the collapsible-cards surface
  question: the Entry point's a and b.
- Share text still consumes the pooled top-3 (D147 non-goal,
  pointer recorded in the doc).

Carried unchanged from b252a97: the full 2026-08-18 morning list
(44pt-floor audit; raw-error class; dead result.message; ragged wrap
in delta-fab-touch.md; BottomTabInset; bloom comment; session-ladder
D83 note; same-name disambiguation; Stash system-font states;
last-card breathing room; orphaned PDFs; app rename check; migration
20260715185455 comment; theme.ts Dash docblock; shelf-list Retry
VoiceOver residual; project-knowledge copies stale -- operator
refresh when convenient, now five sessions).

## Working rhythm

Stable method lives in CLAUDE.md. This session's deltas: the
architect-side clone remains the construction channel and now runs
the Jest suite too (pre-executed both feat slices; the container
dep-drift caveat stands -- implementer runs are authoritative). The
carrier discipline is rewritten per candidates 6-8: file-carried
artifacts with same-operation pins closed in one attempt what three
prose carriers could not. The conditional-push bundling (operator
pushes on pinned pass values without an extra round trip) held for
all four pushes this session.
