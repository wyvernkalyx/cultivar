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

// The glossary tap-surface content (D86, corrected by D86.6/D86.7): the 27
// ratified one-line definitions, grouped by the survey phase whose sheet shows
// them. Copied character-for-character from the 27-entry tables in
// documentation/design/glossary.md — the em dashes inside definitions are
// content (D86.3) and are never normalized. Axis groups lead with their
// axis-title entry (Target Energy, Setting, Main Goal); the ladder group is the
// five rungs with no heading entry (D86.7). closing has no group, so its sheet
// trigger never renders (structural exclusion). Terms here match the vocabulary
// arrays above — one source, never two.
export type GlossaryEntry = { term: string; definition: string };
export type GlossaryPhase =
  | 'ladder'
  | 'energy'
  | 'environment'
  | 'main_goal'
  | 'fit'
  | 'physical_state'
  | 'co_consumption';
export const GLOSSARY: Record<GlossaryPhase, readonly GlossaryEntry[]> = {
  ladder: [
    { term: 'Loved', definition: "Top tier — an absolute go-to experience you'd want every time." },
    { term: 'Liked', definition: "Good — a positive experience you'd happily repeat." },
    { term: 'Neutral', definition: "Middle ground — unremarkable either way; neither good nor bad." },
    { term: 'Disliked', definition: "Disappointing — fell short of what you were hoping for." },
    { term: 'Hated', definition: "Poor — a terrible experience you'd actively avoid repeating." },
  ],
  energy: [
    { term: 'Target Energy', definition: "The physical or mental pace you were hoping to set for the session." },
    { term: 'Relaxed', definition: "Unwinding — wanting to slow down, ease off, and take it easy." },
    { term: 'Active', definition: "Up and moving — wanting to stay physically or mentally engaged." },
    { term: 'High-Energy', definition: "Upbeat — wanting a lively, fast-paced, or animated feel." },
  ],
  environment: [
    { term: 'Setting', definition: "Who was around you and the environment you were in." },
    { term: 'Solo', definition: "Flying solo — spending time on your own." },
    { term: 'Social', definition: "With others — hanging out, sharing, or being around people." },
  ],
  main_goal: [
    { term: 'Main Goal', definition: "What made you reach for it — your primary intention for the session." },
    { term: 'Ease Tension', definition: "Wanting to loosen up and let go of what was weighing on you." },
    { term: 'Deep Focus', definition: "Getting in the zone — wanting to lock into an activity without distraction." },
    { term: 'Appetite', definition: "Wanting to enjoy food more or boost your appetite." },
  ],
  fit: [
    { term: 'Missed', definition: "It didn't give you the feeling or outcome you were going for." },
    { term: 'Partly', definition: "It got you partway there, but didn't fully deliver." },
    { term: 'Matched', definition: "It hit the spot — delivered exactly what you were hoping for." },
  ],
  physical_state: [
    { term: 'Thirsty', definition: "Went in feeling dry, thirsty, or needing water." },
    { term: 'Tired', definition: "Went in feeling worn out or low on energy." },
    { term: 'Wound Up', definition: "Went in feeling tense, rushed, or under pressure." },
  ],
  co_consumption: [
    { term: 'Alcohol', definition: "Drank alcohol right before, during, or shortly after this session." },
    { term: 'Caffeine', definition: "Had coffee, tea, or an energy drink around this session." },
    { term: 'Nicotine', definition: "Smoked, vaped, or used nicotine around this session." },
    { term: 'Heavy Meal', definition: "Ate a heavy or high-fat meal right around this session." },
    { term: 'Aromatic Foods', definition: "Ate strongly aromatic foods — citrus, mango, or fresh herbs — around this session." },
  ],
} as const;
