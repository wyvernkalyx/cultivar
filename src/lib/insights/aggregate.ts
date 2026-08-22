import { RUNGS } from '../lexicon';

/**
 * D142 Insights aggregation -- pure library (slice 7a, extended in 7b-i for
 * the tab UI and Counter view: display facts on buy-again rows, the
 * total-terpenes range, and the share text composer).
 *
 * Personal-empirical discipline, restated where it is most at risk: every
 * number here is a description of reported lab values on products THIS user
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
export type TerpeneProfileCompanion = {
  name: string;
  /** Group members (COAs) on which this name is REPORTED beside the
   *  dominant. A co-occurrence count in the log, stated as such -- never a
   *  synergy or effect claim (D147.1). */
  coaCount: number;
};
export type TerpeneProfileGroup = {
  dominant: string;
  coaCount: number;
  sessionCount: number;
  /** Dominant pct across members, reported values only (D147.1). */
  dominantPct: { min: number; max: number };
  /** Top 3 by coaCount desc, then name asc (D147.1). */
  companions: TerpeneProfileCompanion[];
};
export type TerpeneProfiles = {
  /** Member count desc, then dominant name asc (D147.1). */
  groups: TerpeneProfileGroup[];
  /** COAs in the set with zero reported terpene rows: counted, displayed,
   *  never merged into a group and never invented (D147). */
  noDataCoaCount: number;
  noDataSessionCount: number;
};
export type ProfileProductTerpene = { name: string; pct: number };
/** D150: one product (COA) in a verdict set, rendered as its own fingerprint.
 *  topTerpenes follows the shelf card's rule (card-data.ts
 *  groupTopTerpenesByCoa): null pct is excluded outright, top 3 by pct, name
 *  tiebreak. An empty list with a null or zero total is the no-data case,
 *  rendered as such -- never an empty track. */
