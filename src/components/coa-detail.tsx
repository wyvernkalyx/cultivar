import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CoaPdfViewer from '@/components/coa-pdf-viewer';
import { Dash, verdictHue } from '@/constants/theme';
import { setFavorite } from '@/lib/coa-favorite';
import { promptRetire } from '@/lib/coa-retire';
import { supabase } from '@/lib/supabase';

// Font families registered app-wide in the root layout (D83 Decision 1),
// referenced by name exactly as the shelf card and the archive do; an unloaded
// family falls back to the system font rather than blocking the render.
const SORA_REGULAR = 'Sora_400Regular';
const SORA_SEMIBOLD = 'Sora_600SemiBold';
const SORA_BOLD = 'Sora_700Bold';
const SORA_DISPLAY = 'Sora_800ExtraBold';
const SERIF_ITALIC = 'Newsreader_400Regular_Italic';

// How long a signed COA-PDF link lives, in seconds. The URL's whole job is a
// single load in the in-app viewer, so it expires almost immediately after
// that: a long-lived link out of a private bucket is a bucket that is not
// private.
const PdfLinkTtlSeconds = 300;

// How many terpene rows stand before the expand control. A display bound only
// -- every row is one tap away, and no value on this surface is ever shortened
// (D102: the detail shows full lab precision, the card is where two decimals
// live).
const TERPENE_PREVIEW = 5;

// Vertical room the sticky bar occupies, so the last section can scroll clear
// of it. Applied only when the bar renders.
const LOG_BAR_CLEARANCE = 96;

// DB shape (D45): exactly the selected columns and embeds, snake_case, as
// the tables store them — not the parser shape.
type AnalyteRow = {
  id: string;
  name: string;
  pct: number | null;
};

type SafetyRow = {
  id: string;
  category: string;
  status: string;
};

// One live session of this COA, at session_current grain (D59:
// latest-then-filter, soft deletes already excluded). `notes` is the user's own
// words (D95) and is rendered verbatim or not at all.
type DetailSession = {
  overall_word: string | null;
  created_at: string;
  notes: string | null;
};

type CoaDetailRecord = {
  id: string;
  strain: string | null;
  brand: string | null;
  batch: string | null;
  lab: string | null;
  source_lab: string | null;
  total_thc: number | null;
  total_cbd: number | null;
  total_terpenes: number | null;
  sampled_on: string | null;
  tested_on: string | null;
  created_at: string;
  // The retained source document (D87), read here to drive the D100 open-PDF
  // row. Null is a COA saved without a retained PDF, which the row states
  // rather than hides.
  pdf_object_path: string | null;
  // Possession and repurchase intent (D89, D91). on_shelf_count is what the
  // retirement copy reports and what gates the sticky bar (D101); favorite is
  // three-state, and null means never asked, not "no" (D48).
  on_shelf_count: number;
  favorite: boolean | null;
  coa_terpenes: AnalyteRow[];
  coa_cannabinoids: AnalyteRow[];
  coa_safety: SafetyRow[];
};

// Three-state invariant, same as the shelf card: a null value is ND / <LOQ /
// not reported and renders the literal "ND" — never 0, never blank. The value
// itself is the stored number verbatim, at full lab precision (D102): this
// surface never truncates and never rounds.
function ndLabel(value: number | null): string {
  return value === null ? 'ND' : `${value}%`;
}

// A `date` column arrives as 'YYYY-MM-DD'. `new Date('YYYY-MM-DD')` parses at
// UTC midnight, which renders as the prior day west of UTC; constructing from
// the parts yields local midnight, so the displayed day never shifts.
function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString();
}

// Reported rows first, descending by concentration; unreported rows after,
// alphabetical. A named divergence (D45) from the editor's emission order —
// the child tables carry no position column, so that order is unrecoverable at
// the DB seam. Ranking reported values against each other is the detail's own
// reading order (reference 02) and never moves an ND row into the ranking,
// because absence has no magnitude to rank.
function orderAnalytes(rows: AnalyteRow[]): AnalyteRow[] {
  const reported = rows
    .filter((row): row is AnalyteRow & { pct: number } => row.pct !== null)
    .sort((a, b) => (b.pct !== a.pct ? b.pct - a.pct : a.name.localeCompare(b.name)));
  const absent = rows
    .filter((row) => row.pct === null)
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...reported, ...absent];
}

