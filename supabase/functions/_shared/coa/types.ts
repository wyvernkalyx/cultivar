// Normalized, structured representation of a parsed COA (Certificate of Analysis).
//
// Truth rule (see CLAUDE.md): never fabricate a value. Any analyte that the lab
// reported as ND / <LOQ / not-reported is represented as `null`, never `0` and
// never an invented number.

export type SourceLab = 'kaycha' | 'drs-confident' | 'unknown';

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
  lab: string;
  brand: string;
  strain: string;
  batch: string;
  totalThcPct: number | null;
  totalCbdPct: number | null;
  totalTerpenesPct: number | null;
  cannabinoids: Analyte[];
  terpenes: Analyte[];
  safety: SafetyRow[];
  sourceLab: SourceLab;
}
