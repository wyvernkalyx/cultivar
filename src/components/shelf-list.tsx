import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { CoaDetail } from '@/components/coa-detail';
import {
  PreferenceSummary,
  type PreferenceSummaryProps,
  type RungWord,
} from '@/components/preference-summary';
import { SessionLadder } from '@/components/session-ladder';
import {
  ShelfCard,
  type CardSession,
  type CardTerpene,
  type ShelfCoa,
} from '@/components/shelf-card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { RUNGS } from '@/lib/lexicon';
import { supabase } from '@/lib/supabase';

// The card, its date helpers, and the ShelfCoa shape live in shelf-card.tsx
// from D99 on — the list owns fetching and the modals, the card owns display.

// The per-session inputs (D98/D99), exactly the columns selected. A live
// session is one row of session_current (D59: latest-then-filter, soft
// deletes already excluded), so the row count IS the all-time session count.
// One fetch serves both the summary's distribution and the per-card dots.
type SummarySession = { overall_word: string | null; coa_id: string; created_at: string };
// Deliberately UNFILTERED by on_shelf_count: the summary is all-time,
// including off-shelf history (D98). RLS scopes the rows.
type SummaryCoa = {
  id: string;
  favorite: boolean | null;
  total_thc: number | null;
  total_cbd: number | null;
};
type SummaryTerpene = { coa_id: string; name: string; pct: number | null };

// Min/max over REPORTED values only, with the unreported ones counted beside
// them — the D98 binding, verbatim: ranges compute over reported values only;
// ND is annotated alongside, never folded in as a zero lower bound. No COA
// reporting the analyte at all yields null, not a range of zeros.
function analyteRange(values: (number | null)[]): PreferenceSummaryProps['loved']['thc'] {
  const reported = values.filter((value): value is number => value !== null);
  if (reported.length === 0) return null;
  return {
    min: Math.min(...reported),
    max: Math.max(...reported),
    ndCount: values.length - reported.length,
  };
}

// Top 3 terpenes by concentration across the Loved COAs (the ratified v1
// "relevant terpenes" definition). Per name, the maximum reported pct; a null
// pct is an unreported analyte and is excluded from the ranking outright, so
// absence can never rank as a zero. Ties break on name for a stable order.
function rankLovedTerpenes(rows: SummaryTerpene[], lovedCoaIds: Set<string>) {
  const best = new Map<string, number>();
  for (const row of rows) {
    if (row.pct === null || !lovedCoaIds.has(row.coa_id)) continue;
    const current = best.get(row.name);
    if (current === undefined || row.pct > current) best.set(row.name, row.pct);
  }
  return [...best.entries()]
    .map(([name, pct]) => ({ name, pct }))
    .sort((a, b) => (b.pct !== a.pct ? b.pct - a.pct : a.name.localeCompare(b.name)))
    .slice(0, 3);
}

// The whole summary, computed client-side over session_current merged with the
// unfiltered catalog (D98: no new view, no migration — session_current is
// already the one source of per-session grain, and this is that consumer).
function buildSummary(
  sessions: SummarySession[],
  coas: SummaryCoa[],
  terpenes: SummaryTerpene[]
): PreferenceSummaryProps {
  const distribution = Object.fromEntries(RUNGS.map((rung) => [rung.word, 0])) as Record<
    RungWord,
    number
  >;
  for (const session of sessions) {
    // A word outside RUNGS (or a null) counts toward the all-time total but
    // has no rung to land on; it is never coerced into one.
    if (session.overall_word !== null && session.overall_word in distribution) {
      distribution[session.overall_word as RungWord] += 1;
    }
  }

  const lovedSessions = sessions.filter((session) => session.overall_word === 'Loved');
  const lovedCoaIds = new Set(lovedSessions.map((session) => session.coa_id));
  const lovedCoas = coas.filter((coa) => lovedCoaIds.has(coa.id));

  return {
    sessionCount: sessions.length,
    distribution,
    buyAgainCount: coas.filter((coa) => coa.favorite === true).length,
    loved: {
      terpenes: rankLovedTerpenes(terpenes, lovedCoaIds),
      thc: analyteRange(lovedCoas.map((coa) => coa.total_thc)),
      cbd: analyteRange(lovedCoas.map((coa) => coa.total_cbd)),
      lovedSessionCount: lovedSessions.length,
    },
  };
}

// This COA's live sessions, ascending by time, for the card's verdict dots
// (D99). An absent word keeps its session — the session happened, and the
// card renders it faint rather than dropping it, so the count stays honest.
function groupSessionsByCoa(sessions: SummarySession[]): Map<string, CardSession[]> {
  const byCoa = new Map<string, CardSession[]>();
  for (const session of sessions) {
    const existing = byCoa.get(session.coa_id);
    const entry = { word: session.overall_word ?? '', at: session.created_at };
    if (existing === undefined) byCoa.set(session.coa_id, [entry]);
    else existing.push(entry);
  }
  for (const entries of byCoa.values()) {
    entries.sort((a, b) => a.at.localeCompare(b.at));
  }
  return byCoa;
}

