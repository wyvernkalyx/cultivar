import { supabase } from '@/lib/supabase';

/**
 * Retiring one package (slice 6, D90).
 *
 * The event insert and the decrement are one `security invoker` RPC
 * (D90.1), not two client writes. `coas` carries a single ALL policy, so a
 * client that did this in two steps could leave an event with no decrement
 * or a decrement with no event, and neither is detectable afterward. The
 * count is derived state; the events are the record (D89).
 *
 * Like `coa-dedupe.ts` and `coa-pdf-storage.ts`, this never throws across
 * the module boundary: the caller's job is to surface the failure, not to
 * recover from it. A swallowed failure here would report a retirement that
 * did not happen.
 */

export type RetireCoaResult = { ok: true; count: number } | { ok: false; message: string };

/**
 * Records one retirement and returns the COA's new `on_shelf_count`, which
 * is the RPC's own post-update read rather than a client-side subtraction:
 * the floor lives in SQL (`greatest(count - 1, 0)`) and re-deriving it here
 * would be a second, weaker copy of a rule that already exists server-side.
 *
 * `reason` is passed through unnormalized. The D90.2 check
 * (`length(trim(reason)) > 0`) is the rule of record, and it rejects an
 * empty reason as a constraint violation rather than trusting this caller.
 */
export async function retireCoa(coaId: string, reason: string): Promise<RetireCoaResult> {
  const { data, error } = await supabase.rpc('retire_coa', {
    p_coa_id: coaId,
    p_reason: reason,
  });
  if (error) {
    return { ok: false, message: error.message };
  }
  // The client is untyped (no generated DB types), so this asserts the
  // RPC's scalar integer return. Runtime validation remains the accepted
  // debt.
  return { ok: true, count: Number(data) };
}
