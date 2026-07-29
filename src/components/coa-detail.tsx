import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { removeCoaPdf } from '@/lib/coa-pdf-storage';
import { retireCoa } from '@/lib/coa-retire';
import { supabase } from '@/lib/supabase';

// DB shape (D45): exactly the selected columns and embeds, snake_case, as
// the tables store them — not the parser shape. The first client read of the
// child analyte tables.
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
  // Selected for the delete path only (D87): nothing renders it — there is no
  // reader for retained PDFs yet.
  pdf_object_path: string | null;
  // Possession and repurchase intent (D89, D91). on_shelf_count is what the
  // retirement copy reports; favorite is three-state, and null means never
  // asked, not "no" (D48).
  on_shelf_count: number;
  favorite: boolean | null;
  coa_terpenes: AnalyteRow[];
  coa_cannabinoids: AnalyteRow[];
  coa_safety: SafetyRow[];
};

// Three-state invariant, same as the shelf card: a null value is ND / <LOQ /
// not reported and renders the literal "ND" — never 0, never blank. The
// invariant follows the data wherever it is displayed (D45): the three
// totals and every analyte pct.
function ndLabel(value: number | null) {
  return value === null ? 'ND' : `${value}%`;
}

// A `date` column arrives as 'YYYY-MM-DD'. `new Date('YYYY-MM-DD')` parses at
// UTC midnight, which renders as the prior day west of UTC; constructing from
// the parts yields local midnight, so the displayed day never shifts.
function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString();
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" style={styles.rowLabel}>
        {label}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.rowValue}>
        {value}
      </ThemedText>
    </View>
  );
}

// Detected rows first; ND rows collapse under an always-present
// "Not detected (N)" control, every row individually visible on expand.
// Alphabetical within each group is a named divergence (D45) from the
// editor's emission order — the child tables carry no position column, so
// that order is unrecoverable at the DB seam. Grouping is recomputed from
// current values on every render: there is no draft and no editing here.
function AnalytePanel({ title, rows }: { title: string; rows: AnalyteRow[] }) {
  const [ndOpen, setNdOpen] = useState(false);
  const detected = rows.filter((r) => r.pct !== null).sort((a, b) => a.name.localeCompare(b.name));
  const nd = rows.filter((r) => r.pct === null).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {detected.map((r) => (
        <Row key={r.id} label={r.name} value={ndLabel(r.pct)} />
      ))}
      <Pressable onPress={() => setNdOpen((open) => !open)} style={styles.ndToggle}>
        <ThemedText type="small" themeColor="textSecondary">
          Not detected ({nd.length})
        </ThemedText>
      </Pressable>
      {ndOpen && nd.map((r) => <Row key={r.id} label={r.name} value={ndLabel(r.pct)} />)}
    </View>
  );
}

/**
 * Full record of one COA (slice 9, D45): the shelf's second read surface.
 * Fetches its own consistent snapshot — the list row is never passed down,
 * because the detail shows columns the list never selected. Hosts the
 * shelf's only delete affordance; the caller owns the modal and the
 * post-delete refetch.
 */
