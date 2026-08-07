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

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

/**
 * Normalize a month-name US date (`May 08, 2026`, `May 8, 2026`) to ISO
 * `YYYY-MM-DD`. Full English month names only, matched case-insensitively;
 * lived-demand scope -- CTND prints this form and prints it with the full
 * name. Returns null for null/undefined/empty, non-matching shape, an
 * unknown month name, a day outside 1-31, or a non-4-digit year. Same
 * numeric-bounds-only posture as normalizeUsDate above: transcription,
 * never invention.
 */
export function normalizeMonthNameDate(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  const s = raw.trim();
  if (s === '') return null;

  const m = /^([A-Za-z]+) (\d{1,2}), (\d{4})$/.exec(s);
  if (!m) return null;

  const month = MONTHS[m[1].toLowerCase()];
  if (month == null) return null;
  const day = Number(m[2]);
  if (day < 1 || day > 31) return null;

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${m[3]}-${pad(month)}-${pad(day)}`;
}
