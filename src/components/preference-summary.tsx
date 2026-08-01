import { StyleSheet, Text, View } from 'react-native';

import { Dash } from '@/constants/theme';
import { RUNGS } from '@/lib/lexicon';

// Font families registered app-wide in the root layout (D83 Decision 1),
// referenced by name exactly as session-ladder.tsx does; an unloaded family
// falls back to the system font rather than blocking the render. Sora 800 --
// the reference's display role -- is not among the loaded weights, so it is
// deliberately unused here.
const SORA_REGULAR = 'Sora_400Regular';
const SORA_SEMIBOLD = 'Sora_600SemiBold';
const SORA_BOLD = 'Sora_700Bold';
const SERIF_ITALIC = 'Newsreader_400Regular_Italic';

// The five rung words, one source (RUNGS in src/lib/lexicon.ts), never a
// second string table -- D62's rule, unchanged by D99's display supersession.
export type RungWord = (typeof RUNGS)[number]['word'];

// A reported-values range plus the count of Loved COAs the lab did not report
// the analyte for. The D98 binding: ndCount is annotated ALONGSIDE the range,
// never folded into it as a zero lower bound.
export type AnalyteRange = { min: number; max: number; ndCount: number };

export type LovedConcentrations = {
  // Top 3 by concentration, already ranked; null pct rows are excluded
  // upstream, so every entry here is a reported value.
  terpenes: { name: string; pct: number }[];
  thc: AnalyteRange | null;
  cbd: AnalyteRange | null;
  lovedSessionCount: number;
};

export type PreferenceSummaryProps = {
  // All-time, session grain, including off-shelf history (D98).
  sessionCount: number;
  distribution: Record<RungWord, number>;
  buyAgainCount: number;
  loved: LovedConcentrations;
};

// Two decimals, truncated (D102: truncation never rounds into a false
// precision claim). Done on the fixed-notation string rather than by
// multiply-and-trunc, because `Math.trunc(8.29 * 100) / 100` is 8.28 -- the
// float product lands just below the integer and the artifact reads as a
// different lab value.
function truncate2(value: number): string {
  const fixed = value.toFixed(10);
  return fixed.slice(0, fixed.indexOf('.') + 3);
}

// A range whose ends coincide is one value, not a range of width zero.
function formatRange(range: AnalyteRange): string {
  const span =
    range.min === range.max
      ? `${truncate2(range.min)}%`
      : `${truncate2(range.min)}% – ${truncate2(range.max)}%`;
  return range.ndCount > 0 ? `${span} · ${range.ndCount} ND` : span;
}

// Identity only, consistent per terpene, no meaning (D99). An unlisted lab
// name gets the muted text color rather than an invented hue.
function terpeneHue(name: string): string {
  const hues = Dash.terpene as Record<string, string>;
  return hues[name.toLowerCase()] ?? Dash.textMuted;
}

const BAR_MAX_HEIGHT = 56;
const BAR_MIN_HEIGHT = 3;

// One rung column: the bar's height is proportional to its count against the
// tallest rung. A zero-count rung is DIMMED, never hidden (D98) -- the shape
// of the distribution includes the verdicts that never happened.
function VerdictBar({ word, count, max }: { word: RungWord; count: number; max: number }) {
  const height =
    count === 0 || max === 0
      ? BAR_MIN_HEIGHT
      : Math.max(BAR_MIN_HEIGHT, Math.round((count / max) * BAR_MAX_HEIGHT));
  return (
    <View style={styles.barColumn}>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.bar,
            { height, backgroundColor: Dash.verdict[word], opacity: count === 0 ? 0.15 : 1 },
          ]}
        />
      </View>
      <Text style={[styles.barCount, count === 0 && styles.dimmed]}>{count}</Text>
      <Text style={[styles.barWord, count === 0 && styles.dimmed]}>{word}</Text>
    </View>
  );
}

