import type { CardCannabinoid, CardSession, CardTerpene } from '@/components/shelf-card';

// The row shapes the card inputs are built from, exactly the columns the
// surfaces select. Two surfaces now build card inputs -- the shelf (D99) and
// the off-shelf archive (D101) -- so the grouping conventions live in one
// module rather than being restated per surface.

// The per-session inputs (D98/D99), exactly the columns selected. A live
// session is one row of session_current (D59: latest-then-filter, soft
// deletes already excluded), so the row count IS the all-time session count.
// One fetch serves both the summary's distribution and the per-card dots.
export type SummarySession = { overall_word: string | null; coa_id: string; created_at: string };

export type SummaryTerpene = { coa_id: string; name: string; pct: number | null };

// This COA's live sessions, ascending by time, for the card's verdict dots
// (D99). An absent word keeps its session — the session happened, and the
// card renders it faint rather than dropping it, so the count stays honest.
export function groupSessionsByCoa(sessions: SummarySession[]): Map<string, CardSession[]> {
  const byCoa = new Map<string, CardSession[]>();
  for (const session of sessions) {
    const existing = byCoa.get(session.coa_id);
    const entry = { word: session.overall_word ?? '', at: session.created_at };
    if (existing === undefined) byCoa.set(session.coa_id, [entry]);
    else existing.push(entry);
  }
  for (const entries of byCoa.values()) {
    entries.sort((a, b) => a.at.localeCompare(b.at));
  }
  return byCoa;
}

// Per-COA top-3 reported terpenes for the fingerprint bar, the same ranking
// convention the slice-1 summary uses: a null pct is an unreported analyte
// and is excluded outright, so absence can never rank as a zero; ties break
// on name for a stable order across refetches.
export function groupTopTerpenesByCoa(rows: SummaryTerpene[]): Map<string, CardTerpene[]> {
  const byCoa = new Map<string, CardTerpene[]>();
  for (const row of rows) {
    if (row.pct === null) continue;
    const entry = { name: row.name, pct: row.pct };
    const existing = byCoa.get(row.coa_id);
    if (existing === undefined) byCoa.set(row.coa_id, [entry]);
    else existing.push(entry);
  }
  for (const [coaId, entries] of byCoa) {
    entries.sort((a, b) => (b.pct !== a.pct ? b.pct - a.pct : a.name.localeCompare(b.name)));
    byCoa.set(coaId, entries.slice(0, 3));
  }
  return byCoa;
}

export type SummaryCannabinoid = { coa_id: string; name: string; pct: number | null };

// Per-COA top-3 reported cannabinoids for the card's D132 line, the
// groupTopTerpenesByCoa convention exactly: a null pct is an unreported
// analyte and is excluded outright, so absence can never rank as a zero;
// ties break on name for a stable order across refetches. Deliberately a
// sibling, not a shared generic -- generalization is banked until a third
// analyte family needs it.
export function groupTopCannabinoidsByCoa(
  rows: SummaryCannabinoid[]
): Map<string, CardCannabinoid[]> {
  const byCoa = new Map<string, CardCannabinoid[]>();
  for (const row of rows) {
    if (row.pct === null) continue;
    const entry = { name: row.name, pct: row.pct };
    const existing = byCoa.get(row.coa_id);
    if (existing === undefined) byCoa.set(row.coa_id, [entry]);
    else existing.push(entry);
  }
  for (const [coaId, entries] of byCoa) {
    entries.sort((a, b) => (b.pct !== a.pct ? b.pct - a.pct : a.name.localeCompare(b.name)));
    byCoa.set(coaId, entries.slice(0, 3));
  }
  return byCoa;
}
