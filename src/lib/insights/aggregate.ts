import { RUNGS } from '../lexicon';

/**
 * D142 Insights aggregation -- pure library, wired to nothing (slice 7a).
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
  favorite: boolean | null;
  total_thc: number | null;
  total_cbd: number | null;
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
};
export type BuyAgainRow = { coaId: string; inStash: boolean };
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
    buyAgain: coas
      .filter((coa) => coa.favorite === true)
      .map((coa) => ({ coaId: coa.id, inStash: coa.on_shelf_count > 0 }))
      .sort((a, b) => a.coaId.localeCompare(b.coaId)),
  };
}
