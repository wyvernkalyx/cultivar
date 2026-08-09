import { StyleSheet, Text, View } from 'react-native';

import { Dash, Type, terpeneHue } from '@/constants/theme';
import type { EffectCount } from '@/lib/card-data';
import { RUNGS } from '@/lib/lexicon';

// Font families registered app-wide in the root layout (D83 Decision 1),
// referenced by name exactly as session-ladder.tsx does; an unloaded family
// falls back to the system font rather than blocking the render. Sora 800 --
// the reference's display role -- was deferred out of slice 1 and registered
// in D99 for the shelf card's strain line; D109's header totals are this
// file's first consumer of it.
const SORA_REGULAR = Type.family.regular;
const SORA_SEMIBOLD = Type.family.semibold;
const SORA_BOLD = Type.family.bold;
const SORA_DISPLAY = Type.family.display;
const SERIF_ITALIC = Type.family.serifItalic;

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
  // Session-derived, frequency-ranked (D133): the user's own recorded tags,
  // never a chemistry inference. Empty means no tagged sessions in scope,
  // and the line does not render -- never a placeholder.
  topEffects: EffectCount[];
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

// Mini bars (D109): the distribution shares the header row with the two
// totals, so the track is a third of its slice-1 height. barTrack reads the
// same constant, so the two never drift.
const BAR_MAX_HEIGHT = 30;
const BAR_MIN_HEIGHT = 3;

// One rung column: the bar's height is proportional to its count against the
// tallest rung. A zero-count rung is DIMMED, never hidden (D98) -- the shape
// of the distribution includes the verdicts that never happened. D109 drops
// the rung word; hue (Dash.verdict, fixed per rung) and the dimming carry
// rung identity, and the fixed top-rung-first order is unchanged.
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
            </View>
          ))}
        </View>
      )}
      {/* D109 collapses the two stacked analytes onto one line. The values
          are untouched: ND is first-class: a null range is every Loved COA's
          lab not reporting the analyte, and it renders the literal "ND" on
          the same grounds the shelf card's totals do -- never 0, never
          blank; and formatRange still annotates ndCount ALONGSIDE the
          reported range, never as a zero lower bound (D98's binding, which
          D109.1 restates against the mock's "ND-0.08%" defect). */}
      <View style={styles.analyteRow}>
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
  topEffects,
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
      {/* D109's header row, mock layout: the two all-time totals flank the
          distribution. The card opens on it -- the "Your preferences"
          eyebrow is gone from this branch because the screen's own subtitle
          now frames the card, and the standalone "Would buy again: N" line
          is absorbed into the right flank. The empty branch above keeps its
          eyebrow: nothing frames a card that has no header row. */}
      <View style={styles.headerRow}>
        <View style={styles.flank}>
          <Text style={styles.flankValue}>{sessionCount}</Text>
          <Text style={styles.label}>SESSIONS · ALL-TIME</Text>
        </View>
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
        <View style={styles.flankRight}>
          <Text style={styles.flankValue}>{buyAgainCount}</Text>
          <Text style={styles.label}>BUY AGAIN</Text>
        </View>
      </View>
      {/* The D133 summary line, register ratified b-2: the qualifier plus the
          top tags, exact stored strings, separator per the D132 line. Absent
          entirely when no session in scope carries tags. */}
      {topEffects.length > 0 && (
        <Text style={styles.effectsLine}>
          {`Often ${topEffects.map((effect) => effect.name).join(' \u00b7 ')}`}
        </Text>
      )}
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
  effectsLine: {
    fontFamily: SERIF_ITALIC,
    fontSize: 13,
    color: Dash.textBody,
  },
  headerRow: {
    flexDirection: 'row',
    // The two flanks and the bar row all end on the same line: each column
    // is value-over-eyebrow or bar-over-count, so bottom alignment is what
    // lines the three eyebrow-register rows up.
    alignItems: 'flex-end',
    gap: 12,
  },
  flank: {
    gap: 2,
  },
  flankRight: {
    gap: 2,
    alignItems: 'flex-end',
  },
  flankValue: {
    fontFamily: SORA_DISPLAY,
    fontSize: 26,
    lineHeight: 28,
    fontVariant: ['tabular-nums'],
    color: Dash.text,
  },
  barRow: {
    // Takes the header row's middle; the flanks are content-sized, so the
    // distribution absorbs whatever width their digits leave.
    flex: 1,
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
  dimmed: {
    opacity: 0.15,
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
  analyteRow: {
    flexDirection: 'row',
    // Wraps rather than truncates: a two-ended range with an ND annotation
    // on both analytes is longer than one narrow line, and a clipped lab
    // value is a misreported one.
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 14,
    rowGap: 4,
  },
  analyte: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
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
