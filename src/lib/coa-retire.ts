import { Alert } from 'react-native';

import { setFavorite } from '@/lib/coa-favorite';
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

/**
 * What a caller must know about the package being retired: the id the RPC
 * takes, and the three fields the confirm copy reads. Repurchase intent is
 * named too but never read here -- the question this sequence ends on
 * offers all three of its arms regardless of the stored answer -- so the
 * type states the whole of what the sequence touches rather than only what
 * it inspects. Structural, so this module keeps no dependency on a
 * component's type: the detail record and the shelf row both satisfy it as
 * they are.
 */
export type RetireTarget = {
  id: string;
  strain: string | null;
  brand: string | null;
  on_shelf_count: number;
  favorite: boolean | null;
};

/**
 * The retirement ritual, shared by the COA detail and the shelf card
 * (D114), on the module form D113 established: the writer and the prompt
 * that drives it live together, and the RPC keeps exactly one client call
 * site above.
 *
 * Two surfaces raise this now. Duplicating the sequence would duplicate
 * the D44 identity echo, D90's copy constraint, and the survey's two
 * reasons in a second place, where each could drift on its own.
 *
 * `onDone` is the caller's refetch. It fires exactly once per completed
 * sequence and not at all when the confirm is cancelled, because nothing
 * has been written at that point.
 */
export function promptRetire(coa: RetireTarget, onDone: () => void): void {
  const answerFavorite = async (value: boolean) => {
    const result = await setFavorite(coa.id, value);
    if (!result.ok) {
      Alert.alert('Could not save', result.message);
    }
    onDone();
  };

  // Q2 of the retirement survey (D90), optional by design. Skip writes
  // NOTHING -- repurchase intent is left untouched, not nulled, because
  // unanswered is not an answer (D48). This arm is exactly what the card's
  // own question deliberately lacks: skipping a question and clearing an
  // answer are different operations.
  const askAgain = () =>
    Alert.alert('Would you buy it again?', undefined, [
      { text: 'Yes', onPress: () => void answerFavorite(true) },
      { text: 'No', onPress: () => void answerFavorite(false) },
      { text: 'Skip', style: 'cancel', onPress: onDone },
    ]);

  // Q1 is the event (D90). One RPC, one transaction (D90.1): the reason and
  // the decrement land together or not at all. A failure stops the sequence
  // -- Q2 is a question about a retirement that happened -- and still
  // refetches, so the surface agrees with a database that did not move.
  const record = async (reason: string) => {
    const result = await retireCoa(coa.id, reason);
    if (!result.ok) {
      Alert.alert('Could not retire', result.message);
      onDone();
      return;
    }
    askAgain();
  };

  // The D44 identity echo, same two rules: strain falls back to "this COA",
  // and a blank brand omits its line rather than rendering an empty one.
  const strain = coa.strain?.trim() ? coa.strain.trim() : 'this COA';
  const brand = coa.brand?.trim();
  const identity = [strain, ...(brand ? [brand] : [])].join('\n');
  // Exactly one outcome line, chosen by what will be left. D90's copy
  // constraint: a card that stays on the shelf must never be told it is
  // being taken off it.
  const outcome =
    coa.on_shelf_count > 1
      ? `You'll still have ${coa.on_shelf_count - 1} on your shelf.`
      : 'This takes it off your shelf.';
  Alert.alert('Retire a package', `${identity}\n\n${outcome}`, [
    { text: 'Smoked it all', onPress: () => void record('Smoked it all') },
    { text: 'Gave up on it', onPress: () => void record('Gave up on it') },
    // Nothing has been written at this point, so cancelling is a pure
    // no-op -- no event, no decrement, no question, no refetch.
    { text: 'Cancel', style: 'cancel' },
  ]);
}
