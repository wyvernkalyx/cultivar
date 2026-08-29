# Session Handoff

Written 2026-08-29, at the close of the 2026-08-28/29 session (crossed
midnight once). Repo is authoritative over every claim here; Phase A
verifies before any work begins.

## State at close

HEAD at close: the commit carrying this file, riding on 731a457a
(docs: D163 spike closed). Sync was 0 0 after every push; five pushes
this session, all ref-scoped, all two-channel where Tier 2.

Shipped end-to-end:
- D162 Keystone parser, full package cycle: docs 83ad8f43, data
  43d14037 (three fixtures), feat cdedfc42. Deployed (operator,
  API-upload path, Docker warning benign), device-gated on the phone
  (six per-step verdicts), MCP read-back exact including pdf_sha256
  byte-identity with the fixture pin. Both "not compatible" Nanticoke
  labs now parse. Suite: 20 Deno (scoped), 179/5 Jest, tsc clean.
- D163 web-importer spike, opened AND closed same day: doc cd7b9dd5,
  findings amendment 731a457a. Exit criterion MET (All Gas 7g Glass
  Jar imported from the PC through a desktop browser, row 42707425,
  read back exact). All five unknowns closed; see the doc's Findings.
  Spike branch spike/d163-web-importer at 9c520f8 is LOCAL-ONLY
  evidence on the operator's machine -- never merged, never pushed.
- SECURITY: the client env var held a SECRET (sb_secret) API key;
  the spike's web guard exposed it on first sign-in. Contained (never
  in repo history -- observed by full-history grep), remediated
  2026-08-29: publishable key swapped in, app proven under it with
  zero code changes, secret key revoked, stale dist/ deleted.

## Falsifiable predictions for next Phase A

1. origin/main = this handoff commit; parent 731a457a5c726e11f3...
2. Migrations by name-form: 20. No restock migration present.
3. Jest: 179 tests / 5 suites via npm test. Deno: 20 tests via
   cd supabase/functions && deno test --allow-read ingest-coa/
   (this exact form; deno task test does not exist -- settled).
4. Fixture pdf count: 13.
5. coas rows: 19 at close (Blue Raspberry newest-4, Acapulco Gold
   1d624fdb, Sherbadelic, All Gas 7g 42707425 newest). Operator use
   adds rows; predict >= 19, Acapulco sha 6ad9610e counted once.
6. Fuel Pump f2503fc3 on_shelf_count: 0. Oldest open wound, still.
7. D ceiling: D163.
8. .env key class: grep -o 'EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_[a-z]*'
   prints ...=sb_publishable. If it ever prints sb_secret again,
   stop everything.
9. Operator worktree: two .claude/ untracked lines; branch main;
   spike/d163-web-importer exists locally at 9c520f8.
10. CLAUDE.md sha256 36ca6a841cc3... until its queued touch lands.

## Ruled queue

1. Restock (D159-D160). Slice 1 carrier was never placed; migration
   20260825000001_coa_restocks_d159.sql (pin ba5625bf347dc45249807f
   ca1041041d448543cd624ac0b720620146c265d8a8, 76 lines) re-delivered
   from the ratified text in restock.md's commit thread. NEW INPUT
   from D163: the D88 duplicate dialog is a hard hang on web
   (Alert.alert is a no-op there) and restock must rebuild that exact
   dialog for its third outcome. DECIDE at design time: fold the
   web-capable dialog into the restock arc, or keep separate arcs.
2. Age-gate UI slice (D154-D158, copy ratified, migration applied).
3. Web-importer implementation arc (new D-number) if promoted; the
   spike doc's Findings is its evidence base.
Banked: road-to-store gains a "client key is publishable-class" gate;
CLAUDE.md [ADAPT] refresh (test counts now 179/5 Jest + 20 Deno; the
cwd-reset bullet is REFUTED, see ledger); sign-in latency on web if
it recurs (one data point, cause not established).

## Findings ledger, this session

Architect errors reaching artifacts: 5. (1) gate-4 "above the blank"
-- an unobserved layout decoration in a prompt; implementer corrected.
(2) alpha-Pinene asserted as "Pinene" -- guessed canonical name,
self-caught by the executed mirror before shipping. (3)(4) two false
premises in the D163 doc (File API bytes-read; Alert "twice, for
error surfacing") -- structural claims written from imports without
reading use sites; refuted implementer-side, ledgered in the doc's
Corrections. (5) garbled switch-refusal clause in the closing prompt
(self-contradicting prose, unreachable but malformed).
Architect self-caught, twice: stale clone at dry-run time (origin had
moved). STANDING RULE ADOPTED: the architect fetches origin
immediately before every dry run, not once per session.
Implementer errors: 0. Implementer catches, credited: the parent
directory's stub CLAUDE.md is a live confusion vector (injected
context shows d:\Projects\Cultivar\CLAUDE.md, not the handbook);
set-then-prove caught its own carried-cwd slip; cwd persistence
across tool calls confirmed twice -- the prior "per-turn cwd reset"
account is REFUTED and the handbook bullet should be corrected on
its next touch; two doc premises refuted from installed source before
any browser ran; unprompted CR byte-census before staging; declined
an unneeded .env read on the day .env was the incident.

## Capability notes (architect container, this session)

Clones the public repo; installs deno from GitHub releases; npm:
specifiers resolve (registry allowed) so the FULL ingestCoa pipeline
runs architect-side against fixtures, including unpdf extraction;
jsr.io unreachable, so deno-test-file execution stays implementer-
side (values pre-executed via plain-assert mirrors instead); Jest
runs via npm ci + npm test; shell is /bin/sh (no brace expansion);
Supabase MCP reads work as before. Fetch-before-dry-run is now
standing (see ledger).

## Entry point next session

Phase A against this file, then restock design ratification -- the
fold-or-separate dialog DECIDE is the first ruling to seek.
