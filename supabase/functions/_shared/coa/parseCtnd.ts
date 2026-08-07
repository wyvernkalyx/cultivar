import type { Analyte, CoaResult, SafetyRow } from './types.ts';
import { normalizeMonthNameDate } from './dates.ts';
import { displayTerpene, isKnownTerpene, parsePct } from './normalize.ts';

// CTND (Certified Testing and Data) COAs are label-adjacent (D127). The
// cover panel prints its totals in UPPERCASE (`TOTAL THC 28.4%`) where the
// detail tables print mixed case, so every total pattern here is
// case-exact and cannot match the cover (D130). The `< LOQ` absence marker
// is two tokens and is always captured as one unit (D124).
//
// The extractor detaches superscript digits: the printed delta-THC rows
// come out as three rows all named `Δ -THC`, with the 8/9/10 designators
// loose elsewhere in the text. Handling is an operator ruling
// (2026-08-07): attribute by position -- first Delta-8, second Delta-9,
// third Delta-10, the order the document prints and its own Definitions
// formula corroborates -- as transcription-by-position, and only when
// exactly three such rows appear; any other count stores none of them,
// failing closed to omission rather than misattribution. Stored names use
// the inline form the document's own Definitions paragraph prints.

// A capture that trims to empty is absence, not a blank value (D97).
function firstMatch(text: string, re: RegExp): string | null {
  const m = re.exec(text);
  if (!m) return null;
  const value = m[1].trim();
  return value === '' ? null : value;
}

/**
 * The text of one assay section: from its `<Name> Testing Method:` heading
 * to that section's own `Prepared By:` sign-off. Row patterns are matched
 * inside this window, never across the whole document (D124).
 */
function sectionAfter(text: string, heading: string): string {
  const start = text.indexOf(heading);
  if (start < 0) return '';
  const end = text.indexOf('Prepared By:', start + heading.length);
  return text.slice(start, end < 0 ? text.length : end);
}

// Numeric table cell, and the cell-or-absence form. `< LOQ` is captured as
// one unit; parsePct maps it to null and never to zero.
const NUM = '[\\d,]+(?:\\.\\d+)?';
const CELL = `(?:< LOQ|${NUM})`;

// The delta-THC rows as the extractor emits them: the bare `Δ -THC`
// fragment, an optional LOQ column (the third row omits it), then the
// result cells. The leading space lookbehind excludes the 9R-/9S- isomer
// rows, whose `Δ` is hyphen-joined.
const DELTA_ROW = new RegExp(
  `(?<= )Δ -THC(?: ${NUM})? (${CELL}) ${CELL} ${CELL}`,
  'g',
);

function parseCannabinoids(text: string): Analyte[] {
  const section = sectionAfter(text, 'Cannabinoids Testing Method:');
  const out: Analyte[] = [];
  const seen = new Set<string>();

  // Unambiguous rows: single-token uppercase names, LOQ column, three
  // result cells. `Total THC` fails the shape (mixed-case `Total` is not a
  // name token and the totals rows are followed by another label, not a
  // third cell); header tokens fail the numeric-LOQ requirement; the
  // hyphen-joined fragments of the isomer rows fail the space lookbehind.
  const re = new RegExp(
    `(?<= )(?<!< )([A-Z][A-Z0-9]+) ${NUM} (${CELL}) ${CELL} ${CELL}`,
    'g',
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(section)) !== null) {
    const name = m[1];
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({ name, pct: parsePct(m[2]) });
  }

  // Operator-ruled positional attribution of the three bare delta rows
  // (see module comment). Exactly three, in document order, or none.
  const deltas: (string | null)[] = [];
  let d: RegExpExecArray | null;
  DELTA_ROW.lastIndex = 0;
  while ((d = DELTA_ROW.exec(section)) !== null) {
    deltas.push(d[1]);
  }
  if (deltas.length === 3) {
    const names = ['Δ8-THC', 'Δ9-THC', 'Δ10-THC'];
    deltas.forEach((cell, i) => {
      out.push({ name: names[i], pct: parsePct(cell) });
    });
  }

  return out;
}

function parseTerpenes(text: string): Analyte[] {
  const section = sectionAfter(text, 'Terpenes Testing Method:');
  // Row: <name> <dilution> <LOQ> <%> <mg/g>. Names carry Greek letters,
  // which the shared key folds. Two lookbehinds guard the name's start:
  // the space stops a truncated capture inside a hyphen-fragmented name
  // (the extractor splits the superscripted carene row) from landing on a
  // canonical name the row did not print whole, and `(?<!< )` stops the
  // LOQ of an unconsumed preceding absence cell from gluing onto the next
  // row's name as a bogus first word -- observed on the fixture, where it
  // silently swallowed the row after the fragmented one (D124's shift
  // class in a new form). The Total Terpenes row prints only two numerics
  // and fails the four-column shape; unknown printed names drop through
  // the known-name check (Kaycha and DRS precedent) -- on the fixture
  // every such row is < LOQ, so no measured value is lost.
  const re = new RegExp(
    `(?<= )(?<!< )([A-Za-z\\u0370-\\u03FF][A-Za-z0-9\\u0370-\\u03FF\\-]*(?: [A-Za-z]+)?) \\d+ ${NUM} (${CELL}) ${CELL}`,
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

// The cover's compliance grid prints each category beside an UPPERCASE
// status word, and it precedes every assay section, so first match per
// category reads the grid.
const SAFETY_CATEGORIES = [
  'Cannabinoids',
  'Foreign Matter',
  'Heavy Metals',
  'Microbials',
  'Moisture Content',
  'Mycotoxins',
  'Pesticides',
  'Terpenes',
  'Water Activity',
];

function parseSafety(text: string): SafetyRow[] {
  const rows: SafetyRow[] = [];
  for (const category of SAFETY_CATEGORIES) {
    const m = new RegExp(`${category} (PASS|FAIL|TESTED|NOT TESTED)(?= )`).exec(
      text,
    );
    if (m) rows.push({ category, status: m[1] });
  }
  return rows;
}

export function parseCtnd(text: string): CoaResult {
  // Totals from detail rows only (D130): mixed-case label plus the row's
  // own cell shape. The UPPERCASE cover panel and the `=` of the
  // Definitions formula both fail these patterns.
  const totalThcPct = parsePct(
    firstMatch(text, new RegExp(`Total THC (${CELL}) ${CELL} ${CELL}`)),
  );
  const totalCbdPct = parsePct(
    firstMatch(text, new RegExp(`Total CBD (${CELL}) ${CELL} ${CELL}`)),
  );
  const totalTerpenesPct = parsePct(
    firstMatch(text, new RegExp(`Total Terpenes (${CELL}) ${CELL}`)),
  );

  // Label-adjacent header fields, bounded by the next printed label
  // rather than a separator character (D123's ground, carried).
  const strain = firstMatch(text, /Cultivar\(s\): (.+?) Date Collected:/);
  const batch = firstMatch(text, /Batch No\.: (.+?) Test Pkg:/);
  const brand = firstMatch(text, /MANUFACTURER (.+?) License:/);

  const sampledDate = normalizeMonthNameDate(
    firstMatch(text, /Date Collected: ([A-Za-z]+ \d{1,2}, \d{4})/),
  );
  const testedDate = normalizeMonthNameDate(
    firstMatch(text, /Report Date: ([A-Za-z]+ \d{1,2}, \d{4})/),
  );

  return {
    lab: 'Certified Testing and Data',
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
    sourceLab: 'ctnd',
  };
}
