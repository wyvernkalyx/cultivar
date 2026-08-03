# Profile Reset and Data Export -- design (D110-D112)

Status: RATIFIED 2026-08-03 (D110-D112). This status line is amended by
the commit that changes its truth.

North stars: `documentation/design/session-entries-schema.md` (D52
append-only; the soft-delete mechanic this design reuses),
`documentation/design/coa-retention-and-possession.md` ("the count is
derived state; the events are the record", and the single-transaction
shape in Ratification and amendments, D90.1), `CLAUDE.md` (no fabricated
data; nothing recorded is silently destroyed).

Operator rulings absorbed (2026-08-03, chat): reset is a soft-reset, not
an erasure; scope is session chains plus `favorite`, retirements
retained; session notes are retained and hidden with their chains, not
resurfaced; off-shelf goes through retirement events with a
system-written reason; export is full-profile; restore is server-side,
file import banked; undo UI banked until a reset is actually regretted.

---

## Observed baseline (2026-08-03, MCP + implementer recon at db72555)

- `session_current` filters `deleted = false` on the latest entry per
  chain -- a `deleted = true` insert removes a chain from both scoring
  views with no schema change.
- Public tables: `coas`, `coa_cannabinoids`, `coa_terpenes`,
  `coa_safety`, `coa_retirements`, `session_entries`, `profiles`; RLS
  enabled on all seven.
- RPC surface: `insert_coa`, `find_coa_duplicates`, `retire_coa`, all
  `prosecdef = f`.
- The settings surface is the D107.1 account sheet in
  `src/app/index.tsx` (a core RN Modal, pageSheet). It carries the email
  and Sign out, and deliberately does not bump `shelfVersion` on close.
- `expo-file-system` is in the lockfile transitively via `expo` and
  absent from `package.json`; `expo-sharing` is absent everywhere.
- Live query sites on `session_current`: three (`coa-detail.tsx:298`,
  `off-shelf-list.tsx:91`, `shelf-list.tsx:191`). `coa_session_stats`
  has zero app-code query sites.
- Test-phase data: 5 coas, 23 raw entries (12 current), 2 retirements,
  `sum(on_shelf_count)` = 4. All test data; the design is for real users.

---

## D110 -- Profile reset is a soft-reset: one RPC, one transaction

A settings-menu action that returns the scoring picture to zero without
destroying anything recorded.

New RPC `reset_profile`, `security invoker`, `set search_path = ''`,
gated on `prosecdef = f`. In one transaction, for the calling user:

1. For every chain visible in `session_current`: insert one new entry
   copying that chain's latest snapshot with `deleted = true`. This is
   the D52 soft-delete mechanic, applied in bulk. `lexicon_version` is
   copied from the source entry, never the client constant -- a copy is
   not a new answer.
