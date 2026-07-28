import { supabase } from '@/lib/supabase';

/**
 * Duplicate detection at confirm time (slice 5c, D88).
 *
 * The lookup is a `security invoker` RPC rather than Edge Function code
 * (D88.4): `ingest-coa` is identity-blind by construction, and the RPC carries
 * `created_by = auth.uid()` as an explicit predicate in its own right, so the
 * D88.1 disclosure hole cannot open even if the function is ever run under a
 * role RLS does not bind.
 *
 * This module decides nothing. It answers "does this already exist" and names
 * which row a prompt should describe; every outcome is the user's, because an
 * accidental double-upload and a genuine second package are indistinguishable
 * to a hash (D88). Merging, incrementing, and discarding all live at the call
 * site, behind a prompt.
 *
 * Like `coa-pdf-storage.ts`, neither function throws across the module
 * boundary: the caller's job is to surface the failure, not to recover from it
 * — and here a swallowed failure would silently re-open the hole the check
 * exists to close.
 */

/**
 * One row of `find_coa_duplicates` (migration `20260728171246`, flags fixed in
 * `20260728172153`). snake_case because these are the RPC's column names, not
 * the parser's fields — the same convention `coa-detail.tsx` follows at the DB
 * seam.
 *
 * `hash_match` and `natural_key_match` are which signal fired, and both are
 * non-null: the fix migration coalesces each flag to false, so a row selected
 * by one signal reports a definite false for the other rather than null. Null
 * would read as "unasked" here, and the signal was asked.
 */
export type DuplicateMatch = {
  id: string;
  strain: string | null;
  brand: string | null;
  lab: string | null;
  batch: string | null;
  on_shelf_count: number;
  hash_match: boolean;
  natural_key_match: boolean;
};

export type FindCoaDuplicatesResult =
  | { ok: true; rows: DuplicateMatch[] }
  | { ok: false; message: string };

/**
 * Both D88 signals in one owner-scoped call. A null hash disables the hash arm
 * and leaves the natural key doing the work, which is the live case until the
 * hashing Edge Function is deployed.
 *
 * Arguments pass through unnormalized on purpose: the RPC treats '' as absent
 * (`nullif(trim(...), '')`), so normalizing here would be a second, weaker
 * copy of a rule that already exists server-side — and the server's copy is
 * the one that governs.
 */
export async function findCoaDuplicates(
  pdfSha256: string | null,
  lab: string | null,
  batch: string | null,
): Promise<FindCoaDuplicatesResult> {
  const { data, error } = await supabase.rpc('find_coa_duplicates', {
    p_pdf_sha256: pdfSha256,
    p_lab: lab,
    p_batch: batch,
  });
  if (error) {
    return { ok: false, message: error.message };
  }
  // The client is untyped (no generated DB types), so this cast asserts the
  // RPC's returns-table shape. Runtime validation remains the accepted debt.
  return { ok: true, rows: (data ?? []) as DuplicateMatch[] };
}

/**
 * Which matched row the prompt describes. Strongest signal wins: a hash match
 * is byte-identical evidence, a natural-key match is only same-lot evidence.
 *
 * Among equal natural-key matches the choice is arbitrary, and that is
 * accepted (operator-ratified 2026-07-28): every row on one natural key
 * describes the same physical lot, so the prompt says the same true thing
 * whichever it names. The count in the prompt's summary is what tells the user
 * there was more than one.
 *
 * Call only with a non-empty array — an empty result is not a duplicate and
 * has no target to pick.
 */
export function pickDedupeTarget(rows: DuplicateMatch[]): DuplicateMatch {
  return rows.find((r) => r.hash_match) ?? rows[0];
}