// Safety as one line: counts grouped by the VERBATIM stored status strings,
// lowercased only for reading. No mapping, no second vocabulary, no invented
// pass/fail category — a status this app has never seen still counts and still
// prints itself. Largest group first, ties alphabetical, so the line is stable
// across refetches.
function safetySummary(rows: SafetyRow[]): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0])))
    .map(([status, count]) => `${count} ${status.toLowerCase()}`)
    .join(' · ');
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, muted === true && styles.rowValueMuted]}>{value}</Text>
    </View>
  );
}

// The full terpene list at full lab precision, standing at five rows until
// asked. Expansion is display only: nothing is fetched, and nothing that was
// hidden was ever shortened.
function TerpeneList({ rows }: { rows: AnalyteRow[] }) {
  const [expanded, setExpanded] = useState(false);
  if (rows.length === 0) {
    return <Text style={styles.absent}>Terpenes not reported by lab.</Text>;
  }
  const ordered = orderAnalytes(rows);
  const visible = expanded ? ordered : ordered.slice(0, TERPENE_PREVIEW);
  return (
    <>
      {visible.map((row) => (
        <Row key={row.id} label={row.name} value={ndLabel(row.pct)} muted={row.pct === null} />
      ))}
      {ordered.length > TERPENE_PREVIEW && (
        <Pressable
          onPress={() => setExpanded((open) => !open)}
          style={styles.toggle}
          accessibilityRole="button">
          <Text style={styles.toggleText}>
            {expanded ? 'Show fewer' : `Show all (${ordered.length})`}
          </Text>
        </Pressable>
      )}
    </>
  );
}

// Reported cannabinoids stand; the unreported ones collapse behind one line.
// Every row is individually visible on expand — the collapse hides names, never
// values, and a section whose analytes were all unreported is that one line and
// nothing else, because there is no reported row to lead with.
function CannabinoidSection({ rows }: { rows: AnalyteRow[] }) {
  const [ndOpen, setNdOpen] = useState(false);
  const reported = orderAnalytes(rows).filter((row) => row.pct !== null);
  const absent = rows.filter((row) => row.pct === null).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Cannabinoids</Text>
      {rows.length === 0 && <Text style={styles.absent}>Cannabinoids not reported by lab.</Text>}
      {reported.map((row) => (
        <Row key={row.id} label={row.name} value={ndLabel(row.pct)} />
      ))}
      {absent.length > 0 && (
        <>
          <Pressable
            onPress={() => setNdOpen((open) => !open)}
            style={styles.toggle}
            accessibilityRole="button">
            <Text style={styles.toggleText}>
              {`Not detected (${absent.length}) · ${ndOpen ? 'Hide' : 'Show'}`}
            </Text>
          </Pressable>
          {ndOpen &&
            absent.map((row) => (
              <Row key={row.id} label={row.name} value={ndLabel(row.pct)} muted />
            ))}
        </>
      )}
    </View>
  );
}

// Safety collapses to its count line; the per-assay list is one tap under it,
// each assay's status printed as the lab stored it.
function SafetySection({ rows }: { rows: SafetyRow[] }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Safety</Text>
      {rows.length === 0 ? (
        <Text style={styles.absent}>No safety assays reported by lab.</Text>
      ) : (
        <>
          <Text style={styles.summaryLine}>{safetySummary(rows)}</Text>
          <Pressable
            onPress={() => setOpen((shown) => !shown)}
            style={styles.toggle}
            accessibilityRole="button">
            <Text style={styles.toggleText}>{open ? 'Hide assays' : 'Show assays'}</Text>
          </Pressable>
          {open &&
            [...rows]
              .sort((a, b) => a.category.localeCompare(b.category))
              .map((assay) => <Row key={assay.id} label={assay.category} value={assay.status} />)}
        </>
      )}
    </View>
  );
}

