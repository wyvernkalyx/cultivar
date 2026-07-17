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

// Aimless-on-purpose is the one intent under which fit is unaskable —
// "did it do what you wanted" has no referent (scoring-lexicon rule,
// inherited hard by rich-path.md). Typed against INTENTS so the spelling
// cannot drift from the chip that writes it.
export const AIMLESS_INTENT: (typeof INTENTS)[number] = 'just because';

// The fit vocabulary (rich-path.md, D64): three uniform chips answering
// "Did it do what you wanted?". Fit is intent-relative (D66) and never
// touches the score or the books. One source, never two.
export const FITS = ['No', 'Sort of', 'Yes'] as const;
