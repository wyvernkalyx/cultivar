// The scoring lexicon, client side: the single source for the overall-scale
// vocabulary and the version stamped onto every session entry
// (documentation/design/session-logging.md, persistence contract). The word
// is the raw answer as displayed; the score is that word's hidden 1-5 value
// at this LEXICON_VERSION (session-entries-schema.md).
export const LEXICON_VERSION = 3;

// Ordered top rung first (D51: up = better, "Neutral" at dead center) — index
// i here IS rung index i on the ladder. The ladder reads this array; the rung
// index resolves to word + score through this one source, never two. D85
// swapped the strings (Loved/Liked/Neutral/Disliked/Hated); the hidden
// 5/4/3/2/1 mapping is UNCHANGED across v2->v3 exactly as it was across
// v1->v2, and that is exactly what keeps cross-version score averaging
// (coa_session_stats) valid — averaging rides on a stable hidden-value
// mapping, so it alone needs no lexicon_version branch (D85.1, D85.3).
export const RUNGS = [
  { word: 'Loved', score: 5 },
  { word: 'Liked', score: 4 },
  { word: 'Neutral', score: 3 },
  { word: 'Disliked', score: 2 },
  { word: 'Hated', score: 1 },
] as const;

// The three intent axes (D71 structure, D85.1 strings), each a forced single
// pick in its own field, each independently nullable (null = unanswered).
// Authored order per the D85.1 vocabulary. Main Goal is the intent anchor
// (D72) and the fit question's referent (D73); a null Main Goal is the
// aimless session. One source, never two.
export const ENERGY = ['Relaxed', 'Active', 'High-Energy'] as const;
export const ENVIRONMENT = ['Solo', 'Social'] as const;
export const MAIN_GOAL = ['Ease Tension', 'Deep Focus', 'Appetite'] as const;

// The two multi-select confound panels: co-consumption (D75) and
// physical-state (D76). Presence-only, toggled by tap (D78). Authored order
// per the D85.1 vocabularies. One source, never two.
export const CO_CONSUMPTION = [
  'Alcohol',
  'Caffeine',
  'Nicotine',
  'Heavy Meal',
  'Aromatic Foods',
] as const;
export const PHYSICAL_STATE = ['Thirsty', 'Tired', 'Wound Up'] as const;

// The fit vocabulary (D64 placement, D85.1 strings): three uniform chips
// answering "Did it do what you wanted?". Fit is Main-Goal-relative (D72) and
// never touches the score or the books. D85 retires the v2 strings; fit's
// placement and nulling rule are untouched (D78 records why). One source,
// never two.
export const FITS = ['Missed', 'Partly', 'Matched'] as const;
