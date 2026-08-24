import * as Brightness from 'expo-brightness';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PreferenceSummary } from '@/components/preference-summary';
import { Fingerprint } from '@/components/shelf-card';
import { BottomTabInset, Dash, MaxContentWidth, Space, Type } from '@/constants/theme';
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
// view pins screen brightness while it is open (D143, landed with the
// native module). The pin is behavior only: the reference specifies no
// on-screen line about it, so none renders.
//
// Personal-empirical discipline (D142, restated where most at risk): every
// number is a reported lab value on products this user rated. No copy on
// this screen may claim or imply a compound causes an effect.

const RANGE_ABSENT = 'ND';

function rangeText(range: AnalyteRange | null): string {
  return formatRangePct(range) ?? RANGE_ABSENT;
}

// D150: one fingerprint per product. Each entry is a product this user
// actually rated -- strain, brand, and the shelf card's own track + legend
// over that product's top-3 reported terpenes. Nothing is pooled across
// products: a blended bar would show a profile no lab measured. Three
// cases, each stated as what it is (device-gate finding 2026-08-21, a
// manual COA with nine reported terpenes and no total): reported rows and
// a total draw the track; reported rows without a total show the legend
// alone (Fingerprint omits the track when total is null); zero reported
// rows say so in words, never as an empty track.
function ProfileProducts({ profile }: { profile: ChemistryProfile }) {
  return (
    <View style={styles.productList}>
      {profile.products.map((product) => {
        const hasReported = product.topTerpenes.length > 0;
        return (
          <View key={product.coaId} style={styles.product}>
            <Text style={styles.productStrain} numberOfLines={1} ellipsizeMode="tail">
              {product.strain?.trim() || 'Strain not reported'}
            </Text>
            {product.brand?.trim() ? (
              <Text style={styles.productBrand} numberOfLines={1} ellipsizeMode="tail">
                {product.brand.trim()}
              </Text>
            ) : null}
            {hasReported ? (
              <Fingerprint
                total={
                  product.totalTerpenes !== null && product.totalTerpenes > 0
                    ? product.totalTerpenes
                    : null
                }
                terpenes={product.topTerpenes}
              />
            ) : (
              <Text style={styles.productNoData}>No reported terpene data</Text>
            )}
          </View>
        );
      })}
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

  // The Counter view's brightness pin (D143). The modal has no lifecycle of
  // its own -- both close paths are one state flip -- so this effect is the
  // owner: it engages only while the counter is open and unwinds itself on
  // close, on unmount, and on backgrounding.
  //
  // Restore is by hand because iOS has no restore call and a pin there
  // persists until the device locks: the level in effect at open is captured
  // once and set back, and a re-pin on returning to the foreground reuses
  // that same captured level rather than re-reading a level we ourselves
  // pinned. If the capture fails there is nothing to restore to, so nothing
  // is pinned -- never take the screen somewhere we cannot put it back.
  //
  // Every call is failure-swallowed on purpose. Brightness is cosmetic; a
  // rejection here must never surface, retry, or take the Counter view down
  // with it.
  useEffect(() => {
    if (!counterOpen) return;
    let closed = false;
    let held: number | null = null;
    const pin = () => {
      if (held === null) return;
      void Brightness.setBrightnessAsync(1).catch(() => {});
    };
    const unpin = () => {
      if (held === null) return;
      void Brightness.setBrightnessAsync(held).catch(() => {});
    };
    void Brightness.getBrightnessAsync().then(
      (level) => {
        // A level that lands after the close is a level we must not act on.
        if (closed) return;
        held = level;
        pin();
      },
      () => {}
    );
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') pin();
      else unpin();
    });
    return () => {
      closed = true;
      subscription.remove();
      unpin();
    };
  }, [counterOpen]);

  const insights = data?.insights ?? null;
  const share = () => {
    if (insights === null) return;
    void Share.share({ message: buildShareText(insights) });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.wordmark}>KALYX</Text>
          <Text style={styles.title}>Insights</Text>
          {insights !== null && insights.sessionCount > 0 && (
            <Text style={styles.subtitle}>
              {`Based on ${insights.sessionCount} logged ${
                insights.sessionCount === 1 ? 'session' : 'sessions'
              } across ${insights.strainCount} ${
                insights.strainCount === 1 ? 'product' : 'products'
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
                  Based on products you rated Loved · lab concentrations only
                </Text>
                {insights.target.coaCount === 0 ? (
                  <Text style={styles.absent}>No Loved sessions yet.</Text>
                ) : (
                  <>
                    <ProfileProducts profile={insights.target} />
                    <Text style={styles.explainer}>
                      What the lab found in each product you rated Loved. No effect claims
                      — just what was in them.
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
                  Based on products you rated Disliked or Hated · lab concentrations only
                </Text>
                {insights.avoid.coaCount === 0 ? (
                  <Text style={styles.absent}>No Disliked or Hated sessions yet.</Text>
                ) : (
                  <>
                    <ProfileProducts profile={insights.avoid} />
                    <Text style={styles.explainer}>
                      What the lab found in each product you rated Disliked or Hated. Same
                      facts, other direction — worth a pause when a menu matches.
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

      {/* Counter view (D142): full-screen inverted, large type, its
          brightness pin owned by the effect above (D143). */}
      <Modal
        visible={counterOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setCounterOpen(false)}>
        <View style={[styles.counterRoot, { paddingTop: insets.top }]}>
          <View style={styles.counterHeader}>
            <Text style={styles.counterWordmark}>KALYX</Text>
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
    ...Type.role.display,
    color: Dash.text,
  },
  subtitle: {
    ...Type.role.serif,
    color: Dash.textBody,
  },
  messageBlock: {
    gap: Space.chip,
    paddingVertical: Space.section,
    alignItems: 'center',
  },
  errorText: {
    ...Type.role.body,
    color: Dash.textBody,
    textAlign: 'center',
  },
  retry: {
    ...Type.role.action,
    color: Dash.accent,
  },
  loading: {
    ...Type.role.body,
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
    ...Type.role.label,
    color: Dash.textMuted,
  },
  absent: {
    ...Type.role.body,
    color: Dash.textFaint,
  },
  explainer: {
    fontFamily: Type.family.serifItalic,
    fontSize: 12.5,
    color: Dash.textMuted,
  },
  productList: {
    gap: Space.row,
  },
  product: {
    gap: 2,
  },
  productStrain: {
    fontFamily: Type.family.semibold,
    fontSize: 12.5,
    color: Dash.text,
  },
  productBrand: {
    fontFamily: Type.family.regular,
    fontSize: 11,
    color: Dash.textMuted,
  },
  productNoData: {
    fontFamily: Type.family.regular,
    fontSize: 11,
    color: Dash.textFaint,
    marginTop: 4,
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
    ...Type.role.value,
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
    ...Type.role.body,
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
