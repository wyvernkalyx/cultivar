import { useCallback, useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AddToShelfModal from '@/components/add-to-shelf-modal';
import { CoaDetail } from '@/components/coa-detail';
import { CompletionBloomOverlay } from '@/components/completion-bloom';
import type { PreferenceSummaryProps } from '@/components/preference-summary';
import { SessionLadder, type CloseOutcome } from '@/components/session-ladder';
import {
  ShelfCard,
  type CardCannabinoid,
  type CardEffect,
  type CardRetirement,
  type CardSession,
  type CardTerpene,
  type ShelfCoa,
} from '@/components/shelf-card';
import { Dash, Space, Spacing, Type } from '@/constants/theme';
import {
  groupSessionsByCoa,
  groupTopCannabinoidsByCoa,
  groupTopEffectsByCoa,
  groupTopTerpenesByCoa,
  type SummaryCannabinoid,
  type SummarySession,
  type SummaryTerpene,
} from '@/lib/card-data';
import { RUNGS } from '@/lib/lexicon';
import { subscribeDataChanged } from '@/lib/refresh';
import { buildSummary, type SummaryCoa } from '@/lib/summary';
import { promptRetire } from '@/lib/coa-retire';
import { supabase } from '@/lib/supabase';

// The card, its date helpers, and the ShelfCoa shape live in shelf-card.tsx
// from D99 on — the list owns fetching and the modals, the card owns display.
// The per-COA grouping conventions moved to src/lib/card-data.ts in D101,
// where the off-shelf archive reads them too.

// Font families for the section row, registered app-wide in the root layout
// (D83 Decision 1) and referenced by name as the card does.
const SORA_REGULAR = Type.family.regular;
const SORA_SEMIBOLD = Type.family.semibold;
const SORA_BOLD = Type.family.bold;

// The retirement events (D90), exactly the columns selected; ported here
// from the archive component slice 4a absorbs. The LATEST event per COA is
// the one whose reason describes the card's current state; earlier events
// are not overwritten anywhere -- they are simply not what the line reports.
type RetirementRow = { coa_id: string; reason: string; created_at: string };

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

// The Stash's two segments (D138): Active is possession, History is the
// absorbed archive (D101's substance unchanged -- off-stash is a display
// state, never an erasure).
type Segment = 'active' | 'history';

// Sort pills (reference screen 01). 'rated' orders by the mean hidden score
// of the user's own logged sessions -- personal-empirical: the user's
// verdicts, never chemistry, decide "top". Unscored items sort last.
type SortKey = 'recent' | 'thc' | 'terps' | 'rated' | 'alpha';

const SORT_LABELS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Recent' },
  { key: 'thc', label: 'Highest THC' },
  { key: 'terps', label: 'Highest terps' },
  { key: 'rated', label: 'Top rated' },
  { key: 'alpha', label: 'A-Z' },
];

const SCORE_BY_WORD = new Map<string, number>(RUNGS.map((rung) => [rung.word, rung.score]));

// The summary computation (SummaryCoa, the range and ranking helpers, and
// buildSummary) moved to src/lib/summary.ts in slice 3: the Insights route
// consumes it too now, and two copies are two places for the D98 bindings
// to drift. This list keeps its five-select load because it also feeds the
// cards; only the builder moved.

// The dashboard's subtitle renders OUTSIDE the card from D109 on (the
// mock-faithful placement, under the screen title), so the screen needs the
// all-time session count this component already computes. One optional
// callback, fired from the same load() that sets the state -- no second
// query and no second fetch lifecycle. The key={shelfVersion} remount
// refiring it is expected: it reports the same number, so the parent's
// setState is a no-op.
export type ShelfListProps = {
  onSummary?: (summary: PreferenceSummaryProps) => void;
  // The header's search bar (slice 4a; the standing queue's search item).
  // Client-side, strain and brand, case-insensitive; empty means everything.
  filterQuery?: string;
};