export function CoaDetail({
  coaId,
  onClose,
  onDeleted,
  onLogSession,
}: {
  coaId: string;
  onClose: () => void;
  onDeleted: () => void;
  onLogSession: () => void;
}) {
  const theme = useTheme();
  const [coa, setCoa] = useState<CoaDetailRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  // One embedded select, one consistent snapshot (D45). Promise-callback
  // form, not an async body: setState stays out of the synchronous effect
  // path (react-hooks/set-state-in-effect), matching the shelf list's load.
  const load = useCallback(
    () =>
      supabase
        .from('coas')
        .select(
          'id, strain, brand, batch, lab, source_lab, total_thc, total_cbd, total_terpenes, sampled_on, tested_on, created_at, pdf_object_path, on_shelf_count, favorite, coa_terpenes(id, name, pct), coa_cannabinoids(id, name, pct), coa_safety(id, category, status)'
        )
        .eq('id', coaId)
        .single()
        .then(({ data, error: queryError }) => {
          // .single() errors on zero rows, so a record deleted underneath
          // lands here as the error state.
          if (queryError) {
            setError(queryError.message);
            return;
          }
          setError(null);
          // The client is untyped (no generated DB types); this cast asserts
          // the selected-columns-and-embeds shape. Runtime validation remains
          // the accepted debt.
          setCoa(data as CoaDetailRecord);
        }),
    [coaId]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Client delete, no RPC (D42 mechanism, unchanged): the child analyte rows
  // are the schema's on-delete-cascade concern, not the client's; RLS scopes
  // the delete. Success is the caller's to handle — close and refetch.
  const deleteCoa = (objectPath: string | null) =>
    supabase
      .from('coas')
      .delete()
      .eq('id', coaId)
      .then(async ({ error: deleteError }) => {
        if (deleteError) {
          Alert.alert('Delete failed', deleteError.message);
          return;
        }
        // Row first, then the Storage object (D87.4 observed constraints).
        // D53's cascade is a foreign key and foreign keys do not reach
        // Storage, so the removal is explicit. A failure here leaves a
        // detectable orphan; object-first would leave a row pointing at a
        // document that no longer exists. Surfaced, never swallowed — and
        // never a reason to withhold onDeleted(), since the row is gone.
        if (objectPath !== null) {
          const removed = await removeCoaPdf(objectPath);
          if (!removed.ok) {
            Alert.alert(
              'PDF not removed',
              `This COA was deleted, but its stored PDF was not removed.\n\n${removed.message}`
            );
          }
        }
        onDeleted();
      });

  /**
   * Repurchase intent (D91), written straight to the row. No RPC: `coas`
   * carries a single ALL policy because `favorite` is revisable state, not a
   * record, which is the same reasoning D88.6 used for the count. The record
   * is `coa_retirements`, and it is not updatable at all.
   *
   * Reloads on both arms. On success the row moved; on failure it did not,
   * and the control renders from the stored value, so a refetch is what puts
   * the surface back in agreement with the database either way.
   */
  const writeFavorite = async (next: boolean | null) => {
    const { error: updateError } = await supabase
      .from('coas')
      .update({ favorite: next })
      .eq('id', coaId);
    if (updateError) {
      Alert.alert('Could not save', updateError.message);
    }
    await load();
  };

  // Q2 of the retirement survey (D90), optional by design. Skip writes
  // NOTHING -- favorite is left untouched, not nulled, because unanswered is
  // not an answer (D48). Every arm reloads: Q1 already changed the count.
  const askFavorite = () =>
    Alert.alert('Would you buy it again?', undefined, [
      { text: 'Yes', onPress: () => void writeFavorite(true) },
      { text: 'No', onPress: () => void writeFavorite(false) },
      { text: 'Skip', style: 'cancel', onPress: () => void load() },
    ]);

  // Q1 is the event (D90). One RPC, one transaction (D90.1): the reason and
  // the decrement land together or not at all. A failure stops here -- Q2 is
  // a question about a retirement that happened.
  const retire = async (record: CoaDetailRecord, reason: string) => {
    const result = await retireCoa(record.id, reason);
    if (!result.ok) {
      Alert.alert('Could not retire', result.message);
      return;
    }
    askFavorite();
  };

  const confirmRetire = (record: CoaDetailRecord) => {
    // The D44 identity echo again, same two rules: strain falls back to
    // "this COA", and a blank brand omits its line rather than rendering an
    // empty one.
    const strain = record.strain?.trim() ? record.strain.trim() : 'this COA';
    const brand = record.brand?.trim();
    const identity = [strain, ...(brand ? [brand] : [])].join('\n');
    // Exactly one outcome line, chosen by what will be left. D90's copy
    // constraint: a card that stays on the shelf must never be told it is
    // being taken off it.
    const outcome =
      record.on_shelf_count > 1
        ? `You'll still have ${record.on_shelf_count - 1} on your shelf.`
        : 'This takes it off your shelf.';
    Alert.alert('Retire a package', `${identity}\n\n${outcome}`, [
      { text: 'Smoked it all', onPress: () => void retire(record, 'Smoked it all') },
      { text: 'Gave up on it', onPress: () => void retire(record, 'Gave up on it') },
      // Nothing has been written at this point, so cancelling is a pure
      // no-op -- no event, no decrement, no question.
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const confirmDelete = (record: CoaDetailRecord) => {
    // D44 line-echo body, reused verbatim (D45): echo the record's displayed
    // identity (strain, brand, added date), then the destruction sentence.
    // Never render a blank where a name should be: strain falls back to
    // "this COA"; a null/blank brand omits its line entirely. The identity
    // echo is redundant in a single-card context but harmless.
    const strain = record.strain?.trim() ? record.strain.trim() : 'this COA';
    const brand = record.brand?.trim();
    const identity = [
      strain,
      ...(brand ? [brand] : []),
      `Added ${new Date(record.created_at).toLocaleDateString()}`,
    ].join('\n');
    Alert.alert(
      'Delete COA?',
      `${identity}\n\nDeletes this COA, all of its lab data (terpene, cannabinoid, and safety rows), and its logged sessions. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCoa(record.pdf_object_path),
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        {error !== null ? (
          <View style={styles.messageContainer}>
            <ThemedText type="small" style={styles.centered}>
              {error}
            </ThemedText>
            <Pressable onPress={load}>
              <ThemedText type="smallBold" style={styles.centered}>
                Retry
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={onClose}
              style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">Close</ThemedText>
            </Pressable>
          </View>
        ) : coa === null ? (
          <View style={styles.messageContainer}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
              Loading…
            </ThemedText>
          </View>
        ) : (
          // Fixed-footer column (the 6c lesson): the sections scroll; the
          // delete and close controls are the scroll's siblings, visible at
          // rest without scrolling. The dialog guards accidental taps.
          <>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
              <View style={styles.section}>
                <ThemedText type="subtitle">{coa.strain}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {coa.brand}
                </ThemedText>
                {/* Whichever lab dates exist (D84.4), honestly labeled;
                    Added stays as provenance, never relabeled. */}
                {coa.sampled_on ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    Sampled {formatIsoDate(coa.sampled_on)}
                  </ThemedText>
                ) : null}
                {coa.tested_on ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    Tested {formatIsoDate(coa.tested_on)}
                  </ThemedText>
                ) : null}
                <ThemedText type="small" themeColor="textSecondary">
                  Added {new Date(coa.created_at).toLocaleDateString()}
                </ThemedText>
                {coa.batch?.trim() ? <Row label="Batch" value={coa.batch.trim()} /> : null}
                {coa.lab?.trim() ? <Row label="Lab" value={coa.lab.trim()} /> : null}
                {coa.source_lab?.trim() ? (
                  // Subordinate secondary text (D45): a system identifier,
                  // not user-facing vocabulary.
                  <ThemedText type="code" themeColor="textSecondary">
                    {coa.source_lab.trim()}
                  </ThemedText>
                ) : null}
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold">Totals</ThemedText>
                <Row label="THC" value={ndLabel(coa.total_thc)} />
                <Row label="CBD" value={ndLabel(coa.total_cbd)} />
                <Row label="Total terpenes" value={ndLabel(coa.total_terpenes)} />
              </View>

              <AnalytePanel title="Terpenes" rows={coa.coa_terpenes} />
              <AnalytePanel title="Cannabinoids" rows={coa.coa_cannabinoids} />

              <View style={styles.section}>
                <ThemedText type="smallBold">Safety</ThemedText>
                {[...coa.coa_safety]
                  .sort((a, b) => a.category.localeCompare(b.category))
                  .map((s) => (
                    <Row key={s.id} label={s.category} value={s.status} />
                  ))}
              </View>

              {/* Repurchase intent (D91), settable any time and not only at
                  retirement: it is a verdict about the chemistry, and it has
                  to outlive every package. Three states -- tapping the
                  active choice clears it back to null, because "never asked"
                  and "no" are different answers (D48). This is not Never
                  Again, which is a display override and remains
                  unimplemented. */}
              <View style={styles.section}>
                <ThemedText type="smallBold">Repurchase</ThemedText>
                <View style={styles.row}>
                  <ThemedText type="small" style={styles.rowLabel}>
                    Would buy again
                  </ThemedText>
                  <View style={styles.choiceRow}>
                    <Pressable
                      onPress={() => void writeFavorite(coa.favorite === true ? null : true)}
                      style={[
                        styles.choice,
                        {
                          backgroundColor:
                            coa.favorite === true
                              ? theme.backgroundSelected
                              : theme.backgroundElement,
                        },
                      ]}>
                      <ThemedText
                        type={coa.favorite === true ? 'smallBold' : 'small'}
                        themeColor={coa.favorite === true ? 'text' : 'textSecondary'}>
                        Yes
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => void writeFavorite(coa.favorite === false ? null : false)}
                      style={[
                        styles.choice,
                        {
                          backgroundColor:
                            coa.favorite === false
                              ? theme.backgroundSelected
                              : theme.backgroundElement,
                        },
                      ]}>
                      <ThemedText
                        type={coa.favorite === false ? 'smallBold' : 'small'}
                        themeColor={coa.favorite === false ? 'text' : 'textSecondary'}>
                        No
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Log session (D49): launches the logging surface; the caller
                owns the modal chaining. First in the footer — the most
                common action does not sit under the destructive one. */}
            <Pressable
              onPress={onLogSession}
              style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">Log session</ThemedText>
            </Pressable>
            {/* Retire (D90): a package leaves the shelf, the COA does not.
                Between logging and deleting because that is where it sits in
                consequence -- it changes possession, never the record. */}
            <Pressable
              onPress={() => confirmRetire(coa)}
              style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">Retire a package</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => confirmDelete(coa)}
              style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold" style={styles.deleteLabel}>
                Delete COA
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={onClose}
              style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">Close</ThemedText>
            </Pressable>
          </>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  centered: {
    textAlign: 'center',
  },
  messageContainer: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  scroll: {
    flex: 1,
    alignSelf: 'stretch',
  },
  scrollContent: {
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowLabel: {
    flexShrink: 1,
  },
  rowValue: {
    textAlign: 'right',
  },
  ndToggle: {
    paddingVertical: Spacing.one,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  choice: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  deleteLabel: {
    // No error token exists in Colors; literal color follows the sign-in
    // precedent. Legible on both light and dark backgrounds.
    color: '#e5484d',
  },
});