export type ProfileProduct = {
  coaId: string;
  strain: string | null;
  brand: string | null;
  totalTerpenes: number | null;
  topTerpenes: ProfileProductTerpene[];
};
export type ChemistryProfile = {
  coaCount: number;
  sessionCount: number;
  /** D150: the set's products, strain asc (absent last), brand asc, id asc. */
  products: ProfileProduct[];
  /** Every name with >= 1 reported value in the set; max pct desc, name asc.
   *  Retained for the share text (D147 non-goal); the cards render profiles. */
  terpenes: TerpeneRange[];
  /** D147: per-COA profiles grouped by dominant terpene. */
  profiles: TerpeneProfiles;
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

// D147: per-COA profiles grouped by dominant terpene. The profile grain is
// the COA's own reported rows, pct desc with name-asc ties (the
// topReportedTerpene ordering, generalized to the full list); null rows join
// nothing. A COA with zero reported rows lands in the no-data bucket:
// counted, never merged, never invented. Groups count distinct COAs
// (D147.2); session counts ride beside as evidence weight. Companions count
// each non-dominant reported NAME once per member COA (D147.1).
function terpeneProfiles(
  terpenes: InsightTerpene[],
  coaIds: Set<string>,
  sessionsByCoa: Map<string, number>
): TerpeneProfiles {
  const rowsByCoa = new Map<string, { name: string; pct: number }[]>();
  for (const id of coaIds) rowsByCoa.set(id, []);
  for (const row of terpenes) {
    if (!coaIds.has(row.coa_id) || row.pct === null) continue;
    rowsByCoa.get(row.coa_id)!.push({ name: row.name, pct: row.pct });
  }
  type GroupEntry = {
    coaCount: number;
    sessionCount: number;
    min: number;
    max: number;
    companionCoas: Map<string, number>;
  };
  const groups = new Map<string, GroupEntry>();
  let noDataCoaCount = 0;
  let noDataSessionCount = 0;
  for (const [coaId, rows] of rowsByCoa) {
    const sessionCount = sessionsByCoa.get(coaId) ?? 0;
    if (rows.length === 0) {
      noDataCoaCount += 1;
      noDataSessionCount += sessionCount;
      continue;
    }
    rows.sort((a, b) => (b.pct !== a.pct ? b.pct - a.pct : a.name.localeCompare(b.name)));
    const dominant = rows[0];
    let entry = groups.get(dominant.name);
    if (entry === undefined) {
      entry = {
        coaCount: 0,
        sessionCount: 0,
        min: dominant.pct,
        max: dominant.pct,
        companionCoas: new Map(),
      };
      groups.set(dominant.name, entry);
    }
    entry.coaCount += 1;
    entry.sessionCount += sessionCount;
    entry.min = Math.min(entry.min, dominant.pct);
    entry.max = Math.max(entry.max, dominant.pct);
    const seen = new Set<string>();
    for (const row of rows) {
      if (row.name === dominant.name || seen.has(row.name)) continue;
      seen.add(row.name);
      entry.companionCoas.set(row.name, (entry.companionCoas.get(row.name) ?? 0) + 1);
    }
  }
  return {
    groups: [...groups.entries()]
      .map(([dominant, entry]) => ({
        dominant,
        coaCount: entry.coaCount,
        sessionCount: entry.sessionCount,
        dominantPct: { min: entry.min, max: entry.max },
        companions: [...entry.companionCoas.entries()]
          .map(([name, coaCount]) => ({ name, coaCount }))
          .sort((a, b) =>
            b.coaCount !== a.coaCount ? b.coaCount - a.coaCount : a.name.localeCompare(b.name)
          )
          .slice(0, 3),
      }))
      .sort((a, b) =>
        b.coaCount !== a.coaCount ? b.coaCount - a.coaCount : a.dominant.localeCompare(b.dominant)
      ),
    noDataCoaCount,
    noDataSessionCount,
  };
}

// D150: per-product top-3 reported terpenes, the card-data convention
// restated here rather than imported: this tree is the Jest-covered pure
// library and card-data.ts sits outside it. Null pct never ranks; a product
// with no reported rows gets an empty list, which the screen states as
// "No reported terpene data" -- absence rendered as absence.
function profileProducts(coas: InsightCoa[], terpenes: InsightTerpene[]): ProfileProduct[] {
  const byCoa = new Map<string, ProfileProductTerpene[]>();
  for (const row of terpenes) {
    if (row.pct === null) continue;
    const entry = { name: row.name, pct: row.pct };
    const existing = byCoa.get(row.coa_id);
    if (existing === undefined) byCoa.set(row.coa_id, [entry]);
    else existing.push(entry);
  }
  return coas
    .map((coa) => ({
      coaId: coa.id,
      strain: coa.strain,
      brand: coa.brand,
      totalTerpenes: coa.total_terpenes,
      topTerpenes: (byCoa.get(coa.id) ?? [])
        .sort((a, b) => (b.pct !== a.pct ? b.pct - a.pct : a.name.localeCompare(b.name)))
        .slice(0, 3),
    }))
    .sort((a, b) => {
      if (a.strain === null && b.strain !== null) return 1;
      if (a.strain !== null && b.strain === null) return -1;
      const byStrain = (a.strain ?? '').localeCompare(b.strain ?? '');
      if (byStrain !== 0) return byStrain;
      const byBrand = (a.brand ?? '').localeCompare(b.brand ?? '');
      return byBrand !== 0 ? byBrand : a.coaId.localeCompare(b.coaId);
    });
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
  const sessionsByCoa = new Map<string, number>();
  for (const session of matching) {
    sessionsByCoa.set(session.coa_id, (sessionsByCoa.get(session.coa_id) ?? 0) + 1);
  }
  const setCoas = coas.filter((coa) => coaIds.has(coa.id));
  return {
    coaCount: setCoas.length,
    sessionCount: matching.length,
    products: profileProducts(setCoas, terpenes),
    terpenes: terpeneRanges(terpenes, coaIds),
    profiles: terpeneProfiles(terpenes, coaIds, sessionsByCoa),
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
