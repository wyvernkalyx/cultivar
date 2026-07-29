import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { CoaDetail } from '@/components/coa-detail';
import { SessionLadder } from '@/components/session-ladder';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { RUNGS } from '@/lib/lexicon';
import { supabase } from '@/lib/supabase';

// DB shape (D41): exactly the selected columns, snake_case, as the coas
// table stores them — not the parser shape.
type ShelfCoa = {
  id: string;
  strain: string | null;
  brand: string | null;
  lab: string | null;
  total_thc: number | null;
  total_cbd: number | null;
  total_terpenes: number | null;
  sampled_on: string | null;
  tested_on: string | null;
  created_at: string;
  on_shelf_count: number;
};

// Three-state invariant, same as the editor: a null total is ND / <LOQ /
// not reported and renders the literal "ND" — never 0, never blank.
function totalLabel(value: number | null) {
  return value === null ? 'ND' : `${value}%`;
}

// A `date` column arrives as 'YYYY-MM-DD'. `new Date('YYYY-MM-DD')` parses at
// UTC midnight, which renders as the prior day west of UTC; constructing from
// the parts yields local midnight, so the displayed day never shifts.
function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString();
}

// Card date line (D84.4), one line by strict precedence: tested, else
// sampled (each labeled as such), else the existing created_at provenance.
// created_at is a timestamptz and keeps its own timezone-aware treatment.
function cardDateLine(coa: ShelfCoa): string {
  if (coa.tested_on) return `Tested ${formatIsoDate(coa.tested_on)}`;
  if (coa.sampled_on) return `Sampled ${formatIsoDate(coa.sampled_on)}`;
  return `Added ${new Date(coa.created_at).toLocaleDateString()}`;
}

function Total({ label, value }: { label: string; value: number | null }) {
  return (
    <View style={styles.total}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="small">{totalLabel(value)}</ThemedText>
    </View>
  );
}

// Neutral by construction (D41): every card is the same themed surface — no
// mood, no color coding, no per-card visual variance. Scoped in the scoring
// slice (D62/D63, documentation/design/scoring-read.md): the claim now holds
// for untried cards only — a scored card renders its band word, looked up in
// RUNGS by score (never a second word table), and an untried card renders
// nothing in its place (D61: untried is absence, never a value). One
// interaction (D45): tap opens the card detail, with no press feedback — the
// card stays visually neutral (discipline 2). Long-press is retired; delete
// lives on the detail view.
function ShelfCard({
  coa,
  band,
  onOpen,
}: {
  coa: ShelfCoa;
  band: number | undefined;
  onOpen: () => void;
}) {
  const bandWord =
    band === undefined ? undefined : RUNGS.find((rung) => rung.score === band)?.word;
  return (
    <Pressable onPress={onOpen}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.strainRow}>
          <ThemedText type="smallBold" style={styles.strain}>
            {coa.strain}
          </ThemedText>
          {/* Quantity badge (D89): one card per COA regardless of count, so
              the count rides the strain line. Rendered only above a single
              package -- at one package there is no badge at all, because
              absence says it and a stated count of one is noise. */}
          {coa.on_shelf_count > 1 && (
            <ThemedText type="small" themeColor="textSecondary">
              {`x${coa.on_shelf_count}`}
            </ThemedText>
          )}
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {coa.brand}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {cardDateLine(coa)}
        </ThemedText>
        {bandWord !== undefined && <ThemedText type="smallBold">{bandWord}</ThemedText>}
        <View style={styles.totalsRow}>
          <Total label="THC" value={coa.total_thc} />
          <Total label="CBD" value={coa.total_cbd} />
          <Total label="Total terpenes" value={coa.total_terpenes} />
        </View>
      </ThemedView>
    </Pressable>
  );
}

