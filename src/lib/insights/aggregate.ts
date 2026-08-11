import { RUNGS } from '../lexicon';

/**
 * D142 Insights aggregation -- pure library (slice 7a, extended in 7b-i for
 * the tab UI and Counter view: display facts on buy-again rows, the
 * total-terpenes range, and the share text composer).
 *
 * Personal-empirical discipline, restated where it is most at risk: every
 * number here is a description of reported lab values on batches THIS user
 * rated, never an effect claim. ND / not-reported is null and joins no
 * range (the D98 binding, verbatim from summary.ts): a range never
 * manufactures a zero lower bound, and an analyte nobody reported yields
 * null, not a range of zeros.
 *
 * Verdict sets derive from RUNGS by hidden score, not by string: score 5 is
 * the target set, scores 1-2 the avoid set. The hidden 1-5 mapping is the
 * stable thing across lexicon versions (D85.1); words are not.
 *
 * A COA rated Loved in one session and Hated in another appears in BOTH
 * profiles. That is a fact about the log, stated as such -- reconciling it
 * would be an editorial claim this library has no license to make.
 */

export type InsightSession = { coa_id: string; overall_word: string | null };
export type InsightCoa = {
  id: string;
  strain: string | null;
  brand: string | null;
  favorite: boolean | null;
  total_thc: number | null;
  total_cbd: number | null;
  total_terpenes: number | null;
  on_shelf_count: number;
};
export type InsightTerpene = { coa_id: string; name: string; pct: number | null };

export type AnalyteRange = { min: number; max: number; ndCount: number };
export type TerpeneRange = {
  name: string;
  min: number;
  max: number;
  /** COAs in the verdict set with a reported (non-null) value for this name. */
  reportedCount: number;
  /** Rows in the verdict set carrying this name with pct null (lab said ND /
   *  not quantified). A COA with NO row for the name is neither reported nor
   *  ND -- the lab never listed it, and absence is not a fact about it. */
  ndRowCount: number;
};
export type ChemistryProfile = {
  coaCount: number;
  sessionCount: number;
  /** Every name with >= 1 reported value in the set; max pct desc, name asc. */
  terpenes: TerpeneRange[];
  thc: AnalyteRange | null;
  cbd: AnalyteRange | null;
  totalTerpenes: AnalyteRange | null;
};
export type BuyAgainRow = {
  coaId: string;
  strain: string | null;
  brand: string | null;
  inStash: boolean;
  totalThc: number | null;
  totalTerpenes: number | null;
  /** Highest reported terpene on this COA; null when nothing is reported.
   *  Reported values only -- a null pct row can never top this ranking. */
  topTerpene: { name: string; pct: number } | null;
};
export type Insights = {
  sessionCount: number;
  /** Distinct COAs carrying at least one session -- the subtitle's "strains". */
  strainCount: number;
  target: ChemistryProfile;
  avoid: ChemistryProfile;
  buyAgain: BuyAgainRow[];
};

const TARGET_WORDS = new Set(RUNGS.filter((rung) => rung.score === 5).map((rung) => rung.word));
const AVOID_WORDS = new Set(RUNGS.filter((rung) => rung.score <= 2).map((rung) => rung.word));

// Min/max over REPORTED values only; nulls counted beside, never folded in.
// All-null (or empty) input yields null: no reported value, no range.
function analyteRange(values: (number | null)[]): AnalyteRange | null {
  const reported = values.filter((value): value is number => value !== null);
  if (reported.length === 0) return null;
  return {
    min: Math.min(...reported),
    max: Math.max(...reported),
    ndCount: values.length - reported.length,
  };
}

// Per-name ranges over the rows belonging to the given COA set. A name whose
// every in-set row is null has no range and is dropped: with zero reported
// values there is nothing to describe, and describing it anyway would be
// the fabrication this app exists to refuse.
function terpeneRanges(rows: InsightTerpene[], coaIds: Set<string>): TerpeneRange[] {
  const byName = new Map<string, { min: number; max: number; reportedCount: number; ndRowCount: number }>();
  for (const row of rows) {
    if (!coaIds.has(row.coa_id)) continue;
    const entry = byName.get(row.name) ?? {
      min: Infinity,
      max: -Infinity,
      reportedCount: 0,
      ndRowCount: 0,
    };
    if (row.pct === null) {
      entry.ndRowCount += 1;
    } else {
      entry.min = Math.min(entry.min, row.pct);
      entry.max = Math.max(entry.max, row.pct);
      entry.reportedCount += 1;
    }
    byName.set(row.name, entry);
  }
  return [...byName.entries()]
    .filter(([, entry]) => entry.reportedCount > 0)
    .map(([name, entry]) => ({
      name,
      min: entry.min,
      max: entry.max,
      reportedCount: entry.reportedCount,
      ndRowCount: entry.ndRowCount,
    }))
    .sort((a, b) => (b.max !== a.max ? b.max - a.max : a.name.localeCompare(b.name)));
}