2. `coas.favorite` -> null on every row. Revisable state, not a record
   (per the retention doc's note); nulling is not destruction.
3. For each COA with `on_shelf_count > 0`: insert that many
   `coa_retirements` events with `reason = 'Profile reset'`, then set
   `on_shelf_count = 0`. Count and events stay coherent (D89 grounds);
   event and decrement share the transaction (D90.1 shape).
4. Insert one row into `profile_resets` (D110.2).

Returns `{sessions_hidden, packages_retired, favorites_cleared}` for the
completion state.

**D110.1 -- reset does not call `retire_coa`.** That RPC is the
survey-facing path: one package, operator-authored reasons, a favorite
prompt. Reset semantics differ in all three. The reset RPC inserts its
events directly; `'Profile reset'` is system-written and is never a
survey option -- the survey stays two-reason, and the banked third
user-facing reason stays banked.

**D110.2 -- `profile_resets` records the reset as an event.** Append-only
table: `id` uuid pk, `created_by` (the `coas` convention verbatim),
`created_at`, `sessions_hidden` int, `snapshot` jsonb holding the
pre-reset `favorite` and `on_shelf_count` per COA id. RLS: INSERT
(`with check` only) and SELECT, own rows, nothing else -- the
`coa_retirements` shape. Grounds: recover-later asymmetry. The nulled
favorites and zeroed counts are the only reset effects not recoverable
from raw rows; a jsonb snapshot at reset time is pennies and keeps D112
buildable without a schema change later. All entries inserted by one
reset share one `created_at` (`now()` is transaction-stable), which is
the identification D112 needs.

**Copy constraint, operator-owned wording:** reset UI says hidden or
cleared, never deleted. Nothing is deleted, and copy that claims
otherwise is a false claim in the product's own voice. The confirm
screen states observed counts before acting ("This hides N sessions
across M products") and offers export first (D111).

## D111 -- Export is the full profile, client-generated, versioned

A settings-menu action, also offered on the reset confirm screen.

- **Scope:** the user's rows from `coas`, `coa_cannabinoids`,
  `coa_terpenes`, `coa_safety`, `coa_retirements`, `profile_resets`,
  and **raw** `session_entries` including soft-deleted entries. The raw
  chain is the record; exporting only `session_current` would ship the
  view and lose the history.
- **Format:** one JSON document, envelope
  `{format: "cultivar-export", version: 1, exported_at, user_id, data}`.
  Versioned so a future import can refuse what it does not understand.
- **ND is `null` in the export, never 0.** The fabrication invariant
  ships with the data: an export that renders ND as 0 exports the
  violation to every downstream tool.
- **Mechanism:** authenticated selects (RLS scopes them), serialize
  client-side, write via `expo-file-system` to cache, hand to the iOS
  share sheet via core React Native `Share` with a file `url`.
  `expo-file-system` gets declared in `package.json` (`npx expo
  install`) as its own `chore:` commit -- declaration only; the module
  is already compiled into the dev binary transitively. **Falsifiable
  claim, settled at the device gate:** no EAS rebuild is required. If
  `Share` refuses a file URL or the module resolves null, fallback is
  `expo-sharing`, which is a new native module and triggers the
  EAS-rebuild split rule.

## D112 -- Restore is server-side undo, designed now, built on demand

File import is banked, permanently second to server-side undo while the
data survives reset (D110). Grounds, recorded so this is not
relitigated: an import path must re-match COAs by content, remap every
chain id, and accept client-supplied history wholesale -- supplied
scores, supplied timestamps -- a fabrication surface on a table whose
design is "the record is what happened." Lived demand for import is
device/account migration or a future hard-erasure feature; neither
exists.

Undo mechanics, named so they are not improvised later: a reset is
identified by its `profile_resets` row; the entries it inserted share
its `created_at`. Undo inserts, per affected chain, a copy of the last
pre-reset snapshot (append-only -- undo is itself an insert, never a
DELETE of the reset entries), restores `favorite` and `on_shelf_count`
from the snapshot jsonb, and records itself. User-initiated soft-deletes
from before the reset are not resurrected -- they do not share the
reset's `created_at`. **No undo UI ships in this arc** -- ruled
2026-08-03 (operator): undo is banked until a reset is actually
regretted; the snapshot and identification above keep it buildable.

## Slice plan

Ship order ratified: export before reset, so the confirm screen's
"export first" is real on day one.

1. **`docs:`** -- this document (Tier 1).
2. **`chore:`** -- declare `expo-file-system` (declaration-only claim
   above).
3. **Export (`feat:`, Tier 2)** -- serializer as pure functions where
   testable, settings-sheet row, share flow. Gate: device -- export
   produced, opened in Files, spot-checked against MCP-observed rows,
   ND-as-null confirmed on a COA with a known ND analyte.
4. **Schema (`feat:`, Tier 3)** -- migration: `profile_resets` + RLS +
   `reset_profile`. Implementer authors, operator applies. Gate:
   observed state plus a paired behavioral control (below).
5. **Reset UI (`feat:`, Tier 2)** -- settings-sheet row, confirm screen
   with counts and export offer, completion state, shelf refresh. The
   account sheet's deliberate no-refresh-on-close is revisited here:
   reset changes COA state, so the completion path must bump
   `shelfVersion`. Gate: device with MCP read-back.

## Non-goals

- File import (D112, banked). Undo UI (ruled banked). Hard erasure (the
  banked D47 item stands untouched). Android. Any change to the
  retirement survey's two user-facing reasons. Any new view; any change
  to `session_current` or `coa_session_stats`. PDF objects in Storage
  are untouched by reset -- the COA is retained, so its document is too.

## Gates (schema slice)

- `pg_policies` on `profile_resets`: exactly two policies, INSERT and
  SELECT. `pg_tables.rowsecurity = true`. `prosecdef = f` for
  `reset_profile` by the standing form.
- Behavioral, control-paired, as the authenticated owner against test
  rows: run `reset_profile`; read back `session_current` count 0,
  favorites all null, `sum(on_shelf_count)` 0, retirements increased by
  exactly the pre-reset shelf sum, `profile_resets` exactly one new row
  whose snapshot matches the pre-reset MCP observation, and all
  reset-inserted session entries sharing one `created_at`. Then attempt
  UPDATE and DELETE on the new `profile_resets` row: 0 rows affected,
  with the insert as the paired positive control.
