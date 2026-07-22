import type { Analyte, CoaResult, SafetyRow } from './types.ts';
import { normalizeUsDate } from './dates.ts';
import { displayTerpene, isKnownTerpene, parsePct } from './normalize.ts';

// DRS Testing / Confident LIMS COAs lay analyte tables out as clean rows:
//   <name> <LOQ> <result-%> <result-mg/g>
// The LOQ column is a fixed value per table (0.2 for cannabinoids, 0.0125 for
// terpenes), which we use as a reliable row anchor.

const DRS_SAFETY_CATEGORIES = [
  'Pesticides',
  'Microbials',
  'Mycotoxins',
  'Solvents',
  'Metals',
  'Foreign Matter',
  'Water Activity',
  'Moisture',
];

function parseSafety(text: string): SafetyRow[] {
  // In the DRS summary block the status precedes the category
  // (e.g. "Pass Pesticides", "Not Tested Solvents").
  const rows: SafetyRow[] = [];
  for (const category of DRS_SAFETY_CATEGORIES) {
    const m = new RegExp(`(Not Tested|Pass|Fail)\\s+${category}\\b`).exec(text);
    if (m) rows.push({ category, status: m[1] });
  }
  return rows;
}

function parseAnalytes(text: string, loqAnchor: string): Analyte[] {
  // Match "<name> <loqAnchor> <result>" where name may be one or two words
  // (e.g. "Caryophyllene Oxide"). Greek letters and parenthesised isomer
  // prefixes are allowed in the name.
  const anchor = loqAnchor.replace('.', '\\.');
  // Row shape: "<name> <LOQ> <result-%> <result-mg/g>". We also consume the
  // trailing mg column so its ND/value cannot bleed into the next row's name.
  const re = new RegExp(
    `([A-Za-z\\u0391-\\u03C9(][A-Za-z0-9\\u0391-\\u03C9()\\-,]*(?: [A-Za-z]+)?)\\s+${anchor}\\s+(ND|NR|<LOQ|[\\d.]+)\\s+(?:ND|NR|<LOQ|<?[\\d.]+)`,
    'g',
  );
  const out: Analyte[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const name = m[1].trim();
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({ name, pct: parsePct(m[2]) });
  }
  return out;
}

function parseTerpenes(text: string): Analyte[] {
  return parseAnalytes(text, '0.0125')
    .filter((a) => isKnownTerpene(a.name))
    .map((a) => ({ name: displayTerpene(a.name), pct: a.pct }));
}

function firstMatch(text: string, re: RegExp): string | null {
  const m = re.exec(text);
  return m ? m[1].trim() : null;
}

export function parseDrsConfident(text: string): CoaResult {
  // "<value>% Total THC   <value> Total CBD   <value>% Moisture"
  const totalThcPct = parsePct(firstMatch(text, /([\d.]+)%\s+Total THC\b/));
  const totalCbdPct = parsePct(
    firstMatch(text, /Total THC\s+(ND|NR|<?[\d.]+%?)\s+Total CBD\b/),
  );
  const totalTerpenesPct = parsePct(
    firstMatch(text, /([\d.]+)%\s+Total Terpenes\b/),
  );

  const strain = firstMatch(text, /Strain:\s*(.+?)\s+Batch#/) ?? '';
  const batch = firstMatch(text, /Batch#:\s*([^;]+?);/) ?? '';
  // Both edges anchored on structural tokens: the page counter ("1 of 8")
  // on the left, the template's "Contact Person" label on the right (D69).
  // No LLC requirement -- the capture is whatever sits between the anchors.
  const brand = firstMatch(text, /\b\d+ of \d+\s+(.+?)\s+Contact Person/) ?? '';

  // Collection is the semantic match for Kaycha's "Sampled" (D84.3); the
  // lab-intake "Sample Received:" is deliberately not consumed. The
  // date-shaped capture ignores DRS's trailing time garbage (e.g. "948").
  const sampledDate = normalizeUsDate(
    firstMatch(
      text,
      /Sample Collection Date\/Time\s*:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    ),
  );
  const testedDate = normalizeUsDate(
    firstMatch(text, /Report Created\s*:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/),
  );

  return {
    lab: 'DRS Testing',
    brand,
    strain,
    batch,
    sampledDate,
    testedDate,
    totalThcPct,
    totalCbdPct,
    totalTerpenesPct,
    cannabinoids: parseAnalytes(text, '0.2'),
    terpenes: parseTerpenes(text),
    safety: parseSafety(text),
    sourceLab: 'drs-confident',
  };
}
