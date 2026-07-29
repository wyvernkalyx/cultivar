# Text-field absence is null -- design (D97)

Status: RATIFIED 2026-07-29. Implementation is the Q4 parser pass
(pure-logic slice; gate = tests pasted raw, plus one device pass on
the editor).

## D97 -- absence of a text field is null, never ''

The ND principle extended to text: lab, brand, strain, and batch are
string | null end to end. A document that does not state a field
yields null -- '' asserts "the document says blank," which is a
different claim and a false one.

## Parser

- firstMatch (both per-lab copies, parseKaycha.ts and
  parseDrsConfident.ts) returns null when the trimmed capture is
  empty -- the trim-to-empty path bypasses every ?? coalesce, so the
  fix lives inside the helper. Consolidating the duplicated helpers
  is a refactor: of its own, banked.
- The ?? '' coalesces on strain, batch, and brand become ?? null in
  both parsers.
- The unknown-lab sentinel (parseCoa.ts) emits null for all four
  text fields: an unrecognized document is total absence, and the
  guard arm reads the analyte arrays, never the sentinel's text.
- Supersedes the representation half of D68: no dba token still
  means no brand, but the emission is null, not ''.

## Types -- both mirrors, one commit

supabase/functions/_shared/coa/types.ts and the editor's
hand-copied CoaParseResult (src/components/coa-editor.tsx) widen
lab/brand/strain/batch to string | null together. No sync
enforcement exists between the two declarations; a commit touching
one and not the other compiles clean on both sides while the client
keeps the old contract.

## Editor

- MetadataField binds value={value ?? ''} -- null is not a valid
  controlled-input value in React Native.
- emitDraft normalizes metadata on confirm: trim, and trimmed-empty
  emits null. Today a user-cleared field emits '' per keystroke,
  untrimmed -- the parser defect user-side; after this, cleared and
  never-present emit the same honest null.

## Boundary

The dedupe wrapper (src/lib/coa-dedupe.ts) already carried the
null contract before D97 -- findCoaDuplicates and DuplicateMatch
were declared string | null when the wrapper landed, and
find_coa_duplicates treats '' as absent server-side via
nullif(trim(...), '') (migration 20260728172153). Discovered at
the Q4 build, 2026-07-29: this section originally described the
widening as pending, written without reading the file -- recorded
here rather than silently corrected.

## Known consequences

Two Jest brand expectations flip from '' to null (permanent-shade,
cosmic-cereal). insert_coa already maps JSON null and missing keys
to SQL NULL, so no schema change.

## Banked

- firstMatch consolidation (refactor:, its own commit).
- Shelf freshness indicator: >3 months, sourced tested_on ??
  sampled_on; a UI slice for the feature phase.
