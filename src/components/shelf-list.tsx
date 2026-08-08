import { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AddToShelfModal from '@/components/add-to-shelf-modal';
import { CoaDetail } from '@/components/coa-detail';
import { CompletionBloomOverlay } from '@/components/completion-bloom';
import { OffShelfList } from '@/components/off-shelf-list';
import {
  PreferenceSummary,
  type PreferenceSummaryProps,
  type RungWord,
} from '@/components/preference-summary';
import { SessionLadder, type CloseOutcome } from '@/components/session-ladder';
import {
  ShelfCard,
  type CardCannabinoid,
  type CardEffect,
  type CardSession,
  type CardTerpene,
  type ShelfCoa,
} from '@/components/shelf-card';
import { ThemedText } from '@/components/themed-text';
import { Dash, Spacing } from '@/constants/theme';
import {
  groupSessionsByCoa,
  groupTopCannabinoidsByCoa,
  groupTopEffectsByCoa,
  groupTopTerpenesByCoa,
  rankTopEffects,
  type SummaryCannabinoid,
  type SummarySession,
  type SummaryTerpene,
} from '@/lib/card-data';
import { promptFavorite } from '@/lib/coa-favorite';
import { promptRetire } from '@/lib/coa-retire';
import { RUNGS } from '@/lib/lexicon';
import { supabase } from '@/lib/supabase';

// The card, its date helpers, and the ShelfCoa shape live in shelf-card.tsx
// from D99 on — the list owns fetching and the modals, the card owns display.
// The per-COA grouping conventions moved to src/lib/card-data.ts in D101,
// where the off-shelf archive reads them too.

// Font families for the section row, registered app-wide in the root layout
// (D83 Decision 1) and referenced by name as the card does.
const SORA_REGULAR = 'Sora_400Regular';
const SORA_BOLD = 'Sora_700Bold';

// Deliberately UNFILTERED by on_shelf_count: the summary is all-time,
// including off-shelf history (D98). RLS scopes the rows. on_shelf_count
// joins the selection in D101 so the off-shelf count comes from data already
// fetched -- the archive's own query belongs to the archive, not the shelf.
type SummaryCoa = {
  id: string;
  favorite: boolean | null;
  total_thc: number | null;
  total_cbd: number | null;
  on_shelf_count: number;
};

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
    topEffects: rankTopEffects(sessions),
  };
}

// The dashboard's subtitle renders OUTSIDE the card from D109 on (the
// mock-faithful placement, under the screen title), so the screen needs the
// all-time session count this component already computes. One optional
// callback, fired from the same load() that sets the state -- no second
// query and no second fetch lifecycle. The key={shelfVersion} remount
// refiring it is expected: it reports the same number, so the parent's
// setState is a no-op.
export type ShelfListProps = {
  onSummary?: (summary: PreferenceSummaryProps) => void;
};

