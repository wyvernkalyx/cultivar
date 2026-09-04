import { appAlert } from '@/lib/app-alert';
import { supabase } from '@/lib/supabase';

/**
 * Re-acquisition (D159, D160): a retired row comes back to the shelf.
 *
 * The event insert and the increment are one `security invoker` RPC, the
 * D90.1 one-write discipline `retire_coa` established: two client writes
 * could leave an event with no count change or a count change with no
 * event, and neither is detectable afterward. The cap lives in SQL
 * (`least(count + 1, 1)`), so a restock against an already-shelved row is
 * a recorded event and a count that stays at 1 -- the caller never
 * re-derives the rule.
 *
 * Like `coa-retire.ts`, this never throws across the module boundary.
 */

export type RestockCoaResult = { ok: true; count: number } | { ok: false; message: string };

/**
 * Records one restock and returns the COA's new `on_shelf_count`, which is
 * the RPC's own post-update read rather than a client-side assumption.
 */
export async function restockCoa(coaId: string): Promise<RestockCoaResult> {
  const { data, error } = await supabase.rpc('restock_coa', {
    p_coa_id: coaId,
  });
  if (error) {
    return { ok: false, message: error.message };
  }
  // The client is untyped (no generated DB types), so this asserts the
  // RPC's scalar integer return. Runtime validation remains the accepted
  // debt, as in retireCoa.
  return { ok: true, count: Number(data) };
}

/**
 * What a caller must know about the row being restocked: the id the RPC
 * takes and the name the success line echoes. Structural, so the detail
 * record and the shelf row both satisfy it as they are.
 */
export type RestockTarget = {
  id: string;
  strain: string | null;
};

/**
 * The restock action, shared by the COA detail and the History card
 * (D160.2), on the D113/D114 form: the writer and the line that announces
 * it live together, and the RPC keeps exactly one client call site above.
 *
 * The tap acts -- there is no confirm. Nothing destructive happens, Retire
 * reverses it, and the ratified copy carries no confirm text. The success
 * line is the D44/D45 identity echo: name the row, then say what happened.
 *
 * `onDone` is the caller's refetch. It fires exactly once, on success and
 * on failure alike, so the surface agrees with the database either way.
 */
export function restockAndAnnounce(coa: RestockTarget, onDone: () => void): void {
  const strain = coa.strain?.trim() ? coa.strain.trim() : 'This COA';
  void restockCoa(coa.id).then((result) => {
    if (!result.ok) {
      appAlert(
        'Could not restock',
        'Nothing was recorded — the product is still in your History as it was. Check your connection and try again.'
      );
      onDone();
      return;
    }
    // Refetch before the line shows, not on dismissal: the surface should
    // already agree with the database while the user reads it.
    onDone();
    appAlert(`${strain} is back in your stash.`);
  });
}
