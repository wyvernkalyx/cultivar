import { readFileSync } from 'fs';
import { join } from 'path';

import { extractText } from '../extractText.ts';
import { parseCoa } from '../parseCoa.ts';
import { normalizeMonthNameDate, normalizeUsDate } from '../dates.ts';
import { displayTerpene, dominantTerpene, isKnownTerpene } from '../normalize.ts';
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
  /** Human label for the describe block. */
  strain: string;
  /** The strain exactly as the parser returns it, casing included. */
  parsedStrain: string;
  file: string;
  sourceLab: CoaResult['sourceLab'];
  totalThc: number;
  totalTerp: number;
  dominant: string;
  myrcene: number;
  limonene: number | null; // null => reported ND by the lab
  batch: string | null;
  brand: string | null;
  sampledDate: string | null;
  testedDate: string | null;
}

const CASES: FixtureCase[] = [
  {
    strain: 'Animal Face',
    parsedStrain: 'Animal Face',
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
    parsedStrain: 'RAINBOW RUNTZ',
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
    parsedStrain: 'Cosmic Cereal',
    file: 'cosmic-cereal.pdf',
    sourceLab: 'kaycha',
    totalThc: 31.8081,
    totalTerp: 1.85,
    dominant: 'Limonene',
    myrcene: 0.11,
    limonene: 0.55,
    batch: 'CMC-0601-AL-0126-D-E',
    brand: null,
    sampledDate: '2026-04-17',
    testedDate: '2026-04-28',
  },
  {
    strain: 'Gelato 33',
    parsedStrain: 'Gelato 33',
    file: 'gelato-33.pdf',
    sourceLab: 'green-analytics',
    totalThc: 23.574,
    totalTerp: 1.42,
    dominant: 'Limonene',
    myrcene: 0.14,
    limonene: 0.46,
    batch: '2601-030',
    brand: 'Aeterna Cannabis',
    sampledDate: '2026-01-20',
    testedDate: '2026-02-13',
  },
  {
    strain: 'Permanent Shade',
    parsedStrain: 'Permanent Shade',
    file: 'permanent-shade.pdf',
    sourceLab: 'kaycha',
    totalThc: 29.5444,
    totalTerp: 2.22,
    dominant: 'Limonene',
    myrcene: 0.04,
    limonene: 0.65,
    batch: 'PMMS-0601-AL-0126-D-E',
    brand: null,
    sampledDate: '2026-04-17',
    testedDate: '2026-04-28',
  },
  {
    strain: 'Hooch',
    parsedStrain: 'Hooch',
    file: 'hooch.pdf',
    sourceLab: 'act',
    totalThc: 27.91,
    totalTerp: 2.819,
    dominant: 'Caryophyllene',
    myrcene: 0.1615,
    limonene: 0.6684,
    batch: 'AP-FE-GH0526',
    brand: 'Alchemy Pure LLC',
    sampledDate: '2026-05-21',
    testedDate: '2026-05-26',
  },
  {
    strain: 'Stank Breath',
    parsedStrain: 'Stank Breath',
    file: 'stank-breath.pdf',
    sourceLab: 'ctnd',
    totalThc: 28.4,
    totalTerp: 2.7841,
    dominant: 'Caryophyllene',
    myrcene: 0.076,
    limonene: 0.2991,
    batch: 'STBR-028-FL8',
    brand: 'Moby & Zeke LLC (dba Sapphire Farms)',
    sampledDate: '2026-05-08',
    testedDate: '2026-05-15',
  },
  {
    strain: 'WF00350 compliance form',
    parsedStrain: 'Whole Flower',
    file: 'wf00350.pdf',
    sourceLab: 'green-analytics',
    totalThc: 22.677,
    totalTerp: 1.38,
    dominant: 'Myrcene',
    myrcene: 0.36,
    limonene: 0.3,
    batch: 'WF00350',
    brand: 'NYHO LABS LLC',
    sampledDate: '2024-12-03',
    testedDate: '2024-12-11',
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

      it(`strain is ${JSON.stringify(c.parsedStrain)}`, () => {
        expect(coa.strain).toBe(c.parsedStrain);
      });
    });
  }
});

