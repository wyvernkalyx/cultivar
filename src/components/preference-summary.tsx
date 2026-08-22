import { StyleSheet, Text, View } from 'react-native';

import { Dash, Type } from '@/constants/theme';
import type { EffectCount } from '@/lib/card-data';
import { RUNGS } from '@/lib/lexicon';

// Font families registered app-wide in the root layout (D83 Decision 1),
// referenced by name exactly as session-ladder.tsx does; an unloaded family
// falls back to the system font rather than blocking the render. Sora 800 --
// the reference's display role -- was deferred out of slice 1 and registered
// in D99 for the shelf card's strain line; D109's header totals are this
// file's first consumer of it.
const SORA_DISPLAY = Type.family.display;
const SERIF_ITALIC = Type.family.serifItalic;

// The five rung words, one source (RUNGS in src/lib/lexicon.ts), never a
// second string table -- D62's rule, unchanged by D99's display supersession.
export type RungWord = (typeof RUNGS)[number]['word'];

export type PreferenceSummaryProps = {
  // All-time, session grain, including off-shelf history (D98).
  sessionCount: number;
  distribution: Record<RungWord, number>;
  buyAgainCount: number;
  // Session-derived, frequency-ranked (D133): the user's own recorded tags,
  // never a chemistry inference. Empty means no tagged sessions in scope,
  // and the line does not render -- never a placeholder.
  topEffects: EffectCount[];
};

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

// D151 (2026-08-21): the Loved-sessions module -- terpene-name chips and
// the THC/CBD range line -- is gone. Operator ruling: redundant with the
// Target profile card directly above it on Insights, and reductive (names
// without values). The per-product fingerprints (D150) carry that reading
// now. Its types, helpers, and styles left with it.

/**
 * The dashboard's preference summary (D98). Presentational: props in, nothing
 * fetched here -- the shelf list owns load(), so this refetches through the
 * existing D63 paths and grows no lifecycle of its own.
 */
export function PreferenceSummary({
  sessionCount,
  distribution,
  buyAgainCount,
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
      {/* D109's header row, D148's cut: the verdict distribution with the
          BUY AGAIN total to its right. The left flank's all-time session
          count left the card 2026-08-19 (D148) -- the Insights subtitle
          already states that number before the card is reached. The
          "Your preferences" eyebrow remains gone from this branch because
          the screen's own subtitle frames the card, and the standalone
          "Would buy again: N" line stays absorbed into the right flank.
          The empty branch above keeps its eyebrow: nothing frames a card
          that has no header row. */}
      <View style={styles.headerRow}>
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
    ...Type.role.label,
    color: Dash.textMuted,
  },
  empty: {
    ...Type.role.serif,
    color: Dash.textBody,
  },
  effectsLine: {
    fontFamily: SERIF_ITALIC,
    fontSize: 13,
    color: Dash.textBody,
  },
  headerRow: {
    flexDirection: 'row',
    // The bar row and the remaining flank end on the same line: each column
    // is bar-over-count or value-over-eyebrow, so bottom alignment is what
    // lines the eyebrow-register rows up (D148 removed the left flank; the
    // geometry rule is unchanged).
    alignItems: 'flex-end',
    gap: 12,
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
    // Takes the header row's left and middle; the flank is content-sized,
    // so the distribution absorbs whatever width its digits leave.
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
    ...Type.role.value,
    fontVariant: ['tabular-nums'],
    color: Dash.text,
    textAlign: 'center',
  },
  dimmed: {
    opacity: 0.15,
  },
});
