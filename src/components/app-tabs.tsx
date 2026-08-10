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
          <TabTrigger name="index" href="/" asChild>
            <TabButton label="Stash" icon="archivebox" />
          </TabTrigger>
          <Pressable
            onPress={() => setSelectorVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Add or log"
            style={styles.fabSlot}>
            <View style={styles.fab}>
              <Text style={styles.fabPlus}>+</Text>
            </View>
          </Pressable>
          <TabTrigger name="insights" href="/insights" asChild>
            <TabButton label="Insights" icon="chart.bar" />
          </TabTrigger>
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

const styles = StyleSheet.create({
  slot: {
    flex: 1,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    backgroundColor: Dash.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Dash.surface2,
    paddingTop: Space.chip,
    paddingHorizontal: Space.gutter,
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
  // The raised center action (reference 01): the circle sits proud of the
  // bar. Raising is a transform so the bar's own layout height stays what
  // BottomTabInset accounts for.
  fabSlot: {
    minWidth: 72,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Dash.accent,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -18 }],
  },
  fabPlus: {
    fontFamily: Type.family.display,
    fontSize: 26,
    lineHeight: 30,
    color: Dash.bg,
  },
});
