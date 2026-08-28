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
  // The Smithers wordmark renders as an image; the text anchor is the
  // signing entity "Smithers CTS New York LLC", present on every page.
  if (/Smithers\s+CTS/i.test(text)) return 'smithers';
  // D162: the wordmark renders as an image; the text anchor is the signing
  // entity plus the per-page sampling footnote -- observed 16 hits on each
  // of three real documents, 0 on all ten prior-lab fixtures.
  if (/Keystone\s+State\s+Testing/i.test(text)) return 'keystone';
  // D128: the anchor is the literal lab name, exact case; 24 hits on the
  // fixture, 0 on every other lab's fixture (cross-fixture negative case).
  if (text.includes('ACT Laboratories')) return 'act';
  // D128: 36 hits on the CTND fixture, 0 on every other lab's fixture.
  if (text.includes('CTND')) return 'ctnd';
  return 'unknown';
}
