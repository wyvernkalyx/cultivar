// The scoring lexicon, client side: the single source for the overall-scale
// vocabulary and the version stamped onto every session entry
// (documentation/design/session-logging.md, persistence contract). The word
// is the raw answer as displayed; the score is that word's hidden 1-5 value
// at this LEXICON_VERSION (session-entries-schema.md).
export const LEXICON_VERSION = 2;

// Ordered top rung first (D51: up = better, "Mid" at dead center) — index i
// here IS rung index i on the ladder. The ladder reads this array; the rung
// index resolves to word + score through this one source, never two. D70
// swapped the strings (Elite/Solid/Mid/Miss/Trash); the hidden 5/4/3/2/1
// mapping is UNCHANGED, and that is exactly what keeps cross-version score
// averaging (coa_session_stats) valid — averaging rides on a stable
// hidden-value mapping (session-entries-schema.md, D77).
export const RUNGS = [
  { word: 'Elite', score: 5 },
  { word: 'Solid', score: 4 },
  { word: 'Mid', score: 3 },
  { word: 'Miss', score: 2 },
  { word: 'Trash', score: 1 },
] as const;

// The three intent axes (D71), each a forced single pick in its own field,
// each independently nullable (null = unanswered). Authored order per the
// D71 vocabulary. Spark is the intent anchor (D72) and the fit question's
// referent (D73); Spark-null is the aimless session. One source, never two.
export const ENERGY = ['Chill', 'Active', 'Buzzing'] as const;
export const ENVIRONMENT = ['Solo', 'Social'] as const;
export const SPARK = ['Relief', 'Flow', 'Munchies'] as const;

// The two multi-select confound panels: co-consumption (D75) and
// physical-state (D76). Presence-only, toggled by tap (D78). Authored order
// per the D75/D76 vocabularies. One source, never two.
export const CO_CONSUMPTION = [
  'Alcohol',
  'Caffeine',
  'Nicotine',
  'Fatty food',
  'Terpene-rich food',
] as const;
export const PHYSICAL_STATE = ['Dehydrated', 'Fatigued', 'Stressed'] as const;

// The fit vocabulary (D64): three uniform chips answering "Did it do what
// you wanted?". Fit is Spark-relative (D72) and never touches the score or
// the books. It survives the D70-D76 supersession — the pass retired fit's
// placement and nulling rule, never its strings (D78 records why). One
// source, never two.
export const FITS = ['No', 'Sort of', 'Yes'] as const;
