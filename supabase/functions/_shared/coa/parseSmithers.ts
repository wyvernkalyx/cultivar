import type { Analyte, CoaResult, SafetyRow } from './types.ts';
import { normalizeUsDate } from './dates.ts';
import { displayTerpene, isKnownTerpene, parsePct } from './normalize.ts';

// Smithers CTS New York COAs open with the product title, carry a
// "COMPLIANCE FOR RETAIL" summary where the category PRECEDES the status
// (the mirror of DRS), and lay analyte tables out as:
//   cannabinoids: <name> <LOQ%> <avg-%> <mg/serving>   (LOQ is '-' on totals)
//   terpenes:     <name> <LOQ%> <result-%>
// The terpene LOQ column is always a 7-decimal figure (0.0004200 ...), which
// no result value shares, so it is the row anchor.

const SMITHERS_SAFETY_CATEGORIES = [
  'Residual Solvents',
  'Pesticides',
  'Mycotoxins',
  'Water Activity',
  'Trace Metals',
  'Microbial Contaminants',
  'Moisture Analysis',
  'Filth & Foreign',
];

function firstMatch(text: string, re: RegExp): string | null {
  const m = re.exec(text);
  if (!m) return null;
  const value = m[1].trim();
  return value === '' ? null : value;
}

function parseSafety(text: string): SafetyRow[] {
  const rows: SafetyRow[] = [];
  for (const category of SMITHERS_SAFETY_CATEGORIES) {
    const m = new RegExp(`${category}\\s+(Not Tested|Pass|Fail)\\b`).exec(text);
    if (m) rows.push({ category, status: m[1] });
  }
  return rows;
}

function section(text: string, from: RegExp, to: RegExp): string {
  const a = from.exec(text);
  if (!a) return '';
  const rest = text.slice(a.index + a[0].length);
  const b = to.exec(rest);
  return b ? rest.slice(0, b.index) : rest;
}

function parseCannabinoids(text: string): Analyte[] {
  const body = section(text, /Average Cannabinoid Profile/, /Cannabinoid Totals/);
  // Row: <name> <LOQ-or-dash> <avg%> <mg/serving>. Name is 1..4 tokens ending
  // before a numeric/dash LOQ; parenthesised abbreviations and Greek deltas
  // allowed. The trailing mg column is consumed so it cannot bleed forward.
  const re =
    /((?:[A-Za-z\u0394][\w\u0394()\-,]*)(?:\s+[\w\u0394()\-,]+){0,4}?)\s+(-|\d[\d.]*)\s+(<LOQ|\d[\d.]*)\s+(<LOQ|\d[\d.]*)/g;
  const out: Analyte[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const name = m[1].trim();
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({ name, pct: parsePct(m[3]) });
  }
  return out;
}

function parseTerpenes(text: string): Analyte[] {
  const body = section(text, /Terpene Total\b/, /Terpene Totals\b/);
  // Name tokens may open with "(" for isomer marks like "Pulegone (+)".
  // Column headers repeat mid-section for the two-column layout, so a
  // captured name is stripped of leading header tokens rather than trusted.
  const re = /((?:[A-Za-z3(][\w()+\-]*)(?:\s+[A-Za-z(][\w()+\-]*){0,2}?)\s+(0\.\d{7})\s+(<LOQ|\d[\d.]*)/g;
  // Two printed isomer rows can land on one canonical name (cis- and
  // trans-b-Ocimene both map to Ocimene, the map's standing collapse).
  // Within one document those are summed: the single-name labs print the
  // total, so the sum is the comparable figure. Null + value = value;
  // all-null stays null -- nothing detected is invented into a zero.
  const byName = new Map<string, number | null>();
  const order: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const raw = m[1].trim().replace(/^(?:Analyte\s+)?(?:LOQ\s+)?/, '');
    if (!isKnownTerpene(raw)) continue;
    const name = displayTerpene(raw);
    const pct = parsePct(m[3]);
    if (!byName.has(name)) {
      byName.set(name, pct);
      order.push(name);
    } else {
      const prev = byName.get(name) ?? null;
      byName.set(name, prev === null ? pct : pct === null ? prev : prev + pct);
    }
  }
  return order.map((name) => ({ name, pct: byName.get(name) ?? null }));
}

export function parseSmithers(text: string): CoaResult {
  const totalThcPct = parsePct(
    firstMatch(text, /Total Tetrahydrocannabinol \(THC\)\s+-\s+(<LOQ|[\d.]+)/),
  );
  const totalCbdPct = parsePct(
    firstMatch(text, /Total Cannabidiol \(CBD\)\s+-\s+(<LOQ|[\d.]+)/),
  );
  const totalTerpenesPct = parsePct(
    firstMatch(text, /Total Terpenes\s+([\d.]+)\s+PASS/),
  );

  // The document has no labelled strain field; the printed product title is
  // the closest printed statement of identity and is user-editable at
  // confirm. Verbatim, never trimmed down to a guessed strain word (D97).
  const strain = firstMatch(text, /^(.+?)\s+Lot #:/) ?? null;
  const batch = firstMatch(text, /Lot #:\s*(\S+)\s+Lot Size:/) ?? null;
  // Client line as printed, between the certificate number and its address.
  const brand = firstMatch(text, /Certificate:\s*[\d.]+\s+(.+?)\s+Address:/) ?? null;

  const sampledDate = normalizeUsDate(
    firstMatch(text, /Sample Collected:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/),
  );
  const testedDate = normalizeUsDate(
    firstMatch(text, /Published:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/),
  );

  return {
    lab: 'Smithers CTS New York LLC',
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
    sourceLab: 'smithers',
  };
}
