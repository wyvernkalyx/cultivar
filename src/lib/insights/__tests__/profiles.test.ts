import {
  buildInsights,
  type InsightCoa,
  type InsightSession,
  type InsightTerpene,
} from '../aggregate';

// D147 terpene profiles: per-COA profiles grouped by dominant terpene.
// Fixtures mirror aggregate.test.ts: 'Loved' is the score-5 target word,
// 'Hated' score 1 in the avoid set (D85.1 -- scores, not strings).

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

describe('D147 profile grouping', () => {
  it('groups loved COAs by dominant terpene, COA-grain with session counts beside', () => {
    const coas = [coa('a'), coa('b'), coa('c')];
    // a: myrcene-dominant, 2 loved sessions. b: myrcene-dominant, 1 session.
    // c: limonene-dominant, 1 session.
    const sessions = [s('a', 'Loved'), s('a', 'Loved'), s('b', 'Loved'), s('c', 'Loved')];
    const terpenes = [
      t('a', 'Myrcene', 1.2),
      t('a', 'Caryophyllene', 0.5),
      t('b', 'Myrcene', 0.8),
      t('b', 'Limonene', 0.3),
      t('c', 'Limonene', 0.9),
    ];
    const { groups, noDataCoaCount } = buildInsights(sessions, coas, terpenes).target.profiles;
    expect(noDataCoaCount).toBe(0);
    expect(groups).toHaveLength(2);
    // Member count desc: Myrcene (2 COAs, 3 sessions) before Limonene (1, 1).
    expect(groups[0]).toEqual({
      dominant: 'Myrcene',
      coaCount: 2,
      sessionCount: 3,
      dominantPct: { min: 0.8, max: 1.2 },
      companions: [
        { name: 'Caryophyllene', coaCount: 1 },
        { name: 'Limonene', coaCount: 1 },
      ],
    });
    expect(groups[1]).toEqual({
      dominant: 'Limonene',
      coaCount: 1,
      sessionCount: 1,
      dominantPct: { min: 0.9, max: 0.9 },
      companions: [],
    });
  });

  it('orders equal-count groups by dominant name ascending', () => {
    const coas = [coa('a'), coa('b')];
    const sessions = [s('a', 'Loved'), s('b', 'Loved')];
    const terpenes = [t('a', 'Terpinolene', 1.0), t('b', 'Myrcene', 1.0)];
    const { groups } = buildInsights(sessions, coas, terpenes).target.profiles;
    expect(groups.map((group) => group.dominant)).toEqual(['Myrcene', 'Terpinolene']);
  });

  it('resolves an exact dominant tie by name ascending and keeps the tied name as a companion (D147.3)', () => {
    const coas = [coa('a')];
    const sessions = [s('a', 'Loved')];
    const terpenes = [t('a', 'Pinene', 0.7), t('a', 'Limonene', 0.7), t('a', 'Myrcene', 0.2)];
    const { groups } = buildInsights(sessions, coas, terpenes).target.profiles;
    expect(groups).toHaveLength(1);
    expect(groups[0].dominant).toBe('Limonene');
    // The tied name sorts first among companions at its true standing.
    expect(groups[0].companions).toEqual([
      { name: 'Myrcene', coaCount: 1 },
      { name: 'Pinene', coaCount: 1 },
    ]);
  });

  it('caps companions at the top 3 by member count desc, then name asc (D147.1)', () => {
    const coas = [coa('a'), coa('b')];
    const sessions = [s('a', 'Loved'), s('b', 'Loved')];
    const terpenes = [
      t('a', 'Myrcene', 2.0),
      t('b', 'Myrcene', 1.5),
      // On both members:
      t('a', 'Caryophyllene', 0.4),
      t('b', 'Caryophyllene', 0.3),
      // On one member each:
      t('a', 'Humulene', 0.2),
      t('a', 'Linalool', 0.2),
      t('b', 'Bisabolol', 0.1),
    ];
    const { groups } = buildInsights(sessions, coas, terpenes).target.profiles;
    expect(groups[0].companions).toEqual([
      { name: 'Caryophyllene', coaCount: 2 },
      { name: 'Bisabolol', coaCount: 1 },
      { name: 'Humulene', coaCount: 1 },
    ]);
  });
});

describe('D147 ND-null discipline at the profile grain', () => {
  it('null rows never rank, never join, and an all-ND COA lands in the no-data bucket', () => {
    const coas = [coa('a'), coa('b')];
    const sessions = [s('a', 'Loved'), s('b', 'Loved'), s('b', 'Loved')];
    const terpenes = [
      t('a', 'Myrcene', null), // ND on a: joins nothing
      t('a', 'Limonene', 0.6), // a's true dominant
      t('b', 'Myrcene', null), // b is all-ND: no profile
    ];
    const profiles = buildInsights(sessions, coas, terpenes).target.profiles;
    expect(profiles.groups).toHaveLength(1);
    expect(profiles.groups[0].dominant).toBe('Limonene');
    expect(profiles.groups[0].companions).toEqual([]);
    expect(profiles.noDataCoaCount).toBe(1);
    expect(profiles.noDataSessionCount).toBe(2);
  });

  it('a COA with no terpene rows at all is no-data, not invented', () => {
    const coas = [coa('a')];
    const sessions = [s('a', 'Loved')];
    const profiles = buildInsights(sessions, coas, []).target.profiles;
    expect(profiles.groups).toEqual([]);
    expect(profiles.noDataCoaCount).toBe(1);
    expect(profiles.noDataSessionCount).toBe(1);
  });

  it('an empty verdict set yields empty groups and zero buckets', () => {
    const profiles = buildInsights([], [], []).target.profiles;
    expect(profiles.groups).toEqual([]);
    expect(profiles.noDataCoaCount).toBe(0);
    expect(profiles.noDataSessionCount).toBe(0);
  });
});

describe('D147 set membership and coexistence with the pooled list', () => {
  it('a COA rated into both sets profiles in both (the standing both-profiles rule)', () => {
    const coas = [coa('a')];
    const sessions = [s('a', 'Loved'), s('a', 'Hated')];
    const terpenes = [t('a', 'Myrcene', 1.0)];
    const insights = buildInsights(sessions, coas, terpenes);
    expect(insights.target.profiles.groups[0].dominant).toBe('Myrcene');
    expect(insights.avoid.profiles.groups[0].dominant).toBe('Myrcene');
  });

  it('the pooled terpene ranges remain beside profiles (share text, D147 non-goal)', () => {
    const coas = [coa('a')];
    const sessions = [s('a', 'Loved')];
    const terpenes = [t('a', 'Myrcene', 1.0), t('a', 'Limonene', 0.4)];
    const target = buildInsights(sessions, coas, terpenes).target;
    expect(target.terpenes.map((row) => row.name)).toEqual(['Myrcene', 'Limonene']);
    expect(target.profiles.groups[0].dominant).toBe('Myrcene');
  });
});