describe('parseAct name fidelity', () => {
  // The d10-THC isomer names open with a parenthesis and carry digits and
  // commas. An earlier capture class started at a letter and stored
  // `aR,9S)-d10-THC` -- a name the document never printed. The assertion
  // exists so that defect cannot be re-derived: names are stored as printed
  // (no-fabrication), ND as null.
  it('captures the parenthesized d10-THC isomers as printed, ND as null', async () => {
    const coa = await loadCoa('hooch.pdf');
    const names = coa.cannabinoids.map((c) => c.name);
    expect(names).toContain('(6aR,9S)-d10-THC');
    expect(names).toContain('(6aR,9R)-d10-THC');
    for (const n of ['(6aR,9S)-d10-THC', '(6aR,9R)-d10-THC']) {
      expect(coa.cannabinoids.find((c) => c.name === n)?.pct).toBeNull();
    }
  });
});

describe('parseGreenAnalytics form safety (D136)', () => {
  // Refuted at build, recorded in the design doc: the D136 labels are NOT
  // absent from the Adult-Use form -- its transposed header prints them as
  // a contiguous empty label run. Fallback safety rests on each pattern
  // requiring a value-shaped token between two-sided anchors, so the empty
  // run matches nothing. These pin that property directly.
  it('no labeled fallback matches the Adult-Use transposed label run', async () => {
    const buf = readFileSync(join(FIXTURES, 'gelato-33.pdf'));
    const text = await extractText(new Uint8Array(buf));
    // The labels are present -- the premise the refuted control assumed away.
    expect(text.includes('Batch Lot ID:')).toBe(true);
    // The fallback patterns still match nothing on this form.
    expect(/Batch Lot ID: (\S+) Batch Size:/.test(text)).toBe(false);
    expect(/Client Name: (.+?) Sampling Location:/.test(text)).toBe(false);
    expect(/Date Reported: (\d{1,2}\/\d{1,2}\/\d{4}) Client Name:/.test(text)).toBe(false);
  });

  it('the compliance-form fixture prints no tracking tags', async () => {
    const buf = readFileSync(join(FIXTURES, 'wf00350.pdf'));
    const text = await extractText(new Uint8Array(buf));
    expect(/1A4[A-Z0-9]+/.test(text)).toBe(false);
  });
});

describe('parseCtnd delta-THC positional attribution', () => {
  // The extractor detaches superscript digits, so the printed delta-THC
  // rows arrive as three rows all named the bare delta fragment. Operator
  // ruling (2026-08-07): attribute by document position -- 8, 9, 10 --
  // and only when exactly three such rows appear; any other count stores
  // none. These assertions pin both the attribution and the guard's
  // fail-closed shape.
  it('stores exactly three delta rows, attributed 8/9/10 in order', async () => {
    const coa = await loadCoa('stank-breath.pdf');
    const deltas = coa.cannabinoids.filter((c) => c.name.startsWith('Δ'));
    expect(deltas.map((c) => c.name)).toEqual(['Δ8-THC', 'Δ9-THC', 'Δ10-THC']);
    expect(deltas[0].pct).toBeNull();
    expect(deltas[1].pct).toBeCloseTo(5.73, 2);
    expect(deltas[2].pct).toBeNull();
  });
});

