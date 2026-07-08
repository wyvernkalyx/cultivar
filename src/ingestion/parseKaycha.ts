import type { Analyte, CoaResult, SafetyRow } from './types';
import { displayTerpene, isKnownTerpene, parsePct } from './normalize';

// Kaycha Labs COAs appear in two layouts across the fixtures:
//
//  A) "row" layout (Cosmic Cereal, Permanent Shade): terpenes are one clean
//     row each -- "<name> <LOQ> <limit> PASS <result-%> <mg/unit>" -- while
//     cannabinoids are printed as a transposed block (all names, then "%",
//     then all values).
//  B) "column" layout (Rainbow Runtz): the mirror image -- cannabinoids are
//     clean rows and terpenes are the transposed block.
//
// We detect each table's layout independently rather than assuming a sub-format.

const KAYCHA_CANNABINOIDS = [
  '(6AR,9R) D10-THC',
  '(6AR,9S) D10-THC',
  'CBC',
  'CBDA',
  'CBDV',
  'CBD',
  'CBGA',
  'CBG',
  'CBN',
  'D8-THC',
  'D9-THC',
  'THCA',
  'THCV',
];

function firstMatch(text: string, re: RegExp): string | null {
  const m = re.exec(text);
  return m ? m[1].trim() : null;
}

// ---- Terpenes -------------------------------------------------------------

function parseTerpeneRows(text: string): Analyte[] {
  const re =
    /([A-Z][A-Z0-9\- ]*?[A-Z])\s+[\d.]+\s+[\d.]+\s+(?:PASS|FAIL)\s+(<?[\d.]+)/g;
  const out: Analyte[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (!isKnownTerpene(m[1])) continue; // skips "TOTAL TERPENES", headers
    const name = displayTerpene(m[1]);
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({ name, pct: parsePct(m[2]) });
  }
  return out;
}

function sliceBetween(text: string, from: number, endToken: string): [string, number] {
  const end = text.indexOf(endToken, from);
  const stop = end < 0 ? text.length : end;
  return [text.slice(from, stop), stop];
}

function parseTerpeneColumns(text: string): Analyte[] {
  const loqIdx = text.indexOf('LOQ (%)');
  if (loqIdx < 0) return [];
  const namesStart = text.lastIndexOf('Terpenes ', loqIdx);
  if (namesStart < 0) return [];

  let namesRegion = text.slice(namesStart + 'Terpenes '.length, loqIdx).trim();
  // Join the multi-word terpene names so a single whitespace split is clean.
  namesRegion = namesRegion
    .replace(/ALPHA TERPINEOL/g, 'ALPHA-TERPINEOL')
    .replace(/FENCHYL ALCOHOL/g, 'FENCHYL-ALCOHOL')
    .replace(/CARYOPHYLLENE OXIDE/g, 'CARYOPHYLLENE-OXIDE');
  const names = namesRegion.split(/\s+/).filter(Boolean);

  const resIdx = text.indexOf('Result (%)', loqIdx);
  if (resIdx < 0) return [];
  const [valuesRegion] = sliceBetween(
    text,
    resIdx + 'Result (%)'.length,
    'Terpenes',
  );
  const values = valuesRegion
    .split(/\s+/)
    .filter((t) => /^(<?[\d.]+|ND|<LOQ)$/i.test(t));

  const n = Math.min(names.length, values.length);
  const out: Analyte[] = [];
  for (let i = 0; i < n; i++) {
    out.push({ name: displayTerpene(names[i]), pct: parsePct(values[i]) });
  }
  return out;
}

function parseTerpenes(text: string): Analyte[] {
  return /TOTAL TERPENES/i.test(text)
    ? parseTerpeneRows(text)
    : parseTerpeneColumns(text);
}

// ---- Cannabinoids ---------------------------------------------------------