/**
 * Full record of one COA (D45, redesigned in D102): the shelf's second read
 * surface, on the dashboard's tokens and in reference 02's order — header,
 * totals and the full terpene list, sessions, cannabinoids, safety and the
 * retained PDF, repurchase intent, retirement — with a sticky logging bar that
 * exists only while a package is on the shelf (D101).
 *
 * Fetches its own consistent snapshot: the list row is never passed down,
 * because the detail shows columns the list never selected.
 *
 * No delete affordance ships (D104). `coas` carries an ALL policy so a client
 * delete is possible, and D53's cascade makes it destructive — it takes logged
 * session history with it, which is the product. Retirement (D87–D91) is the
 * designed path off the shelf; a bad ingest is operator-SQL.
 */
export function CoaDetail({
  coaId,
  onClose,
  onLogSession,
}: {
  coaId: string;
  onClose: () => void;
  // Absent on the off-shelf archive (D101), which hosts no logging surface.
  // Optional rather than a no-op handler: a button whose press does nothing
  // is the inert affordance the ruling rules out.
  onLogSession?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [coa, setCoa] = useState<CoaDetailRecord | null>(null);
  const [sessions, setSessions] = useState<DetailSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  // One PDF request on the wire at a time (the D54 posture): signing is a
  // round trip, and a second tap would sign the same document twice before
  // the first URL ever reached the viewer.
  const [pdfInFlight, setPdfInFlight] = useState(false);
  // The signed URL currently being viewed, and the viewer's open state in one
  // value (D106.2): null is closed, so clearing it is how the viewer closes.
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Read off the record so the narrowing survives into the press handler: a
  // property access on state is re-widened inside a closure, a const local is
  // not. Null here is a genuinely absent document, never a loading state --
  // this whole branch renders only once `coa` is loaded.
  const pdfObjectPath = coa?.pdf_object_path ?? null;

  // The record stays ONE embedded select, one consistent snapshot (D45); the
  // session history rides beside it as a parallel select, the shelf's own
  // convention (D63) rather than a second embed. Promise-callback form, not an
  // async body: setState stays out of the synchronous effect path
  // (react-hooks/set-state-in-effect), matching the shelf list's load.
  const load = useCallback(
    () =>
      Promise.all([
        supabase
          .from('coas')
          .select(
            'id, strain, brand, batch, lab, source_lab, total_thc, total_cbd, total_terpenes, sampled_on, tested_on, created_at, pdf_object_path, on_shelf_count, favorite, coa_terpenes(id, name, pct), coa_cannabinoids(id, name, pct), coa_safety(id, category, status)'
          )
          .eq('id', coaId)
          .single(),
        // Newest first: history on this surface reads downward in time. RLS
        // scopes the rows and the view has already dropped soft-deleted chains
        // (D59), so the query carries no predicate beyond this COA.
        supabase
          .from('session_current')
          .select('overall_word, created_at, notes')
          .eq('coa_id', coaId)
          .order('created_at', { ascending: false }),
      ]).then(([coaResult, sessionsResult]) => {
        // One error state: either query's failure surfaces through the existing
        // path, no second banner. .single() errors on zero rows, so a record
        // deleted underneath lands here too.
        const queryError = coaResult.error ?? sessionsResult.error;
        if (queryError) {
          setError(queryError.message);
          return;
        }
        setError(null);
        // The client is untyped (no generated DB types); these casts assert the
        // selected-columns-and-embeds shapes. Runtime validation remains the
        // accepted debt.
        setCoa(coaResult.data as CoaDetailRecord);
        setSessions(sessionsResult.data as DetailSession[]);
      }),
    [coaId]
  );

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Open the retained source document (D100). Signing is unchanged: the
   * bucket is private, so the object is unreachable without a short-lived
   * signed URL, and creating one is still the whole mechanism here. What the
   * URL feeds changed -- it opens the in-app viewer (D106), not Safari.
   *
   * The signing failure lands on the detail's own error state rather than an
   * Alert: the message is a fact about this record's surface, and the state
   * already carries a Retry that reloads the record. A document that fails to
   * render is the viewer's own arm, stated inline there.
   */
  const openPdf = async (objectPath: string) => {
    setPdfInFlight(true);
    const { data, error: signError } = await supabase.storage
      .from('coa-pdfs')
      .createSignedUrl(objectPath, PdfLinkTtlSeconds);
    if (signError !== null || data === null) {
      setError(signError?.message ?? 'Could not create a link to the stored PDF.');
      setPdfInFlight(false);
      return;
    }
    setPdfUrl(data.signedUrl);
    setPdfInFlight(false);
  };

  /**
   * Repurchase intent (D91), recorded through the shared writer (D113).
   * The row update itself no longer lives here: the shelf and archive
   * cards raise the same question now, and one writer is what keeps the
   * three surfaces from drifting. What stays is this surface's own
   * reporting and refetch, which the card surfaces do differently.
   *
   * Reloads on both arms. On success the row moved; on failure it did not,
   * and the control renders from the stored value, so a refetch is what puts
   * the surface back in agreement with the database either way.
   */
  const answerFavorite = async (next: boolean | null) => {
    const result = await setFavorite(coaId, next);
    if (!result.ok) {
      Alert.alert('Could not save', result.message);
    }
    await load();
  };

  // The whole retirement sequence -- confirm, reason, and the repurchase
  // question that follows a successful event -- lives in the shared module
  // from D114 on, because the shelf card raises the identical sequence. This
  // surface supplies the record and its own refetch and owns nothing else
  // about the ritual.

  if (error !== null) {
    return (
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button">
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.message}>{error}</Text>
          <Pressable onPress={load} accessibilityRole="button">
            <Text style={styles.retry}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (coa === null) {
    return (
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button">
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.message}>Loading…</Text>
        </View>
      </View>
    );
  }

  // The sticky bar exists only where a logging path exists AND a package is on
  // the shelf (D101): a session against a finished package is more often a
  // data-entry error than an event. The record drives the first half, the
  // caller the second. The scroll's bottom clearance follows the bar, so an
  // archived record gains no dead space under its last section.
  const showLogBar = coa.on_shelf_count > 0 && onLogSession !== undefined;
  // Batch and lab on one line, each omitted when blank rather than rendering a
  // label over nothing.
  const labLine = [coa.batch?.trim(), coa.lab?.trim()].filter(Boolean).join(' · ');

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button">
          <Text style={styles.close}>Close</Text>
        </Pressable>
        {/* Quantity badge (D89): rendered only above a single package -- at one
            package there is no badge at all, because absence says it and a
            stated count of one is noise. */}
        {coa.on_shelf_count > 1 && (
          <Text style={styles.badge}>{`x${coa.on_shelf_count} on shelf`}</Text>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          showLogBar && { paddingBottom: LOG_BAR_CLEARANCE },
        ]}>
        {/* 1. Header. The display face without the card's uppercase: the detail
            is the full record, the card is the poster. */}
        <View style={styles.header}>
          {/* Null or whitespace-only strain is stated, not left as a blank
              line (D97, the same treatment brand gets directly below). */}
          <Text style={coa.strain?.trim() ? styles.strain : styles.strainAbsent}>
            {coa.strain?.trim() ? coa.strain : 'Strain not reported'}
          </Text>
          {/* Null brand is stated, not left as an empty-looking gap (D97). */}
          <Text style={coa.brand === null ? styles.brandAbsent : styles.brand}>
            {coa.brand ?? 'Brand not reported'}
          </Text>
          {labLine !== '' && <Text style={styles.meta}>{labLine}</Text>}
          {coa.source_lab?.trim() ? (
            // Subordinate secondary text (D45): a system identifier, not
            // user-facing vocabulary.
            <Text style={styles.sourceLab}>{coa.source_lab.trim()}</Text>
          ) : null}
          {/* Whichever lab dates exist (D84.4), honestly labeled; Added stays
              as provenance, never relabeled. */}
          {coa.sampled_on ? (
            <Text style={styles.meta}>{`Sampled ${formatIsoDate(coa.sampled_on)}`}</Text>
          ) : null}
          {coa.tested_on ? (
            <Text style={styles.meta}>{`Tested ${formatIsoDate(coa.tested_on)}`}</Text>
          ) : null}
          <Text style={styles.meta}>
            {`Added ${new Date(coa.created_at).toLocaleDateString()}`}
          </Text>
        </View>

        {/* 2. Totals and the FULL terpene list, every value at full lab
            precision (D102). Nothing on this surface is truncated. */}
        <View style={styles.card}>
          <Text style={styles.label}>Totals · as reported</Text>
          <View style={styles.totalsRow}>
            <View style={styles.total}>
              <Text style={styles.totalLabel}>THC</Text>
              <Text style={[styles.totalValue, coa.total_thc === null && styles.totalValueNd]}>
                {ndLabel(coa.total_thc)}
              </Text>
            </View>
            <View style={styles.total}>
              <Text style={styles.totalLabel}>CBD</Text>
              <Text style={[styles.totalValue, coa.total_cbd === null && styles.totalValueNd]}>
                {ndLabel(coa.total_cbd)}
              </Text>
            </View>
            <View style={styles.total}>
              <Text style={styles.totalLabel}>Total terpenes</Text>
              <Text style={[styles.totalValue, coa.total_terpenes === null && styles.totalValueNd]}>
                {ndLabel(coa.total_terpenes)}
              </Text>
            </View>
          </View>
          <TerpeneList rows={coa.coa_terpenes} />
        </View>

        {/* 3. Sessions, promoted above Cannabinoids (operator-ratified
            2026-07-30). The user's own history against this chemistry: the
            verdict word as recorded, the date it landed, and the note in the
            user's own words (D95) -- verbatim, never paraphrased, never
            summarized into something it did not say. */}
        <View style={styles.card}>
          <Text style={styles.label}>Sessions</Text>
          {sessions.length === 0 ? (
            <Text style={styles.absent}>No sessions yet</Text>
          ) : (
            sessions.map((session, index) => (
              <View key={`${session.created_at}-${index}`} style={styles.session}>
                <View style={styles.sessionHead}>
                  <View
                    style={[styles.dot, { backgroundColor: verdictHue(session.overall_word) }]}
                  />
                  <Text
                    style={
                      session.overall_word === null ? styles.sessionWordAbsent : styles.sessionWord
                    }>
                    {session.overall_word ?? 'Verdict not recorded'}
                  </Text>
                  <Text style={styles.sessionDate}>
                    {new Date(session.created_at).toLocaleDateString()}
                  </Text>
                </View>
                {session.notes !== null && session.notes !== '' && (
                  <Text style={styles.sessionNote}>{session.notes}</Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* 4. Cannabinoids. */}
        <CannabinoidSection rows={coa.coa_cannabinoids} />

        {/* 5. Safety, then the retained source document. */}
        <SafetySection rows={coa.coa_safety} />

        {/* The retained source document (D100). A record with no stored PDF
            says so in one line and offers nothing to press: a button that
            cannot do its job is worse than an honest sentence. */}
        {pdfObjectPath === null ? (
          <Text style={styles.pdfAbsent}>{"Original COA PDF wasn't retained."}</Text>
        ) : (
          <Pressable
            onPress={() => void openPdf(pdfObjectPath)}
            disabled={pdfInFlight}
            accessibilityRole="button"
            style={[styles.actionRow, pdfInFlight && styles.actionRowDisabled]}>
            <Text style={styles.actionLabel}>Open original COA (PDF)</Text>
          </Pressable>
        )}

        {/* 6. Repurchase intent (D91), settable any time and not only at
            retirement: it is a verdict about the chemistry, and it has to
            outlive every package. Three states -- tapping the active choice
            clears it back to null, because "never asked" and "no" are
            different answers (D48), and an unanswered control says so in
            words rather than resting on "No". This is not Never Again, which
            is a display override and remains unimplemented. */}
        <View style={styles.card}>
          <Text style={styles.label}>Would buy again</Text>
          <View style={styles.choiceRow}>
            <Pressable
              onPress={() => void answerFavorite(coa.favorite === true ? null : true)}
              accessibilityRole="button"
              style={[styles.choice, coa.favorite === true && styles.choiceYes]}>
              <Text style={[styles.choiceText, coa.favorite === true && styles.choiceYesText]}>
                Yes
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void answerFavorite(coa.favorite === false ? null : false)}
              accessibilityRole="button"
              style={[styles.choice, coa.favorite === false && styles.choiceNo]}>
              <Text style={[styles.choiceText, coa.favorite === false && styles.choiceNoText]}>
                No
              </Text>
            </Pressable>
          </View>
          {coa.favorite === null && <Text style={styles.absent}>Not answered yet</Text>}
        </View>

        {/* 7. Retire (D90): a package leaves the shelf, the COA does not. At
            count 0 there is nothing left to retire, and the confirm copy's
            arithmetic presumes a package exists. Block order is unchanged;
            only the treatment is (D114a) -- this row no longer wears the
            PDF row's neutral card, so it reads as an action rather than a
            second document link. */}
        {coa.on_shelf_count > 0 && (
          <Pressable
            onPress={() => promptRetire(coa, load)}
            accessibilityRole="button"
            style={styles.retireRow}>
            <Text style={styles.retireLabel}>Retire a package</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* 8. The sticky bar (D102): an absolute view over the ScrollView. Its
          solid background is the reference's scrim rendered without a
          gradient -- expo-linear-gradient would be a new dependency and a new
          EAS build, which one bar's edge does not buy. */}
      {showLogBar && (
        <View style={[styles.logBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable onPress={onLogSession} accessibilityRole="button" style={styles.logButton}>
            <Text style={styles.logLabel}>Log a session</Text>
          </Pressable>
        </View>
      )}

      {/* 9. The in-app viewer (D106), last so its Modal sits over everything
          this surface draws. It renders nothing until a signed URL exists. */}
      <CoaPdfViewer url={pdfUrl} onClose={() => setPdfUrl(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Dash.bg,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  close: {
    fontFamily: SORA_BOLD,
    fontSize: 11.5,
    color: Dash.accent,
  },
  badge: {
    fontFamily: SORA_BOLD,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontVariant: ['tabular-nums'],
    color: Dash.textMuted,
    backgroundColor: Dash.surface,
    borderRadius: Dash.radius.badge,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  messageContainer: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: 8,
  },
  message: {
    fontFamily: SORA_REGULAR,
    fontSize: 11.5,
    color: Dash.textMuted,
    textAlign: 'center',
  },
  retry: {
    fontFamily: SORA_BOLD,
    fontSize: 11.5,
    color: Dash.accent,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
    alignSelf: 'stretch',
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 16,
  },
  header: {
    gap: 4,
  },
  strain: {
    fontFamily: SORA_DISPLAY,
    fontSize: 28,
    lineHeight: 31,
    color: Dash.text,
  },
  strainAbsent: {
    fontFamily: SORA_DISPLAY,
    fontSize: 28,
    lineHeight: 31,
    color: Dash.textMuted,
  },
  brand: {
    fontFamily: SORA_REGULAR,
    fontSize: 11.5,
    color: Dash.textBody,
  },
  brandAbsent: {
    fontFamily: SORA_REGULAR,
    fontSize: 11.5,
    color: Dash.textMuted,
  },
  meta: {
    fontFamily: SORA_REGULAR,
    fontSize: 11.5,
    color: Dash.textFaint,
  },
  sourceLab: {
    fontFamily: SORA_REGULAR,
    fontSize: 10,
    color: Dash.textFaint,
  },
  card: {
    backgroundColor: Dash.surface,
    borderRadius: Dash.radius.card,
    padding: 16,
    gap: 8,
  },
  label: {
    fontFamily: SORA_BOLD,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Dash.textMuted,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  total: {
    flexShrink: 1,
    gap: 2,
  },
  totalLabel: {
    fontFamily: SORA_BOLD,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Dash.textFaint,
  },
  totalValue: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    color: Dash.text,
  },
  totalValueNd: {
    color: Dash.textMuted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 16,
  },
  rowLabel: {
    flexShrink: 1,
    fontFamily: SORA_REGULAR,
    fontSize: 11.5,
    color: Dash.textBody,
  },
  rowValue: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 11.5,
    fontVariant: ['tabular-nums'],
    color: Dash.text,
    textAlign: 'right',
  },
  rowValueMuted: {
    color: Dash.textMuted,
  },
  toggle: {
    paddingVertical: 4,
  },
  toggleText: {
    fontFamily: SORA_BOLD,
    fontSize: 11.5,
    color: Dash.accent,
  },
  summaryLine: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 11.5,
    fontVariant: ['tabular-nums'],
    color: Dash.text,
  },
  absent: {
    fontFamily: SORA_REGULAR,
    fontSize: 11.5,
    color: Dash.textMuted,
  },
  session: {
    gap: 4,
    backgroundColor: Dash.surface2,
    borderRadius: Dash.radius.row,
    padding: 12,
  },
  sessionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionWord: {
    flex: 1,
    fontFamily: SORA_SEMIBOLD,
    fontSize: 11.5,
    color: Dash.text,
  },
  sessionWordAbsent: {
    flex: 1,
    fontFamily: SORA_REGULAR,
    fontSize: 11.5,
    color: Dash.textMuted,
  },
  sessionDate: {
    fontFamily: SORA_REGULAR,
    fontSize: 11.5,
    fontVariant: ['tabular-nums'],
    color: Dash.textFaint,
  },
  sessionNote: {
    fontFamily: SERIF_ITALIC,
    // The loaded face is the 400 italic; leaving a heavier weight in place
    // would ask iOS to synthesize one this family has no file for.
    fontWeight: '400',
    fontSize: 14.5,
    color: Dash.textBody,
  },
  pdfAbsent: {
    fontFamily: SERIF_ITALIC,
    fontWeight: '400',
    fontSize: 14.5,
    color: Dash.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
  actionRow: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: Dash.surface,
    borderRadius: Dash.radius.card,
    paddingVertical: 16,
  },
  actionRowDisabled: {
    opacity: 0.5,
  },
  actionLabel: {
    fontFamily: SORA_BOLD,
    fontSize: 11.5,
    color: Dash.text,
  },
  // D114(a). The retire row stops twinning the PDF row above it: it carries
  // the destructive tint the No choice on this same surface already uses --
  // the same value, not a second red -- and its own top margin over the
  // scroll's gap, so the two rows no longer read as a pair of links.
  retireRow: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(224, 104, 94, 0.14)',
    borderRadius: Dash.radius.card,
    paddingVertical: 16,
  },
  retireLabel: {
    fontFamily: SORA_BOLD,
    fontSize: 11.5,
    color: Dash.verdict.Hated,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choice: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Dash.surface2,
  },
  choiceYes: {
    backgroundColor: 'rgba(126, 217, 155, 0.14)',
  },
  choiceNo: {
    backgroundColor: 'rgba(224, 104, 94, 0.14)',
  },
  choiceText: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 11.5,
    color: Dash.textMuted,
  },
  choiceYesText: {
    color: Dash.accent,
  },
  choiceNoText: {
    color: Dash.verdict.Hated,
  },
  logBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Dash.bg,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  logButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: 16,
    backgroundColor: Dash.accent,
  },
  logLabel: {
    fontFamily: SORA_BOLD,
    fontSize: 11.5,
    color: Dash.bg,
  },
});
