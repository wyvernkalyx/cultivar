import { TERPENE_AROMA_FALLBACK, TERPENE_GLOSSARY_FOOTER, terpeneAroma } from '../terpene-glossary';

// D152: the glossary is aroma-only copy. The banned-language test is the
// product invariant (no effect claims in any copy) made executable for this
// file: an entry that drifts into effects fails the suite, not a review.
const EFFECT_LANGUAGE = [
  'relax',
  'calm',
  'sedat',
  'sleep',
  'energ',
  'uplift',
  'focus',
  'mood',
  'anxi',
  'stress',
  'pain',
  'relief',
  'therap',
  'medic',
  'inflamm',
  'appetite',
  'known for',
  'helps',
  'effect',
];

const NAMES = [
  'Limonene',
  'Caryophyllene',
  'Caryophyllene Oxide',
  'Myrcene',
  'Pinene',
  'alpha-Pinene',
  'beta-Pinene',
  'Linalool',
  'Humulene',
  'Terpinolene',
  'Ocimene',
  'Bisabolol',
  'Farnesene',
  'Camphene',
  'Nerolidol',
  'cis-Nerolidol',
  'trans-Nerolidol',
  'Geraniol',
  'Eucalyptol',
  'Guaiol',
  'Terpineol',
  'Valencene',
  'Citronellol',
  'Borneol',
  'Fenchol',
  'Carene',
  'Menthol',
  'Sabinene',
  'alpha-Cedrene',
];

describe('D152 terpene glossary', () => {
  it('every listed canonical name has an entry, looked up case-insensitively', () => {
    for (const name of NAMES) {
      expect(terpeneAroma(name)).not.toBe(TERPENE_AROMA_FALLBACK);
      expect(terpeneAroma(name.toUpperCase())).toBe(terpeneAroma(name));
    }
  });
  it('an unknown name gets the fallback, never a guess', () => {
    expect(terpeneAroma('p-Cymene')).toBe(TERPENE_AROMA_FALLBACK);
    expect(terpeneAroma('')).toBe(TERPENE_AROMA_FALLBACK);
  });
  it('no entry and no footer uses effect language', () => {
    const lines = [...NAMES.map(terpeneAroma), TERPENE_GLOSSARY_FOOTER].map((s) => s.toLowerCase());
    for (const line of lines) {
      for (const banned of EFFECT_LANGUAGE) {
        expect(`${line} :: ${banned}`).not.toMatch(new RegExp(`^.*${banned}.* :: ${banned}$`));
      }
    }
  });
});
