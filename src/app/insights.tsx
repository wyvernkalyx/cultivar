import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PreferenceSummary, type PreferenceSummaryProps } from '@/components/preference-summary';
import { BottomTabInset, Dash, MaxContentWidth, Space, Type } from '@/constants/theme';
import { subscribeDataChanged } from '@/lib/refresh';
import { loadSummary } from '@/lib/summary';

// The Insights tab (D138 nav shell; D142 owns its full content). Slice 3
// hosts the existing preference summary unrestyled -- the tab is honest from
// its first render, and slice 7 restyles it in place with the Target
// profile / Would Buy Again / Profiles to avoid surfaces. Terminology per
// D138: consumer copy on this screen never says "shelf".
export default function InsightsScreen() {
  const [summary, setSummary] = useState<PreferenceSummaryProps | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    void loadSummary().then((result) => {
      if (result.ok) {
        setError(null);
        setSummary(result.summary);
      } else {
        setError(result.message);
      }
    });
  }, []);

  // Two staleness paths, both covered: regaining tab focus after writes on
  // the Stash screen (card-hosted logging, retire, delete), and the
  // quick-actions tick for writes that happen while this tab is the one on
  // screen (a FAB-logged session).
  useFocusEffect(
    useCallback(() => {
      load();
      return subscribeDataChanged(load);
    }, [load])
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.wordmark}>CULTIVAR</Text>
          <Text style={styles.title}>Insights</Text>
          {summary !== null && summary.sessionCount > 0 && (
            <Text style={styles.subtitle}>
              {`Based on ${summary.sessionCount} logged ${summary.sessionCount === 1 ? 'session' : 'sessions'}.`}
            </Text>
          )}
          {error !== null && (
            <View style={styles.messageBlock}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={load} accessibilityRole="button" accessibilityLabel="Retry">
                <Text style={styles.retry}>Retry</Text>
              </Pressable>
            </View>
          )}
          {error === null && summary === null && <Text style={styles.loading}>Loading…</Text>}
          {error === null && summary !== null && <PreferenceSummary {...summary} />}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Dash.bg,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  scrollContent: {
    paddingHorizontal: Space.gutter,
    paddingTop: Space.chip,
    paddingBottom: BottomTabInset + Space.section,
    gap: Space.row,
  },
  wordmark: {
    fontFamily: Type.family.bold,
    fontSize: 12,
    letterSpacing: 3,
    color: Dash.accent,
  },
  title: {
    fontFamily: Type.family.display,
    fontSize: 26,
    lineHeight: 29,
    color: Dash.text,
  },
  subtitle: {
    fontFamily: Type.family.serifItalic,
    fontSize: 14.5,
    color: Dash.textBody,
  },
  messageBlock: {
    gap: Space.chip,
    paddingVertical: Space.section,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: Type.family.regular,
    fontSize: 11.5,
    color: Dash.textBody,
    textAlign: 'center',
  },
  retry: {
    fontFamily: Type.family.bold,
    fontSize: 11.5,
    color: Dash.accent,
  },
  loading: {
    fontFamily: Type.family.regular,
    fontSize: 11.5,
    color: Dash.textMuted,
    textAlign: 'center',
    paddingVertical: Space.section,
  },
});
