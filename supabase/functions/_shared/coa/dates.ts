// Pure US-date normalizer shared by the per-lab parsers (D84.2).
//
// Lives in _shared/coa/ because both parsers consume it and Jest's `roots`
// discover only this directory. Dependency-free and side-effect-free.

/**
 * Normalize a US `M/D/YY`..`MM/DD/YYYY` date string to ISO `YYYY-MM-DD`.
 *
 * Accepts 1-2 digit month/day and a 2- or 4-digit year. A 2-digit year
 * pivots to `20YY` (D84.2) -- documented interpretation, not fabrication:
 * the value is transcribed from the COA, never invented. Returns null for
 * null/undefined/empty, non-date-shaped input, a 3-digit year, a month
 * outside 1-12, or a day outside 1-31.
 *
 * Bounds are numeric only -- there is no calendar validation, so Feb 30
 * passes. That is a deliberate approximation: rejecting a transcribed date
 * on calendar grounds would discard a value the lab printed; the ND-class
 * invariant only forbids inventing values, not transcribing odd ones.
 */
export function normalizeUsDate(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = raw.trim();
  if (s === '') return null;

  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(s);
  if (!m) return null;

  const [, mm, dd, yy] = m;
  if (yy.length === 3) return null; // only 2- or 4-digit years

  const month = Number(mm);
  const day = Number(dd);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const year = yy.length === 2 ? 2000 + Number(yy) : Number(yy);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}
