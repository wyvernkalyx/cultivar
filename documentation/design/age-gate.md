# Age Gate + Jurisdiction Attestation

Status: drafted 2026-08-25; rulings 1a/2a/3b and D154-D157 ratified by
the operator 2026-08-25 (chat). Amended by the commit that changes its
truth. Roadmap Phase 2, box 1. MVP MUST and store requirement.

## What this is

Before any app surface, a signed-in user attests once: 21 or older,
and located where their use of this app is lawful. The app stores the
attestation as an event and never asks again. This is legal posture,
not enforcement -- an attestation gate verifies nothing and claims to
verify nothing.

## D154 -- Attestation-only; no birthdate is ever collected

The gate stores a boolean fact ("attested") with a timestamp. No DOB,
no age, no jurisdiction name. Grounds: data minimization in the exact
place the risk register is most nervous (consumption data on a
cross-border server, lawyer review pending). A birthdate is identity
data with breach value; an attestation boolean is nearly worthless to
an attacker and answers the store requirement identically. Also less
UI: two statements, one confirm, no date picker.

## D155 -- Attestations are events in `user_attestations`, append-only

New table, the house event pattern (session_entries D52,
coa_retirements, profile_resets precedent):

- `id` uuid pk default gen_random_uuid()
- `created_by` uuid not null default auth.uid() references
  auth.users (id) on delete cascade -- the repo convention verbatim
- `kind` text not null -- 'age21_jurisdiction' now; text not enum,
  per the standing vocabulary convention
- `statement_version` smallint not null -- the client sends its
  constant (1 at ship); when counsel edits the copy, the version
  records which text was agreed (lexicon_version precedent)
- `created_at` timestamptz not null default now()

RLS: INSERT own rows and SELECT own rows. No UPDATE, no DELETE --
append-only by policy absence. Grounds for a table over a column on
`profiles`: profiles carries an UPDATE policy, so a boolean there is
client-mutable, and a legal attestation that a buggy client can
silently flip is not a record. An event table gives counsel an audit
trail and gives the consent/terms slice (Phase 2, box 2) a home --
another `kind`, zero migration. Named cost, accepted: one more table
and a Tier 3 gate ceremony.

## D156 -- Placement: after auth, before any app surface; fail-closed

The gate needs a uid (D155 stores account-side, ruling 2a), so it sits
after OTP sign-in, ahead of every app route. On launch the client asks
for any own row with the current kind; absence routes to the gate.
No cached verdict: if the read cannot complete, the gate shows --
fail-closed, the airplane precedent. Attesting requires connectivity;
accepted.

## D157 -- Decline is soft (ruling 3b)

Declining shows an ineligible screen; the gate is presented again at
next launch (and reachable by back). No hard lock, no counter, no
scolding copy. Grounds: operator ruling over the architect's hard-stop
lean. Named cost, recorded: a declined user can immediately re-answer;
true of any attestation gate, which is posture, not enforcement.

## Copy

Operator-owned wording, two statements and a confirm. Discipline: the
copy must not name jurisdictions, enumerate laws, or advise on
legality -- the attestation is the user's, not ours. No consumption
encouragement (Phase 6 sweep will re-verify).

## Slices

1. Schema (Tier 3): migration for D155. MCP gates: table + RLS
   visible; paired control -- as the inserting identity, insert one
   row, see it, then UPDATE and DELETE match 0 rows (the
   coa_retirements gate form); non-owner insert rejected.
2. UI (Tier 2, device-gated): gate screen + routing + ineligible
   screen. Device gate: fresh account sees the gate; attest lands one
   row (MCP read-back) and enters the app; relaunch does not
   re-prompt; declined account sees ineligible, relaunch shows the
   gate again; airplane mode at the gate stays at the gate.

## Non-goals

No DOB or age verification service. No geolocation, IP checks, or
jurisdiction lists. No consent/terms UI (the table accommodates it;
the slice does not build it). No re-attestation prompts for existing
rows. No Android-specific work.
