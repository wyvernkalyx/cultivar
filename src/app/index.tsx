import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AddToShelfModal from '@/components/add-to-shelf-modal';
import type { PreferenceSummaryProps } from '@/components/preference-summary';
import { ShelfList } from '@/components/shelf-list';
import { ThemedText } from '@/components/themed-text';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, Dash, MaxContentWidth, Spacing } from '@/constants/theme';
import { exportProfile } from '@/lib/export';
import { supabase } from '@/lib/supabase';

// Font families registered app-wide in the root layout (D83 Decision 1),
// referenced by name exactly as the dashboard's other surfaces do; an unloaded
// family falls back to the system font rather than blocking the render.
const SORA_REGULAR = 'Sora_400Regular';
const SORA_BOLD = 'Sora_700Bold';
const SORA_DISPLAY = 'Sora_800ExtraBold';
const SERIF_ITALIC = 'Newsreader_400Regular_Italic';

export default function HomeScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [addToShelfVisible, setAddToShelfVisible] = useState(false);
  // The gear's surface (D107.1). It owns no shelf state: nothing behind it
  // can change a COA, so closing it deliberately does NOT bump shelfVersion.
  const [settingsVisible, setSettingsVisible] = useState(false);
  // The export's in-flight flag (D111). It gates the row against a second
  // tap while the selects and the file write are outstanding.
  const [exporting, setExporting] = useState(false);
  // Bumped on every modal close and used as ShelfList's key, so closing
  // after a save remounts the list and refetches (the pickId pattern). A
  // close without a save refetching too is accepted.
  const [shelfVersion, setShelfVersion] = useState(0);
  // The all-time session count, reported up by the shelf's own load() so the
  // subtitle below the screen title reads from the same fetch the summary
  // card does (D109's mock-faithful placement) -- never a second query.
  // null is "no data yet", distinct from a real 0.
  const [sessionCount, setSessionCount] = useState<number | null>(null);
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
  const runExport = async () => {
    setExporting(true);
    try {
      await exportProfile();
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

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
        {/* D107: one row replaces the account row and the full-width "Add to
            shelf" button. The pill keeps the app's sole ingestion entry
            point; the gear opens D107.1's surface for the account. */}
        <View style={styles.header}>
          <Text style={styles.wordmark}>CULTIVAR</Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setSettingsVisible(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Settings">
              <SymbolView name="gearshape" tintColor={Dash.textMuted} size={22} />
            </Pressable>
            <Pressable
              onPress={() => setAddToShelfVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Add">
              <View style={styles.addPill}>
                <Text style={styles.addPillLabel}>+ Add</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <AddToShelfModal
          visible={addToShelfVisible}
          onClose={() => {
            setAddToShelfVisible(false);
            setShelfVersion((n) => n + 1);
          }}
        />

        {/* D109: the summary card's old countLine, moved out to sit under
            the screen title per the mock. It renders only once there is a
            session to report -- at zero the card's own empty branch carries
            the invitation, and a "0 sessions logged" line above it would
            state the fact twice and clash with that copy. */}
        <View style={styles.shelfHeadingBlock}>
          <ThemedText type="subtitle" style={styles.shelfHeading}>
            Your shelf
          </ThemedText>
          {sessionCount !== null && sessionCount > 0 && (
            <Text style={styles.shelfSubtitle}>
              {`${sessionCount} ${sessionCount === 1 ? 'session' : 'sessions'} logged, on and off the shelf. Verdicts build your picture here.`}
            </Text>
          )}
        </View>
        <ShelfList key={shelfVersion} onSummary={handleSummary} />

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
            disabled={exporting}
            accessibilityRole="button"
            accessibilityState={{ disabled: exporting }}
            accessibilityLabel="Export data">
            <Text style={[styles.sheetAction, exporting && styles.sheetActionBusy]}>
              {exporting ? 'Preparing export...' : 'Export data'}
            </Text>
          </Pressable>
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
    paddingBottom: BottomTabInset + Spacing.three,
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
  addPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Dash.radius.row,
    backgroundColor: Dash.accent,
  },
  addPillLabel: {
    fontFamily: SORA_BOLD,
    fontSize: 11.5,
    color: Dash.bg,
  },
  // Title and subtitle are one block: the screen's own gap (Spacing.three)
  // would read as two unrelated lines rather than a heading and its gloss.
  shelfHeadingBlock: {
    alignSelf: 'stretch',
    gap: Spacing.one,
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
  signOut: {
    fontFamily: SORA_BOLD,
    fontSize: 14.5,
    color: Dash.accent,
  },
});
