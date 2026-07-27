// The scoring lexicon, client side: the single source for the overall-scale
// vocabulary and the version stamped onto every session entry
// (documentation/design/session-logging.md, persistence contract). The word
// is the raw answer as displayed; the score is that word's hidden 1-5 value
// at this LEXICON_VERSION (session-entries-schema.md).
//
// v4 marks the FIELD SET, not the strings (D94). The survey cut retired the
// three intent axes, fit, and both confound panels, and dropped their columns:
// under v3 a null main_goal meant the user SKIPPED, under v4 it means the
// question was never ASKED, and D48's "unanswered is not an answer" requires
// those stay distinguishable — so the version must carry the field set, not
// merely the strings. The hidden 5/4/3/2/1 mapping is UNCHANGED across
// v3->v4, exactly as it was across v1->v2 and v2->v3, so cross-version score
// averaging in coa_session_stats stays valid with no lexicon_version branch
// and NO ratified recompute is triggered (D94).
export const LEXICON_VERSION = 4;

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

// The glossary tap-surface content, reduced to the ladder by D96: five
// entries, one term-bearing phase, one sheet, zero orphans (D86.6's partition
// property restated for the cut). Copied character-for-character from the
// 27-entry tables in documentation/design/glossary.md — the em dashes inside
// definitions are content (D86.3's verbatim rule, which survives in full for
// the five that remain) and are never normalized. glossary.md is NOT edited:
// it is the ledger and keeps all 27, including the vocabularies whose surfaces
// this cut retired (D93's CO_CONSUMPTION tripwire reads from it). The closing
// screen has no group, so its sheet trigger never renders — the structural
// exclusion, unchanged. Terms here match RUNGS above — one source, never two.
export type GlossaryEntry = { term: string; definition: string };
export type GlossaryPhase = 'ladder';
export const GLOSSARY: Record<GlossaryPhase, readonly GlossaryEntry[]> = {
  ladder: [
    { term: 'Loved', definition: "Top tier — an absolute go-to experience you'd want every time." },
    { term: 'Liked', definition: "Good — a positive experience you'd happily repeat." },
    { term: 'Neutral', definition: "Middle ground — unremarkable either way; neither good nor bad." },
    { term: 'Disliked', definition: "Disappointing — fell short of what you were hoping for." },
    { term: 'Hated', definition: "Poor — a terrible experience you'd actively avoid repeating." },
  ],
} as const;
