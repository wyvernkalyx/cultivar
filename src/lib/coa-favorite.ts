import { Alert, type AlertButton } from 'react-native';

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

/**
 * The minimum a caller must know about the COA being answered. Both card
 * surfaces pass their whole row, which satisfies this structurally, and
 * this module stays free of any dependency on a component's type.
 */
export type FavoriteTarget = { id: string; favorite: boolean | null };

/**
 * The card surfaces' shared prompt (D113). One ritual, not one per list:
 * the two lists' handlers are identical, and a second copy is a second
 * place for the wording to drift out of agreement with the detail's.
 *
 * The question is worded exactly as the retirement prompt asks it
 * (operator copy ruling, 2026-08-04: one question, one wording, both
 * prompts). Clear answer appears only where there is an answer to clear
 * -- offering it against a never-asked row offers to erase nothing. The
 * retirement prompt's third arm is deliberately absent here, because
 * skipping a question and clearing an answer are different operations.
 *
 * `onWritten` fires only after a confirmed write. A failed write leaves
 * the caller's rendered state alone: the surfaces render from the stored
 * value, so refetching an unchanged row would report nothing.
 */
export function promptFavorite(coa: FavoriteTarget, onWritten: () => void): void {
  const write = async (value: boolean | null) => {
    const result = await setFavorite(coa.id, value);
    if (!result.ok) {
      Alert.alert('Could not save', result.message);
      return;
    }
    onWritten();
  };
  const buttons: AlertButton[] = [
    { text: 'Yes', onPress: () => void write(true) },
    { text: 'No', onPress: () => void write(false) },
  ];
  if (coa.favorite !== null) {
    buttons.push({ text: 'Clear answer', onPress: () => void write(null) });
  }
  buttons.push({ text: 'Cancel', style: 'cancel' });
  Alert.alert('Would you buy it again?', undefined, buttons);
}
