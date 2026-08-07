import type { Analyte, CoaResult, SafetyRow } from './types.ts';
import { normalizeUsDate } from './dates.ts';
import { displayTerpene, isKnownTerpene, parsePct } from './normalize.ts';

// ACT Laboratories (NY) COAs are label-adjacent (D127): every header value
// sits immediately after its label, so captures anchor on the printed label
// and D123's positional-slot machinery is deliberately absent. The header
// block repeats once per page; firstMatch semantics make that harmless.
//
// Every numeric comes from a detail table, never the rounded cover panel
// (D130). The cover is additionally value-before-label (`976.98 mg/unit
// Total THC`), so a label-anchored pattern that requires the row's full
// numeric column shape after the label cannot match it; the boilerplate
// total formula (`Total THC = ...`) fails the same shape requirement.

// A capture that trims to empty is absence, not a blank value (D97).
function firstMatch(text: string, re: RegExp): string | null {
  const m = re.exec(text);
  if (!m) return null;
  const value = m[1].trim();
  return value === '' ? null : value;
}

/**
 * The text of one assay section: from its `<Name> SOP:` heading to that
 * section's own `Report notes:` footer (or end of document). Row patterns
 * are matched inside this window, never across the whole document, per
 * D124's finding on the same problem: unscoped row shapes also match other
 * tables. The footer, not the next section heading, is the right endpoint:
 * the page layout interleaves a neighbouring assay's heading between the
 * cannabinoid heading and its rows, so a heading-bounded window can close
 * before the first row (observed on the fixture).
 */
function sectionAfter(text: string, heading: string): string {
  const start = text.indexOf(heading);
  if (start < 0) return '';
  const end = text.indexOf('Report notes:', start + heading.length);
  return text.slice(start, end < 0 ? text.length : end);
}

// Numeric table cell as ACT prints it: thousands separators, optional
// decimals. ND is the dominant absence marker on this lab (parsePct maps it,
// NR, NT, and any less-than capture to null and never to zero).
const NUM = '[\\d,]+(?:\\.\\d+)?';
const CELL = `(?:ND|${NUM})`;

function parseCannabinoids(text: string): Analyte[] {
  const section = sectionAfter(text, 'Cannabinoids SOP:');
  // Row: <name> <LOQ> <%> <mg/g> <mg/unit>. Names are single tokens, with
  // leading parentheses, digits, and commas in the d10-THC isomers, so the
  // name class admits an opening paren in first position. The totals rows
  // print no LOQ column, so requiring a numeric LOQ plus all three result
  // cells binds this pattern to detail rows only.
  const re = new RegExp(
    `([A-Za-z(][A-Za-z0-9(),\\-]*) ${NUM} (${CELL}) ${CELL} ${CELL}`,
    'g',
  );
  const out: Analyte[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(section)) !== null) {
    const name = m[1].trim();
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({ name, pct: parsePct(m[2]) });
  }
  return out;
}

function parseTerpenes(text: string): Analyte[] {
  const section = sectionAfter(text, 'Terpenes SOP:');
  // Row: <name> <LOQ> <%> <Status>. The name may carry one second word
  // (Caryophyllene Oxide, Sabinene Hydrate). The Total Terpenes row matches
  // the same shape with `Terpenes` as its name-token; the known-terpene
  // filter drops it, along with panel rows whose printed names have no canon
  // entry -- on the fixture every such row is ND, so no measured value is
  // lost (Kaycha and DRS precedent: terpene rows route through the
  // known-name check).
  const re = new RegExp(
    `([A-Za-z][A-Za-z0-9\\-]*(?: [A-Za-z]+)?) ${NUM} (${CELL}) (?:Tested|Passed|Failed)`,
    'g',
  );
  const out: Analyte[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(section)) !== null) {
    if (!isKnownTerpene(m[1])) continue;
    const name = displayTerpene(m[1]);
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({ name, pct: parsePct(m[2]) });
  }
  return out;
}

// The Tests Summary grid opens the document, before any assay section
// repeats these words in other roles, so first match per category reads the
// summary.
const SAFETY_CATEGORIES = [
  'Cannabinoids',
  'Moisture',
  'Microbials',
  'Water Activity',
  'Foreign Matter',
  'Homogeneity',
  'Terpenes',
  'Residual Solvents',
  'Mycotoxins',
  'Heavy Metals',
  'Pesticides',
];

function parseSafety(text: string): SafetyRow[] {
  const rows: SafetyRow[] = [];
  for (const category of SAFETY_CATEGORIES) {
    const m = new RegExp(`${category} (Pass|Fail|Tested|Not Tested)(?= )`).exec(
      text,
    );
    if (m) rows.push({ category, status: m[1] });
  }
  return rows;
}

export function parseAct(text: string): CoaResult {
  // Totals come from detail rows only (D130). The cannabinoid totals rows
  // print three result cells and no LOQ; the terpene total prints LOQ,
  // percent, and a status word. The cover panel's value-before-label order
  // and the formula's `=` both fail these shapes.
  const totalThcPct = parsePct(
    firstMatch(text, new RegExp(`Total THC (${CELL}) ${CELL} ${CELL}`)),
  );
  const totalCbdPct = parsePct(
    firstMatch(text, new RegExp(`Total CBD (${CELL}) ${CELL} ${CELL}`)),
  );
  const totalTerpenesPct = parsePct(
    firstMatch(
      text,
      new RegExp(`Total Terpenes ${NUM} (${CELL}) (?:Passed|Tested|Failed)`),
    ),
  );

  // Label-adjacent header fields. Strain and batch are bounded by the next
  // printed label rather than by a separator character, because strain names
  // may contain separators (D123's ground, carried).
  const strain = firstMatch(text, /Strain: (.+?), Unit Weight:/);
  const batch = firstMatch(text, /Batch#: (.+?), Batch Size:/);
  const brand = firstMatch(text, /Certificate of Analysis (.+?) Order No\.:/);

  const sampledDate = normalizeUsDate(
    firstMatch(text, /Date Sampled: (\d{1,2}\/\d{1,2}\/\d{4}) \d{1,2}:\d{2}/),
  );
  const testedDate = normalizeUsDate(
    firstMatch(text, /Report Created: (\d{1,2}\/\d{1,2}\/\d{4}) \d{1,2}:\d{2}/),
  );

  return {
    lab: 'ACT Laboratories (NY)',
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
    sourceLab: 'act',
  };
}