// The Loved-sessions module: lab concentrations only, and labeled as such.
// Never an effect claim, never a population-level assertion -- this reports
// what the labs measured in the COAs behind this user's own Loved verdicts.
function LovedModule({ loved }: { loved: LovedConcentrations }) {
  if (loved.lovedSessionCount === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.label}>In Loved sessions · lab concentrations only</Text>
        <Text style={styles.muted}>No Loved sessions yet.</Text>
      </View>
    );
  }
  return (
    <View style={styles.section}>
      <Text style={styles.label}>In Loved sessions · lab concentrations only</Text>
      {loved.terpenes.length > 0 && (
        <View style={styles.chipRow}>
          {loved.terpenes.map((terpene) => (
            <View key={terpene.name} style={styles.chip}>
              <View style={[styles.chipDot, { backgroundColor: terpeneHue(terpene.name) }]} />
              <Text style={styles.chipText}>{terpene.name}</Text>
              <Text style={styles.chipValue}>{`${truncate2(terpene.pct)}%`}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.analyteRow}>
        {/* ND is first-class: a null range is every Loved COA's lab not
            reporting the analyte, and it renders the literal "ND" on the
            same grounds the shelf card's totals do -- never 0, never blank. */}
        <View style={styles.analyte}>
          <Text style={styles.analyteLabel}>THC</Text>
          <Text style={styles.analyteValue}>{loved.thc === null ? 'ND' : formatRange(loved.thc)}</Text>
        </View>
        <View style={styles.analyte}>
          <Text style={styles.analyteLabel}>CBD</Text>
          <Text style={styles.analyteValue}>{loved.cbd === null ? 'ND' : formatRange(loved.cbd)}</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * The dashboard's preference summary (D98). Presentational: props in, nothing
 * fetched here -- the shelf list owns load(), so this refetches through the
 * existing D63 paths and grows no lifecycle of its own.
 */
export function PreferenceSummary({
  sessionCount,
  distribution,
  buyAgainCount,
  loved,
}: PreferenceSummaryProps) {
  // Zero sessions renders the frame, not fake content (D98): no bars, no
  // zeros, no placeholder stats -- an honest empty state and nothing else.
  if (sessionCount === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.label}>Your preferences</Text>
        <Text style={styles.empty}>
          No sessions logged yet. Verdicts will build your picture here.
        </Text>
      </View>
    );
  }

  const counts = RUNGS.map((rung) => distribution[rung.word]);
  const max = counts.reduce((highest, count) => (count > highest ? count : highest), 0);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Your preferences</Text>
      <Text style={styles.countLine}>
        {`${sessionCount} ${sessionCount === 1 ? 'session' : 'sessions'} logged, on and off the shelf.`}
      </Text>
      {/* RUNGS order, top rung first -- the fixed green->red band identity. */}
      <View style={styles.barRow}>
        {RUNGS.map((rung) => (
          <VerdictBar
            key={rung.word}
            word={rung.word}
            count={distribution[rung.word]}
            max={max}
          />
        ))}
      </View>
      <Text style={styles.buyAgain}>{`Would buy again: ${buyAgainCount}`}</Text>
      <LovedModule loved={loved} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Dash.surface,
    borderRadius: Dash.radius.card,
    padding: 16,
    gap: 12,
  },
  label: {
    fontFamily: SORA_BOLD,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Dash.textMuted,
  },
  empty: {
    fontFamily: SERIF_ITALIC,
    fontSize: 14.5,
    color: Dash.textBody,
  },
  countLine: {
    fontFamily: SERIF_ITALIC,
    fontSize: 14.5,
    color: Dash.textBody,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'stretch',
    gap: 4,
  },
  barTrack: {
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: Dash.radius.badge,
  },
  barCount: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 11.5,
    fontVariant: ['tabular-nums'],
    color: Dash.text,
    textAlign: 'center',
  },
  barWord: {
    fontFamily: SORA_REGULAR,
    fontSize: 9,
    color: Dash.textFaint,
    textAlign: 'center',
  },
  dimmed: {
    opacity: 0.15,
  },
  buyAgain: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 11.5,
    fontVariant: ['tabular-nums'],
    color: Dash.textBody,
  },
  section: {
    gap: 8,
    backgroundColor: Dash.surface2,
    borderRadius: Dash.radius.row,
    padding: 12,
  },
  muted: {
    fontFamily: SORA_REGULAR,
    fontSize: 11.5,
    color: Dash.textMuted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Dash.bg,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontFamily: SORA_REGULAR,
    fontSize: 11.5,
    color: Dash.textBody,
  },
  chipValue: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 11.5,
    fontVariant: ['tabular-nums'],
    color: Dash.text,
  },
  analyteRow: {
    flexDirection: 'row',
    gap: 16,
  },
  analyte: {
    gap: 2,
  },
  analyteLabel: {
    fontFamily: SORA_BOLD,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Dash.textFaint,
  },
  analyteValue: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 11.5,
    fontVariant: ['tabular-nums'],
    color: Dash.text,
  },
});
