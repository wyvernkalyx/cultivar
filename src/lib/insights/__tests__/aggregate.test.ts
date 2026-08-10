import {
  buildInsights,
  type InsightCoa,
  type InsightSession,
  type InsightTerpene,
} from '../aggregate';

const coa = (id: string, over: Partial<InsightCoa> = {}): InsightCoa => ({
  id,
  favorite: null,
  total_thc: null,
  total_cbd: null,
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
    coa('a', { total_thc: 22.5, total_cbd: null }),
    coa('b', { total_thc: 18.1, total_cbd: null }),
    coa('c', { total_thc: null, total_cbd: null }),
  ];
  const sessions = [s('a', 'Loved'), s('b', 'Loved'), s('c', 'Loved')];
  const out = buildInsights(sessions, coas, []);

  it('THC range spans reported values with nulls in ndCount', () => {
    expect(out.target.thc).toEqual({ min: 18.1, max: 22.5, ndCount: 1 });
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
    coa('b', { favorite: true, on_shelf_count: 1 }),
    coa('a', { favorite: true, on_shelf_count: 0 }),
    coa('c', { favorite: false, on_shelf_count: 1 }),
    coa('d', { favorite: null, on_shelf_count: 1 }),
  ];
  const out = buildInsights([], coas, []);

  it('includes favorite === true only; false and null are different answers', () => {
    expect(out.buyAgain.map((row) => row.coaId)).toEqual(['a', 'b']);
  });
  it('inStash is the binary read of on_shelf_count', () => {
    expect(out.buyAgain).toEqual([
      { coaId: 'a', inStash: false },
      { coaId: 'b', inStash: true },
    ]);
  });
});

describe('empty log', () => {
  const out = buildInsights([], [], []);
  it('yields zero counts, null ranges, empty lists -- no invention', () => {
    expect(out.sessionCount).toBe(0);
    expect(out.strainCount).toBe(0);
    expect(out.target).toEqual({ coaCount: 0, sessionCount: 0, terpenes: [], thc: null, cbd: null });
    expect(out.avoid).toEqual({ coaCount: 0, sessionCount: 0, terpenes: [], thc: null, cbd: null });
    expect(out.buyAgain).toEqual([]);
  });
});
