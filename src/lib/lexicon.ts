// The scoring lexicon, client side: the single source for the overall-scale
// vocabulary and the version stamped onto every session entry
// (documentation/design/session-logging.md, persistence contract). The word
// is the raw answer as displayed; the score is that word's hidden 1-5 value
// at this LEXICON_VERSION (session-entries-schema.md).
export const LEXICON_VERSION = 1;

// Ordered top rung first (D51: up = better, "Meh" at dead center) — index i
// here IS rung index i on the ladder. The ladder and the chip row both read
// this array; the rung index resolves to word + score through this one
// source, never two.
export const RUNGS = [
  { word: 'I loved it', score: 5 },
  { word: 'Yes', score: 4 },
  { word: 'Meh', score: 3 },
  { word: 'No', score: 2 },
  { word: 'I hated it', score: 1 },
] as const;

// The intent vocabulary, v1 seed list in authored order (scoring-lexicon
// doc; D56): rendered as seven uniform chips until onboarding ships a
// default. Aimless-on-purpose is a first-class answer, never a skip; an
// unanswered chip row stores intent as null (D48).
export const INTENTS = [
  'sleep',
  'exercise',
  'study/work',
  'create',
  'sex',
  'socialize',
  'just because',
] as const;
