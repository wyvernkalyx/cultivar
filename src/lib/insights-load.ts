import type { PreferenceSummaryProps } from '@/components/preference-summary';
import { buildSummary, type SummaryCoa } from '@/lib/summary';
import { buildInsights, type Insights, type InsightCoa } from '@/lib/insights/aggregate';
import type { SummarySession, SummaryTerpene } from '@/lib/card-data';
import { supabase } from '@/lib/supabase';

// The Insights screen's one fetch (D142, slice 7b-ii). The screen renders
// both the new surfaces (buildInsights) and the kept preference summary
// (buildSummary, operator ruling 2026-08-10: distribution and effects
// survive below Profiles to avoid) -- one set of selects feeds both
// builders, so the two can never disagree about which rows existed.
// Lives OUTSIDE src/lib/insights/ deliberately: that directory is the
// Jest-covered pure tree (no supabase, no RN), and this file is the wiring.

export type InsightsScreenData = { insights: Insights; summary: PreferenceSummaryProps };
export type InsightsScreenResult =
  | { ok: true; data: InsightsScreenData }
  | { ok: false; message: string };

export async function loadInsightsScreen(): Promise<InsightsScreenResult> {
  const [sessionsResult, coasResult, terpenesResult] = await Promise.all([
    supabase.from('session_current').select('overall_word, coa_id, created_at, effects'),
    supabase
      .from('coas')
      .select('id, strain, brand, favorite, total_thc, total_cbd, total_terpenes, on_shelf_count'),
    supabase.from('coa_terpenes').select('coa_id, name, pct'),
  ]);
  const queryError = sessionsResult.error ?? coasResult.error ?? terpenesResult.error;
  if (queryError) {
    return { ok: false, message: queryError.message };
  }
  const sessions = sessionsResult.data as SummarySession[];
  const coas = coasResult.data as (InsightCoa & SummaryCoa)[];
  const terpenes = terpenesResult.data as SummaryTerpene[];
  return {
    ok: true,
    data: {
      insights: buildInsights(sessions, coas, terpenes),
      summary: buildSummary(sessions, coas),
    },
  };
}
