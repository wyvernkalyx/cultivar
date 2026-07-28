import { supabase } from '@/lib/supabase';

/**
 * COA source-PDF retention against Supabase Storage (slice 4, D87).
 *
 * The invariant this module exists to hold: the upload happens in the same
 * user action that commits the `coas` row, and NEVER at parse time. A
 * rejected or abandoned parse must leave no object behind, so `ingest-coa`
 * writes nothing here and nothing calls into this module until a row exists.
 *
 * Sequencing is D87.4, after-save update: `insert_coa` runs unchanged and
 * returns the new id, the object is uploaded to `{uid}/{coa_id}.pdf` keyed by
 * that id, and only then is `coas.pdf_object_path` written. The path embeds
 * the row id, which does not exist until the insert returns — an insert-time
 * path would record a reference to an object that does not exist yet.
 *
 * Neither function throws across the module boundary: both return a
 * discriminated result, because the caller's job in this slice is to surface
 * the failure, not to recover from it.
 */

/** Where a retention attempt stopped. Part of the user-visible notice. */
export type UploadStage = 'session' | 'read' | 'upload' | 'update';

export type UploadCoaPdfResult =
  | { ok: true; path: string }
  | { ok: false; stage: UploadStage; message: string };

export type RemoveCoaPdfResult = { ok: true } | { ok: false; message: string };

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Upload a picked COA PDF and record its object path on the already-saved
 * row. Call this only after `insert_coa` has returned an id.
 *
 * The `stage` on failure is load-bearing: the gate for this slice is the
 * physical device, where the only evidence is what the UI says, and
 * "session" / "read" / "upload" / "update" are four genuinely different
 * defects with four different fixes.
 */
export async function uploadCoaPdf(
  fileUri: string,
  coaId: string,
): Promise<UploadCoaPdfResult> {
  // Same posture as ingest-coa.ts: no session is an error, not a throw.
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) {
    return { ok: false, stage: 'session', message: 'Not signed in.' };
  }
  // The uid is the first path segment every Storage policy keys on
  // (D87.1: `(storage.foldername(name))[1] = auth.uid()::text`), so it comes
  // from the session rather than being passed in and trusted.
  const uid = session.user.id;
  const path = `${uid}/${coaId}.pdf`;

  // The fetch(file://) read is the path already proven by ingest-coa.ts. RN's
  // Blob cannot be constructed from an ArrayBuffer, so the ArrayBuffer itself
  // is the upload body.
  let bytes: ArrayBuffer;
  try {
    const fileResponse = await fetch(fileUri);
    bytes = await fileResponse.arrayBuffer();
  } catch (err) {
    return {
      ok: false,
      stage: 'read',
      message: `Could not read the picked file: ${describe(err)}`,
    };
  }

  const { error: uploadError } = await supabase.storage
    .from('coa-pdfs')
    .upload(path, bytes, {
      contentType: 'application/pdf',
      // No upsert: one COA row owns one object path, and a silent overwrite
      // would destroy a retained document without recording that it happened.
      upsert: false,
    });
  if (uploadError) {
    return { ok: false, stage: 'upload', message: uploadError.message };
  }

  // The object exists but nothing points at it until this lands. A failure
  // here is D87.4's named, accepted cost: a saved COA with a null path and an
  // orphan object — detectable and repairable, unlike its inverse.
  const { error: updateError } = await supabase
    .from('coas')
    .update({ pdf_object_path: path })
    .eq('id', coaId);
  if (updateError) {
    return { ok: false, stage: 'update', message: updateError.message };
  }

  return { ok: true, path };
}

/**
 * Remove a retained PDF. Called after the `coas` row is already deleted —
 * row first, then object, so a failure here leaves a detectable orphan rather
 * than a row referencing a document that no longer exists.
 *
 * No uid logic: Storage RLS scopes the delete server-side, and re-deriving
 * the prefix client-side would be a second, weaker copy of that rule.
 *
 * Success requires an object to have actually been removed, not merely the
 * absence of an error: `remove()` reports both a policy refusal and an
 * already-absent object as `error: null` with empty `data`, so trusting the
 * error alone would swallow exactly the orphan D87 requires to be surfaced.
 */
export async function removeCoaPdf(objectPath: string): Promise<RemoveCoaPdfResult> {
  const { data, error } = await supabase.storage.from('coa-pdfs').remove([objectPath]);
  if (error) {
    return { ok: false, message: error.message };
  }
  // The count is the evidence, not the error: remove() reports absence and
  // refusal alike as success-with-empty-data.
  if ((data ?? []).length === 0) {
    return {
      ok: false,
      message: 'No object was removed; it may not exist or removal was not permitted.',
    };
  }
  return { ok: true };
}
