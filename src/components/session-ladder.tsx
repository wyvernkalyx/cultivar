import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// The overall scale, exact strings from the scoring lexicon (D46). Rung
// order is fixed by the metaphor (D51): up = better, the shelf rehearsed —
// best word at the top, "Meh" at dead center.
const RUNG_WORDS = ['I loved it', 'Yes', 'Meh', 'No', 'I hated it'] as const;
const RUNG_COUNT = RUNG_WORDS.length;

// Feel values (provisional by design — the physical-iPhone gate tunes
// these, not this file): how hard the card magnetizes toward the active
// rung, how far the active word swells, and the settle spring.
const MAGNET_PULL = 0.35;
const SWELL_SCALE = 1.4;
const SPRING = { damping: 18, stiffness: 180 };

// The chip renders the row it logs against; the spike needs identity only.
type LadderCoa = {
  strain: string | null;
  brand: string | null;
};

// One rung: the word swells while it is the pending answer. Emphasis is
// scale only — typographic, never color; the mood visual language belongs
// to the art pass (session-logging doc non-goal).
function Rung({
  word,
  index,
  activeRung,
}: {
  word: string;
  index: number;
  activeRung: SharedValue<number>;
}) {
  const swell = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(activeRung.value === index ? SWELL_SCALE : 1, { duration: 120 }) },
    ],
  }));
  return (
    <View style={styles.rung}>
      <Animated.View style={swell}>
        <ThemedText>{word}</ThemedText>
      </Animated.View>
    </View>
  );
}

/**
 * The session-logging spike (slice 1 of the session-logging doc, D50/D51):
 * the vertical ladder, live for the drag-vs-tap gate. Persists nothing by
 * design — there is no save path, absent, not stubbed — and the surface
 * says so plainly on every settle. No chip row, no intent: later slices.
 */
export function SessionLadder({ coa, onClose }: { coa: LadderCoa; onClose: () => void }) {
  const theme = useTheme();
  // The honesty label, not a success toast: shown on settle, cleared when
  // the card returns home.
  const [settled, setSettled] = useState(false);

  // Card offset from its home-zone resting position.
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  // Nearest rung while the card is above the home zone; -1 = none.
  const activeRung = useSharedValue(-1);
  // Frames in content-column coordinates: the rung region and the home
  // zone are siblings of the same column, so their onLayout frames share
  // an origin and the card's translation maps between them directly.
  const rungTop = useSharedValue(0);
  const rungRegionHeight = useSharedValue(0);
  const homeTop = useSharedValue(0);
  const restCenterY = useSharedValue(0);

  const onRungRegionLayout = (event: LayoutChangeEvent) => {
    rungTop.value = event.nativeEvent.layout.y;
    rungRegionHeight.value = event.nativeEvent.layout.height;
  };
  const onHomeLayout = (event: LayoutChangeEvent) => {
    homeTop.value = event.nativeEvent.layout.y;
    // The card rests centered in the home zone.
    restCenterY.value = event.nativeEvent.layout.y + event.nativeEvent.layout.height / 2;
  };

  const showNotice = () => setSettled(true);
  const clearNotice = () => setSettled(false);

  const pan = Gesture.Pan()
    .onStart(() => {
      // Re-dragging works indefinitely (D50): each drag starts from
      // wherever the card currently sits, home or rung.
      startX.value = tx.value;
      startY.value = ty.value;
    })
    .onUpdate((event) => {
      tx.value = startX.value + event.translationX;
      ty.value = startY.value + event.translationY;
      const centerY = restCenterY.value + ty.value;
      // In or below the home zone there is no pending answer — the
      // geometry is the cancel (D51). Above it, the nearest rung is
      // always active: no dead zones between rungs.
      if (rungRegionHeight.value > 0 && centerY < homeTop.value) {
        const rungHeight = rungRegionHeight.value / RUNG_COUNT;
        const index = Math.floor((centerY - rungTop.value) / rungHeight);
        activeRung.value = Math.min(RUNG_COUNT - 1, Math.max(0, index));
      } else {
        activeRung.value = -1;
      }
    })
    .onEnd(() => {
      if (activeRung.value >= 0) {
        // Release anywhere above home = snap to nearest rung. In the
        // shipped mechanic this drop is the save (D50); the spike has no
        // save path, and the notice says so.
        const rungHeight = rungRegionHeight.value / RUNG_COUNT;
        const target =
          rungTop.value + (activeRung.value + 0.5) * rungHeight - restCenterY.value;
        ty.value = withSpring(target, SPRING);
        tx.value = withSpring(0, SPRING);
        runOnJS(showNotice)();
      } else {
        tx.value = withSpring(0, SPRING);
        ty.value = withSpring(0, SPRING);
        runOnJS(clearNotice)();
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    // Magnetize (D51): while a rung is active the card is pulled a
    // fraction of the way toward that rung's center, so the pending
    // answer is unmissable before release.
    let pull = 0;
    if (activeRung.value >= 0 && rungRegionHeight.value > 0) {
      const rungHeight = rungRegionHeight.value / RUNG_COUNT;
      const target = rungTop.value + (activeRung.value + 0.5) * rungHeight - restCenterY.value;
      pull = (target - ty.value) * MAGNET_PULL;
    }
    return { transform: [{ translateX: tx.value }, { translateY: ty.value + pull }] };
  });

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.rungRegion} onLayout={onRungRegionLayout}>
          {RUNG_WORDS.map((word, index) => (
            <Rung key={word} word={word} index={index} activeRung={activeRung} />
          ))}
        </View>

        {/* The home zone: the card's resting shelf and the cancel — the
            card renders above the rungs because this zone is the later
            sibling. When the card has settled on a rung, the vacated slot
            shows the honesty label. */}
        <View
          style={[styles.homeZone, { backgroundColor: theme.backgroundSelected }]}
          onLayout={onHomeLayout}>
          {settled && (
            <View style={styles.notice} pointerEvents="none">
              <ThemedText type="small">Spike build — nothing was saved.</ThemedText>
            </View>
          )}
          <GestureDetector gesture={pan}>
            <Animated.View
              style={[styles.cardChip, { backgroundColor: theme.backgroundElement }, cardStyle]}>
              <ThemedText type="smallBold">{coa.strain}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {coa.brand}
              </ThemedText>
            </Animated.View>
          </GestureDetector>
        </View>

        <Pressable
          onPress={onClose}
          style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="smallBold">Close</ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  rungRegion: {
    flex: 1,
  },
  rung: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeZone: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    minHeight: 96,
  },
  notice: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardChip: {
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
    minWidth: 180,
  },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
});