export function ShelfList({ onSummary, filterQuery }: ShelfListProps) {
  const [rows, setRows] = useState<ShelfCoa[] | null>(null);
  // The preference summary's props (D98), computed in load() from the same
  // fetch as the shelf so it has no lifecycle of its own — it refetches
  // through every existing D63 path and no other.
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
  const [retirementByCoa, setRetirementByCoa] = useState<Map<string, CardRetirement>>(new Map());
  const [segment, setSegment] = useState<Segment>('active');
  const [sort, setSort] = useState<SortKey>('recent');
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
          // Whole catalog since slice 4a: the Active/History segments split
          // client-side on on_shelf_count, so the old DB-side complement
          // pair collapsed into one fetch. A count of 0 is still only a
          // display state, never an erasure: the row, its sessions, its
          // band, and its favorite all survive. RLS scopes the rows; the DB
          // orders them; the segments, the pills, and the search partition
          // and reorder what it returned, without a second fetch.
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
        supabase.from('coa_retirements').select('coa_id, reason, created_at'),
      ]).then(([coasResult, sessionsResult, allCoasResult, terpenesResult, cannabinoidsResult, retirementsResult]) => {
        // One error state: any query's failure surfaces through the
        // existing path, no second banner.
        const queryError =
          coasResult.error ??
          sessionsResult.error ??
          allCoasResult.error ??
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
        const sessions = sessionsResult.data as SummarySession[];
        const terpenes = terpenesResult.data as SummaryTerpene[];
        const allCoas = allCoasResult.data as SummaryCoa[];
        // Built for the header's subtitle count alone since slice 4a --
        // the card itself renders on Insights (D142).
        onSummary?.(buildSummary(sessions, allCoas, terpenes));
        setSessionsByCoa(groupSessionsByCoa(sessions));
        setEffectsByCoa(groupTopEffectsByCoa(sessions));
        setTerpenesByCoa(groupTopTerpenesByCoa(terpenes));
        setCannabinoidsByCoa(
          groupTopCannabinoidsByCoa(cannabinoidsResult.data as SummaryCannabinoid[])
        );
        setRetirementByCoa(latestRetirementByCoa(retirementsResult.data as RetirementRow[]));
      }),
    // onSummary is in the closure, so it is in the deps. The caller passes a
    // stable (useCallback) handler; an unstable one would re-identify load()
    // on every parent render and refetch through the mount effect below.
    [onSummary]
  );

  useEffect(() => {
    load();
  }, [load]);
  // Quick-actions writes (FAB add, FAB-logged session) happen outside this
  // tree; the tick is their only line of sight into load() (slice 3).
  useEffect(() => subscribeDataChanged(load), [load]);

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

  // The segment split, the search, and the sort, in that order -- all over
  // the one fetched catalog. Search filters within the current segment so
  // an Active search never silently surfaces History rows.
  const query = (filterQuery ?? '').trim().toLowerCase();
  const matchesQuery = (coa: ShelfCoa) =>
    query.length === 0 ||
    (coa.strain ?? '').toLowerCase().includes(query) ||
    (coa.brand ?? '').toLowerCase().includes(query);
  // Mean of the hidden scores of this COA's scored sessions; null when none
  // are scored. Absent words stay unscored rather than being coerced (the
  // D62 family: the tags and words never invent numbers).
  const meanScore = (coaId: string): number | null => {
    const scores = (sessionsByCoa.get(coaId) ?? [])
      .map((session) => SCORE_BY_WORD.get(session.word))
      .filter((score): score is number => score !== undefined);
    if (scores.length === 0) return null;
    return scores.reduce((total, score) => total + score, 0) / scores.length;
  };
  const sortRows = (list: ShelfCoa[]): ShelfCoa[] => {
    if (sort === 'recent') return list;
    // Alphabetical partitions on whether a strain was reported at all, never
    // on a coerced name: a row the lab left unnamed has nothing to
    // alphabetize, and treating its absence as '' would file every such row
    // together under a key nobody entered. Named rows order among
    // themselves; the rest follow in fetched order -- the same standing
    // absence convention the numeric branch below applies to ND and unscored
    // rows.
    if (sort === 'alpha') {
      const named = list.filter((coa) => (coa.strain?.trim() ?? '') !== '');
      const unnamed = list.filter((coa) => (coa.strain?.trim() ?? '') === '');
      named.sort((a, b) =>
        (a.strain as string).trim().localeCompare((b.strain as string).trim(), undefined, {
          sensitivity: 'base',
          numeric: true,
        })
      );
      return [...named, ...unnamed];
    }
    const value = (coa: ShelfCoa): number | null =>
      sort === 'thc' ? coa.total_thc : sort === 'terps' ? coa.total_terpenes : meanScore(coa.id);
    // Stable partition: valued rows descending, unvalued rows after them in
    // fetched order. ND and unscored sort last, never as zero (the standing
    // absence rule).
    const valued = list.filter((coa) => value(coa) !== null);
    const unvalued = list.filter((coa) => value(coa) === null);
    valued.sort((a, b) => (value(b) as number) - (value(a) as number));
    return [...valued, ...unvalued];
  };
  const displayRows =
    rows === null
      ? []
      : sortRows(
          rows.filter(
            (coa) => (segment === 'active' ? coa.on_shelf_count > 0 : coa.on_shelf_count === 0) &&
              matchesQuery(coa)
          )
        );
  const activeCount = rows === null ? 0 : rows.filter((coa) => coa.on_shelf_count > 0).length;
  const historyCount = rows === null ? 0 : rows.filter((coa) => coa.on_shelf_count === 0).length;
  // The chip states the standing order; the menu is the only place it
  // changes. Falls back to the first entry so the chip always names
  // something rather than rendering an empty value.
  const sortLabel = SORT_LABELS.find((option) => option.key === sort)?.label ?? SORT_LABELS[0].label;

  // The sort menu (D145): a system control, so the standing choice is
  // announced by the platform rather than by a colored fill, and the
  // checkmark rides the option the spec asks for it on.
  const openSortMenu = () => {
    // iOS only by construction. Android is banked for this app, and a
    // platform this module does not serve must no-op rather than throw.
    if (Platform.OS !== 'ios') return;
    const labels = SORT_LABELS.map((option) =>
      option.key === sort ? `\u2713 ${option.label}` : option.label
    );
    ActionSheetIOS.showActionSheetWithOptions(
      { options: [...labels, 'Cancel'], cancelButtonIndex: labels.length },
      (index) => {
        // Cancel and the dismissal index both land outside the options.
        if (index < 0 || index >= labels.length) return;
        setSort(SORT_LABELS[index].key);
      }
    );
  };

  if (error) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.message}>{error}</Text>
        <Pressable onPress={load}>
          <Text style={styles.messageAction}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (rows === null) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageMuted}>Loading…</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={displayRows}
        keyExtractor={(coa) => coa.id}
        renderItem={({ item }) => (
          <ShelfCard
            coa={item}
            sessions={sessionsByCoa.get(item.id) ?? []}
            topTerpenes={terpenesByCoa.get(item.id) ?? []}
            topCannabinoids={cannabinoidsByCoa.get(item.id) ?? []}
            effects={effectsByCoa.get(item.id) ?? []}
            onOpen={() => setDetailCoaId(item.id)}
            // History rows carry the retirement line instead of the Log
            // path (D101's exclusion, unchanged by the absorption): a
            // session against a finished package is more often a data-entry
            // error than an event.
            retirement={item.on_shelf_count === 0 ? retirementByCoa.get(item.id) : undefined}
            // One tap straight to the verdict screen (D99). The direct path,
            // not the pending chain: that chain exists only because the
            // detail pageSheet must finish dismissing before a second modal
            // can present (D49), and there is no sheet open here.
            onLog={item.on_shelf_count > 0 ? () => setLoggingCoa(item) : undefined}
            // D114: the same sequence the detail raises, reached from the
            // card. The archive omits this prop -- that omission is the
            // exclusion, on the onLog form. Refetch is load(), the D63 path:
            // a retirement changes the count, and a card that reached zero
            // has to stop being rendered here.
            onRetire={item.on_shelf_count > 0 ? (coa) => promptRetire(coa, load) : undefined}
            // D135: attach reached from the same overflow retire lives in.
            // The card itself gates on source_lab === 'manual'.
            onAttach={item.on_shelf_count > 0 ? (coa) => setAttachTarget(coa) : undefined}
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
        // The summary card left this surface in slice 4a: Insights owns it
        // (D142); the fetch stays because the subtitle count reads it. In
        // its place, the reference's segment toggle and sort pills (screen
        // 01), which absorb the archive modal and its entry link (D108
        // superseded; D101's substance unchanged).
        // Pinned (4a gate finding 2): the pills stay reachable while the
        // cards scroll under them. The wrapper carries the screen
        // background so cards never show through the pinned band.
        stickyHeaderIndices={[0]}
        ListHeaderComponent={
          <View style={styles.pinnedHeader}>
            {/* Possession as a two-way switch, one track (D145). The counts
                stay whole-segment: they say how much is on each side, which
                is what a switch has to say to be worth reading. */}
            <View style={styles.segmentTrack}>
              {(
                [
                  { key: 'active', label: `Active (${activeCount})` },
                  { key: 'history', label: `History (${historyCount})` },
                ] as { key: Segment; label: string }[]
              ).map((option) => {
                const isSelected = segment === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setSegment(option.key)}
                    // The 32pt visual is the ratified dimension; the slop is
                    // what carries the target to the 44pt floor without
                    // moving anything on screen.
                    hitSlop={{ top: 6, bottom: 6 }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={option.label}
                    style={[styles.segment, isSelected && styles.segmentSelected]}>
                    <Text style={isSelected ? styles.segmentLabelSelected : styles.segmentLabel}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {/* The count reports what is actually on screen -- segment,
                search, and order already applied -- so it answers "how many
                am I looking at", not "how many exist". */}
            <View style={styles.sortRow}>
              <Text style={styles.strainCount}>
                {`${displayRows.length} ${displayRows.length === 1 ? 'strain' : 'strains'}`}
              </Text>
              <Pressable
                onPress={openSortMenu}
                hitSlop={{ top: 8, bottom: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`Sort: ${sortLabel}`}
                style={styles.sortChip}>
                <Text style={styles.sortChipPrefix}>Sort:</Text>
                <Text style={styles.sortChipValue}>{sortLabel}</Text>
                <Text style={styles.sortChipCaret}>{'\u25bc'}</Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.messageMuted}>
            {query.length > 0
              ? 'Nothing matches your search.'
              : segment === 'active'
                ? 'Nothing in your stash yet'
                : 'Nothing in your History yet.'}
          </Text>
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
  // The list's message states stand on the screen's fixed dark ground
  // (Dash.bg), so each states its own color instead of resolving one from the
  // device color scheme: a scheme-resolved color renders near-black on
  // near-black in Light appearance, which is what took the error state and its
  // Retry off the screen. Size, weight, and leading are the values these four
  // lines already rendered at, carried over unchanged -- this slice moves where
  // the color comes from and nothing else.
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
    textAlign: 'center',
    color: Dash.text,
  },
  messageAction: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
    textAlign: 'center',
    color: Dash.text,
  },
  messageMuted: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
    textAlign: 'center',
    color: Dash.textMuted,
  },
  // The D145 header: a two-segment switch over one track, then the count
  // and the sort chip on one row. The band carries the screen background
  // so cards never show through it while it is pinned.
  pinnedHeader: {
    backgroundColor: Dash.bg,
    paddingTop: Space.card,
    paddingBottom: Space.row,
    gap: Space.row,
  },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: Dash.segmentTrack,
    borderRadius: 10,
    padding: 2,
  },
  segment: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: Dash.segmentOn,
    // The one elevation in this app, and the ratified spec pins it: it is
    // what lifts the standing side off the track it shares with the other.
    shadowColor: Dash.shadowInk,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  segmentLabel: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 12.5,
    color: Dash.textMuted,
  },
  segmentLabelSelected: {
    fontFamily: SORA_BOLD,
    fontSize: 12.5,
    color: Dash.text,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strainCount: {
    fontFamily: SORA_REGULAR,
    fontSize: 11,
    color: Dash.textMuted,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.inline,
    height: 28,
    paddingHorizontal: Space.row,
    borderRadius: 14,
    backgroundColor: Dash.chipFill,
    borderWidth: 1,
    borderColor: Dash.chipBorder,
  },
  sortChipPrefix: {
    fontFamily: SORA_REGULAR,
    fontSize: 11.5,
    color: Dash.textMuted,
  },
  sortChipValue: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 11.5,
    color: Dash.textStrong,
  },
  sortChipCaret: {
    fontFamily: SORA_REGULAR,
    fontSize: 9,
    color: Dash.textMuted,
  },
});
