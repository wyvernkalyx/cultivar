import {
  buildInsights,
  buildShareText,
  formatPct,
  formatRangePct,
  type InsightCoa,
  type InsightSession,
  type InsightTerpene,
} from '../aggregate';

const coa = (id: string, over: Partial<InsightCoa> = {}): InsightCoa => ({
  id,
  strain: null,
  brand: null,
  favorite: null,
  total_thc: null,
  total_cbd: null,
  total_terpenes: null,
  on_shelf_count: 0,
  ...over,
});
const s = (coaId: string, word: string | null): InsightSession => ({
  coa_id: coaId,
  overall_word: word,
});
const t = (coaId: string, name: string, pct: number | null): InsightTerpene => ({
  coa_id: coaId,
  name,
  pct,
});

describe('verdict sets derive from RUNGS scores', () => {
  const coas = [coa('a'), coa('b'), coa('c')];
  const sessions = [
    s('a', 'Loved'),
    s('b', 'Liked'),
    s('b', 'Neutral'),
    s('c', 'Disliked'),
    s('c', 'Hated'),
    s('a', 'SomeFutureWord'),
    s('a', null),
  ];
  const out = buildInsights(sessions, coas, []);

  it('target counts Loved sessions only', () => {
    expect(out.target.sessionCount).toBe(1);
    expect(out.target.coaCount).toBe(1);
  });
  it('avoid counts Disliked and Hated sessions', () => {
    expect(out.avoid.sessionCount).toBe(2);
    expect(out.avoid.coaCount).toBe(1);
  });
  it('Liked, Neutral, unknown words, and null land in neither profile', () => {
    // 7 sessions total; 1 target + 2 avoid; the other 4 shape no profile.
    expect(out.sessionCount).toBe(7);
  });
  it('subtitle strainCount is distinct session COAs, not session count', () => {
    expect(out.strainCount).toBe(3);
  });
});

describe('a COA rated at both extremes appears in both profiles', () => {
  const out = buildInsights(
    [s('x', 'Loved'), s('x', 'Hated')],
    [coa('x', { total_thc: 20 })],
    [t('x', 'Myrcene', 0.5)]
  );
  it('is in target and avoid with the same chemistry facts', () => {
    expect(out.target.coaCount).toBe(1);
    expect(out.avoid.coaCount).toBe(1);
    expect(out.target.thc).toEqual({ min: 20, max: 20, ndCount: 0 });
    expect(out.avoid.terpenes).toEqual([
      { name: 'Myrcene', min: 0.5, max: 0.5, reportedCount: 1, ndRowCount: 0 },
    ]);
  });
});

describe('analyte ranges: reported values only, ND counted beside', () => {
  const coas = [
    coa('a', { total_thc: 22.5, total_cbd: null, total_terpenes: 1.5 }),
    coa('b', { total_thc: 18.1, total_cbd: null, total_terpenes: 3.3 }),
    coa('c', { total_thc: null, total_cbd: null, total_terpenes: null }),
  ];
  const sessions = [s('a', 'Loved'), s('b', 'Loved'), s('c', 'Loved')];
  const out = buildInsights(sessions, coas, []);

  it('THC range spans reported values with nulls in ndCount', () => {
    expect(out.target.thc).toEqual({ min: 18.1, max: 22.5, ndCount: 1 });
  });
  it('total terpenes gets the same reported-only range', () => {
    expect(out.target.totalTerpenes).toEqual({ min: 1.5, max: 3.3, ndCount: 1 });
  });
  it('an analyte with zero reported values is null, never a zero range', () => {
    expect(out.target.cbd).toBeNull();
  });
});

describe('terpene ranges', () => {
  const coas = [coa('a'), coa('b'), coa('c'), coa('z')];
  const sessions = [s('a', 'Loved'), s('b', 'Loved'), s('c', 'Loved')];
  const rows = [
    t('a', 'Myrcene', 0.36),
    t('b', 'Myrcene', 0.9),
    t('c', 'Myrcene', null), // ND row: joins no range, counted
    t('a', 'Limonene', 0.9), // ties Myrcene's max -> name breaks the tie
    t('a', 'Humulene', null),
    t('b', 'Humulene', null), // every in-set row null -> dropped
    t('z', 'Pinene', 3.0), // out-of-set COA: excluded entirely
  ];
  const out = buildInsights(sessions, coas, rows);

  it('range spans reported in-set values; null rows counted as ndRowCount', () => {
    expect(out.target.terpenes).toContainEqual({
      name: 'Myrcene',
      min: 0.36,
      max: 0.9,
      reportedCount: 2,
      ndRowCount: 1,
    });
  });
  it('a name with only null rows is dropped, not ranged at zero', () => {
    expect(out.target.terpenes.map((row) => row.name)).not.toContain('Humulene');
  });
  it('rows from COAs outside the set never contribute', () => {
    expect(out.target.terpenes.map((row) => row.name)).not.toContain('Pinene');
  });
  it('orders by max desc with name asc on ties', () => {
    expect(out.target.terpenes.map((row) => row.name)).toEqual(['Limonene', 'Myrcene']);
  });
  it('a COA with no row for a name is neither reported nor ND for it', () => {
    const myrcene = out.target.terpenes.find((row) => row.name === 'Myrcene');
    // 3 COAs in set; 2 reported + 1 ND row. Nothing invented a 4th fact.
    expect((myrcene?.reportedCount ?? 0) + (myrcene?.ndRowCount ?? 0)).toBe(3);
  });
});

