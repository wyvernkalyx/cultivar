import type { Analyte, CoaResult, SafetyRow } from './types.ts';
import { normalizeUsDate } from './dates.ts';
import { displayTerpene, isKnownTerpene, parsePct } from './normalize.ts';

// Keystone State Testing COAs extract with two column-fusion artifacts:
// terpene rows fuse the result with the CAS number ("0.2199123-35-3"),
// and every section's row number rides the tail of the previous token.
// The terpene split is ambiguous by shape alone (two valid readings of
// "0.2199123-35-3") and deterministic by chemistry: each analyte's CAS
// is a constant. The table below is both the disambiguator and the
// documentation of Keystone's fixed panel.

const KEYSTONE_TERPENE_CAS: Record<string, string> = {
  'Beta-myrcene': '123-35-3',
  'Alpha-pinene': '80-56-8',
  'Beta-caryophyllene': '87-44-5',
  'Limonene': '5989-27-5',
  'Alpha-humulene': '6753-98-6',
  'Linalool': '78-70-6',
  'Beta-pinene': '127-91-3',
  'Terpinolene': '586-62-9',
  'Ocimene': '13877-91-3',
  'Alpha-bisabolol': '515-69-5',
  'Caryophyllene-oxide': '1139-30-6',
  'Geraniol': '106-24-1',
  'Camphene': '79-92-5',
  'Guaiol': '489-86-1',
  'Alpha-terpinene': '99-86-5',
  'Terpineol': '8006-39-1',
  'Fenchol': '14575-74-7',
  'Valencene': '4630-07-3',
  'Alpha-phellandrene': '99-83-2',
  'Farnesene': '502-61-4',
};

// Keystone varies section headers by product template (D162 ruling "b",
// 2026-08-28): flower prints "Moisture by Analyzer" / "Water Activity by
// Meter"; jars and prerolls print "Moisture LWG" / bare "Water Activity";
// infused prerolls add "Residual Solvents by HS-GC-MS". Each group lists
// printed variants, most-specific first; the first variant that matches
// wins and is stored verbatim, one row per group. The bare "Water
// Activity" variant is safe because the page-1 icon strip prints only
// uppercase PASS, which the mixed-case status capture cannot match.
const KEYSTONE_SAFETY_CATEGORY_VARIANTS: string[][] = [
  ['Foreign Matter by Microscopy'],
  ['Moisture by Analyzer', 'Moisture LWG'],
  ['Water Activity by Meter', 'Water Activity'],
  ['Pesticides by LCMSMS'],
  ['Residual Solvents by HS-GC-MS'],
  ['Mycotoxins by LCMSMS'],
  ['Heavy Metals by ICPMS'],
  ['Micro by Petri & qPCR'],
];

function firstMatch(text: string, re: RegExp): string | null {
  const m = re.exec(text);
  if (!m) return null;
  const value = m[1].trim();
  return value === '' ? null : value;
}

function parseSafety(text: string): SafetyRow[] {
  const rows: SafetyRow[] = [];
  for (const variants of KEYSTONE_SAFETY_CATEGORY_VARIANTS) {
    for (const category of variants) {
      // The status fuses with the analysis timestamp ("2:27 pmPass"), so no
      // left word-boundary: the first Pass/Fail in the section window wins.
      const m = new RegExp(
        `${category.replace(/[&]/g, '\\$&')}[\\s\\S]{0,140}?(Pass|Fail)`,
      ).exec(text);
      if (m) {
        rows.push({ category, status: m[1] });
        break;
      }
    }
  }
  return rows;
}

function parseCannabinoids(text: string): Analyte[] {
  // Row: <n> <name> 0.001000 <clean-%> <mg-fused-with-CAS>. The % column
  // is clean; the fused mg/CAS token is consumed and discarded.
  const re = /([A-Za-z][\w/-]*)\s+0\.001000\s+(ND|\d+\.?\d*)\s/g;
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
  const out: Analyte[] = [];
  const seen = new Set<string>();
  for (const [printed, cas] of Object.entries(KEYSTONE_TERPENE_CAS)) {
    // "<name> <value-or-ND fused with CAS> 0.1000<rownum>": the known CAS
    // suffix is stripped off the fused token; what remains is the value.
    const m = new RegExp(
      `${printed}\\s+(ND|\\d+\\.\\d+)${cas.replace(/-/g, '\\-')}\\s+0\\.1000`,
    ).exec(text);
    if (!m) continue;
    if (!isKnownTerpene(printed)) continue;
    const name = displayTerpene(printed);
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({ name, pct: parsePct(m[1]) });
  }
  return out;
}

export function parseKeystone(text: string): CoaResult {
  const totalThcPct = parsePct(firstMatch(text, /Total THC:\s*([\d.]+)\s*%/));
  const totalCbdPct = parsePct(firstMatch(text, /Total CBD:\s*([\d.]+)\s*%/));
  // No labelled terpene total survives extraction; the icon-strip value is
  // taken positionally -- CBD's mg/g before it, moisture after, the PASS
  // strip terminating (template knowledge, recorded in the design doc).
  const totalTerpenesPct = parsePct(
    firstMatch(text, /mg\/g\s+([\d.]+)\s*%\s+[\d.]+\s*%\s+PASS PASS/),
  );

  // D161a inherited: no labelled strain field; the printed product title
  // is the closest printed statement of identity, verbatim.
  const strain = firstMatch(text, /Date Released:\s*[\d/]+\s+[\d:]+[AP]M\s+(.+?)\s+Sample #:/) ?? null;
  const batch = firstMatch(text, /Regulator Batch ID:\s*(\S+)/) ?? null;
  const brand = firstMatch(text, /Certificate of Analysis Final\s+(.+?)\s+\d/) ?? null;

  // Keystone's own footnote: "Date Sampled = collected from client" --
  // their labels invert the common reading; the footnote governs.
  const sampledDate = normalizeUsDate(
    firstMatch(text, /Date Sampled:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/),
  );
  const testedDate = normalizeUsDate(
    firstMatch(text, /Date Released:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/),
  );

  return {
    lab: 'Keystone State Testing of New York',
    brand,
    strain,
    batch,
    sampledDate,
    testedDate,
    totalThcPct,
    totalCbdPct,
    totalTerpenesPct,
    cannabinoids: parseCannabinoids(text),
    terpenes: parseTerpenes(text),
    safety: parseSafety(text),
    sourceLab: 'keystone',
  };
}
