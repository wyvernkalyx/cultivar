// D152 (2026-08-21): what a terpene smells like, one line each, so a name in
// a legend explains itself where it is read. Aroma and a familiar source --
// nothing else. No effect, mood, medical, or "known for" language, here or
// anywhere this renders: the lab measured the compound; what it does to a
// person is what the user's own sessions say (the personal-empirical rule
// applied to copy).
//
// Entries exist only where the aroma is uncontroversial common knowledge.
// Canonical names not listed (among them p-Cymene, alpha- and gamma-
// Terpinene, alpha-Phellandrene, Sabinene Hydrate, Isopulegol) have no entry
// and render the fallback -- never a guessed descriptor. Keys are lowercase
// canonical names as normalize.ts emits them; lookup lowercases the input.

export type TerpeneAroma = { aroma: string };

const GLOSSARY: Record<string, TerpeneAroma> = {
  limonene: { aroma: 'Citrus. The smell of lemon and orange peel.' },
  caryophyllene: { aroma: 'Peppery and woody. Black pepper, clove.' },
  'caryophyllene oxide': {
    aroma: 'Drier and woodier than Caryophyllene. The smell of aged spice.',
  },
  myrcene: { aroma: 'Earthy and musky, a little fruity. Mango, hops, lemongrass.' },
  pinene: { aroma: 'Pine. Fresh pine needles, rosemary.' },
  'alpha-pinene': { aroma: 'Pine. Fresh pine needles, rosemary.' },
  'beta-pinene': { aroma: 'Pine with a green, herbal edge. Basil, dill, parsley.' },
  linalool: { aroma: 'Floral. Lavender.' },
  humulene: { aroma: 'Woody and earthy with a hoppy bitterness. Hops, coriander.' },
  terpinolene: { aroma: 'Fresh, piney, lightly floral. Lilac, apple, cumin.' },
  ocimene: { aroma: 'Sweet and herbaceous. Mint, basil, mango.' },
  bisabolol: { aroma: 'Light, sweet floral. Chamomile.' },
  farnesene: { aroma: 'Green apple peel, a little floral.' },
  camphene: { aroma: 'Camphor and damp fir needles.' },
  nerolidol: { aroma: 'Woody and floral, like fresh tree bark. Jasmine, tea tree.' },
  'cis-nerolidol': { aroma: 'Woody and floral, like fresh tree bark. Jasmine, tea tree.' },
  'trans-nerolidol': { aroma: 'Woody and floral, like fresh tree bark. Jasmine, tea tree.' },
  geraniol: { aroma: 'Rose and geranium.' },
  eucalyptol: { aroma: 'Eucalyptus. Cool and camphor-like.' },
  guaiol: { aroma: 'Pine and rose, with a woody base.' },
  terpineol: { aroma: 'Lilac and lime blossom.' },
  valencene: { aroma: 'Orange. Named for the Valencia orange.' },
  citronellol: { aroma: 'Citronella and rose.' },
  borneol: { aroma: 'Camphor and mint, a little earthy.' },
  fenchol: { aroma: 'Camphor with a lemon and pine edge.' },
  carene: { aroma: 'Sweet pine and cedar.' },
  menthol: { aroma: 'Mint. Cooling.' },
  sabinene: { aroma: 'Spicy and woody. Black pepper, nutmeg.' },
  'alpha-cedrene': { aroma: 'Cedar wood.' },
};

export const TERPENE_AROMA_FALLBACK = 'No description yet.';

// The one footer line, shown under every entry and the fallback alike.
export const TERPENE_GLOSSARY_FOOTER =
  'A lab-reported aroma compound. Cultivar reports what was in the product, not what it does.';

export function terpeneAroma(name: string): string {
  return GLOSSARY[name.trim().toLowerCase()]?.aroma ?? TERPENE_AROMA_FALLBACK;
}
