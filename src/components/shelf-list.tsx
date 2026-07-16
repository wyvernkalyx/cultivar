import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { CoaDetail } from '@/components/coa-detail';
import { SessionLadder } from '@/components/session-ladder';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
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
  created_at: string;
};

// Three-state invariant, same as the editor: a null total is ND / <LOQ /
// not reported and renders the literal "ND" — never 0, never blank.
function totalLabel(value: number | null) {
  return value === null ? 'ND' : `${value}%`;
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
// mood, no color coding, no per-card visual variance. One interaction (D45):
// tap opens the card detail, with no press feedback — the card stays
// visually neutral (discipline 2). Long-press is retired; delete lives on
// the detail view.
function ShelfCard({ coa, onOpen }: { coa: ShelfCoa; onOpen: () => void }) {
  return (
    <Pressable onPress={onOpen}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">{coa.strain}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {coa.brand}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Added {new Date(coa.created_at).toLocaleDateString()}
        </ThemedText>
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
      supabase
        .from('coas')
        .select('id, strain, brand, lab, total_thc, total_cbd, total_terpenes, created_at')
        .order('created_at', { ascending: false })
        .then(({ data, error: queryError }) => {
          if (queryError) {
            setError(queryError.message);
            return;
          }
          setError(null);
          // The client is untyped (no generated DB types); this cast asserts
          // the selected-columns shape. Runtime validation remains the
          // accepted debt.
          setRows(data as ShelfCoa[]);
        }),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

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
        renderItem={({ item }) => <ShelfCard coa={item} onOpen={() => setDetailCoaId(item.id)} />}
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
        onRequestClose={() => setDetailCoaId(null)}
        // iOS gesture dismissal of a pageSheet does not reliably route
        // through onRequestClose; wiring both keeps the state in sync, and
        // closing twice is idempotent.
        onDismiss={() => {
          setDetailCoaId(null);
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
            onClose={() => setDetailCoaId(null)}
            onDeleted={() => {
              setDetailCoaId(null);
              load();
            }}
            onLogSession={() => {
              setPendingLogCoa(rows.find((row) => row.id === detailCoaId) ?? null);
              setDetailCoaId(null);
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
            setLoggingCoa(null);
          }
        }}>
        {loggingCoa !== null && (
          <GestureHandlerRootView style={styles.gestureRoot}>
            <SessionLadder
              coa={loggingCoa}
              onClose={() => setLoggingCoa(null)}
              onBusyChange={setLogBusy}
            />
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
