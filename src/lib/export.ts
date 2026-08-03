import { File, Paths } from 'expo-file-system';
import { Share } from 'react-native';

import { supabase } from '@/lib/supabase';

/**
 * Full-profile export (D111, `documentation/design/profile-reset-and-export.md`).
 *
 * Eight authenticated selects, serialized client-side into one versioned
 * JSON document and handed to the share sheet. Nothing here mutates: this
 * module reads and writes a file, and never touches a row.
 *
 * Rows travel verbatim. Every table is selected with `*` and handed to
 * `JSON.stringify` untouched -- no coalescing, no defaulting, no rounding.
 * That is what keeps an absent analyte null: a `pct` the lab did not report
 * is null in the database, and the one way to export it as 0 would be to
 * write code that puts it there. There is no such code, deliberately.
 */

/** One row, untyped. The client has no generated database types (the
 * `coa-retire.ts` debt), and an export that enumerated columns would rot
 * against the next migration -- `*` is both simpler and more durable. */
export type ExportRow = Record<string, unknown>;

export type ExportData = {
  profiles: ExportRow[];
  coas: ExportRow[];
  coa_cannabinoids: ExportRow[];
  coa_terpenes: ExportRow[];
  coa_safety: ExportRow[];
  coa_retirements: ExportRow[];
  profile_resets: ExportRow[];
  session_entries: ExportRow[];
};

export type ExportMeta = {
  userId: string;
  exportedAt: string;
};

export type ExportEnvelope = {
  format: 'cultivar-export';
  version: 1;
  exported_at: string;
  user_id: string;
  data: ExportData;
};

/**
 * The envelope, built from already-fetched rows. Pure: no network, no
 * clock, no supabase import reachable from here -- both moving parts are
 * arguments, so this is the piece that becomes testable the day app-code
 * tests exist ([ADAPT] item 1).
 *
 * `version` is the reason the envelope exists: a future import can refuse
 * a document it does not understand rather than guess at it.
 */
export function buildExport(rows: ExportData, meta: ExportMeta): ExportEnvelope {
  return {
    format: 'cultivar-export',
    version: 1,
    exported_at: meta.exportedAt,
    user_id: meta.userId,
    data: {
      profiles: rows.profiles,
      coas: rows.coas,
      coa_cannabinoids: rows.coa_cannabinoids,
      coa_terpenes: rows.coa_terpenes,
      coa_safety: rows.coa_safety,
      coa_retirements: rows.coa_retirements,
      profile_resets: rows.profile_resets,
      session_entries: rows.session_entries,
    },
  };
}

/**
 * Unwraps one select, or throws naming the table that failed. A partial
 * export is worse than no export: it looks complete and is not, so one
 * failed read aborts the whole document rather than shipping a file with a
 * silently empty section.
 */
function rowsOrThrow(
  table: string,
  result: { data: unknown; error: { message: string } | null },
): ExportRow[] {
  if (result.error) {
    throw new Error(`Could not read ${table}: ${result.error.message}`);
  }
  return (result.data ?? []) as ExportRow[];
}

/**
 * The eight selects. RLS scopes every one of them to the caller, so no
 * query carries an owner predicate of its own -- unlike the server-side
 * lookups, which run where RLS may not apply.
 *
 * Ordering is deterministic per table so two exports of unchanged data are
 * byte-identical and diffable.
 */
export async function fetchExportData(): Promise<ExportData> {
  const [profiles, coas, cannabinoids, terpenes, safety, retirements, resets, entries] =
    await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('coas').select('*').order('created_at', { ascending: true }),
      supabase
        .from('coa_cannabinoids')
        .select('*')
        .order('coa_id', { ascending: true })
        .order('name', { ascending: true }),
      supabase
        .from('coa_terpenes')
        .select('*')
        .order('coa_id', { ascending: true })
        .order('name', { ascending: true }),
      supabase
        .from('coa_safety')
        .select('*')
        .order('coa_id', { ascending: true })
        .order('category', { ascending: true }),
      supabase.from('coa_retirements').select('*').order('created_at', { ascending: true }),
      supabase.from('profile_resets').select('*').order('created_at', { ascending: true }),
      // The raw table, not the view. session_current filters deleted = false
      // and keeps one entry per chain; the chain itself is the record, and a
      // view-shaped export would ship a snapshot and lose the history.
      supabase.from('session_entries').select('*').order('entry_no', { ascending: true }),
    ]);

  return {
    profiles: rowsOrThrow('profiles', profiles),
    coas: rowsOrThrow('coas', coas),
    coa_cannabinoids: rowsOrThrow('coa_cannabinoids', cannabinoids),
    coa_terpenes: rowsOrThrow('coa_terpenes', terpenes),
    coa_safety: rowsOrThrow('coa_safety', safety),
    coa_retirements: rowsOrThrow('coa_retirements', retirements),
    profile_resets: rowsOrThrow('profile_resets', resets),
    session_entries: rowsOrThrow('session_entries', entries),
  };
}

/** Local-time stamp for the filename: the user names this file by when
 * they made it. The envelope's `exported_at` carries the unambiguous UTC
 * instant. */
function fileStamp(at: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}` +
    `-${pad(at.getHours())}${pad(at.getMinutes())}${pad(at.getSeconds())}`
  );
}

export type ExportOutcome = 'shared' | 'dismissed';

/**
 * Fetch, build, write, share.
 *
 * Uses the installed module's primary API -- `File` and `Paths` from
 * `expo-file-system`. The single-function forms it also re-exports are
 * annotated as deprecated and documented to throw at runtime; they are
 * reachable only through the package's legacy subpath, which this does not
 * import.
 *
 * Failures propagate. The caller surfaces them, exactly as `coa-retire.ts`
 * expects of its own caller: a swallowed error here would report an export
 * that never reached the user.
 */
export async function exportProfile(): Promise<ExportOutcome> {
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(`Could not read the session: ${sessionError.message}`);
  }
  const userId = session.session?.user.id;
  if (!userId) {
    throw new Error('Could not read the session: no signed-in user');
  }

  const rows = await fetchExportData();
  const at = new Date();
  const envelope = buildExport(rows, { userId, exportedAt: at.toISOString() });

  // Two-space indent: a person opens this file, and a single-line document
  // of every row a profile owns is not readable by one.
  const json = JSON.stringify(envelope, null, 2);

  // Cache, not documents: the share sheet copies what it needs, and a file
  // the system may reclaim is the right lifetime for a handoff artifact.
  const file = new File(Paths.cache, `cultivar-export-${fileStamp(at)}.json`);
  file.create({ overwrite: true });
  file.write(json);

  const result = await Share.share({
    url: file.uri,
    title: 'Cultivar export',
  });
  return result.action === Share.sharedAction ? 'shared' : 'dismissed';
}
