import { extractText as unpdfExtractText, getDocumentProxy } from 'unpdf';

// Null byte that pdf.js emits in place of an fi/fl ligature glyph, plus the
// real Unicode ligature codepoints (defensive -- unpdf emits the null byte on
// our fixtures, not these). Built via char codes so no literal control/ligature
// characters live in this source file.
const NUL = String.fromCharCode(0x0000);
const LIGATURES: [string, string][] = [
  [String.fromCharCode(0xfb00), 'ff'],
  [String.fromCharCode(0xfb01), 'fi'],
  [String.fromCharCode(0xfb02), 'fl'],
  [String.fromCharCode(0xfb03), 'ffi'],
  [String.fromCharCode(0xfb04), 'ffl'],
];

/**
 * Extract the full text of a born-digital COA PDF.
 *
 * Uses unpdf (pdf.js under the hood), which is Deno/serverless-compatible so
 * this same code can later run inside a Supabase Edge Function.
 *
 * pdf.js emits a null byte where the source PDF used an fi/fl ligature glyph
 * (e.g. "Certi<NUL>cate", "Con<NUL>dent LIMS"). We strip those so downstream
 * regexes see clean, single-spaced text. The dropped ligature characters do
 * not affect any parsed value (batch, strain, and analyte rows contain none),
 * only cosmetic words in boilerplate.
 */
export async function extractText(pdf: Uint8Array): Promise<string> {
  const doc = await getDocumentProxy(pdf);
  const { text } = await unpdfExtractText(doc, { mergePages: true });
  return cleanText(text);
}

/** Normalize extracted PDF text: drop ligature null bytes, collapse whitespace. */
export function cleanText(raw: string): string {
  let out = raw.split(NUL).join('');
  for (const [glyph, replacement] of LIGATURES) {
    out = out.split(glyph).join(replacement);
  }
  return out.replace(/\s+/g, ' ').trim();
}
