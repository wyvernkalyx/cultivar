import type { Analyte, CoaResult, SafetyRow } from './types.ts';
import { normalizeUsDate } from './dates.ts';
import { displayTerpene, parsePct } from './normalize.ts';

// Green Analytics NY COAs are the mirror image of the two shapes already
// handled (D122, green-analytics-parser.md). Analyte tables are clean rows in
// reading order; the HEADER block is transposed as a whole -- every field
// value emits in one run, every field label in a separate run later, with no
// adjacency between a label and the value it names. Nothing here anchors on a
// header label, because there is no header label to anchor on.

/** The representative-sample suffix the lab appends to the sample name (D123). */
const REPRESENTATIVE_SUFFIX = ' - Representative Sample';

// A capture that trims to empty is absence, not a blank value (D97).
function firstMatch(text: string, re: RegExp): string | null {
  const m = re.exec(text);
  if (!m) return null;
  const value = m[1].trim();
  return value === '' ? null : value;
}

/**
 * The text between a section's method line and that section's reporting-limit
 * footnote. Row patterns are matched inside this window, never across the
 * whole document: unscoped, a correctly shaped row pattern also matches the
 * pesticides and water-activity tables, which share the numeric column
 * layout (D124).
 */
function sectionBetween(text: string, methodMarker: string): string {
  const start = text.indexOf(methodMarker);
  if (start < 0) return '';
  const end = text.indexOf('MRL = Minimum reporting limit', start);
  return text.slice(start, end < 0 ? text.length : end);
}

// Row shape, both tables: <name> <result...> <reporting limit>. The result
// column is either a number or the two-token absence marker, which must be
// captured as one unit or the split leaves a bare numeral behind and the
// following row shifts (D124). parsePct maps any capture opening with a
// less-than sign to null.
const RESULT = '(< MRL|[\\d.]+)';

function parseTerpenes(text: string): Analyte[] {
  const section = sectionBetween(text, 'Terpenes analysis utilizing GC-MS');
  const re = new RegExp(
    `([A-Za-z][A-Za-z0-9\\-]*(?: [A-Za-z]+)?) ${RESULT} (0\\.\\d{2})(?= )`,
    'g',
  );
  const out: Analyte[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(section)) !== null) {
    const name = displayTerpene(m[1]);
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({ name, pct: parsePct(m[2]) });
  }
  return out;
}

function parseCannabinoids(text: string): Analyte[] {
  const section = sectionBetween(text, 'Potency analysis utilizing HPLC');
  // Three columns here: percent, mg/serving, reporting limit. The mg column is
  // consumed so its absence marker cannot bleed into the next row's name.
  const re = new RegExp(
    `([A-Za-z][A-Za-z0-9\\-]*) ${RESULT} ${RESULT} (0\\.\\d{3})(?= )`,
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

// The compliance summary is a grid of single-letter codes, expanded here to
// the words the document's own legend assigns them.
const STATUS_WORDS: Record<string, string> = {
  P: 'Pass',
  F: 'Fail',
  T: 'Tested',
  '-': 'Not Tested',
};

const SAFETY_CATEGORIES = [
  'Potency',
  'Pesticides',
  'Heavy Metals',
  'Mycotoxins',
  'Water Activity',
  'Microbiological',
  'Residual Solvents',
  'Terpenes',
  'Moisture',
  'Filth & Foreign Material',
];

function parseSafety(text: string): SafetyRow[] {
  const rows: SafetyRow[] = [];
  for (const category of SAFETY_CATEGORIES) {
    const esc = category.replace(/[&]/g, '\\$&');
    const m = new RegExp(`${esc} ([PFT-])(?= )`).exec(text);
    if (m) rows.push({ category, status: STATUS_WORDS[m[1]] ?? m[1] });
  }
  return rows;
}

export function parseGreenAnalytics(text: string): CoaResult {
  // Totals sit in summary rows, each anchored on the bracketed formula label
  // the document prints beside it.
  const totalThcPct = parsePct(
    firstMatch(text, /Total THC \[[^\]]*\]\s+(< MRL|[\d.]+)/),
  );
  const totalCbdPct = parsePct(
    firstMatch(text, /Total CBD \[[^\]]*\]\s+(< MRL|[\d.]+)/),
  );
  const totalTerpenesPct = parsePct(
    firstMatch(text, /Total Terpenes \(% w\/w\)\s+(< MRL|[\d.]+)/),
  );

  // Strain: the section headings repeat the sample name beside the sample id,
  // which is the one place in the document where the name sits next to a
  // structural token. The representative-sample suffix is removed only when
  // present in full -- never a general "drop anything after a separator" rule,
  // since strain names contain separators (D123).
  const printedStrain = firstMatch(
    text,
    /(?:Cannabinoids|Terpenes):\s*(.+?)\s*\(\d{8}-[A-Z]+-\d+\)/,
  );
  const strain =
    printedStrain != null && printedStrain.endsWith(REPRESENTATIVE_SUFFIX)
      ? printedStrain.slice(0, -REPRESENTATIVE_SUFFIX.length).trim() || null
      : printedStrain;

  // Batch has no adjacent label. It is recovered from its slot between the
  // package identifier and the two numeric fields that follow it, with a
  // tracking identifier anchoring each end. Tight on purpose: when the slot is
  // not populated as expected the pattern matches nothing and batch is null,
  // rather than capturing a neighbouring field and storing it as a batch
  // number the document never stated (D123).
  const batch = firstMatch(
    text,
    /1A4[A-Z0-9]+ ([A-Za-z0-9][A-Za-z0-9\-]*) \d+ \d+ 1A4[A-Z0-9]+/,
  );

  // Brand is the client of record, bounded by the report date on the left and
  // the sampling location plus contact address on the right (D123).
  const brand = firstMatch(
    text,
    /Sample Result: (?:PASS|FAIL) \d{1,2}\/\d{1,2}\/\d{4} (.+?) [A-Z][a-z]+, [A-Z]{2} \S+@/,
  );

  // Sampling is the only date printed with a time beside it; the date-shaped
  // capture ignores the trailing time. The report date is the tested date.
  const sampledDate = normalizeUsDate(
    firstMatch(text, /(\d{1,2}\/\d{1,2}\/\d{4}) \d{1,2}:\d{2}:\d{2} [AP]M/),
  );
  const testedDate = normalizeUsDate(
    firstMatch(text, /Sample Result: (?:PASS|FAIL) (\d{1,2}\/\d{1,2}\/\d{4})/),
  );

  return {
    lab: 'Green Analytics NY, LLC',
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
    sourceLab: 'green-analytics',
  };
}
