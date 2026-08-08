import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoaDetail } from '@/components/coa-detail';
import {
  ShelfCard,
  type CardCannabinoid,
  type CardRetirement,
  type CardSession,
  type CardTerpene,
  type ShelfCoa,
} from '@/components/shelf-card';
import { Dash } from '@/constants/theme';
import {
  groupSessionsByCoa,
  groupTopCannabinoidsByCoa,
  groupTopTerpenesByCoa,
  type SummaryCannabinoid,
  type SummarySession,
  type SummaryTerpene,
} from '@/lib/card-data';
import { promptFavorite } from '@/lib/coa-favorite';
import { supabase } from '@/lib/supabase';

// Font families registered app-wide in the root layout (D83 Decision 1),
// referenced by name exactly as the shelf card does; an unloaded family falls
// back to the system font rather than blocking the render.
const SORA_REGULAR = 'Sora_400Regular';
const SORA_BOLD = 'Sora_700Bold';
const SORA_DISPLAY = 'Sora_800ExtraBold';
const SERIF_ITALIC = 'Newsreader_400Regular_Italic';

// The retirement events (D90), exactly the columns selected. This is the
// first client read of coa_retirements; its SELECT policy already scopes the
// rows to the owner, so the query carries no predicate of its own.
type RetirementRow = { coa_id: string; reason: string; created_at: string };

// The event that emptied the shelf, per COA. A multi-package COA retires more
// than once (D90: two packages produce two events, free to disagree), and the
// LATEST event is the one whose reason describes the card's current state.
// The earlier events are not overwritten anywhere -- they are simply not what
// this line reports.
function latestRetirementByCoa(rows: RetirementRow[]): Map<string, CardRetirement> {
  const byCoa = new Map<string, CardRetirement>();
  for (const row of rows) {
    const current = byCoa.get(row.coa_id);
    if (current === undefined || row.created_at > current.at) {
      byCoa.set(row.coa_id, { reason: row.reason, at: row.created_at });
    }
  }
  return byCoa;
}

/**
 * The off-shelf archive (D101), discharging the 2026-07-29 ruling's named
 * cost: a COA whose last package was retired is otherwise unreachable. Same
 * card language, visibly archived by the retirement line, and no Log button
 * anywhere on it -- a session against a finished package is more often a
 * data-entry error than an event.
 *
 * The shelf's own `.gt('on_shelf_count', 0)` filter is untouched; this is its
 * complement, and the two together are the whole catalog.
 */
