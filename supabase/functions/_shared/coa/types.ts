// Normalized, structured representation of a parsed COA (Certificate of Analysis).
//
// Truth rule (see CLAUDE.md): never fabricate a value. Any analyte that the lab
// reported as ND / <LOQ / not-reported is represented as `null`, never `0` and
// never an invented number. The same rule governs the text fields (D97): a
// field the document does not state is `null`, never `''` -- an empty string
// would assert that the document says blank, which is a different claim.

export type SourceLab = 'kaycha' | 'drs-confident' | 'green-analytics' | 'act' | 'unknown';

/** A single measured analyte. `pct` is null for ND / <LOQ / not-reported. */
export interface Analyte {
  name: string;
  pct: number | null;
}

/** A pass/fail compliance category (Pesticides, Heavy Metals, ...). */
export interface SafetyRow {
  category: string;
  status: string;
}

export interface CoaResult {
  /** Lab name as printed; null when the document does not state one. */
  lab: string | null;
  /** Brand as printed; null when the document does not state one. */
  brand: string | null;
  /** Strain as printed; null when the document does not state one. */
  strain: string | null;
  /** Batch as printed; null when the document does not state one. */
  batch: string | null;
  /** ISO YYYY-MM-DD from the COA's sampled/collection date; null when absent or unparseable. */
  sampledDate: string | null;
  /** ISO YYYY-MM-DD from the COA's completed/report date; null when absent or unparseable. */
  testedDate: string | null;
  totalThcPct: number | null;
  totalCbdPct: number | null;
  totalTerpenesPct: number | null;
  cannabinoids: Analyte[];
  terpenes: Analyte[];
  safety: SafetyRow[];
  sourceLab: SourceLab;
}
