import type { CoaResult } from './types.ts';
import { identifyLab } from './identifyLab.ts';
import { parseKaycha } from './parseKaycha.ts';
import { parseDrsConfident } from './parseDrsConfident.ts';

/**
 * Parse the extracted text of a COA into a normalized {@link CoaResult}.
 *
 * Identifies the source lab, then dispatches to the matching per-lab parser.
 * For an unrecognized lab we return an empty shell tagged `unknown` rather than
 * throwing, so callers can surface "unsupported lab" on the confirm screen.
 */
export function parseCoa(text: string): CoaResult {
  const sourceLab = identifyLab(text);
  switch (sourceLab) {
    case 'kaycha':
      return parseKaycha(text);
    case 'drs-confident':
      return parseDrsConfident(text);
    default:
      return {
        lab: '',
        brand: '',
        strain: '',
        batch: '',
        totalThcPct: null,
        totalCbdPct: null,
        totalTerpenesPct: null,
        cannabinoids: [],
        terpenes: [],
        safety: [],
        sourceLab: 'unknown',
      };
  }
}
