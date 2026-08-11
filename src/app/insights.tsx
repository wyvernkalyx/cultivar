import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PreferenceSummary } from '@/components/preference-summary';
import { BottomTabInset, Dash, MaxContentWidth, Space, Type, terpeneHue } from '@/constants/theme';
import {
  buildShareText,
  formatPct,
  formatRangePct,
  type AnalyteRange,
  type BuyAgainRow,
  type ChemistryProfile,
} from '@/lib/insights/aggregate';
import { loadInsightsScreen, type InsightsScreenData } from '@/lib/insights-load';
import { subscribeDataChanged } from '@/lib/refresh';

// The Insights tab, D142 content (slice 7b-ii): Target profile hero, Would
// Buy Again with Share and Counter view, Profiles to avoid, and the kept
// preference summary below (operator ruling 2026-08-10 -- distribution and
// effects line survive; carve-out 4, nothing shipped is lost). The Counter
// view ships WITHOUT the brightness pin: that is D143's native module, and
// copy claiming it here would be false, so no such copy renders.
//
// Personal-empirical discipline (D142, restated where most at risk): every
// number is a reported lab value on batches this user rated. No copy on
// this screen may claim or imply a compound causes an effect.

const RANGE_ABSENT = 'ND';

function rangeText(range: AnalyteRange | null): string {
  return formatRangePct(range) ?? RANGE_ABSENT;
}

