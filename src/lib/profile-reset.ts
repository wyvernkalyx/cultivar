import { supabase } from '@/lib/supabase';

/**
 * Profile reset (slice 5, D110 -- see
 * documentation/design/profile-reset-and-export.md).
 *
 * The whole reset is one `security invoker` RPC and one transaction: the
 * closing session entries, the nulled favorites, the retirement events and
 * their zeroed counts all land together or none of them do. A client that
 * did this in four steps could leave a profile half-reset with no way to
 * tell afterward which half ran.
 *
 * Like `coa-retire.ts`, this never throws across the module boundary: the
 * caller's job is to surface the failure, not to recover from it. A
 * swallowed failure here would report a reset that did not happen.
 */

type ResetProfileResult =
  | {
      ok: true;
      sessions_hidden: number;
      packages_retired: number;
      favorites_cleared: number;
    }
  | { ok: false; message: string };

/**
 * Runs the reset and returns the three counts the RPC itself reports.
 *
 * The counts are the server's own post-mutation row counts, not a
 * client-side prediction from a pre-read: the pre-read is a separate
 * statement at a separate instant, and re-deriving the outcome here would
 * be a second, weaker copy of a number that already exists.
 */
export async function resetProfile(): Promise<ResetProfileResult> {
  const { data, error } = await supabase.rpc('reset_profile');
  if (error) {
    return { ok: false, message: error.message };
  }
  // The client is untyped (no generated DB types), so this asserts the
  // RPC's jsonb return. Runtime validation remains the accepted debt --
  // the same debt `coa-retire.ts` carries for its scalar.
  const counts = data as {
    sessions_hidden: number;
    packages_retired: number;
    favorites_cleared: number;
  };
  return {
    ok: true,
    sessions_hidden: Number(counts.sessions_hidden),
    packages_retired: Number(counts.packages_retired),
    favorites_cleared: Number(counts.favorites_cleared),
  };
}
