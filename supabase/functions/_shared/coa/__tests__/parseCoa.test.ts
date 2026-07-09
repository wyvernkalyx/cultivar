import { readFileSync } from 'fs';
import { join } from 'path';

import { extractText } from '../extractText.ts';
import { parseCoa } from '../parseCoa.ts';
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

      it('returns a non-empty terpene panel', () => {
        expect(coa.terpenes.length).toBeGreaterThan(0);
      });

      it('reports a Pesticides safety row', () => {
        expect(coa.safety.some((s) => /pesticide/i.test(s.category))).toBe(true);
      });
    });
  }
});
