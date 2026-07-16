import { uuid } from 'expo-modules-core';
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
import { INTENTS, LEXICON_VERSION, RUNGS } from '@/lib/lexicon';
import { supabase } from '@/lib/supabase';

// Rung order is the lexicon's (D51): up = better, best word at the top,
// "Meh" at dead center. Words and scores resolve through the one source.
const RUNG_WORDS = RUNGS.map((rung) => rung.word);
const RUNG_COUNT = RUNGS.length;

// Feel values (provisional by design — the physical-iPhone gate tunes
// these, not this file): how hard the card magnetizes toward the active
// rung, how far the active word swells, and the settle spring.
const MAGNET_PULL = 0.35;
const SWELL_SCALE = 1.4;
const SPRING = { damping: 18, stiffness: 180 };

// ~10s client abort (D54): a hung insert fails visibly instead of holding
// the surface's dismissal guard forever.
const INSERT_TIMEOUT_MS = 10000;

// The card chip renders identity; the insert needs the id (coa_id).
type LadderCoa = {
  id: string;
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
 * The session-logging surface (D49-D51 mechanic, D54-D57 persistence and
 * chip row): the vertical ladder. A drop on a rung is the save attempt —
 * it inserts a session entry immediately and the card renders pending
 * until the insert confirms (D54). A re-drag inserts a revision row into
 * the same chain (D52); a failed revision reverts to the last confirmed
 * truth (D55). The intent chip row fades in only on confirmed insert —
 * it IS the success indicator (D54): seven uniform chips (D56); a
 * different chip revises with word + score carried forward, re-tapping
 * the confirmed chip is a no-op (D57).
 */
export function SessionLadder({
  coa,
  onClose,
  onBusyChange,
}: {
  coa: LadderCoa;
  onClose: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const theme = useTheme();
  // One in-flight insert at a time (D54): drives the pending visual and
  // disables new drags and both dismissal paths — the Close button here,
  // onRequestClose in the owner via onBusyChange.
  const [inFlight, setInFlight] = useState(false);
  // Plain inline error (D54), rendered in the home-zone slot the spike's
  // honesty label occupied; cleared on the next drag start.
  const [saveError, setSaveError] = useState<string | null>(null);

  // The chain key (D52): minted lazily at the first drop of this
  // presentation and held for its lifetime. A failed insert does NOT
  // discard it — a retry lands in the same chain, which is what makes
  // D54's duplicate-on-retry absorption true. A home-zone cancel before
  // any drop mints nothing. State, not a ref: the gesture closures that
  // reach it are recreated every render, and react-hooks/refs bars ref
  // reads inside them; one-in-flight (D54) guarantees a re-render between
  // inserts, so the captured value is never stale.
  const [sessionId, setSessionId] = useState<string | null>(null);
  // Last confirmed entry (D55): the revert target when a revision fails,
  // and the snapshot a chip tap copies word + score from (D57). Its
  // intent is null until a chip tap confirms (entry 1 sends none, D48).
  // State for the same reason as sessionId.
  const [lastConfirmed, setLastConfirmed] = useState<{
    index: number;
    word: string;
    score: number;
    intent: string | null;
  } | null>(null);
  // The chip whose revision insert is on the wire (D54): renders
  // pending-selected. Cleared on resolution either way — on failure the
  // selection falls back to lastConfirmed.intent by derivation, which is
  // exactly D55's revert.
  const [pendingIntent, setPendingIntent] = useState<string | null>(null);

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

  // Rung index -> card translation offset, shared by the worklet settle
  // path and the JS-side failure revert (same math, one source).
  const rungOffset = (index: number) => {
    'worklet';
    const rungHeight = rungRegionHeight.value / RUNG_COUNT;
    return rungTop.value + (index + 0.5) * rungHeight - restCenterY.value;
  };

  const clearSaveError = () => setSaveError(null);

  // The save attempt (D54): every path is the same insert — same chain,
  // full snapshot (D52). A drop sends its rung with the confirmed intent
  // carried forward; a chip tap sends the confirmed word + score with the
  // tapped chip (D57). Only a failed DROP moves the card (D55) — a failed
  // chip tap reverts selection only.
  const insertEntry = (
    snapshot: { index: number; word: string; score: number; intent: string | null },
    source: 'drop' | 'chip'
  ) => {
    const chainId = sessionId ?? uuid.v4();
    if (sessionId === null) {
      setSessionId(chainId);
    }
    setSaveError(null);
    setInFlight(true);
    if (source === 'chip') {
      setPendingIntent(snapshot.intent);
    }
    onBusyChange(true);

    // Hermes has no AbortSignal.timeout; compose abort from a timer.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), INSERT_TIMEOUT_MS);

    const finish = (failed: boolean) => {
      clearTimeout(timer);
      setInFlight(false);
      setPendingIntent(null);
      onBusyChange(false);
      if (!failed) {
        setLastConfirmed(snapshot);
        return;
      }
      setSaveError("Couldn't save — check your connection.");
      if (source === 'chip') {
        // A failed chip tap never moves the card (D55): clearing the
        // pending chip already reverted the selection to the last
        // confirmed intent.
        return;
      }
      if (lastConfirmed !== null) {
        // D55: back to the last CONFIRMED rung, never the home zone —
        // the last confirmed entry is the truth, and the card lands on it.
        activeRung.value = lastConfirmed.index;
        tx.value = withSpring(0, SPRING);
        ty.value = withSpring(rungOffset(lastConfirmed.index), SPRING);
      } else {
        // Nothing confirmed yet: back to the home zone (D54). Retry is
        // simply re-dropping.
        activeRung.value = -1;
        tx.value = withSpring(0, SPRING);
        ty.value = withSpring(0, SPRING);
      }
    };

    // created_by and deleted are server defaults, never sent; fit /
    // context / co_alcohol stay unsent (null, D48) — intent is the only
    // fact-class field this surface writes.
    supabase
      .from('session_entries')
      .insert({
        session_id: chainId,
        coa_id: coa.id,
        lexicon_version: LEXICON_VERSION,
        overall_word: snapshot.word,
        overall_score: snapshot.score,
        intent: snapshot.intent,
      })
      .abortSignal(controller.signal)
      .then(
        ({ error: insertError }) => finish(insertError !== null),
        // postgrest-js reports fetch failures (abort included) as
        // { error }; this rejection arm is the guarantee that the
        // in-flight guards always release regardless.
        () => finish(true)
      );
  };

  // Rung settle (drop or re-drag): the intent is carried forward from the
  // last confirmed entry — a re-drag after a chip tap must not silently
  // null it; entry 1 sends null (D48 — unanswered is not an answer).
  const settleOnRung = (index: number) => {
    const rung = RUNGS[index];
    insertEntry(
      {
        index,
        word: rung.word,
        score: rung.score,
        intent: lastConfirmed === null ? null : lastConfirmed.intent,
      },
      'drop'
    );
  };

  // Chip tap (D57): a revision insert copying word + score from the last
  // confirmed entry. Re-tapping the confirmed chip is a no-op — an
  // identical row carries zero information.
  const tapChip = (chip: string) => {
    if (lastConfirmed === null || chip === lastConfirmed.intent) {
      return;
    }
    insertEntry(
      {
        index: lastConfirmed.index,
        word: lastConfirmed.word,
        score: lastConfirmed.score,
        intent: chip,
      },
      'chip'
    );
  };

  const pan = Gesture.Pan()
    // No new drag while an insert is on the wire (D54).
    .enabled(!inFlight)
    .onStart(() => {
      // Re-dragging works indefinitely (D50): each drag starts from
      // wherever the card currently sits, home or rung.
      startX.value = tx.value;
      startY.value = ty.value;
      runOnJS(clearSaveError)();
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
        // Release anywhere above home = snap to nearest rung, and the
        // drop is the save attempt (D50/D54): the insert fires now.
        ty.value = withSpring(rungOffset(activeRung.value), SPRING);
        tx.value = withSpring(0, SPRING);
        runOnJS(settleOnRung)(activeRung.value);
      } else {
        tx.value = withSpring(0, SPRING);
        ty.value = withSpring(0, SPRING);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    // Magnetize (D51): while a rung is active the card is pulled a
    // fraction of the way toward that rung's center, so the pending
    // answer is unmissable before release.
    let pull = 0;
    if (activeRung.value >= 0 && rungRegionHeight.value > 0) {
      pull = (rungOffset(activeRung.value) - ty.value) * MAGNET_PULL;
    }
    return { transform: [{ translateX: tx.value }, { translateY: ty.value + pull }] };
  });

  // The chip row fades in only on confirmed insert (D54) — it IS the
  // success indicator. It stays mounted, opacity-hidden, so its
  // appearance never reflows the rung geometry the settled card is
  // parked against.
  const chipRowStyle = useAnimatedStyle(() => ({
    opacity: withTiming(lastConfirmed !== null ? 1 : 0, { duration: 200 }),
  }));

  // Single-select (D48): the pending chip while one is on the wire,
  // the last confirmed intent otherwise — so a failed tap reverts by
  // derivation (D55).
  const selectedIntent = pendingIntent ?? (lastConfirmed === null ? null : lastConfirmed.intent);

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
            sibling. The vacated slot carries the inline save error when
            an insert fails (D54). */}
        <View
          style={[styles.homeZone, { backgroundColor: theme.backgroundSelected }]}
          onLayout={onHomeLayout}>
          {saveError !== null && (
            <View style={styles.notice} pointerEvents="none">
              <ThemedText type="small">{saveError}</ThemedText>
            </View>
          )}
          <GestureDetector gesture={pan}>
            <Animated.View
              style={[
                styles.cardChip,
                { backgroundColor: theme.backgroundElement },
                // Pending until confirmed (D54): translucent while a
                // DROP insert is on the wire (a chip revision's pending
                // visual is the chip's, not the card's), solid on
                // confirmation. Feel is gate-tuned.
                inFlight && pendingIntent === null && styles.cardPending,
                cardStyle,
              ]}>
              <ThemedText type="smallBold">{coa.strain}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {coa.brand}
              </ThemedText>
            </Animated.View>
          </GestureDetector>
        </View>

        {/* The intent chip row (D56): seven uniform chips, seed-list
            order, none promoted — no default exists until onboarding
            ships, and faking one would encode a choice the user never
            made. A fixed layout sibling below the home zone; hidden by
            opacity, so the ladder's geometry is identical before and
            after it appears. */}
        <Animated.View
          style={[styles.chipSection, chipRowStyle]}
          pointerEvents={lastConfirmed !== null ? 'auto' : 'none'}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.chipQuestion}>
            What was this for?
          </ThemedText>
          <View style={styles.chipRow}>
            {INTENTS.map((chip) => {
              // Selected = full inversion (text token as fill, background
              // token as label): the strongest contrast the existing
              // tokens offer. backgroundSelected vs backgroundElement is
              // imperceptible at arm's length in dark mode (gate
              // finding). Same dimensions in every state (D56: uniform,
              // none promoted).
              const selected = chip === selectedIntent;
              return (
                <Pressable
                  key={chip}
                  // Disabled while any insert is on the wire (D54).
                  disabled={inFlight}
                  onPress={() => tapChip(chip)}
                  style={[
                    styles.chip,
                    { backgroundColor: selected ? theme.text : theme.backgroundElement },
                    // Pending-selected while this chip's revision is on
                    // the wire (D54): the selected treatment at the
                    // card's pending opacity; settles on confirm.
                    chip === pendingIntent && styles.chipPending,
                  ]}>
                  <ThemedText type="small" style={selected ? { color: theme.background } : undefined}>
                    {chip}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Dismissal is disabled while an insert is in flight (D54). */}
        <Pressable
          disabled={inFlight}
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
  cardPending: {
    opacity: 0.5,
  },
  chipSection: {
    gap: Spacing.one,
  },
  chipQuestion: {
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.four,
  },
  chipPending: {
    opacity: 0.5,
  },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
});
