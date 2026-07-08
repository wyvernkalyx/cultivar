import type { SourceLab } from './types';

/**
 * Identify which lab produced a COA from its extracted text.
 *
 * Detection uses strings that survive ligature-stripping cleanly:
 *  - Kaycha Labs prints "Kaycha Labs" throughout.
 *  - DRS / Confident LIMS prints "DRS Testing" (the "Confident LIMS" wordmark
 *    loses its "fi" ligature to a null byte, so we do not rely on it).
 */
export function identifyLab(text: string): SourceLab {
  if (/Kaycha\s+Labs/i.test(text)) return 'kaycha';
  if (/DRS\s+Testing/i.test(text) || /Con\w*dent\s+LIMS/i.test(text)) {
    return 'drs-confident';
  }
  return 'unknown';
}
