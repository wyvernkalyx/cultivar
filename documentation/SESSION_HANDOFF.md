# Session Handoff -- 2026-08-27

Read after CLAUDE.md and handoff-specs.md, end to end. HEAD at close:
the commit carrying this file, riding on 9cbbe178 (feat: smithers
parser). If origin/main is neither, work continued past this handoff
-- reconcile from the repo before proceeding.

## What this session shipped (all pushed)

93be543d docs: stopwatch box closed -- Phase 0 COMPLETE (operator
ruling; 44 chains/71 entries observed as the "repeatedly" evidence).
dae5a521 docs: age-gate design (D154-D157). 083ba974 feat:
user_attestations migration -- applied and MCP-gated same night
(paired probe: ins=1 vis=1 upd=0 del=0, both named checks fire,
non-owner RLS-42501, rollback verified). 305740b9 docs: D158 age-only
amendment, operator-caught against live 1.4.3 text. 3b02ffda docs:
restock design (D159-D160, copy frozen). 56870a81 docs: smithers
parser design (D161). 4795922c data: + 9cbbe178 feat: smithers parser
-- 13/13 Deno, 179/5 Jest, device-gated on a LIVE import (QR scanned
off the monitor; production row b163a487: strain verbatim title, 37
terpene rows, 9 non-null, dominant Limonene, <LOQ stayed null).

## Entry point: the Keystone package (evidence-complete, unpackaged)

parseKeystone.ts exists as an operator-held carrier (below), developed
and greened architect-side against NINE real documents: flower,
prerolls, blunts, infused to 47.83% THC, one all-ND terpene panel.
Zero failures. Session opens with ratification of four design calls,
then the Smithers package cycle verbatim (doc -> carriers -> data: +
feat: -> device gate -> push):
 1. CAS-table disambiguation: terpene rows fuse value with CAS
    ("0.2199123-35-3" has two valid regex splits); each analyte's CAS
    constant is the deterministic splitter and the panel doc.
 2. Positional terpene-total anchor: no label survives extraction;
    the icon-strip value is taken by template position (CBD mg/g
    before, moisture after). Survived its hardest case: All_Gas
    prints "0.000 %" -- a PRINTED zero, stored as 0 total with all
    analytes null. Fragilest thing in the parser; say so in the doc.
 3. Strain = printed product title verbatim (D161a inherited).
 4. Keystone's footnote governs date labels: their "Date Sampled" is
    collected-from-client (-> sampledDate); "Date Released" ->
    testedDate.
Executed pins for the tests (Acapulco Gold DP121815): thc 20.98, cbd
0.05767, terp 0.42, strain "Acapulco Gold 1/4 Oz Pouch", batch
DP121815, sampled 2025-04-28, tested 2025-05-06, 13 cannabinoids (7
detected), 20-panel terpenes (2 detected), dominant Myrcene 0.2199,
7 safety Pass. All_Gas AG081009PR: thc 24.25, terp total 0, terp_nn
0. Coconut Cream CM1218161GPRD: thc 47.83, terp 1.22, terp_nn 4.
Proposed fixtures: those three (flower / all-ND / infused). Carrier
pin: parseKeystone.ts sha256
6ba560f9a8b3cf2a2de8e2200859847da9df088ed702e0cfc0d8cb27b85b9423
(operator holds the file; delivered in the closing chat turn of
2026-08-27). Dispatch edits are
three additive one-liners re-derivable from the Smithers diff shape.

## Ruled queue after Keystone

1. Web-importer spike (operator demand, twice expressed, promoted):
   Expo-web serving ONLY the import flow. Design doc first; native-
   module unknowns are the spike's subject. 2. Restock (D159-D160):
   slice 1 carrier was NEVER PLACED -- the migration file
   20260825000001_coa_restocks_d159.sql (pin ba5625bf347dc45249807f
   ca1041041d448543cd624ac0b720620146c265d8a8, 76 lines) must be
   re-delivered from the ratified text in restock.md's commit thread
   or re-authored to the pin. Fuel Pump (f2503fc3) is STILL count 0
   and unloggable -- oldest open wound. 3. Age-gate UI slice (D154-
   D158; copy frozen in age-gate.md amendment).

## Findings ledger (delivered, actionable)

- ARCHITECT ERRORS, ledgered with refutations: (a) drafted a mixed
  data:/code commit; implementer refused citing the handbook rule +
  four unanimous precedents; two-commit split ratified the fix. (b)
  Two hand-recalled prose counts ("eight Smithers tests" -> 7; "four
  animal-face tests" -> 3) -- the no-hand-count rule applies to prose.
- Prompt-template fixes now standing: dirty control precedes the
  FIRST tr gate; carrier prompts state placement as a request whose
  verdict porcelain carries; bare directory counts dropped from
  placement evidence (hash is the gate); multi-file placements get
  one DO line per carrier with destination adjacent.
- Tooling banked (implementer suggestion): a `deno task test` in
  supabase/functions/deno.json pinning `deno test --allow-read
  ingest-coa/` -- a bare root run sweeps a Jest file
  (_shared/coa/__tests__/parseCoa.test.ts) into Deno type-checking,
  102 spurious errors.
- CLAUDE.md [ADAPT] item 1 stale by three independent observations:
  170/4 recorded, 179/5 observed. Fold into next handbook touch,
  with the two owed age-gate.md line items (D155 CHECK constraints
  not in the column list; line 22 "store requirement" phrase).
- OPERATOR TASK STILL OWED: Supabase dashboard -> Auth -> Emails:
  sender "cultivar" -> Kalyx. Reported, never confirmed done. The
  rename has non-repo config surfaces; a checklist is owed (dashboard
  now, App Store Connect at submission).
- Intel: NY moved post-4/1/2026 lab results to Metrc QR serving; the
  nanticoke.co page is an archive. The operator's new Fuel Pump
  package QR is the first Metrc specimen -- next scan tells us what
  Metrc serves. Caramel_Cream_Cherry_Diesel.pdf is a SCAN (zero text
  layer): first raster specimen; OCR ingestion banked as its own arc.
  Open question: pdf_sha256 of URL-fetched vs archive-downloaded
  bytes (answerable from row b163a487; not yet read).
- Deploy state: ingest-coa deployed WITH the Smithers arm, evidenced
  by effect (a parse only new code produces), not by pasted output.
  Keystone feat will need a re-deploy before its device gate.

## Predictions, falsifiable, for next session's Phase A

origin/main = this handoff's commit, parent 9cbbe178. Migrations by
name-form: 20. Jest 179/5; Deno scoped to ingest-coa/: 13/13. coas
rows: 16, newest b163a487 (Blue Raspberry). Fuel Pump f2503fc3
on_shelf_count still 0. Worktree: two .claude/ untracked lines only;
no restock migration present. D ceiling: D161. kalyxjournal.com still
serves the placeholder (browser check). The operator-held
parseKeystone.ts re-hashes to the pin printed at delivery.

## Capability notes

Architect container: clones the repo read-write locally (read-only to
origin), runs the full Deno parser pipeline (deno from GitHub
releases), CANNOT reach jsr.io (test suite runs are the implementer's)
nor nanticoke.co (documents travel by operator upload). Supabase MCP
reads privileged; last-statement-only; probes as DO blocks whose
raised exception carries observations and forces rollback.