export function ShelfList({ onSummary }: ShelfListProps) {
  const [rows, setRows] = useState<ShelfCoa[] | null>(null);
  // The preference summary's props (D98), computed in load() from the same
  // fetch as the shelf so it has no lifecycle of its own — it refetches
  // through every existing D63 path and no other.
  const [summary, setSummary] = useState<PreferenceSummaryProps | null>(null);
  // The cards' per-COA inputs (D99), derived in load() from the SAME fetch
  // that feeds the summary — no second query for either.
  const [sessionsByCoa, setSessionsByCoa] = useState<Map<string, CardSession[]>>(new Map());
  const [terpenesByCoa, setTerpenesByCoa] = useState<Map<string, CardTerpene[]>>(new Map());
  const [cannabinoidsByCoa, setCannabinoidsByCoa] = useState<Map<string, CardCannabinoid[]>>(
    new Map()
  );
  const [effectsByCoa, setEffectsByCoa] = useState<Map<string, CardEffect[]>>(new Map());
  // How many COAs sit at count 0 (D101), computed in load() from the summary's
  // unfiltered catalog select — the footer link needs a count, not the rows,
  // and the archive fetches its own when it opens.
  const [offShelfCount, setOffShelfCount] = useState(0);
  const [offShelfVisible, setOffShelfVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [detailCoaId, setDetailCoaId] = useState<string | null>(null);
  // D135: the manual row being attached to, or null. The modal below renders
  // while this is set; close nulls it and refetches through load(), the D63
  // path, so the flipped source_lab and new chemistry land on the card.
  const [attachTarget, setAttachTarget] = useState<ShelfCoa | null>(null);
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
  // The completion transient (operator ruling, 2026-08-04): the bloom left the
  // closing screen and plays here instead, over the shelf the survey dismisses
  // back to. Mounted only by a ladder close that actually logged — a cancel
  // sets nothing, and a failed insert never closes the ladder at all (D54), so
  // neither can reach it. It unmounts itself by reporting completion.
  const [bloomVisible, setBloomVisible] = useState(false);
  // Whether the open ladder has a session on the shelf, reported by it (D54's
  // reporting shape, second instance). The modal's own dismissal path is the
  // one exit the ladder cannot see, and 2026-08-04 requires it to derive its
  // outcome from the same state every other exit does instead of asserting a
  // cancel it never observed.
  const [logHasEntry, setLogHasEntry] = useState(false);

  // Promise-callback form, not an async body: setState stays out of the
  // synchronous effect path (react-hooks/set-state-in-effect), matching the
  // getSession().then() pattern on the home screen.
  const load = useCallback(
    () =>
      // One coas select for the shelf rows, plus D98's three parallel
      // selects for the preference summary and the cards. Merges are
      // client-side coa_id Maps, never an embedded join: PostgREST
      // relationship inference across a two-level view is not a guarantee
      // worth betting the shelf on.
      Promise.all([
        supabase
          .from('coas')
          .select(
            'id, strain, brand, lab, source_lab, type, favorite, total_thc, total_cbd, total_terpenes, sampled_on, tested_on, created_at, on_shelf_count'
          )
          // Off-shelf COAs are filtered DB-side (D89). A count of 0 is a
          // display state, never an erasure: the row, its sessions, its
          // band, and its favorite all survive, and the query is the only
          // thing that stops asking for them. No client-side filtering --
          // RLS scopes the rows, the DB orders and bounds them.
          .gt('on_shelf_count', 0)
          .order('created_at', { ascending: false }),
        // The summary's three (D98), two of which the cards also read (D99).
        // session_current is the one source of per-session grain (D59), and
        // created_at joins the selection so the per-card dots and the "last
        // X" line come from this same fetch, never a second query. This coas
        // select is deliberately NOT filtered by on_shelf_count, because the
        // summary is all-time including off-shelf history, and RLS scopes
        // the rows.
        supabase.from('session_current').select('overall_word, coa_id, created_at, effects'),
        supabase.from('coas').select('id, favorite, total_thc, total_cbd, on_shelf_count'),
        supabase.from('coa_terpenes').select('coa_id, name, pct'),
        // D132's line reads from the same parallel-select family; the merge
        // stays a client-side coa_id Map like every other card input.
        supabase.from('coa_cannabinoids').select('coa_id, name, pct'),
      ]).then(([coasResult, sessionsResult, allCoasResult, terpenesResult, cannabinoidsResult]) => {
        // One error state: any query's failure surfaces through the
        // existing path, no second banner.
        const queryError =
          coasResult.error ??
          sessionsResult.error ??
          allCoasResult.error ??
          terpenesResult.error ??
          cannabinoidsResult.error;
        if (queryError) {
          setError(queryError.message);
          return;
        }
        setError(null);
        // The client is untyped (no generated DB types); these casts assert
        // the selected-columns shapes. Runtime validation remains the
        // accepted debt.
        setRows(coasResult.data as ShelfCoa[]);
        const sessions = sessionsResult.data as SummarySession[];
        const terpenes = terpenesResult.data as SummaryTerpene[];
        const allCoas = allCoasResult.data as SummaryCoa[];
        const built = buildSummary(sessions, allCoas, terpenes);
        setSummary(built);
        onSummary?.(built);
        setSessionsByCoa(groupSessionsByCoa(sessions));
        setEffectsByCoa(groupTopEffectsByCoa(sessions));
        setTerpenesByCoa(groupTopTerpenesByCoa(terpenes));
        setCannabinoidsByCoa(
          groupTopCannabinoidsByCoa(cannabinoidsResult.data as SummaryCannabinoid[])
        );
        setOffShelfCount(allCoas.filter((coa) => coa.on_shelf_count === 0).length);
      }),
    // onSummary is in the closure, so it is in the deps. The caller passes a
    // stable (useCallback) handler; an unstable one would re-identify load()
    // on every parent render and refetch through the mount effect below.
    [onSummary]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Every ladder-close path refetches (D63): a session may have landed, and
  // a stale band beside a fresh entry is the defect the refetch exists for.
  // The outcome decides one further thing and nothing else: whether the
  // completion transient plays. Dismissal and refetch are unconditional, as
  // they were before the ladder reported an outcome at all.
  const closeLadder = (outcome: CloseOutcome) => {
    setLoggingCoa(null);
    // The gate is 'logged' and only 'logged'. A discard wrote a row, so it
    // refetches like any other write, but a session the user just threw away
    // is not a session to celebrate.
    if (outcome === 'logged') {
      setBloomVisible(true);
    }
    // Reset for the next presentation: this flag describes the ladder that is
    // open, and no ladder is open now.
    setLogHasEntry(false);
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
            topCannabinoids={cannabinoidsByCoa.get(item.id) ?? []}
            effects={effectsByCoa.get(item.id) ?? []}
            onOpen={() => setDetailCoaId(item.id)}
            // One tap straight to the verdict screen (D99). The direct path,
            // not the pending chain: that chain exists only because the
            // detail pageSheet must finish dismissing before a second modal
            // can present (D49), and there is no sheet open here.
            onLog={() => setLoggingCoa(item)}
            // D113: the same question the detail asks, raised from the card
            // through the one shared ritual. A confirmed write refetches
            // through load(), the existing D63 path -- the chip renders from
            // the fetched row, so the list is what puts it back in agreement
            // with the database.
            onFavorite={(coa) => promptFavorite(coa, load)}
            // D114: the same sequence the detail raises, reached from the
            // card. The archive omits this prop -- that omission is the
            // exclusion, on the onLog form. Refetch is load(), the D63 path:
            // a retirement changes the count, and a card that reached zero
            // has to stop being rendered here.
            onRetire={(coa) => promptRetire(coa, load)}
            // D135: attach reached from the same overflow retire lives in.
            // The card itself gates on source_lab === 'manual'.
            onAttach={(coa) => setAttachTarget(coa)}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        // The summary rides the list's own header (D98), so it refetches on
        // every ladder/detail close through the existing load() paths (D63)
        // and never grows a second fetch lifecycle. The section row (D108)
        // sits beneath it and is deliberately NOT conditional on the
        // summary: it labels the cards below it, which render whether or not
        // the summary has computed yet. Named, accepted cost -- a zero
        // on-shelf count can flash for the width of the first load.
        ListHeaderComponent={
          <>
            {summary !== null && <PreferenceSummary {...summary} />}
            {/* The archive's entry point (D108), superseding D101's quiet
                footer link: it sits with the shelf it is the complement of,
                not below the last card. At zero the right half renders
                NOTHING, on D101's own grounds -- a link into an empty
                archive is noise, and absence says it already. */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>{`ON SHELF · ${rows.length}`}</Text>
              {offShelfCount > 0 && (
                <Pressable
                  onPress={() => setOffShelfVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Open off-shelf list">
                  <Text style={styles.offShelfLabel}>{`Off-shelf (${offShelfCount}) ›`}</Text>
                </Pressable>
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
            Nothing on your shelf yet
          </ThemedText>
        }
      />
      {/* The completion transient (2026-08-04). It sits here, over the shelf,
          because the shelf IS the surface the survey lands on when its modal
          dismisses — and because this component already knows the one fact that
          licenses it, which is how the ladder ended. It fills the screen and
          takes no touches, so the list underneath stays scrollable and every
          card stays tappable while it plays. */}
      {bloomVisible && <CompletionBloomOverlay onDone={() => setBloomVisible(false)} />}
      {/* D135: the attach flow is the add flow with a target -- one modal,
          one pipeline, the attachTarget prop the only fork. Owned here, like
          the detail, because the list owns load(): a completed attach closes
          and refetches. */}
      <AddToShelfModal
        visible={attachTarget !== null}
        attachTarget={attachTarget}
        onClose={() => {
          setAttachTarget(null);
          void load();
        }}
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
            onLogSession={() => {
              setPendingLogCoa(rows.find((row) => row.id === detailCoaId) ?? null);
              closeDetail();
            }}
          />
        )}
      </Modal>
      {/* The archive (D101): a sibling modal owning its own fetch, so the
          shelf gains no second lifecycle for rows it does not render.
          Closing refetches on the D63 grounds — a COA can be deleted from
          the archive's detail, and both the summary and this footer's count
          are computed from the catalog that delete changed. */}
      <OffShelfList
        visible={offShelfVisible}
        onClose={() => {
          setOffShelfVisible(false);
          load();
        }}
      />
      {/* The ladder (D50/D51): full-screen sibling modal; gestures inside
          an RN Modal are inert without their own root view. Closing
          returns to the shelf, not the detail sheet — accepted behavior
          from the spike gate. */}
      <Modal
        visible={loggingCoa !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          // Inert while an insert is in flight (D54). The outcome derives from
          // the ladder's reported state, not from the fact that dismissal came
          // from out here (2026-08-04): closing from the top keeps a rated
          // session and says so, rather than announcing a cancel about a row
          // that exists.
          if (!logBusy) {
            closeLadder(logHasEntry ? 'logged' : 'cancelled');
          }
        }}>
        {loggingCoa !== null && (
          <GestureHandlerRootView style={styles.gestureRoot}>
            <SessionLadder
              coa={loggingCoa}
              onClose={closeLadder}
              onBusyChange={setLogBusy}
              onLoggedChange={setLogHasEntry}
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
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  // The eyebrow register the summary card and the shelf card already use;
  // the string is literal caps, so it needs no textTransform.
  sectionLabel: {
    fontFamily: SORA_BOLD,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Dash.accent,
  },
  // The superseded footer link's register, with one gate-driven change:
  // the operator ruled both section-row labels accent green (2026-08-03).
  offShelfLabel: {
    fontFamily: SORA_REGULAR,
    fontSize: 11.5,
    color: Dash.accent,
  },
});