describe('normalizeMonthNameDate', () => {
  it('normalizes a full month name with a zero-padded day', () => {
    expect(normalizeMonthNameDate('May 08, 2026')).toBe('2026-05-08');
  });

  it('normalizes a single-digit day and is case-insensitive on the month', () => {
    expect(normalizeMonthNameDate('may 8, 2026')).toBe('2026-05-08');
    expect(normalizeMonthNameDate('December 1, 2025')).toBe('2025-12-01');
  });

  it('returns null for an unknown month name', () => {
    expect(normalizeMonthNameDate('Maybe 08, 2026')).toBeNull();
  });

  it('returns null for an out-of-bounds day and a non-4-digit year', () => {
    expect(normalizeMonthNameDate('May 32, 2026')).toBeNull();
    expect(normalizeMonthNameDate('May 08, 26')).toBeNull();
  });

  it('returns null for null, undefined, and empty input', () => {
    expect(normalizeMonthNameDate(null)).toBeNull();
    expect(normalizeMonthNameDate(undefined)).toBeNull();
    expect(normalizeMonthNameDate('')).toBeNull();
  });
});

describe('parseCoa unknown-lab shell', () => {
  it('sets both dates and all four text fields null', () => {
    const coa = parseCoa('no recognizable lab markers in this text');
    expect(coa.sourceLab).toBe('unknown');
    expect(coa.sampledDate).toBeNull();
    expect(coa.testedDate).toBeNull();
    // An unrecognized document is total absence (D97): the sentinel states
    // nothing, so every text field is null rather than ''.
    expect(coa.lab).toBeNull();
    expect(coa.brand).toBeNull();
    expect(coa.strain).toBeNull();
    expect(coa.batch).toBeNull();
  });
});

describe('displayTerpene canonical forms', () => {
  // Every name below is printed by a lab in the fixture corpus. The value is
  // the display form; title-case is wrong for the lowercase isomer prefixes,
  // which is what these entries exist to fix.
  const EXPECTED: [string, string][] = [
    ['Carene', 'Carene'],
    ['p-Cymene', 'p-Cymene'],
    ['Sabinene Hydrate', 'Sabinene Hydrate'],
    ['Citronellol', 'Citronellol'],
    ['Alpha-cedrene', 'alpha-Cedrene'],
    ['cis-Nerolidol', 'cis-Nerolidol'],
    ['trans-Nerolidol', 'trans-Nerolidol'],
  ];

  for (const [printed, display] of EXPECTED) {
    it(`${printed} is known and displays as ${display}`, () => {
      expect(isKnownTerpene(printed)).toBe(true);
      expect(displayTerpene(printed)).toBe(display);
    });
  }

  it('keeps the cis and trans nerolidol isomers distinct from bare Nerolidol', () => {
    const forms = ['Nerolidol', 'cis-Nerolidol', 'trans-Nerolidol'];
    expect(new Set(forms.map(displayTerpene)).size).toBe(3);
  });
});

describe('displayTerpene ACT canonical forms (D129)', () => {
  // ACT Laboratories prints ASCII single-letter isomer prefixes. Each pair
  // is [printed form, display form]; the entries exist so an ACT jar's
  // compounds merge with the same compounds as printed by the other labs.
  const EXPECTED: [string, string][] = [
    ['b-Caryophyllene', 'Caryophyllene'],
    ['a-Humulene', 'Humulene'],
    ['b-Myrcene', 'Myrcene'],
    ['b-Pinene', 'beta-Pinene'],
    ['a-Pinene', 'alpha-Pinene'],
    ['a-Bisabolol', 'Bisabolol'],
    ['trans-b-Farnesene', 'Farnesene'],
    ['trans-b-Ocimene', 'Ocimene'],
    ['Borneol', 'Borneol'],
  ];

  for (const [printed, display] of EXPECTED) {
    it(`${printed} is known and displays as ${display}`, () => {
      expect(isKnownTerpene(printed)).toBe(true);
      expect(displayTerpene(printed)).toBe(display);
    });
  }

  it('merges the ASCII-prefixed forms with the Greek-prefixed forms', () => {
    expect(displayTerpene('b-Caryophyllene')).toBe(displayTerpene('β-Caryophyllene'));
    expect(displayTerpene('a-Humulene')).toBe(displayTerpene('α-Humulene'));
  });

  it('keeps the two pinene isomers distinct', () => {
    expect(displayTerpene('b-Pinene')).not.toBe(displayTerpene('a-Pinene'));
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
