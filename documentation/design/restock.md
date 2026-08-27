# Re-acquisition -- Back in the Stash

Status: drafted 2026-08-25; model and sequencing operator-ratified
2026-08-25 (chat: same-row restock; arc jumps the age-gate UI slice).
Amended by the commit that changes its truth.

Lived demand, same day: Fuel Pump (Nanticoke), retired in the morning
("Smoked it all"), re-bought in the evening. The D88 prompt offered
acknowledge / corrected report / mistake, and no surface anywhere
offered a way back to the shelf. The gap was created by two sound
rulings meeting a case neither anticipated: D90 made retirement an
event, D139 made possession binary, and nothing made re-acquisition
anything at all.

## D159 -- Re-acquisition is an event; the same row returns

A second package of the same lot is the same product. The row returns
to the shelf; session history and the per-product fingerprint stay one
thread. Minting a new row per package (the rejected alternative)
splits identical chemistry across rows forever and makes every future
scan a dedupe prompt.

New table `public.coa_restocks`, the event pattern, mirror of
`coa_retirements` in form:

- `id` uuid pk default gen_random_uuid()
- `coa_id` uuid not null references public.coas (id) on delete cascade
- `created_by` uuid not null default auth.uid() references
  auth.users (id) on delete cascade
- `created_at` timestamptz not null default now()

No reason column, deliberate: a retirement needs a why (spent, lost,
disliked); a restock's why is its own name. RLS mirrors
`coa_retirements` verbatim in form: INSERT own and SELECT own, no
UPDATE, no DELETE -- append-only by policy absence. Both FK indexes at
creation, the D90 form.

One RPC, the D90.1 one-write discipline -- event and count move
together or not at all:

    restock_coa(p_coa_id uuid) returns integer
    security invoker, set search_path = ''
    insert into public.coa_restocks (coa_id) values (p_coa_id);
    update public.coas
      set on_shelf_count = least(on_shelf_count + 1, 1)
      where id = p_coa_id returning on_shelf_count;
    not found -> raise; revoke public/anon; grant authenticated.

The cap is the mirror of retire's floor (`greatest(count - 1, 0)`)
and enforces D139's binary invariant, observed live before this
design: max(on_shelf_count) = 1 across all 15 rows, none above.

## D160 -- Two surfaces, one RPC

1. Retired card action (Stash history segment and COA detail): a
   "back in my stash" action on any row with on_shelf_count = 0. No
   scan required -- this is the surface that unblocks a re-buy the
   user notices at the shelf, not at the scanner.
2. Fourth D88 outcome, shown only when EVERY matched row is
   off-shelf (`rows.every(r => r.on_shelf_count === 0)`): if any
   match is still shelved, the lot is present and "I already have
   this" remains the true answer. The restock target is
   `pickDedupeTarget` (strongest match; arbitrary-among-equals was
   ratified 2026-07-28). Like acknowledge, nothing is uploaded and
   no new row is written -- the scanned bytes already live on the
   row.

Label principle, learned tonight and recorded: outcome labels name
the user's action in the moment ("I bought another package"), never
the system's state ("I already have this" described a state, and the
right choice was invisible at the moment of need).

## Copy (operator-owned; ratify or swap by line)

- Prompt outcome label: I bought another package
- Card action label: Back in my stash
- Success line, both surfaces (identity echo, D44/D45): {strain} is
  back in your stash.

## Slices

1. Schema (Tier 3): table + indexes + RPC. MCP gates: table + RLS
   visible, exactly two policies; paired probe as the authenticated
   identity -- restock Fuel Pump's row inside a rolled-back
   transaction, observe count 0 -> 1 and one event row, UPDATE and
   DELETE on coa_restocks match 0; restock an already-shelved row,
   observe count stays 1 (cap fires); non-owner arm as tonight.
2. UI (Tier 2, device-gated on the live dead end): retired Fuel Pump
   card -> back-in-stash action -> Log returns -> one real session
   saves against f2503fc3 (MCP read-back); re-scan the same QR ->
   fourth outcome present -> choosing it is a no-op restock (cap) ->
   prompt closes on the success line.

## Non-goals

No package counting (possession stays binary, D139). No change to
retire semantics or the D88 outcomes' existing three arms. No
supersession (banked at D88). No backfill UI for past dead ends --
the card action already covers any retired row, which is the
backfill. No reason or note column on restocks. No Android-specific
work.
