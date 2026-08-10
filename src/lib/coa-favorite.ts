import { supabase } from '@/lib/supabase';

/**
 * Repurchase intent, the one writer (D113, the 2026-08-04 amendment in
 * documentation/design/dashboard.md).
 *
 * The column is answered from three surfaces now -- the COA detail, the
 * shelf card, and the archive card -- so the write lives in one place
 * rather than once per surface. Three copies of a row update are three
 * places for the behavior to drift, and nothing would detect the drift.
 *
 * No RPC: `coas` carries a single ALL policy because repurchase intent is
 * revisable state and not a record (D91), which is the same reasoning
 * D88.6 used for the possession count. The record is `coa_retirements`,
 * and it is not updatable at all.
 *
 * Like `coa-retire.ts`, this never throws across the module boundary: the
 * caller's job is to surface the failure, not to recover from it. A
 * swallowed failure here would report an answer that was never stored.
 */

export type SetFavoriteResult = { ok: true } | { ok: false; message: string };

/**
 * Records one answer.
 *
 * `null` is the erasure of an answer, not a third answer: it returns the
 * row to never-asked, which D48 keeps distinct from a stored "no".
 */
export async function setFavorite(
  coaId: string,
  value: boolean | null,
): Promise<SetFavoriteResult> {
  const { error } = await supabase.from('coas').update({ favorite: value }).eq('id', coaId);
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}
