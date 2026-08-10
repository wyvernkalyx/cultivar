import type { PreferenceSummaryProps, RungWord } from '@/components/preference-summary';
import { rankTopEffects, type SummarySession, type SummaryTerpene } from '@/lib/card-data';
import { RUNGS } from '@/lib/lexicon';
import { supabase } from '@/lib/supabase';

// Moved from shelf-list.tsx in slice 3 (D138/D142): the Insights route and
// the shelf both consume the summary now, and two copies of the computation
// are two places for the D98 bindings to drift. Logic unchanged byte-for-
// byte in intent; only the module boundary moved.

// Deliberately UNFILTERED by on_shelf_count: the summary is all-time,
// including off-shelf history (D98). RLS scopes the rows.
export type SummaryCoa = {
  id: string;
  favorite: boolean | null;
  total_thc: number | null;
  total_cbd: number | null;
  on_shelf_count: number;
};

// Min/max over REPORTED values only, with the unreported ones counted beside
// them -- the D98 binding, verbatim: ranges compute over reported values only;
// ND is annotated alongside, never folded in as a zero lower bound. No COA
// reporting the analyte at all yields null, not a range of zeros.
function analyteRange(values: (number | null)[]): PreferenceSummaryProps['loved']['thc'] {
  const reported = values.filter((value): value is number => value !== null);
  if (reported.length === 0) return null;
  return {
    min: Math.min(...reported),
    max: Math.max(...reported),
    ndCount: values.length - reported.length,
  };
}

// Top 3 terpenes by concentration across the Loved COAs (the ratified v1
// "relevant terpenes" definition). Per name, the maximum reported pct; a null
// pct is an unreported analyte and is excluded from the ranking outright, so
// absence can never rank as a zero. Ties break on name for a stable order.
function rankLovedTerpenes(rows: SummaryTerpene[], lovedCoaIds: Set<string>) {
  const best = new Map<string, number>();
  for (const row of rows) {
    if (row.pct === null || !lovedCoaIds.has(row.coa_id)) continue;
    const current = best.get(row.name);
    if (current === undefined || row.pct > current) best.set(row.name, row.pct);
  }
  return [...best.entries()]
    .map(([name, pct]) => ({ name, pct }))
    .sort((a, b) => (b.pct !== a.pct ? b.pct - a.pct : a.name.localeCompare(b.name)))
    .slice(0, 3);
}

// The whole summary, computed client-side over session_current merged with the
// unfiltered catalog (D98: no new view, no migration -- session_current is
// already the one source of per-session grain, and this is that consumer).
export function buildSummary(
  sessions: SummarySession[],
  coas: SummaryCoa[],
  terpenes: SummaryTerpene[]
): PreferenceSummaryProps {
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

  const lovedSessions = sessions.filter((session) => session.overall_word === 'Loved');
  const lovedCoaIds = new Set(lovedSessions.map((session) => session.coa_id));
  const lovedCoas = coas.filter((coa) => lovedCoaIds.has(coa.id));

  return {
    sessionCount: sessions.length,
    distribution,
    buyAgainCount: coas.filter((coa) => coa.favorite === true).length,
    loved: {
      terpenes: rankLovedTerpenes(terpenes, lovedCoaIds),
      thc: analyteRange(lovedCoas.map((coa) => coa.total_thc)),
      cbd: analyteRange(lovedCoas.map((coa) => coa.total_cbd)),
      lovedSessionCount: lovedSessions.length,
    },
    topEffects: rankTopEffects(sessions),
  };
}

export type SummaryResult = { ok: true; summary: PreferenceSummaryProps } | { ok: false; message: string };

// The Insights route's own fetch (D142's first consumer): the summary's
// three selects, exactly the shelf's shapes, merged by the same builder. The
// shelf keeps its five-select load because it also feeds the cards; this
// narrower read exists so Insights never rides the shelf's lifecycle.
export async function loadSummary(): Promise<SummaryResult> {
  const [sessionsResult, coasResult, terpenesResult] = await Promise.all([
    supabase.from('session_current').select('overall_word, coa_id, created_at, effects'),
    supabase.from('coas').select('id, favorite, total_thc, total_cbd, on_shelf_count'),
    supabase.from('coa_terpenes').select('coa_id, name, pct'),
  ]);
  const queryError = sessionsResult.error ?? coasResult.error ?? terpenesResult.error;
  if (queryError) {
    return { ok: false, message: queryError.message };
  }
  return {
    ok: true,
    summary: buildSummary(
      sessionsResult.data as SummarySession[],
      coasResult.data as SummaryCoa[],
      terpenesResult.data as SummaryTerpene[]
    ),
  };
}
