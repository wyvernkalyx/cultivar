import { readFileSync } from 'fs';
import { join } from 'path';

import { extractText } from '../extractText.ts';
import { parseCoa } from '../parseCoa.ts';
import { normalizeUsDate } from '../dates.ts';
import { dominantTerpene } from '../normalize.ts';
import type { CoaResult } from '../types.ts';

const FIXTURES = join(__dirname, '..', '__fixtures__');

async function loadCoa(file: string): Promise<CoaResult> {
  const buf = readFileSync(join(FIXTURES, file));
  const text = await extractText(new Uint8Array(buf));
  return parseCoa(text);
}

function terpene(coa: CoaResult, name: string) {
  return coa.terpenes.find((t) => t.name === name);
}

interface FixtureCase {
  strain: string;
  file: string;
  sourceLab: CoaResult['sourceLab'];
  totalThc: number;
  totalTerp: number;
  dominant: string;
  myrcene: number;
  limonene: number | null; // null => reported ND by the lab
  batch: string;
  brand: string;
  sampledDate: string | null;
  testedDate: string | null;
}

const CASES: FixtureCase[] = [
  {
    strain: 'Animal Face',
    file: 'animal-face.pdf',
    sourceLab: 'drs-confident',
    totalThc: 32.69,
    totalTerp: 1.4977,
    dominant: 'Myrcene',
    myrcene: 0.55,
    limonene: null,
    batch: 'ANFA-003-FL8',
    brand: 'Moby & Zeke, LLC',
    sampledDate: '2026-03-03',
    testedDate: '2026-03-12',
  },
  {
    strain: 'Rainbow Runtz',
    file: 'rainbow-runtz.pdf',
    sourceLab: 'kaycha',
    totalThc: 22.7326,
    totalTerp: 1.53,
    dominant: 'Caryophyllene',
    myrcene: 0.19,
    limonene: 0.31,
    batch: 'S01-RARU',
    brand: 'Animal House',
    sampledDate: '2025-05-05',
    testedDate: null,
  },
  {
    strain: 'Cosmic Cereal',
    file: 'cosmic-cereal.pdf',
    sourceLab: 'kaycha',
    totalThc: 31.8081,
    totalTerp: 1.85,
    dominant: 'Limonene',
    myrcene: 0.11,
    limonene: 0.55,
    batch: 'CMC-0601-AL-0126-D-E',
    brand: '',
    sampledDate: '2026-04-17',
    testedDate: '2026-04-28',
  },
  {
    strain: 'Permanent Shade',
    file: 'permanent-shade.pdf',
    sourceLab: 'kaycha',
    totalThc: 29.5444,
    totalTerp: 2.22,
    dominant: 'Limonene',
    myrcene: 0.04,
    limonene: 0.65,
    batch: 'PMMS-0601-AL-0126-D-E',
    brand: '',
    sampledDate: '2026-04-17',
    testedDate: '2026-04-28',
  },
];

describe('parseCoa on real COA fixtures', () => {
  for (const c of CASES) {
    describe(c.strain, () => {
      let coa: CoaResult;

      beforeAll(async () => {
        coa = await loadCoa(c.file);
      });

      it(`identifies source lab as ${c.sourceLab}`, () => {
        expect(coa.sourceLab).toBe(c.sourceLab);
      });

      it(`parses total THC ${c.totalThc}%`, () => {
        expect(coa.totalThcPct).toBeCloseTo(c.totalThc, 2);
      });

      it(`parses total terpenes ${c.totalTerp}%`, () => {
        expect(coa.totalTerpenesPct).toBeCloseTo(c.totalTerp, 2);
      });

      it(`batch is ${c.batch}`, () => {
        expect(coa.batch).toBe(c.batch);
      });

      it(`brand is ${JSON.stringify(c.brand)}`, () => {
        expect(coa.brand).toBe(c.brand);
      });

      it(`dominant terpene is ${c.dominant}`, () => {
        expect(dominantTerpene(coa.terpenes)).toBe(c.dominant);
      });

      it(`Myrcene is ${c.myrcene}%`, () => {
        expect(terpene(coa, 'Myrcene')?.pct).toBeCloseTo(c.myrcene, 2);
      });

      it(
        c.limonene === null
          ? 'Limonene is ND (null)'
          : `Limonene is ${c.limonene}%`,
        () => {
          const lim = terpene(coa, 'Limonene');
          expect(lim).toBeDefined();
          if (c.limonene === null) {
            expect(lim?.pct).toBeNull();
          } else {
            expect(lim?.pct).toBeCloseTo(c.limonene, 2);
          }
        },
      );

      it(`sampledDate is ${JSON.stringify(c.sampledDate)}`, () => {
        expect(coa.sampledDate).toBe(c.sampledDate);
      });

      it(`testedDate is ${JSON.stringify(c.testedDate)}`, () => {
        expect(coa.testedDate).toBe(c.testedDate);
      });

      it('returns a non-empty terpene panel', () => {
        expect(coa.terpenes.length).toBeGreaterThan(0);
      });

      it('reports a Pesticides safety row', () => {
        expect(coa.safety.some((s) => /pesticide/i.test(s.category))).toBe(true);
      });
    });
  }
});

describe('parseCoa unknown-lab shell', () => {
  it('sets both dates null', () => {
    const coa = parseCoa('no recognizable lab markers in this text');
    expect(coa.sourceLab).toBe('unknown');
    expect(coa.sampledDate).toBeNull();
    expect(coa.testedDate).toBeNull();
  });
});

describe('normalizeUsDate', () => {
  it('pivots a 2-digit year to 20YY and zero-pads', () => {
    expect(normalizeUsDate('04/17/26')).toBe('2026-04-17');
    expect(normalizeUsDate('5/5/25')).toBe('2025-05-05');
  });

  it('accepts a 4-digit year', () => {
    expect(normalizeUsDate('03/04/2026')).toBe('2026-03-04');
  });

  it('returns null for empty, non-date, and out-of-bounds input', () => {
    expect(normalizeUsDate('')).toBeNull();
    expect(normalizeUsDate('.')).toBeNull();
    expect(normalizeUsDate('20 units')).toBeNull();
    expect(normalizeUsDate('13/01/26')).toBeNull(); // month > 12
    expect(normalizeUsDate('02/45/26')).toBeNull(); // day > 31
    expect(normalizeUsDate('04/17/026')).toBeNull(); // 3-digit year
  });
});