// The COA's own loudest reported terpene. Null pct rows are unreported and
// can never rank; a COA with no reported rows has no top terpene, stated as
// null rather than invented. Ties break on name for a stable order.
function topReportedTerpene(rows: InsightTerpene[], coaId: string): BuyAgainRow['topTerpene'] {
  let best: { name: string; pct: number } | null = null;
  for (const row of rows) {
    if (row.coa_id !== coaId || row.pct === null) continue;
    if (
      best === null ||
      row.pct > best.pct ||
      (row.pct === best.pct && row.name.localeCompare(best.name) < 0)
    ) {
      best = { name: row.name, pct: row.pct };
    }
  }
  return best;
}

function buildProfile(
  words: Set<string>,
  sessions: InsightSession[],
  coas: InsightCoa[],
  terpenes: InsightTerpene[]
): ChemistryProfile {
  const matching = sessions.filter(
    (session) => session.overall_word !== null && words.has(session.overall_word)
  );
  const coaIds = new Set(matching.map((session) => session.coa_id));
  const setCoas = coas.filter((coa) => coaIds.has(coa.id));
  return {
    coaCount: setCoas.length,
    sessionCount: matching.length,
    terpenes: terpeneRanges(terpenes, coaIds),
    thc: analyteRange(setCoas.map((coa) => coa.total_thc)),
    cbd: analyteRange(setCoas.map((coa) => coa.total_cbd)),
    totalTerpenes: analyteRange(setCoas.map((coa) => coa.total_terpenes)),
  };
}

export function buildInsights(
  sessions: InsightSession[],
  coas: InsightCoa[],
  terpenes: InsightTerpene[]
): Insights {
  return {
    sessionCount: sessions.length,
    strainCount: new Set(sessions.map((session) => session.coa_id)).size,
    target: buildProfile(TARGET_WORDS, sessions, coas, terpenes),
    avoid: buildProfile(AVOID_WORDS, sessions, coas, terpenes),
    // favorite === true only: false and null are different answers (D48) and
    // neither belongs on this list. inStash is D139's binary read of the count.
    // Sorted by strain (absent last), then id, for a stable render order.
    buyAgain: coas
      .filter((coa) => coa.favorite === true)
      .map((coa) => ({
        coaId: coa.id,
        strain: coa.strain,
        brand: coa.brand,
        inStash: coa.on_shelf_count > 0,
        totalThc: coa.total_thc,
        totalTerpenes: coa.total_terpenes,
        topTerpene: topReportedTerpene(terpenes, coa.id),
      }))
      .sort((a, b) => {
        if (a.strain === null && b.strain !== null) return 1;
        if (a.strain !== null && b.strain === null) return -1;
        const byStrain = (a.strain ?? '').localeCompare(b.strain ?? '');
        return byStrain !== 0 ? byStrain : a.coaId.localeCompare(b.coaId);
      }),
  };
}

/**
 * Display formatting -- pure and tested here so the UI never re-derives it.
 * Up to two decimals, trailing zeros trimmed; ranges collapse to the single
 * value when min === max; the en dash (–) is the reference's range form.
 */
export function formatPct(value: number): string {
  return `${Number(value.toFixed(2))}%`;
}

export function formatRangePct(range: AnalyteRange | null): string | null {
  if (range === null) return null;
  if (range.min === range.max) return formatPct(range.min);
  return `${Number(range.min.toFixed(2))}–${formatPct(range.max)}`;
}

/**
 * The Share text (D142, copy re-ratified at the device gate 2026-08-10):
 * human-first, the user's own ask -- terpene names and the three ranges,
 * with ND stated for anything unreported (never 0%, the ND-null
 * invariant). Deterministic, no trailing whitespace; sections render only
 * when they have content; an empty log yields the honest one-liner.
 */
export function buildShareText(insights: Insights): string {
  const lines: string[] = [];
  const { target, buyAgain } = insights;
  if (target.coaCount > 0) {
    lines.push('What I’m looking for:');
    if (target.terpenes.length > 0) {
      lines.push(target.terpenes.slice(0, 3).map((row) => row.name).join(', '));
    }
    const fact = (label: string, range: AnalyteRange | null) =>
      `${label} ${formatRangePct(range) ?? 'ND'}`;
    lines.push(
      [fact('THC', target.thc), fact('CBD', target.cbd), fact('terps', target.totalTerpenes)].join(
        ' · '
      )
    );
  }
  if (buyAgain.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('Would buy again:');
    for (const row of buyAgain) {
      const name = row.strain?.trim() || 'Unnamed COA';
      const brand = row.brand?.trim() ? ` (${row.brand.trim()})` : '';
      lines.push(`- ${name}${brand}`);
    }
  }
  if (lines.length === 0) return 'Nothing logged yet.';
  return lines.join('\n');
}