// Bar fill relative to the loudest terpene shown -- comparison within the
// card only, no absolute scale claimed.
function TerpeneRows({ profile }: { profile: ChemistryProfile }) {
  const shown = profile.terpenes.slice(0, 5);
  const loudest = shown.length > 0 ? Math.max(...shown.map((row) => row.max)) : 0;
  return (
    <View style={styles.terpeneRows}>
      {shown.map((row) => (
        <View key={row.name} style={styles.terpeneRow}>
          <View style={[styles.terpeneDot, { backgroundColor: terpeneHue(row.name) }]} />
          <Text style={styles.terpeneName} numberOfLines={1} ellipsizeMode="tail">
            {row.name}
          </Text>
          <View style={styles.terpeneBarTrack}>
            <View
              style={[
                styles.terpeneBarFill,
                {
                  backgroundColor: terpeneHue(row.name),
                  width: `${loudest > 0 ? Math.max(6, Math.round((row.max / loudest) * 100)) : 0}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.terpeneRange}>
            {rangeText({ min: row.min, max: row.max, ndCount: row.ndRowCount })}
          </Text>
        </View>
      ))}
    </View>
  );
}

function FactLine({ profile }: { profile: ChemistryProfile }) {
  return (
    <View style={styles.factLine}>
      <Text style={styles.factItem}>
        <Text style={styles.factLabel}>THC </Text>
        {rangeText(profile.thc)}
      </Text>
      <Text style={styles.factItem}>
        <Text style={styles.factLabel}>CBD </Text>
        {rangeText(profile.cbd)}
      </Text>
    </View>
  );
}

function BuyAgainItem({ row }: { row: BuyAgainRow }) {
  const stats = [
    row.totalThc === null ? null : `THC ${formatPct(row.totalThc)}`,
    row.totalTerpenes === null ? null : `terps ${formatPct(row.totalTerpenes)}`,
    row.topTerpene === null
      ? null
      : `${row.topTerpene.name.toLowerCase()} ${formatPct(row.topTerpene.pct)}`,
  ].filter((fact): fact is string => fact !== null);
  return (
    <View style={styles.buyRow}>
      <View style={styles.buyRowMain}>
        <Text style={styles.buyStrain}>{row.strain?.trim() || 'Strain not reported'}</Text>
        {row.brand?.trim() ? <Text style={styles.buyBrand}>{row.brand.trim()}</Text> : null}
        {stats.length > 0 && <Text style={styles.buyStats}>{stats.join(' · ')}</Text>}
      </View>
      <View style={styles.buyState}>
        <View
          style={[
            styles.stateDot,
            { backgroundColor: row.inStash ? Dash.accent : Dash.textFaint },
          ]}
        />
        <Text style={[styles.stateText, row.inStash && styles.stateTextActive]}>
          {row.inStash ? 'in stash' : 'finished'}
        </Text>
      </View>
    </View>
  );
}

export default function InsightsScreen() {
  // Captured at screen level: SafeAreaView does not receive insets inside a
  // fullScreen Modal (device gate 2026-08-10: header rendered under the
  // status bar and Close was unreachable), so the counter pads manually --
  // the coa-detail pattern.
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<InsightsScreenData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [counterOpen, setCounterOpen] = useState(false);

  const load = useCallback(() => {
    void loadInsightsScreen().then((result) => {
      if (result.ok) {
        setError(null);
        setData(result.data);
      } else {
        setError(result.message);
      }
    });
  }, []);

  // Two staleness paths, both covered: regaining tab focus after writes on
  // the Stash screen, and the quick-actions tick for writes that happen
  // while this tab is on screen.
  useFocusEffect(
    useCallback(() => {
      load();
      return subscribeDataChanged(load);
    }, [load])
  );

  const insights = data?.insights ?? null;
  const share = () => {
    if (insights === null) return;
    void Share.share({ message: buildShareText(insights) });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.wordmark}>CULTIVAR</Text>
          <Text style={styles.title}>Insights</Text>
          {insights !== null && insights.sessionCount > 0 && (
            <Text style={styles.subtitle}>
              {`Based on ${insights.sessionCount} logged ${
                insights.sessionCount === 1 ? 'session' : 'sessions'
              } across ${insights.strainCount} ${
                insights.strainCount === 1 ? 'strain' : 'strains'
              }.`}
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
          {error === null && data === null && <Text style={styles.loading}>Loading…</Text>}
          {error === null && data !== null && insights !== null && (
            <>
              {/* Target profile -- the hero. Green-bordered per the reference. */}
              <View style={[styles.card, styles.cardTarget]}>
                <Text style={styles.cardTitle}>Target profile</Text>
                <Text style={styles.cardSub}>
                  Based on strains you rated Loved · lab concentrations only
                </Text>
                {insights.target.coaCount === 0 ? (
                  <Text style={styles.absent}>No Loved sessions yet.</Text>
                ) : (
                  <>
                    <TerpeneRows profile={insights.target} />
                    <FactLine profile={insights.target} />
                    <Text style={styles.explainer}>
                      Ranges are the reported values of batches you rated Loved. No effect
                      claims — just what was in them.
                    </Text>
                  </>
                )}
              </View>

              {/* Would Buy Again -- Share + Counter view actions. */}
              <View style={styles.card}>
                <View style={styles.buyHeader}>
                  <Text style={styles.label}>Would buy again</Text>
                  <View style={styles.buyActions}>
                    <Pressable
                      onPress={share}
                      accessibilityRole="button"
                      accessibilityLabel="Share buy-again list"
                      style={styles.actionChip}>
                      <Text style={styles.actionChipText}>Share</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setCounterOpen(true)}
                      accessibilityRole="button"
                      accessibilityLabel="Open counter view"
                      style={styles.actionChip}>
                      <Text style={styles.actionChipText}>Counter view</Text>
                    </Pressable>
                  </View>
                </View>
                {insights.buyAgain.length === 0 ? (
                  <Text style={styles.absent}>No buy-again picks yet.</Text>
                ) : (
                  <>
                    {insights.buyAgain.map((row) => (
                      <BuyAgainItem key={row.coaId} row={row} />
                    ))}
                    <Text style={styles.explainer}>Show this list at the counter.</Text>
                  </>
                )}
              </View>

              {/* Profiles to avoid -- the red-bordered mirror, facts only. */}
              <View style={[styles.card, styles.cardAvoid]}>
                <Text style={styles.cardTitle}>Profiles to avoid</Text>
                <Text style={styles.cardSub}>
                  Compounds frequent in your Disliked and Hated sessions
                </Text>
                {insights.avoid.coaCount === 0 ? (
                  <Text style={styles.absent}>No Disliked or Hated sessions yet.</Text>
                ) : (
                  <>
                    <TerpeneRows profile={insights.avoid} />
                    <FactLine profile={insights.avoid} />
                    <Text style={styles.explainer}>
                      Reported values of batches you rated Disliked or Hated. Same facts,
                      other direction — worth a pause when a menu matches.
                    </Text>
                  </>
                )}
              </View>

              {/* The kept preference summary (distribution + effects line). */}
              <PreferenceSummary {...data.summary} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Counter view (D142): full-screen inverted, large type, no
          brightness claim until D143 ships the module. */}
      <Modal
        visible={counterOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setCounterOpen(false)}>
        <View style={[styles.counterRoot, { paddingTop: insets.top }]}>
          <View style={styles.counterHeader}>
            <Text style={styles.counterWordmark}>CULTIVAR</Text>
            <Pressable
              onPress={() => setCounterOpen(false)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close counter view"
              style={styles.counterClose}>
              <Text style={styles.counterCloseText}>Close</Text>
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={[
              styles.counterScroll,
              { paddingBottom: insets.bottom + Space.section },
            ]}>
            <Text style={styles.counterLead}>I’m looking for…</Text>
            <View style={styles.counterTarget}>
              <Text style={styles.counterTargetLabel}>TARGET PROFILE</Text>
              {insights !== null && insights.target.coaCount > 0 ? (
                <>
                  {insights.target.terpenes.slice(0, 3).map((row) => (
                    <Text key={row.name} style={styles.counterTerpene}>
                      {row.name}
                    </Text>
                  ))}
                  {/* Share parity: the same three facts a recipient of the
                      Share text reads, ND stated, never omitted or zeroed. */}
                  <Text style={styles.counterFacts}>
                    {`THC ${rangeText(insights.target.thc)} · CBD ${rangeText(
                      insights.target.cbd
                    )} · terps ${rangeText(insights.target.totalTerpenes)}`}
                  </Text>
                </>
              ) : (
                <Text style={styles.counterFacts}>No Loved sessions yet.</Text>
              )}
            </View>
            <Text style={styles.counterSectionLabel}>BUY AGAIN</Text>
            {insights !== null && insights.buyAgain.length > 0 ? (
              insights.buyAgain.map((row) => (
                <View key={row.coaId} style={styles.counterCard}>
                  <Text style={styles.counterStrain}>
                    {row.strain?.trim() || 'Strain not reported'}
                  </Text>
                  {row.brand?.trim() ? (
                    <Text style={styles.counterBrand}>{row.brand.trim()}</Text>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={styles.counterEmpty}>No buy-again picks yet.</Text>
            )}
          </ScrollView>
        </View>
      </Modal>
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
  card: {
    backgroundColor: Dash.surface,
    borderRadius: Dash.radius.card,
    padding: Space.card,
    gap: Space.chip,
  },
  cardTarget: {
    borderWidth: 1,
    borderColor: 'rgba(126, 217, 155, 0.45)',
  },
  cardAvoid: {
    borderWidth: 1,
    borderColor: 'rgba(224, 104, 94, 0.45)',
  },
  cardTitle: {
    fontFamily: Type.family.bold,
    fontSize: 15,
    color: Dash.text,
  },
  cardSub: {
    fontFamily: Type.family.regular,
    fontSize: 11,
    color: Dash.textMuted,
  },
  label: {
    fontFamily: Type.family.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Dash.textMuted,
  },
  absent: {
    fontFamily: Type.family.regular,
    fontSize: 11.5,
    color: Dash.textFaint,
  },
  explainer: {
    fontFamily: Type.family.serifItalic,
    fontSize: 12.5,
    color: Dash.textMuted,
  },
  terpeneRows: {
    gap: Space.chip,
  },
  terpeneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.chip,
  },
  terpeneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  terpeneName: {
    fontFamily: Type.family.semibold,
    fontSize: 12,
    color: Dash.text,
    width: 118,
  },
  terpeneBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Dash.surface2,
    overflow: 'hidden',
  },
  terpeneBarFill: {
    height: 6,
    borderRadius: 3,
  },
  terpeneRange: {
    fontFamily: Type.family.medium,
    fontSize: 11.5,
    color: Dash.textBody,
    minWidth: 66,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  factLine: {
    flexDirection: 'row',
    gap: Space.section,
  },
  factItem: {
    fontFamily: Type.family.semibold,
    fontSize: 12.5,
    color: Dash.text,
    fontVariant: ['tabular-nums'],
  },
  factLabel: {
    color: Dash.textMuted,
  },
  buyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buyActions: {
    flexDirection: 'row',
    gap: Space.chip,
  },
  actionChip: {
    backgroundColor: Dash.surface2,
    borderRadius: Dash.radius.pill,
    paddingHorizontal: Space.row,
    paddingVertical: 6,
  },
  actionChipText: {
    fontFamily: Type.family.semibold,
    fontSize: 11.5,
    color: Dash.text,
  },
  buyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Space.chip,
    paddingVertical: Space.inline,
  },
  buyRowMain: {
    flex: 1,
    gap: 2,
  },
  buyStrain: {
    fontFamily: Type.family.bold,
    fontSize: 14,
    color: Dash.text,
  },
  buyBrand: {
    fontFamily: Type.family.regular,
    fontSize: 11.5,
    color: Dash.textMuted,
  },
  buyStats: {
    fontFamily: Type.family.regular,
    fontSize: 11,
    color: Dash.textBody,
    fontVariant: ['tabular-nums'],
  },
  buyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  stateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stateText: {
    fontFamily: Type.family.medium,
    fontSize: 10.5,
    color: Dash.textFaint,
  },
  stateTextActive: {
    color: Dash.accent,
  },
  counterRoot: {
    flex: 1,
    backgroundColor: Dash.text,
  },
  counterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Space.gutter,
    paddingTop: Space.chip,
  },
  counterWordmark: {
    fontFamily: Type.family.bold,
    fontSize: 12,
    letterSpacing: 3,
    color: '#2E7D4F',
  },
  counterClose: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: Dash.radius.pill,
    paddingHorizontal: Space.card,
    paddingVertical: 8,
  },
  counterCloseText: {
    fontFamily: Type.family.semibold,
    fontSize: 14,
    color: Dash.bg,
  },
  counterScroll: {
    paddingHorizontal: Space.gutter,
    paddingTop: Space.section,
    paddingBottom: Space.section,
    gap: Space.row,
  },
  counterLead: {
    fontFamily: Type.family.display,
    fontSize: 22,
    color: Dash.bg,
  },
  counterTarget: {
    backgroundColor: Dash.bg,
    borderRadius: Dash.radius.card,
    padding: Space.section,
    gap: Space.chip,
  },
  counterTargetLabel: {
    fontFamily: Type.family.bold,
    fontSize: 11,
    letterSpacing: 2,
    color: Dash.accent,
  },
  counterTerpene: {
    fontFamily: Type.family.display,
    fontSize: 30,
    lineHeight: 34,
    color: Dash.text,
  },
  counterFacts: {
    fontFamily: Type.family.semibold,
    fontSize: 17,
    color: Dash.textBody,
    fontVariant: ['tabular-nums'],
  },
  counterSectionLabel: {
    fontFamily: Type.family.bold,
    fontSize: 11,
    letterSpacing: 2,
    color: '#2E7D4F',
    marginTop: Space.chip,
  },
  counterCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: Dash.radius.card,
    padding: Space.card,
    gap: 2,
  },
  counterStrain: {
    fontFamily: Type.family.display,
    fontSize: 22,
    color: Dash.bg,
  },
  counterBrand: {
    fontFamily: Type.family.medium,
    fontSize: 14,
    color: 'rgba(11, 15, 12, 0.6)',
  },
  counterEmpty: {
    fontFamily: Type.family.regular,
    fontSize: 14,
    color: 'rgba(11, 15, 12, 0.55)',
  },
});