// Per-COA top-3 reported terpenes for the fingerprint bar, the same ranking
// convention the slice-1 summary uses: a null pct is an unreported analyte
// and is excluded outright, so absence can never rank as a zero; ties break
// on name for a stable order across refetches.
function groupTopTerpenesByCoa(rows: SummaryTerpene[]): Map<string, CardTerpene[]> {
  const byCoa = new Map<string, CardTerpene[]>();
  for (const row of rows) {
    if (row.pct === null) continue;
    const entry = { name: row.name, pct: row.pct };
    const existing = byCoa.get(row.coa_id);
    if (existing === undefined) byCoa.set(row.coa_id, [entry]);
    else existing.push(entry);
  }
  for (const [coaId, entries] of byCoa) {
    entries.sort((a, b) => (b.pct !== a.pct ? b.pct - a.pct : a.name.localeCompare(b.name)));
    byCoa.set(coaId, entries.slice(0, 3));
  }
  return byCoa;
}

export function ShelfList() {
  const [rows, setRows] = useState<ShelfCoa[] | null>(null);
  // Band per COA (D63): absence of a key IS the untried state — a COA with
  // no live sessions has no row in coa_session_stats (D61), so it has no
  // entry here. D99's display supersession took the band word off the card,
  // so nothing READS this today; the state cell, its setter, and the
  // coa_session_stats select all stay for the detail view and the banked
  // consumers. Only the unused getter binding is elided, because an unread
  // local is a lint warning and the warning baseline is a ceiling.
  const [, setBands] = useState<Map<string, number>>(new Map());
  // The preference summary's props (D98), computed in load() from the same
  // fetch as the shelf so it has no lifecycle of its own — it refetches
  // through every existing D63 path and no other.
  const [summary, setSummary] = useState<PreferenceSummaryProps | null>(null);
  // The cards' per-COA inputs (D99), derived in load() from the SAME fetch
  // that feeds the summary — no second query for either.
  const [sessionsByCoa, setSessionsByCoa] = useState<Map<string, CardSession[]>>(new Map());
  const [terpenesByCoa, setTerpenesByCoa] = useState<Map<string, CardTerpene[]>>(new Map());
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
      // view is not a guarantee worth betting the shelf on. D98 adds three
      // more parallel selects for the preference summary; the shelf's own two
      // and their merge are untouched.
      Promise.all([
        supabase
          .from('coas')
          .select(
            'id, strain, brand, lab, type, favorite, total_thc, total_cbd, total_terpenes, sampled_on, tested_on, created_at, on_shelf_count'
          )
          // Off-shelf COAs are filtered DB-side (D89). A count of 0 is a
          // display state, never an erasure: the row, its sessions, its
          // band, and its favorite all survive, and the query is the only
          // thing that stops asking for them. No client-side filtering --
          // RLS scopes the rows, the DB orders and bounds them.
          .gt('on_shelf_count', 0)
          .order('created_at', { ascending: false }),
        supabase.from('coa_session_stats').select('coa_id, band'),
        // The summary's three (D98), two of which the cards also read (D99).
        // session_current is the one source of per-session grain (D59), and
        // created_at joins the selection so the per-card dots and the "last
        // X" line come from this same fetch, never a second query. This coas
        // select is deliberately NOT filtered by on_shelf_count, because the
        // summary is all-time including off-shelf history, and RLS scopes
        // the rows.
        supabase.from('session_current').select('overall_word, coa_id, created_at'),
        supabase.from('coas').select('id, favorite, total_thc, total_cbd'),
        supabase.from('coa_terpenes').select('coa_id, name, pct'),
      ]).then(([coasResult, statsResult, sessionsResult, allCoasResult, terpenesResult]) => {
        // One error state: any query's failure surfaces through the
        // existing path, no second banner.
        const queryError =
          coasResult.error ??
          statsResult.error ??
          sessionsResult.error ??
          allCoasResult.error ??
          terpenesResult.error;
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
        const sessions = sessionsResult.data as SummarySession[];
        const terpenes = terpenesResult.data as SummaryTerpene[];
        setSummary(buildSummary(sessions, allCoasResult.data as SummaryCoa[], terpenes));
        setSessionsByCoa(groupSessionsByCoa(sessions));
        setTerpenesByCoa(groupTopTerpenesByCoa(terpenes));
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
          <ShelfCard
            coa={item}
            sessions={sessionsByCoa.get(item.id) ?? []}
            topTerpenes={terpenesByCoa.get(item.id) ?? []}
            onOpen={() => setDetailCoaId(item.id)}
            // One tap straight to the verdict screen (D99). The direct path,
            // not the pending chain: that chain exists only because the
            // detail pageSheet must finish dismissing before a second modal
            // can present (D49), and there is no sheet open here.
            onLog={() => setLoggingCoa(item)}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        // The summary rides the list's own header (D98), so it refetches on
        // every ladder/detail close through the existing load() paths (D63)
        // and never grows a second fetch lifecycle.
        ListHeaderComponent={summary === null ? null : <PreferenceSummary {...summary} />}
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
});
