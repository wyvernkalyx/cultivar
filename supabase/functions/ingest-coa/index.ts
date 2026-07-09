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

  try {
    const parsed = parseCoa(await extractText(bytes));
    return Response.json({ data: parsed });
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
