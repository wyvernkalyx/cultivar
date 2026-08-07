import type { SourceLab } from './types.ts';

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
  if (/Green\s+Analytics/i.test(text)) return 'green-analytics';
  if (/DRS\s+Testing/i.test(text) || /Con\w*dent\s+LIMS/i.test(text)) {
    return 'drs-confident';
  }
  // D128: the anchor is the literal lab name, exact case; 24 hits on the
  // fixture, 0 on every other lab's fixture (cross-fixture negative case).
  if (text.includes('ACT Laboratories')) return 'act';
  return 'unknown';
}