export function ShelfList() {
  const [rows, setRows] = useState<ShelfCoa[] | null>(null);
  // Band per COA (D63): absence of a key IS the untried state — a COA with
  // no live sessions has no row in coa_session_stats (D61), so it has no
  // entry here and the card renders nothing in the band's place.
  const [bands, setBands] = useState<Map<string, number>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [detailCoaId, setDetailCoaId] = useState<string | null>(null);
  // Session-logging spike (D49): the ladder is a second modal, chained
  // through the pageSheet's onDismiss — presenting it while the sheet is
  // mid-dismissal is the known iOS failure, and onDismiss fires only after
  // dismissal completes. The pending row holds the handoff in between.
  const [pendingLogCoa, setPendingLogCoa] = useState<ShelfCoa | null>(null);
  const [loggingCoa, setLoggingCoa] = useState<ShelfCoa | null>(null);
  // Reported by the ladder while a session-entry insert is in flight
  // (D54): the modal's onRequestClose is inert until the insert resolves.
  // The ladder owns the in-flight lifecycle; this is the guard's line of
  // sight into it.
  const [logBusy, setLogBusy] = useState(false);

  // Promise-callback form, not an async body: setState stays out of the
  // synchronous effect path (react-hooks/set-state-in-effect), matching the
  // getSession().then() pattern on the home screen.
  const load = useCallback(
    () =>
      // Two queries, merged client-side by a coa_id Map (D63) — not an
      // embedded join: PostgREST relationship inference across a two-level
      // view is not a guarantee worth betting the shelf on.
      Promise.all([
        supabase
          .from('coas')
          .select(
            'id, strain, brand, lab, total_thc, total_cbd, total_terpenes, sampled_on, tested_on, created_at, on_shelf_count'
          )
          // Off-shelf COAs are filtered DB-side (D89). A count of 0 is a
          // display state, never an erasure: the row, its sessions, its
          // band, and its favorite all survive, and the query is the only
          // thing that stops asking for them. No client-side filtering --
          // RLS scopes the rows, the DB orders and bounds them.
          .gt('on_shelf_count', 0)
          .order('created_at', { ascending: false }),
        supabase.from('coa_session_stats').select('coa_id, band'),
      ]).then(([coasResult, statsResult]) => {
        // One error state: either query's failure surfaces through the
        // existing path, no second banner.
        const queryError = coasResult.error ?? statsResult.error;
        if (queryError) {
          setError(queryError.message);
          return;
        }
        setError(null);
        // The client is untyped (no generated DB types); these casts assert
        // the selected-columns shapes. Runtime validation remains the
        // accepted debt.
        setRows(coasResult.data as ShelfCoa[]);
        setBands(
          new Map(
            (statsResult.data as { coa_id: string; band: number }[]).map((stat) => [
              stat.coa_id,
              stat.band,
            ])
          )
        );
      }),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  // Every ladder-close path refetches (D63): a session may have landed, and
  // a stale band beside a fresh entry is the defect the refetch exists for.
  const closeLadder = () => {
    setLoggingCoa(null);
    load();
  };

  // Every detail-close path refetches, on the same D63 grounds: a retirement
  // may have landed, and a stale card beside a fresh event is exactly the
  // defect. The count can now change from inside the detail, and a card that
  // went off-shelf has to stop being rendered. Wired on the buttons AND on
  // onDismiss, because gesture dismissal reaches neither of the others; a
  // button close therefore refetches twice on iOS, which is a duplicate read
  // rather than a stale shelf.
  const closeDetail = () => {
    setDetailCoaId(null);
    load();
  };

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (error) {
    return (
      <View style={styles.messageContainer}>
        <ThemedText type="small" style={styles.centered}>
          {error}
        </ThemedText>
        <Pressable onPress={load}>
          <ThemedText type="smallBold" style={styles.centered}>
            Retry
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  if (rows === null) {
    return (
      <View style={styles.messageContainer}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
          Loading…
        </ThemedText>
      </View>
    );
  }

  return (
    <>
      {/* created_at desc comes from the query ONLY — no client-side sorting
          or filtering; RLS scopes the rows, the DB orders them. */}
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={rows}
        keyExtractor={(coa) => coa.id}
        renderItem={({ item }) => (
          <ShelfCard coa={item} band={bands.get(item.id)} onOpen={() => setDetailCoaId(item.id)} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        ListEmptyComponent={
          <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
            Nothing on your shelf yet
          </ThemedText>
        }
      />
      {/* Card detail (D45): same presentation family as AddToShelfModal.
          Owning the modal here dissolves the post-delete refresh problem —
          the list owns load(), so a detail-context delete closes and
          refetches. The key remount-keys the detail on card identity (the
          pickId pattern), so opening a different card never shows a stale
          record. */}
      <Modal
        visible={detailCoaId !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDetail}
        // iOS gesture dismissal of a pageSheet does not reliably route
        // through onRequestClose; wiring both keeps the state in sync, and
        // closing twice is idempotent.
        onDismiss={() => {
          closeDetail();
          // Chained presentation (D49): promote the pending logging row
          // only after the sheet has fully dismissed.
          if (pendingLogCoa !== null) {
            setLoggingCoa(pendingLogCoa);
            setPendingLogCoa(null);
          }
        }}>
        {detailCoaId !== null && (
          <CoaDetail
            key={detailCoaId}
            coaId={detailCoaId}
            onClose={closeDetail}
            onDeleted={closeDetail}
            onLogSession={() => {
              setPendingLogCoa(rows.find((row) => row.id === detailCoaId) ?? null);
              closeDetail();
            }}
          />
        )}
      </Modal>
      {/* The ladder (D50/D51): full-screen sibling modal; gestures inside
          an RN Modal are inert without their own root view. Closing
          returns to the shelf, not the detail sheet — accepted behavior
          from the spike gate. */}
      <Modal
        visible={loggingCoa !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          // Inert while an insert is in flight (D54).
          if (!logBusy) {
            closeLadder();
          }
        }}>
        {loggingCoa !== null && (
          <GestureHandlerRootView style={styles.gestureRoot}>
            <SessionLadder coa={loggingCoa} onClose={closeLadder} onBusyChange={setLogBusy} />
          </GestureHandlerRootView>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  list: {
    flex: 1,
    alignSelf: 'stretch',
  },
  listContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  messageContainer: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  centered: {
    textAlign: 'center',
  },
  strainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  strain: {
    flexShrink: 1,
  },
  card: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  total: {
    gap: Spacing.half,
  },
});