describe('buy again', () => {
  const coas = [
    coa('b', { strain: 'Zeta', brand: 'BrandB', favorite: true, on_shelf_count: 1, total_thc: 27.05, total_terpenes: 3.3375 }),
    coa('a', { strain: 'Alpha', favorite: true, on_shelf_count: 0 }),
    coa('n', { strain: null, favorite: true, on_shelf_count: 1 }),
    coa('c', { strain: 'Gamma', favorite: false, on_shelf_count: 1 }),
    coa('d', { strain: 'Delta', favorite: null, on_shelf_count: 1 }),
  ];
  const rows = [
    t('b', 'Caryophyllene', 2.0),
    t('b', 'Humulene', 0.64),
    t('b', 'Linalool', null), // unreported: can never top the ranking
    t('a', 'Myrcene', null), // only null rows -> no top terpene
  ];
  const out = buildInsights([], coas, rows);

  it('includes favorite === true only; false and null are different answers', () => {
    expect(out.buyAgain.map((row) => row.coaId)).toEqual(['a', 'b', 'n']);
  });
  it('sorts by strain with absent strain last, then id', () => {
    expect(out.buyAgain.map((row) => row.strain)).toEqual(['Alpha', 'Zeta', null]);
  });
  it('carries display facts and the binary in-stash read', () => {
    expect(out.buyAgain[1]).toEqual({
      coaId: 'b',
      strain: 'Zeta',
      brand: 'BrandB',
      inStash: true,
      totalThc: 27.05,
      totalTerpenes: 3.3375,
      topTerpene: { name: 'Caryophyllene', pct: 2.0 },
    });
  });
  it('a COA with no reported terpene rows has null topTerpene, never invented', () => {
    expect(out.buyAgain[0].topTerpene).toBeNull();
  });
});

describe('top terpene tie', () => {
  const out = buildInsights([], [coa('b', { favorite: true })], [
    t('b', 'Limonene', 0.9),
    t('b', 'Caryophyllene', 0.9),
  ]);
  it('breaks on name asc for a stable order', () => {
    expect(out.buyAgain[0].topTerpene).toEqual({ name: 'Caryophyllene', pct: 0.9 });
  });
});

describe('formatting', () => {
  it('formatPct trims to at most two decimals', () => {
    expect(formatPct(22.5)).toBe('22.5%');
    expect(formatPct(29.5444)).toBe('29.54%');
    expect(formatPct(2)).toBe('2%');
  });
  it('formatRangePct renders min-max with an en dash, collapsing equal ends', () => {
    expect(formatRangePct({ min: 18.1, max: 22.5, ndCount: 0 })).toBe('18.1–22.5%');
    expect(formatRangePct({ min: 20, max: 20, ndCount: 1 })).toBe('20%');
    expect(formatRangePct(null)).toBeNull();
  });
});

describe('share text', () => {
  it('composes the ask with ND stated for unreported analytes, never 0%', () => {
    const out = buildInsights(
      [s('b', 'Loved')],
      [
        coa('b', { strain: 'Zeta', brand: 'BrandB', favorite: true, on_shelf_count: 1, total_thc: 27.05, total_terpenes: 3.34 }),
        coa('a', { strain: 'Alpha', favorite: true, on_shelf_count: 0 }),
      ],
      [t('b', 'Caryophyllene', 2.0)]
    );
    expect(buildShareText(out)).toBe(
      [
        'What I’m looking for:',
        'Caryophyllene',
        'THC 27.05% · CBD ND · terps 3.34%',
        '',
        'Would buy again:',
        '- Alpha',
        '- Zeta (BrandB)',
      ].join('\n')
    );
  });
  it('an empty log yields the honest one-liner', () => {
    expect(buildShareText(buildInsights([], [], []))).toBe('Nothing logged yet.');
  });
  it('buy-again alone renders without a phantom profile section', () => {
    const out = buildInsights([], [coa('a', { strain: 'Alpha', favorite: true })], []);
    expect(buildShareText(out)).toBe(['Would buy again:', '- Alpha'].join('\n'));
  });
});

describe('empty log', () => {
  const out = buildInsights([], [], []);
  it('yields zero counts, null ranges, empty lists -- no invention', () => {
    expect(out.sessionCount).toBe(0);
    expect(out.strainCount).toBe(0);
    const emptyProfile = {
      coaCount: 0,
      sessionCount: 0,
      terpenes: [],
      // D147: an empty set has empty profile groups and zero buckets --
      // the no-invention property now asserted at the profile grain too.
      profiles: { groups: [], noDataCoaCount: 0, noDataSessionCount: 0 },
      thc: null,
      cbd: null,
      totalTerpenes: null,
    };
    expect(out.target).toEqual(emptyProfile);
    expect(out.avoid).toEqual(emptyProfile);
    expect(out.buyAgain).toEqual([]);
  });
});
