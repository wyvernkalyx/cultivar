import { withSupabase } from '@supabase/server';

import { extractText } from '../_shared/coa/extractText.ts';
import { parseCoa } from '../_shared/coa/parseCoa.ts';

/**
 * `ingest-coa` -- accept a COA PDF, extract and parse it, return the result.
 *
 * Parse-and-return only: nothing is written to the database or to Storage. A
 * parsed COA is never persisted before a human confirms it on the confirm/edit
 * screen, so this function is pure with respect to project state.
 *
 * The body is raw `application/pdf` bytes rather than `multipart/form-data`.
 * We own both sides of this seam, so multipart would buy nothing and cost a
 * parser.
 */

const PDF_MEDIA_TYPE = 'application/pdf';

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/** The media type, minus any `; charset=...` parameters, lowercased. */
function mediaType(contentType: string | null): string {
  return (contentType ?? '').split(';')[0].trim().toLowerCase();
}

/**
 * Lowercase hex SHA-256 of the given bytes (D88.5). Lowercase is not
 * cosmetic: it is the case D88.3's `~ '^[0-9a-f]{64}$'` check constraint
 * accepts, and a rejected hash silently disables the dedupe fast path.
 *
 * The parameter is `Uint8Array<ArrayBuffer>`, not bare `Uint8Array`: under
 * TS 6 the bare form widens to `ArrayBufferLike`, which `BufferSource`
 * rejects because it admits `SharedArrayBuffer`. The caller's array is
 * already backed by a plain `ArrayBuffer`.
 */
async function sha256Hex(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * The handler body, exported separately from the authenticated default export
 * so it can be exercised in tests without minting a user JWT.
 *
 * A malformed PDF is the caller's error, not ours, so a parser throw maps to
 * 400. 500 stays reserved for genuinely unexpected failures.
 */
export async function ingestCoa(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonError(`Method ${req.method} not allowed; use POST.`, 405);
  }

  if (mediaType(req.headers.get('content-type')) !== PDF_MEDIA_TYPE) {
    return jsonError(`Expected Content-Type: ${PDF_MEDIA_TYPE}.`, 415);
  }

  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.byteLength === 0) {
    return jsonError('Empty request body; expected PDF bytes.', 400);
  }

  // Hashed BEFORE extraction, never after: unpdf takes ownership of the array
  // and detaches its buffer, so `bytes` is zero-length by the time parseCoa
  // returns and a digest taken there is the hash of the empty string
  // (observed: e3b0c442...). This is still the digest of exactly what was
  // parsed -- same array, read before the parser consumes it. Outside the try
  // on purpose: that catch maps a throw to 400 as the caller's error, and a
  // digest failure would not be the caller's.
  const pdfSha256 = await sha256Hex(bytes);

  try {
    const parsed = parseCoa(await extractText(bytes));
    // Still parse-and-return: hashing reads, writes nothing, adds no
    // dependency, and rides on the success shape only (D88.5).
    return Response.json({ data: { ...parsed, pdfSha256 } });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : 'Could not parse the PDF.',
      400,
    );
  }
}

export default {
  fetch: withSupabase({ auth: 'user' }, (req: Request) => ingestCoa(req)),
};
