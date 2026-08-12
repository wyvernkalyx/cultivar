import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PreferenceSummaryProps } from '@/components/preference-summary';
import { ShelfList } from '@/components/shelf-list';
import { ThemedText } from '@/components/themed-text';
import { WebBadge } from '@/components/web-badge';
import { Dash, MaxContentWidth, Space, Spacing, Type } from '@/constants/theme';
import { exportProfile } from '@/lib/export';
import { resetProfile } from '@/lib/profile-reset';
import { supabase } from '@/lib/supabase';

// Font families registered app-wide in the root layout (D83 Decision 1),
// referenced by name exactly as the dashboard's other surfaces do; an unloaded
// family falls back to the system font rather than blocking the render.
const SORA_REGULAR = Type.family.regular;
const SORA_SEMIBOLD = Type.family.semibold;
const SORA_BOLD = Type.family.bold;
const SORA_DISPLAY = Type.family.display;
const SERIF_ITALIC = Type.family.serifItalic;

export default function HomeScreen() {
  const [email, setEmail] = useState<string | null>(null);
  // The gear's surface (D107.1). It owns no shelf state: nothing behind it
  // can change a COA, so closing it deliberately does NOT bump shelfVersion.
  const [settingsVisible, setSettingsVisible] = useState(false);
  // The export's in-flight flag (D111). It gates the row against a second
  // tap while the selects and the file write are outstanding.
  const [exporting, setExporting] = useState(false);
  // The reset's in-flight flag (D110): true across the pre-read and across
  // the RPC, false again once an alert is on screen, since the alert is
  // what holds the interaction from there.
  const [resetting, setResetting] = useState(false);
  // Bumped on every modal close and used as ShelfList's key, so closing
  // after a save remounts the list and refetches (the pickId pattern). A
  // close without a save refetching too is accepted.
  const [shelfVersion, setShelfVersion] = useState(0);
  // The all-time session count, reported up by the shelf's own load() so the
  // subtitle below the screen title reads from the same fetch the summary
  // card does (D109's mock-faithful placement) -- never a second query.
  // null is "no data yet", distinct from a real 0.
  const [sessionCount, setSessionCount] = useState<number | null>(null);
  // The header search (slice 4a; the standing queue's rank-2 item). The
  // query lives here because the header owns the input; ShelfList filters.
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Stable identity on purpose: ShelfList's load() closes over this handler,
  // so an inline arrow would re-identify load() on every render of this
  // screen and refetch the shelf each time.
  const handleSummary = useCallback((summary: PreferenceSummaryProps) => {
    setSessionCount(summary.sessionCount);
  }, []);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });
  }, []);

  // The sheet stays open across the export: the share sheet presents over
  // it, and dismissing the surface the user acted on would lose the error
  // path's only place to report. Nothing here mutates, so shelfVersion is
  // deliberately untouched -- the account sheet's no-refresh-on-close
  // property (D107.1) is unaffected by a read.
  // Returns whether the export completed, which is what the reset's
  // "export first" branch needs: a failed export must never fall through
  // into the reset it was offered ahead of.
  const runExport = async (): Promise<boolean> => {
    setExporting(true);
    try {
      await exportProfile();
      return true;
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setExporting(false);
    }
  };

  // The two counts the confirm sentence states, read live at the moment of
  // the tap. Both are cheap: a head-only count over the live-session view,
  // and the shelf column summed here rather than in a new server-side
  // aggregate, since PostgREST has no sum and D110's non-goals rule out a
  // view for one sentence.
  const readResetCounts = async (): Promise<{ sessions: number; packages: number }> => {
    const [sessions, shelf] = await Promise.all([
      supabase.from('session_current').select('*', { count: 'exact', head: true }),
      supabase.from('coas').select('on_shelf_count'),
    ]);
    if (sessions.error) {
      throw new Error(sessions.error.message);
    }
    if (shelf.error) {
      throw new Error(shelf.error.message);
    }
    const packages = ((shelf.data ?? []) as { on_shelf_count: number }[]).reduce(
      (total, row) => total + row.on_shelf_count,
      0,
    );
    return { sessions: sessions.count ?? 0, packages };
  };

  // The RPC is one transaction, so a failure means nothing moved: the
  // error is reported and no local state changes. Success is the ratified
  // exception to the sheet's no-refresh-on-close property (D110 slice 5) --
  // reset changes COA state, so the shelf behind the sheet is now stale.
  const runReset = async () => {
    setResetting(true);
    const result = await resetProfile();
    setResetting(false);
    if (!result.ok) {
      Alert.alert('Reset failed', result.message);
      return;
    }
    Alert.alert(
      `Profile reset — ${result.sessions_hidden} ${result.sessions_hidden === 1 ? 'session' : 'sessions'} hidden, ${result.packages_retired} ${result.packages_retired === 1 ? 'package' : 'packages'} retired.`,
      undefined,
      [
        {
          text: 'OK',
          onPress: () => {
            setSettingsVisible(false);
            setShelfVersion((n) => n + 1);
          },
        },
      ],
    );
  };

  // Counts are re-read on every entry to this confirm, including the
  // return trip from "Export first": the export can take a while, and a
  // sentence stating numbers the user has since changed would be stating
  // something untrue about their own data.
  const confirmReset = async () => {
    setResetting(true);
    try {
      const counts = await readResetCounts();
      Alert.alert(
        'Start from scratch?',
        `This hides your ${counts.sessions} logged ${counts.sessions === 1 ? 'session' : 'sessions'} and moves ${counts.packages} ${counts.packages === 1 ? 'item' : 'items'} to History. Buy-again answers are cleared. Your COAs stay, and nothing is deleted. You can export your data first.`,
        [
          {
            text: 'Export first',
            onPress: () => {
              void exportThenConfirm();
            },
          },
          {
            text: 'Reset',
            style: 'destructive',
            onPress: () => {
              void runReset();
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    } catch (e) {
      Alert.alert('Reset failed', e instanceof Error ? e.message : String(e));
    } finally {
      setResetting(false);
    }
  };

  // Shared or dismissed both count as completed -- the user got their file
  // either way, and only a thrown export blocks the return to the confirm.
  const exportThenConfirm = async () => {
    if (await runExport()) {
      await confirmReset();
    }
  };

  // One flag for both action rows: the two operations share the sheet, and
  // either one in flight is a reason not to start the other.
  const busy = exporting || resetting;

  const signOut = async () => {
    // The root-layout gate observes the auth change and swaps to sign-in on
    // its own — no navigation here. The sheet is dismissed first so a
    // presented modal is never left over a screen being torn down.
    setSettingsVisible(false);
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* D138: ingestion entry moved to the tab bar's center FAB (the
            quick-actions selector); the header keeps the gear for D107.1's
            account surface. Slice 4 owns the reference's full header. */}
        <View style={styles.header}>
          <Text style={styles.wordmark}>CULTIVAR</Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                // Plain conditional, never a side effect inside a state
                // updater: updaters must be pure (dev double-invocation is
                // exactly the environment that punishes impurity), and the
                // 4a gate observed the impure form failing to close.
                if (searchOpen) {
                  setSearchQuery('');
                  setSearchOpen(false);
                } else {
                  setSearchOpen(true);
                }
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={searchOpen ? 'Close search' : 'Search'}>
              <SymbolView
                name="magnifyingglass"
                tintColor={searchOpen ? Dash.accent : Dash.textMuted}
                size={22}
              />
            </Pressable>
            <Pressable
              onPress={() => setSettingsVisible(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Settings">
              <SymbolView name="gearshape" tintColor={Dash.textMuted} size={22} />
            </Pressable>
          </View>
        </View>

        {/* D109: the summary card's old countLine, moved out to sit under
            the screen title per the mock. It renders only once there is a
            session to report -- at zero the card's own empty branch carries
            the invitation, and a "0 sessions logged" line above it would
            state the fact twice and clash with that copy. */}
        <View style={styles.shelfHeadingBlock}>
          {searchOpen ? (
            // The search bar takes the heading's row while open (reference
            // screen 01). Three exits, per the 4a gate finding that one is
            // not enough: the header icon toggles, Cancel closes, and a
            // blur with an empty query collapses (the reference's own
            // blur-empty rule).
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search your stash"
                placeholderTextColor={Dash.textFaint}
                autoFocus
                autoCorrect={false}
                autoCapitalize="none"
                accessibilityLabel="Search your stash"
                onBlur={() => {
                  if (searchQuery.trim().length === 0) {
                    setSearchQuery('');
                    setSearchOpen(false);
                  }
                }}
              />
              <Pressable
                onPress={() => {
                  setSearchQuery('');
                  setSearchOpen(false);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Cancel search">
                <Text style={styles.searchCancel}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <ThemedText type="subtitle" style={styles.shelfHeading}>
              My Stash
            </ThemedText>
          )}
          {!searchOpen && sessionCount !== null && sessionCount > 0 && (
            <Text style={styles.shelfSubtitle}>
              {`${sessionCount} ${sessionCount === 1 ? 'session' : 'sessions'} logged across Active and History. Verdicts build your picture here.`}
            </Text>
          )}
        </View>
        <ShelfList key={shelfVersion} onSummary={handleSummary} filterQuery={searchQuery} />

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>

      {/* The gear's surface (D107.1): the signed-in email and Sign out, the
          two things the deleted account row carried and the only things it
          carried. Same presentation family as the shelf's detail sheet. */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettingsVisible(false)}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Account</Text>
            <Pressable
              onPress={() => setSettingsVisible(false)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close settings">
              <Text style={styles.sheetClose}>Close</Text>
            </Pressable>
          </View>
          {/* The same one-shot getSession read the account row used; the
              placeholder stands in only until it resolves. */}
          <Text style={styles.sheetEmail} numberOfLines={1}>
            {email ?? '…'}
          </Text>
          {/* D111. Copy and placement are operator-gated and may change at
              the device gate; the row matches the sheet's existing type
              treatment so only the wording is in question. */}
          <Pressable
            onPress={runExport}
            disabled={busy}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            accessibilityLabel="Export data">
            <Text style={[styles.sheetAction, busy && styles.sheetActionBusy]}>
              {exporting ? 'Preparing export...' : 'Export data'}
            </Text>
          </Pressable>
          {/* D110. Grouped with the export as its peer, and carrying the
              same type treatment: the weight of the action lives in the
              confirm's destructive button, not in a red row that shouts
              before the user has asked for anything. */}
          <Pressable
            onPress={confirmReset}
            disabled={busy}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            accessibilityLabel="Reset profile">
            <Text style={[styles.sheetAction, busy && styles.sheetActionBusy]}>Reset profile</Text>
          </Pressable>
          {/* Isolated from the two action rows by its own margin: it is not
              their peer, and the spacing is what says so. */}
          <Pressable onPress={signOut} accessibilityRole="button" accessibilityLabel="Sign out">
            <Text style={styles.signOut}>Sign out</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
    // The screen chrome joins the surfaces it frames: the summary card, the
    // shelf cards, and the archive are all fixed dark (Dash), and a themed
    // white background behind them was the seam.
    backgroundColor: Dash.bg,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  header: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  wordmark: {
    flexShrink: 1,
    fontFamily: SORA_DISPLAY,
    fontSize: 16,
    letterSpacing: 3,
    color: Dash.accent,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  // Title and subtitle are one block: the screen's own gap (Spacing.three)
  // would read as two unrelated lines rather than a heading and its gloss.
  shelfHeadingBlock: {
    alignSelf: 'stretch',
    gap: Spacing.one,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.row,
    alignSelf: 'stretch',
  },
  searchInput: {
    flex: 1,
    fontFamily: SORA_BOLD,
    fontSize: 20,
    color: Dash.text,
    backgroundColor: Dash.surface,
    borderRadius: Dash.radius.row,
    paddingHorizontal: Space.card,
    paddingVertical: Space.chip,
  },
  searchCancel: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 13,
    color: Dash.accent,
  },
  shelfHeading: {
    alignSelf: 'stretch',
    // ThemedText colors from the light/dark scheme; on the fixed dark
    // chrome the style override is what keeps it legible.
    color: Dash.text,
  },
  // The register the summary card's countLine carried before D109 moved it.
  shelfSubtitle: {
    fontFamily: SERIF_ITALIC,
    fontSize: 14.5,
    color: Dash.textBody,
  },
  sheet: {
    flex: 1,
    backgroundColor: Dash.bg,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  sheetTitle: {
    flexShrink: 1,
    fontFamily: SORA_DISPLAY,
    fontSize: 28,
    lineHeight: 31,
    textTransform: 'uppercase',
    color: Dash.text,
  },
  sheetClose: {
    fontFamily: SORA_BOLD,
    fontSize: 11.5,
    color: Dash.textMuted,
  },
  sheetEmail: {
    fontFamily: SORA_REGULAR,
    fontSize: 14.5,
    color: Dash.textBody,
  },
  // Same treatment as Sign out below -- both are sheet actions, and giving
  // the export its own weight would rank two peers that are not ranked.
  sheetAction: {
    fontFamily: SORA_BOLD,
    fontSize: 14.5,
    color: Dash.accent,
  },
  // The only in-flight signal the row carries: no spinner, since the row
  // also swaps its own label.
  sheetActionBusy: {
    color: Dash.textMuted,
  },
  // The sheet's own gap already separates the rows; this margin is the
  // extra distance that makes Sign out read as apart from the pair above
  // it rather than third in a list of three.
  signOut: {
    marginTop: 16,
    fontFamily: SORA_BOLD,
    fontSize: 14.5,
    color: Dash.accent,
  },
});