export function OffShelfList({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<ShelfCoa[] | null>(null);
  const [sessionsByCoa, setSessionsByCoa] = useState<Map<string, CardSession[]>>(new Map());
  const [terpenesByCoa, setTerpenesByCoa] = useState<Map<string, CardTerpene[]>>(new Map());
  const [cannabinoidsByCoa, setCannabinoidsByCoa] = useState<Map<string, CardCannabinoid[]>>(
    new Map()
  );
  const [retirementByCoa, setRetirementByCoa] = useState<Map<string, CardRetirement>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [detailCoaId, setDetailCoaId] = useState<string | null>(null);

  // Promise-callback form, not an async body: setState stays out of the
  // synchronous effect path (react-hooks/set-state-in-effect), matching the
  // shelf list's load.
  const load = useCallback(
    () =>
      // Four parallel selects, merged client-side by a coa_id Map -- the
      // shelf's own convention (D63), not an embedded join. The card inputs
      // are built by the shared card-data functions, so the archive and the
      // shelf rank terpenes and order verdict dots identically.
      Promise.all([
        supabase
          .from('coas')
          .select(
            'id, strain, brand, lab, type, favorite, total_thc, total_cbd, total_terpenes, sampled_on, tested_on, created_at, on_shelf_count'
          )
          // The exact complement of the shelf's `.gt(..., 0)`, filtered
          // DB-side on the same grounds (D89): a count of 0 is a display
          // state, never an erasure. The row, its sessions, its band, and its
          // favorite all survived; this is the surface that shows them.
          .eq('on_shelf_count', 0)
          .order('created_at', { ascending: false }),
        supabase.from('session_current').select('overall_word, coa_id, created_at, effects'),
        supabase.from('coa_terpenes').select('coa_id, name, pct'),
        // D132's line reads from the same parallel-select family (the
        // shelf's pattern); same card language on both surfaces per D101.
        supabase.from('coa_cannabinoids').select('coa_id, name, pct'),
        supabase.from('coa_retirements').select('coa_id, reason, created_at'),
      ]).then(([coasResult, sessionsResult, terpenesResult, cannabinoidsResult, retirementsResult]) => {
        // One error state: any query's failure surfaces through the existing
        // path, no second banner.
        const queryError =
          coasResult.error ??
          sessionsResult.error ??
          terpenesResult.error ??
          cannabinoidsResult.error ??
          retirementsResult.error;
        if (queryError) {
          setError(queryError.message);
          return;
        }
        setError(null);
        // The client is untyped (no generated DB types); these casts assert
        // the selected-columns shapes. Runtime validation remains the
        // accepted debt.
        setRows(coasResult.data as ShelfCoa[]);
        setSessionsByCoa(groupSessionsByCoa(sessionsResult.data as SummarySession[]));
        setTerpenesByCoa(groupTopTerpenesByCoa(terpenesResult.data as SummaryTerpene[]));
        setCannabinoidsByCoa(
          groupTopCannabinoidsByCoa(cannabinoidsResult.data as SummaryCannabinoid[])
        );
        setRetirementByCoa(latestRetirementByCoa(retirementsResult.data as RetirementRow[]));
      }),
    []
  );

  // Fetches on becoming visible, never before: the archive is a surface the
  // user opens, and a modal that is closed has nothing to be stale about.
  useEffect(() => {
    if (visible) {
      load();
    }
  }, [visible, load]);

  // Every detail-close path refetches, the same D63 rule the shelf follows: a
  // delete may have landed, and a stale card beside a fresh event is exactly
  // the defect the refetch exists for. Retirement cannot happen from here --
  // the affordance is gone at count 0 -- but the refetch is the surface's
  // agreement with the database, not a guess about which write occurred.
  const closeDetail = () => {
    setDetailCoaId(null);
    load();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Off shelf</Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close off-shelf list">
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>

        {error !== null ? (
          <View style={styles.messageContainer}>
            <Text style={styles.message}>{error}</Text>
            <Pressable onPress={load}>
              <Text style={styles.retry}>Retry</Text>
            </Pressable>
          </View>
        ) : rows === null ? (
          <View style={styles.messageContainer}>
            <Text style={styles.message}>Loading…</Text>
          </View>
        ) : (
          /* created_at desc comes from the query ONLY -- no client-side
             sorting or filtering; RLS scopes the rows, the DB orders them. */
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={rows}
            keyExtractor={(coa) => coa.id}
            renderItem={({ item }) => (
              <ShelfCard
                coa={item}
                sessions={sessionsByCoa.get(item.id) ?? []}
                topTerpenes={terpenesByCoa.get(item.id) ?? []}
                topCannabinoids={cannabinoidsByCoa.get(item.id) ?? []}
                onOpen={() => setDetailCoaId(item.id)}
                // No onLog, by ruling (D101). The archive marker instead:
                // absent when a COA reached count 0 by some path that left no
                // event, because a retirement line with no retirement behind
                // it would be fabricated.
                retirement={retirementByCoa.get(item.id)}
                // D113 does reach here, unlike the Log button: repurchase
                // intent is a verdict about the chemistry and has to outlive
                // every package (D91), so the archive is exactly where the
                // question stays worth asking. The write refetches through
                // this surface's own load().
                onFavorite={(coa) => promptFavorite(coa, load)}
              />
            )}
            ListEmptyComponent={
              // Unreachable in practice -- the entry link hides at zero -- but
              // an empty modal states nothing, and this states the truth.
              <Text style={styles.empty}>Nothing has left your shelf yet.</Text>
            }
          />
        )}

        {/* Detail from the archive (D101): history and the retained PDF stay
            reachable. Same presentation family and the same remount-on-id
            key as the shelf's, so opening a different card never shows a
            stale record. */}
        <Modal
          visible={detailCoaId !== null}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closeDetail}
          // iOS gesture dismissal of a pageSheet does not reliably route
          // through onRequestClose; wiring both keeps the state in sync, and
          // closing twice is idempotent.
          onDismiss={closeDetail}>
          {detailCoaId !== null && (
            <CoaDetail
              key={detailCoaId}
              coaId={detailCoaId}
              onClose={closeDetail}
            />
          )}
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Dash.bg,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flexShrink: 1,
    fontFamily: SORA_DISPLAY,
    fontSize: 28,
    lineHeight: 31,
    textTransform: 'uppercase',
    color: Dash.text,
  },
  close: {
    fontFamily: SORA_BOLD,
    fontSize: 11.5,
    color: Dash.accent,
  },
  list: {
    flex: 1,
    alignSelf: 'stretch',
  },
  listContent: {
    gap: 8,
    paddingBottom: 8,
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
  empty: {
    fontFamily: SERIF_ITALIC,
    fontSize: 14.5,
    color: Dash.textBody,
    textAlign: 'center',
  },
});
