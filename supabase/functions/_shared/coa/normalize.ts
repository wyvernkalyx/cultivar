// Pure normalization helpers shared by the per-lab parsers.
//
// These are deliberately dependency-free and side-effect-free so they can be
// unit-tested in isolation before any UI wiring.

import type { Analyte } from './types.ts';

/**
 * Parse a single cell from a COA table into a percentage number, or `null`.
 *
 * Maps every "no measurable value" marker a lab uses -- ND, NR, NT, N/A,
 * `<LOQ`, and any `< value` -- to `null`. Never returns 0 for these.
 */
export function parsePct(token: string | null | undefined): number | null {
  if (token == null) return null;
  const t = token.trim();
  if (t === '') return null;
  if (/^(nd|nr|nt|n\/a|absent|not present)$/i.test(t)) return null;
  if (t.startsWith('<')) return null; // <LOQ, <0.0040, <0.1000, ...
  const n = Number(t.replace(/%$/, ''));
  return Number.isFinite(n) ? n : null;
}

// Canonical terpene names. Many labs write the same compound differently
// (`β-Myrcene` / `BETA-MYRCENE` / `Myrcene`); the key collapses those to one
// lookup form. alpha/beta isomers that are genuinely different compounds
// (alpha- vs beta-Pinene) are kept distinct.
const TERPENE_CANON: Record<string, string> = {
  MYRCENE: 'Myrcene',
  BETAMYRCENE: 'Myrcene',
  LIMONENE: 'Limonene',
  DLIMONENE: 'Limonene',
  CARYOPHYLLENE: 'Caryophyllene',
  BETACARYOPHYLLENE: 'Caryophyllene',
  CARYOPHYLLENEOXIDE: 'Caryophyllene Oxide',
  HUMULENE: 'Humulene',
  ALPHAHUMULENE: 'Humulene',
  LINALOOL: 'Linalool',
  PINENE: 'Pinene',
  ALPHAPINENE: 'alpha-Pinene',
  BETAPINENE: 'beta-Pinene',
  BISABOLOL: 'Bisabolol',
  ALPHABISABOLOL: 'Bisabolol',
  TERPINEOL: 'Terpineol',
  ALPHATERPINEOL: 'Terpineol',
  FENCHOL: 'Fenchol',
  FENCHYLALCOHOL: 'Fenchol',
  VALENCENE: 'Valencene',
  CAMPHENE: 'Camphene',
  FARNESENE: 'Farnesene',
  BETAFARNESENE: 'Farnesene',
  GUAIOL: 'Guaiol',
  OCIMENE: 'Ocimene',
  BETAOCIMENE: 'Ocimene',
  GERANIOL: 'Geraniol',
  MENTHOL: 'Menthol',
  TERPINOLENE: 'Terpinolene',
  PHELLANDRENE: 'alpha-Phellandrene',
  ALPHAPHELLANDRENE: 'alpha-Phellandrene',
  TERPINENE: 'alpha-Terpinene',
  ALPHATERPINENE: 'alpha-Terpinene',
  GAMMATERPINENE: 'gamma-Terpinene',
  EUCALYPTOL: 'Eucalyptol',
  NEROLIDOL: 'Nerolidol',
  ISOPULEGOL: 'Isopulegol',
  SABINENE: 'Sabinene',
  // Added 2026-08-05 from the Green Analytics panel, which reports a wider
  // set than the other labs in the corpus. Each of these parsed and carried
  // its value before this entry existed; the entry only fixes the display
  // form, which title-case gets wrong for a lowercase isomer prefix.
  CARENE: 'Carene',
  PCYMENE: 'p-Cymene',
  SABINENEHYDRATE: 'Sabinene Hydrate',
  CITRONELLOL: 'Citronellol',
  ALPHACEDRENE: 'alpha-Cedrene',
  CISNEROLIDOL: 'cis-Nerolidol',
  TRANSNEROLIDOL: 'trans-Nerolidol',
  // Added 2026-08-07 for ACT Laboratories (D129), which prints ASCII
  // single-letter isomer prefixes where other labs print Greek or the
  // full word. Explicit entries, not a key-function fold: a one-letter
  // prefix is too weak a signal to fold globally. Borneol is new to the
  // corpus; the rest map to canonical values that already exist above.
  BCARYOPHYLLENE: 'Caryophyllene',
  AHUMULENE: 'Humulene',
  BMYRCENE: 'Myrcene',
  BPINENE: 'beta-Pinene',
  APINENE: 'alpha-Pinene',
  ABISABOLOL: 'Bisabolol',
  TRANSBFARNESENE: 'Farnesene',
  TRANSBOCIMENE: 'Ocimene',
  BORNEOL: 'Borneol',
  // Smithers CTS vocabulary (2026-08-25): keys keep digits, so 3-Carene
  // cannot reach CARENE without its own key. Isomer keys follow the map's
  // own precedents: caryophyllene and ocimene isomers collapse to the
  // shared canonical (BCARYOPHYLLENE, TRANSBOCIMENE above); nerolidol
  // isomers stay distinct (CISNEROLIDOL / TRANSNEROLIDOL above).
  '3CARENE': 'Carene',
  TRANSCARYOPHYLLENE: 'Caryophyllene',
  CISOCIMENE: 'Ocimene',
  GAMMATERPINEOL: 'Terpineol',
  PULEGONE: 'Pulegone',
  ISOBORNEOL: 'Isoborneol',
  CAMPHOR: 'Camphor',
  CEDRENE: 'Cedrene',
  CEDROL: 'Cedrol',
  FENCHONE: 'Fenchone',
  GERANYLACETATE: 'Geranyl Acetate',
  NEROL: 'Nerol',
};

/** Collapse a terpene name to its canonical lookup key. */
export function terpeneKey(name: string): string {
  return name
    .replace(/[βΒ]/g, 'beta')
    .replace(/[αΑ]/g, 'alpha')
    .replace(/[γΓ]/g, 'gamma')
    .replace(/[δΔ]/g, 'delta')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/** True when `name` maps to a known canonical terpene. */
export function isKnownTerpene(name: string): boolean {
  return terpeneKey(name) in TERPENE_CANON;
}

function titleCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .trim();
}

/** Canonical display name, falling back to title-case for unknown terpenes. */
export function displayTerpene(name: string): string {
  return TERPENE_CANON[terpeneKey(name)] ?? titleCase(name);
}

/** Name of the highest-% terpene, or null if none have a measured value. */
export function dominantTerpene(terpenes: Analyte[]): string | null {
  let best: string | null = null;
  let bestPct = -Infinity;
  for (const t of terpenes) {
    if (t.pct != null && t.pct > bestPct) {
      bestPct = t.pct;
      best = t.name;
    }
  }
  return best;
}
