import type { PreferenceSummaryProps, RungWord } from '@/components/preference-summary';
import { rankTopEffects, type SummarySession } from '@/lib/card-data';
import { RUNGS } from '@/lib/lexicon';

// Moved from shelf-list.tsx in slice 3 (D138/D142): the Insights route and
// the shelf both consume the summary now, and two copies of the computation
// are two places for the D98 bindings to drift. Logic unchanged byte-for-
// byte in intent; only the module boundary moved.

// Deliberately UNFILTERED by on_shelf_count: the summary is all-time,
// including off-shelf history (D98). RLS scopes the rows.
export type SummaryCoa = {
  id: string;
  favorite: boolean | null;
  on_shelf_count: number;
};

// D151 (2026-08-21): the Loved-concentrations block (analyteRange,
// rankLovedTerpenes, and the loved: {...} result) left with the module it
// fed; the terpene rows are no longer an input here. Grep at the change,
// construct form: no other consumer of either helper or of loadSummary,
// which was already unreferenced and is removed with them.

// The whole summary, computed client-side over session_current merged with the
// unfiltered catalog (D98: no new view, no migration -- session_current is
// already the one source of per-session grain, and this is that consumer).
export function buildSummary(sessions: SummarySession[], coas: SummaryCoa[]): PreferenceSummaryProps {
  const distribution = Object.fromEntries(RUNGS.map((rung) => [rung.word, 0])) as Record<
    RungWord,
    number
  >;
  for (const session of sessions) {
    // A word outside RUNGS (or a null) counts toward the all-time total but
    // has no rung to land on; it is never coerced into one.
    if (session.overall_word !== null && session.overall_word in distribution) {
      distribution[session.overall_word as RungWord] += 1;
    }
  }

  return {
    sessionCount: sessions.length,
    distribution,
    buyAgainCount: coas.filter((coa) => coa.favorite === true).length,
    topEffects: rankTopEffects(sessions),
  };
}
