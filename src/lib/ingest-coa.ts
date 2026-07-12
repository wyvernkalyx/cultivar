import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase';

export type IngestResult =
  | { ok: true; status: number; json: unknown }
  | { ok: false; status: number | null; body: string; message: string };

/**
 * Send a picked COA PDF to the deployed `ingest-coa` Edge Function as raw
 * authenticated fetch (D33) and hand back whatever comes back, success or not.
 * Never throws — the caller renders the result raw; this slice is evidence,
 * not interpretation.
 */
export async function ingestCoaPdf(fileUri: string): Promise<IngestResult> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) {
    return { ok: false, status: null, body: '', message: 'Not signed in.' };
  }

  // The fetch(file://) read is proven on this stack, but RN's Blob cannot be
  // constructed from an ArrayBuffer, so the body is the ArrayBuffer itself —
  // RN networking converts it to base64 internally and sends raw bytes,
  // lossless.
  let bytes: ArrayBuffer;
  try {
    const fileResponse = await fetch(fileUri);
    bytes = await fileResponse.arrayBuffer();
  } catch (err) {
    return {
      ok: false,
      status: null,
      body: '',
      message: `Could not read the picked file: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  let response: Response;
  let bodyText: string;
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/ingest-coa`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: SUPABASE_ANON_KEY,
        // Explicit — application/octet-stream would be 415'd by the function.
        'Content-Type': 'application/pdf',
      },
      body: bytes,
    });
    bodyText = await response.text();
  } catch (err) {
    return {
      ok: false,
      status: null,
      body: '',
      message: err instanceof Error ? err.message : String(err),
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(bodyText);
  } catch {
    return {
      ok: false,
      status: response.status,
      body: bodyText,
      message: 'Response body is not valid JSON.',
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      body: bodyText,
      message: `HTTP ${response.status}`,
    };
  }

  return { ok: true, status: response.status, json };
}
