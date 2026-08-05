# Session handoff -- 2026-08-05

The repo is authoritative over this document. This session's own
ledger: the architect generalized "these providers simply don't
gate" from three jars and was refuted by an age gate on device the
same afternoon; named the live labs as "Kaycha and Moby" from the
parser fixtures when no scanned jar was Moby's; and shipped a
presence gate opening with a bare dash that aborted exit 2 in
pre-execution -- the promoted -e rule, violated by its promoter.
Begin with a read-only Phase A audit.

## Start here (Phase A, read-only)

- HEAD's parent is ec29eb5 (docs: qr-import slice (c) gate
  observations). Predicted subject of the handoff commit itself:
  "docs: session handoff 2026-08-05 -- QR arc shipped end to end,
  GA parser next". Sync 0 0 after the operator's push. If HEAD is
  neither, work continued past this handoff -- reconcile first.
- git status --porcelain: exactly seven ?? reference/handoff/
  0N-screens.png lines (N=1..7), the standing noise.
- Migrations: 17 on disk by name-form count, 17 in the ledger.
- npm test -> 52 passed. npx expo lint -> 1 error 0 warnings,
  template file only.
- npx tsc --noEmit -> 0 IN THE OPERATOR'S WORKTREE ONLY. On any
  fresh checkout it is 1 error, exit 2 (TS2882, @/global.css):
  tsconfig includes expo-env.d.ts and .expo/types/**, both
  gitignored, zero .d.ts tracked, so the pass depends on
  Expo-generated typings. Architect-observed on a clean clone,
  TS 6.0.3 lockfile-pinned; the worktree 0 was implementer-observed
  2026-08-05. Banked fix; do not chase it as a regression.
- DB via MCP, observed at write time: coas 9, session_entries 59
  raw / 12 current, tombstoned chains 14, retirements 7, storage
  objects 6, anon grants in public 0.
- The installed dev-client binary is the 2026-08-03 EAS build from
  dbfe1cc and carries expo-camera; its boot gate and the slice (c)
  device gate both passed 2026-08-05. No new build is owed.
If any of these do not match, the repo wins -- re-baseline.

## What shipped (newest first, four commits -- rev-list verified,
plus this handoff)

- ec29eb5 docs: qr-import slice (c) gate observations and corrections
- 7b1985d feat: QR import slice (c) -- scan, browse, three-prong detect
- f9074f9 docs: qr-import provider validation walks and D117 third prong
- cd1553e docs: doc-staleness sweep -- four stale status claims amended

## The arcs

**QR import shipped end to end in one session: walks, D117
amendment, slice (c), device gate, corrections.** The operator
walked real jars; the finals exposed that the primary provider's
URLs are suffix-less per-visit signed blobs, so the operator
ratified a third detection prong (one HEAD request per settled
navigation, content-type raises the affordance, fails to the manual
control). Slice (c) is one new component (scan stage on expo-camera,
browse stage on WebView, three prongs with a stale-probe guard) plus
a surgical modal extension: the post-URI pipeline was factored into
ingestFromUri and shared verbatim by picker and QR paths;
importFromUrl downloads to a fresh cache-local file (unique name per
import -- blob basenames repeat) and drops the remote URL. Nothing
downstream of the URI changed. Gate: three real jars imported with
full retention read-back; the HEAD prong's prediction observed true
on device over an inline suffix-less blob COA; suffix prong observed
on the durable Green Analytics link; download-event prong
unexercised; fail-closed observed twice (forced HTML import
surfaced the 400 and wrote nothing; unsupported lab landed in the
empty-parse guard). qr-import.md carries walks, amendment, and gate
observations as three dated layers -- read all three; the later
layers correct the earlier.

**The architect's channel widened, and the working rhythm used it.**
The architect now clones origin directly, runs the test suite and
tsc, hashes blobs, and reads the DB over MCP. Every doc edit this
session was applied on an architect-side scratch branch and every
grep gate EXECUTED against the real post-edit text before its
prompt shipped; ratified bytes were verified into commits by blob
hash (three commits, three matches), not by eye. Phase A ran
architect-side in minutes. The operator's worktree, device, and
credentialed surfaces remain operator-only.

**Provider landscape, observed not assumed.** Kaycha jars: QR ->
Metrc verifID landing (app.1a4.com, per-package) -> one tap ->
suffix-less signed blob, no age gate cookied or fresh, fetchable
cookie-less, token per visit (~24h). DRS Testing arrived through
the same path unwalked and parsed. Aeterna packages carry TWO QRs:
Metrc lot-label QR -> verifID page that (for that package) renders
lab data as HTML with no PDF; brand QR -> age gate -> index ->
durable .pdf link. Green Analytics is the lab behind the Aeterna
site.

## Refuted hypotheses / corrections

Architect's:
1. "These providers simply don't gate" -- refuted on device;
   Aeterna's age gate appeared in the fresh browser. The walks
   appendix's possibly-cookied flag (the operator's own catch) was
   correct all along. Recorded in ec29eb5.
2. Live labs named as "Kaycha and Moby" from fixtures; the shelf's
   jars were Kaycha x3, Green Analytics, then DRS -- Moby on none.
   Fixtures describe the parser corpus, not the shelf.
3. A presence gate pattern opened with a bare dash and aborted
   exit 2 -- caught by architect-side pre-execution before the
   prompt shipped, which is the pre-execution rule earning its keep.
4. The walks appendix recorded the Gelato QR as landing on the
   brand site; the operator's later scan of the SAME PACKAGE hit
   Metrc verifID -- reconciled by the two-QR photo observation,
   corrected in ec29eb5.
Implementer's catch: a 13-vs-14 deletion count explained by a
byte-identical first line rendering as context (cd1553e review).
Also: the implementer flagged, unprompted, that the slice (c)
commit body's device-gate paragraph was the architect's
observation, not its own -- the worktree-only rule applied in the
correct direction, twice this session.
Operator process note: one gate came back as an aggregate ("all
worked"); the per-step record was reconstructed from screenshots
plus MCP read-back and the D117 prediction got its clean
observation on a re-scan. Aggregate verdicts still are not
evidence; the screenshots were.

## Ratified decisions

- D117 third automatic prong (HEAD request, content-type), grounds
  in qr-import.md's 2026-08-05 amendment. CONFIRMED at the gate.
- Scan entry lives inside the Add flow (idle arm, second button),
  not the shelf header. Strings ratified verbatim: "Scan package
  QR", "Import this COA", "Import this page". Five supporting
  strings shipped and were seen at the gate without rewording --
  approved by exercise; the operator may still reword (Tier 1).
- Bytes-before-prompt: architect-side scratch application plus
  gate pre-execution is now the standing prep for every doc pass.

## Open items

**Runnable now: the Green Analytics parser.** First parser request
driven by lived usage -- a real jar on the shelf is unreadable. The
durable fixture URL shape is recorded in qr-import.md; the operator
downloads the Gelato 33 PDF and supplies it as a fixture (data:
commit; the architect's fetches are robots-blocked on that host).
Then the standing parser pattern: design-doc-first if the format
diverges structurally, pure-logic slice, Jest-gated, fixture-driven,
ND -> null throughout. Nothing about it touches the client.

**Blocked:** nothing operator-side. The download-event prong is
unexercised (banked, not blocked): no known provider produces it.

**Banked (new this session, ahead of the carried list):** stale
hasher comment in add-to-shelf-modal.tsx ("committed but not
deployed" -- the deployed function IS hashing, MCP-observed;
comment sweep); fresh-checkout tsc dependency on generated typings
(tracked .d.ts or a documented caveat); DRS Testing walk detail
(record on the next DRS jar); support-copy reword window.
Carried: the seven reference screenshots (one shows the email);
"Expo Starter" web tab chrome; empty-shelf double statement;
authenticated TRUNCATE; off-shelf log; preference_summary view;
never_again; retirement last-log step; third retirement reason;
Android; app-code test wiring; un-retire; 5-point scale resolution;
user-authored custom tags; EXPLAINERS.closing line 3; the 220ms
bloom window; Alert-under-external-dismissal; anon-grants durable
ACL; commit-body/doc phrase collisions; CLAUDE.md promotion pass
(now also: bytes-before-prompt and the blob-hash ratification
check, both over the bar after this session).

## Working rhythm

Unchanged from CLAUDE.md and handoff-specs 4, with the channel
change above. One live observation: the two-channel commit check
now runs three-deep (implementer report, operator cat -A, architect
blob hash against ratified bytes) and caught nothing this session
-- which is the point; it is cheap and it makes transport
corruption a non-event.

## Entry point

The Green Analytics parser arc (Runnable above). It begins with the
operator supplying the Gelato 33 PDF as a fixture and a read-only
Phase A over the existing parser layout at
supabase/functions/_shared/coa/ -- the architect has not yet read
that directory end to end this session and owes that read before
any design claim. The product finding handoff-specs 4.7 asks for:
this session shipped one feat commit and three docs commits, and
the feat commit is the largest product-behavior change since the
survey cut -- the ratio is healthy, and the next arc is product
again.
