// Pre-populated analyte names for manual COA entry (D134). Client copies:
// the terpene list mirrors the distinct display values of the server
// terpene canon (supabase/functions/_shared/coa/normalize.ts), in canon
// order -- server code must not enter the Metro bundle, so the duplication
// is the accepted debt, same pattern as the CoaParseResult mirror. The
// cannabinoid list is ratified copy (no code canon exists; see
// documentation/design/manual-entry.md, "Pre-populated names").
//
// These are form labels, not data: a row's name reaches the database only
// when the user gives that row a value (a number or an explicit ND).

export const MANUAL_TERPENE_NAMES: readonly string[] = [
  'Myrcene',
  'Limonene',
  'Caryophyllene',
  'Caryophyllene Oxide',
  'Humulene',
  'Linalool',
  'Pinene',
  'alpha-Pinene',
  'beta-Pinene',
  'Bisabolol',
  'Terpineol',
  'Fenchol',
  'Valencene',
  'Camphene',
  'Farnesene',
  'Guaiol',
  'Ocimene',
  'Geraniol',
  'Menthol',
  'Terpinolene',
  'alpha-Phellandrene',
  'alpha-Terpinene',
  'gamma-Terpinene',
  'Eucalyptol',
  'Nerolidol',
  'Isopulegol',
  'Sabinene',
  'Carene',
  'p-Cymene',
  'Sabinene Hydrate',
  'Citronellol',
  'alpha-Cedrene',
  'cis-Nerolidol',
  'trans-Nerolidol',
  'Borneol',
];

export const MANUAL_CANNABINOID_NAMES: readonly string[] = [
  'THCa',
  'D9-THC',
  'D8-THC',
  'D10-THC',
  'THCV',
  'THCVa',
  'CBD',
  'CBDa',
  'CBDV',
  'CBDVa',
  'CBC',
  'CBCa',
  'CBG',
  'CBGa',
  'CBN',
];