function parseCannabinoidRows(text: string): Analyte[] {
  const out: Analyte[] = [];
  for (const name of KAYCHA_CANNABINOIDS) {
    const esc = name.replace(/[()]/g, '\\$&').replace(/\s+/g, '\\s+');
    const m = new RegExp(
      `${esc}\\s+(<?[\\d.]+)\\s+<?[\\d.]+\\s+[\\d.]+\\s+%`,
    ).exec(text);
    if (m) out.push({ name, pct: parsePct(m[1]) });
  }
  return out;
}

function parseCannabinoidColumns(text: string): Analyte[] {
  const m = /\(6AR,9R\)\s*D10-THC/i.exec(text);
  if (!m) return [];
  const start = m.index;
  const pctMarker = text.indexOf(' % ', start);
  if (pctMarker < 0) return [];
  const mgMarker = text.indexOf('mg/unit', pctMarker);

  const namesRegion = text
    .slice(start, pctMarker)
    .replace(/\((6AR,9[RS])\)\s*(D10-THC)/gi, '$1_$2');
  const names = namesRegion.split(/\s+/).filter(Boolean);

  const valuesRegion = text.slice(
    pctMarker + 3,
    mgMarker < 0 ? text.length : mgMarker,
  );
  const values = valuesRegion
    .split(/\s+/)
    .filter((t) => /^(<?[\d.]+|ND|NR|<LOQ)$/i.test(t));

  const n = Math.min(names.length, values.length);
  const out: Analyte[] = [];
  for (let i = 0; i < n; i++) {
    out.push({ name: names[i].replace(/_/g, ' '), pct: parsePct(values[i]) });
  }
  return out;
}

function parseCannabinoids(text: string): Analyte[] {
  return /THCA\s+THCV/i.test(text)
    ? parseCannabinoidColumns(text)
    : parseCannabinoidRows(text);
}

// ---- Safety ---------------------------------------------------------------

function parseSafety(text: string): SafetyRow[] {
  // Kaycha prints "<category> <status>" (category first).
  const re =
    /(Pesticides?|Heavy Metals|Microbials?|Mycotoxins|Filth(?:\/Foreign Material)?|Foreign Material|Water Activity|Moisture(?: Content)?|Terpenes|Residuals? Solvents|Solvents|Cannabinoids?)\s+(PASSED|NOT TESTED|FAILED)/g;
  const rows: SafetyRow[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const category = m[1].trim();
    if (seen.has(category)) continue;
    seen.add(category);
    rows.push({ category, status: m[2] });
  }
  return rows;
}

// ---- Orchestration --------------------------------------------------------

function parseTotalTerpenes(text: string): number | null {
  const row = /TOTAL TERPENES\s+[\d.]+\s+[\d.]+\s+PASS\s+([\d.]+)/i.exec(text);
  if (row) return parsePct(row[1]);
  const col = /Total \(%\)\s+([\d.]+)/i.exec(text);
  return col ? parsePct(col[1]) : null;
}

export function parseKaycha(text: string): CoaResult {
  const totalThcPct = parsePct(firstMatch(text, /Total THC\s+([\d.]+)%/));
  const totalCbdPct = parsePct(firstMatch(text, /Total CBD\s+(<?[\d.]+)%?/));

  const strain =
    firstMatch(
      text,
      /Strain:\s*(.+?)\s+(?:Matrix|Classification|Batch|Certificate)/,
    ) ??
    firstMatch(text, /([A-Z][A-Z]+(?: [A-Z]+)*)\s+Matrix\b/) ??
    '';
  const batch =
    firstMatch(text, /Batch\s*#\s*:?\s*([A-Za-z0-9][A-Za-z0-9\-]*)/) ?? '';
  const brand =
    firstMatch(
      text,
      /([A-Z0-9][A-Za-z0-9 .,&'\-]*?\bdba\b[A-Za-z0-9 .,&'\-]+?)\s+License/i,
    ) ?? '';

  return {
    lab: 'Kaycha Labs',
    brand,
    strain,
    batch,
    totalThcPct,
    totalCbdPct,
    totalTerpenesPct: parseTotalTerpenes(text),
    cannabinoids: parseCannabinoids(text),
    terpenes: parseTerpenes(text),
    safety: parseSafety(text),
    sourceLab: 'kaycha',
  };
}
