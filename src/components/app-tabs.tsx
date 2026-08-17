import { Tabs, TabList, TabTrigger, TabSlot, type TabTriggerSlotProps } from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuickActions } from '@/components/quick-actions';
import { Dash, Space, Type } from '@/constants/theme';

// The D138 nav shell: Stash / center + / Insights, one component for native
// and web on expo-router/ui's headless Tabs. This retires both prior tab
// layers at once -- the router's unstable native tab bar (which cannot host
// the reference's raised center action) and the web variant's leftover
// starter-template chrome. The FAB is a plain pressable, not a route: it
// opens the quick-actions selector (reference screen 07). Described, not
// quoted: the retired tokens are gated by scans that this comment must not
// trip (the standing authored-text rule).
export default function AppTabs() {
  const insets = useSafeAreaInsets();
  const [selectorVisible, setSelectorVisible] = useState(false);

  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <View style={StyleSheet.flatten([styles.bar, { paddingBottom: insets.bottom }])}>
          <View style={styles.backdrop} />
          <TabTrigger name="index" href="/" asChild>
            <TabButton label="Stash" icon="archivebox" />
          </TabTrigger>
          <View style={styles.fabSpacer} />
          <TabTrigger name="insights" href="/insights" asChild>
            <TabButton label="Insights" icon="chart.bar" />
          </TabTrigger>
          <View style={styles.fabLayer} pointerEvents="box-none">
            <Pressable
              onPress={() => setSelectorVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Add or log"
              style={styles.fabSlot}>
              <View style={styles.fab}>
                <Text style={styles.fabPlus}>+</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </TabList>
      <QuickActions visible={selectorVisible} onClose={() => setSelectorVisible(false)} />
    </Tabs>
  );
}

function TabButton({
  label,
  icon,
  isFocused,
  ...props
}: TabTriggerSlotProps & { label: string; icon: 'archivebox' | 'chart.bar' }) {
  const tint = isFocused ? Dash.accent : Dash.textMuted;
  return (
    <Pressable {...props} style={styles.trigger} accessibilityLabel={label}>
      <SymbolView name={icon} tintColor={tint} size={22} />
      <Text style={[styles.triggerLabel, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

// How far the circle stands proud of the painted surface: the shipped raise
// (18) minus the bar's old top padding (Space.chip, 8), so the protrusion on
// screen is exactly what it is today.
const FAB_PROTRUSION = 10;

const styles = StyleSheet.create({
  slot: {
    flex: 1,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: FAB_PROTRUSION + Space.chip,
    paddingHorizontal: Space.gutter,
  },
  backdrop: {
    position: 'absolute',
    top: FAB_PROTRUSION,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Dash.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Dash.surface2,
  },
  trigger: {
    alignItems: 'center',
    gap: 2,
    minWidth: 72,
    paddingVertical: 2,
  },
  triggerLabel: {
    fontFamily: Type.family.semibold,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  fabSpacer: {
    minWidth: 72,
    height: 56,
  },
  // The raised center action (reference 01): the bar owns the protrusion as
  // top padding, the surface and hairline live on the backdrop, and the
  // responder rides a touch-transparent full-width layer, so it shares a top
  // edge with the circle the user sees. See
  // documentation/design/delta-fab-touch.md.
  fabLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    alignItems: 'center',
  },
  fabSlot: {
    width: 72,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Dash.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPlus: {
    fontFamily: Type.family.display,
    fontSize: 26,
    lineHeight: 30,
    color: Dash.bg,
  },
});
