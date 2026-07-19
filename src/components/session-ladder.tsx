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
import {
  CO_CONSUMPTION,
  ENERGY,
  ENVIRONMENT,
  FITS,
  LEXICON_VERSION,
  PHYSICAL_STATE,
  RUNGS,
  SPARK,
} from '@/lib/lexicon';
import { supabase } from '@/lib/supabase';

// Rung order is the lexicon's (D51): up = better, best word at the top,
// "Mid" at dead center. Words and scores resolve through the one source.
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

// The three intent axes (D71) as single-select chip rows, and the two
// multi-select panels (D75/D76) as toggle rows: `key` indexes the Snapshot
// field; `values` come from the one lexicon source. Labels are transitional
// copy — the wheel pass supersedes this surface (session-logging, banked).
type AxisKey = 'energy' | 'environment' | 'spark';
type PanelKey = 'co_consumption' | 'physical_state';
const AXES: { key: AxisKey; label: string; values: readonly string[] }[] = [
  { key: 'energy', label: 'Energy', values: ENERGY },
  { key: 'environment', label: 'Environment', values: ENVIRONMENT },
  { key: 'spark', label: 'Spark', values: SPARK },
];
const PANELS: { key: PanelKey; label: string; values: readonly string[] }[] = [
  { key: 'co_consumption', label: 'Anything else?', values: CO_CONSUMPTION },
  { key: 'physical_state', label: 'How were you starting out?', values: PHYSICAL_STATE },
];

// The card chip renders identity; the insert needs the id (coa_id).
type LadderCoa = {
  id: string;
  strain: string | null;
  brand: string | null;
};

// One entry's writable fields (D52 full snapshot): the rung answer plus
// every fact-class field. lastConfirmed holds exactly this shape, and every
// insert sends one — the fact fields ride along at their snapshot values.
// The two panels are string[] (D75/D76): presence-only, null when
// unanswered, never [] (D78).
type Snapshot = {
  index: number;
  word: string;
  score: number;
  energy: string | null;
  environment: string | null;
  spark: string | null;
  fit: string | null;
  co_consumption: string[] | null;
  physical_state: string[] | null;
};

// Which control fired the insert. Only a failed DROP moves the card (D55);
// every other source reverts by derivation when its pending state clears.
type InsertSource = 'drop' | 'axis' | 'fit' | 'panel';

// The D79 screen sequence: one screen renders at a time and the flow
// advances on insert CONFIRM (not on tap). Order: ladder -> energy ->
// environment -> spark -> fit (only when spark is answered, D73) ->
// closing -> panels (optional, off the required path). Plain conditional
// render; transition animation is banked to the art pass.
type Phase = 'ladder' | 'energy' | 'environment' | 'spark' | 'fit' | 'closing' | 'panels';

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

// One axis or fit screen (D79): a title, the values as full-width
// bottom-anchored pills in thumb reach, and a persistent first-class Skip
// no smaller than a pill. Tap-advance and Skip semantics live in the owner;
// this renders selection/pending state and the inline save error only. The
// chip visual grammar is reused wholesale — selected inverts (text token as
// fill), pending rides at the card's opacity (D57/D65).
function PillScreen({
  theme,
  title,
  values,
  selected,
  pendingValue,
  disabled,
  error,
  onSelect,
  onSkip,
  onBack,
}: {
  theme: ReturnType<typeof useTheme>;
  title: string;
  values: readonly string[];
  selected: string | null;
  pendingValue: string | null;
  disabled: boolean;
  error: string | null;
  onSelect: (value: string) => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.sequenceScreen}>
      <View style={styles.sequenceHeader}>
        <Pressable disabled={disabled} onPress={onBack} style={styles.backButton}>
          <ThemedText type="smallBold">Back</ThemedText>
        </Pressable>
        <ThemedText type="title" numberOfLines={1} adjustsFontSizeToFit style={styles.sequenceTitle}>
          {title}
        </ThemedText>
      </View>
      <View style={styles.pillStack}>
        {values.map((value) => {
          const isSelected = value === selected;
          const isPending = value === pendingValue;
          return (
            <Pressable
              key={value}
              // Disabled while any insert is on the wire (D54).
              disabled={disabled}
              onPress={() => onSelect(value)}
              style={[
                styles.pill,
                { backgroundColor: isSelected ? theme.text : theme.backgroundElement },
                isPending && styles.chipPending,
              ]}>
              <ThemedText
                type="default"
                style={isSelected ? { color: theme.background } : undefined}>
                {value}
              </ThemedText>
            </Pressable>
          );
        })}
        {error !== null && (
          <ThemedText type="small" style={styles.sequenceError}>
            {error}
          </ThemedText>
        )}
        {/* Skip is first-class (D79): a persistent pill, never smaller than
            an answer, that advances and writes nothing. */}
        <Pressable
          disabled={disabled}
          onPress={onSkip}
          style={[styles.pill, styles.skipPill, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="default" themeColor="textSecondary">
            Skip
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * The session-logging surface (D49-D51 mechanic, D54-D55 persistence, D70-D79
 * survey): the vertical ladder feeding a one-axis-per-screen sequence. A drop
 * on a rung is the save attempt — it inserts a session entry immediately and
 * the card renders pending until the insert confirms (D54). A re-drag inserts
 * a revision row into the same chain (D52); a failed revision reverts to the
 * last confirmed truth (D55). The vacated home-zone box echoes the settled
 * word (D58).
 *
 * On a confirmed drop the flow advances (D79) to the axis screens: Energy,
 * Environment, Spark, one per screen, each a full-snapshot revision insert
 * (D71) carrying the rest forward, with the advance firing on CONFIRM, not on
 * tap. Changing Spark nulls fit (D72); a first-class Skip advances and writes
 * nothing. Fit is its own screen shown only when Spark was answered (D73),
 * then a closing screen (Close plus an optional panels entry, off the
 * required path), then the two multi-select confound panels (co-consumption
 * D75, physical-state D76) as toggles (D78) that settle in place. Every write
 * rides the one insertEntry pipeline under the same D54/D55 grammar.
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
  // One in-flight insert at a time (D54): the source whose insert is on
  // the wire, null when idle. Drives the pending visuals (the card and
  // echo go translucent only for a DROP — every other source's pending
  // visual belongs to its own control) and disables new drags, every
  // tap, and both dismissal paths — the Close button here,
  // onRequestClose in the owner via onBusyChange.
  const [inFlightSource, setInFlightSource] = useState<InsertSource | null>(null);
  const inFlight = inFlightSource !== null;
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
  // and the snapshot every revision copies its carried fields from (D57,
  // D65, D78). Its fact-class fields are null until their answers confirm
  // (entry 1 sends all null). State for the same reason as sessionId.
  const [lastConfirmed, setLastConfirmed] = useState<Snapshot | null>(null);
  // The axis + value whose revision insert is on the wire (D54): renders
  // pending-selected. Cleared on resolution either way — on failure the
  // selection falls back to the last confirmed axis value by derivation,
  // which is exactly D55's revert.
  const [pendingAxis, setPendingAxis] = useState<{ axis: AxisKey; value: string } | null>(null);
  // The fit chip whose revision insert is on the wire (D65): the axis
  // chips' pending grammar reused wholesale — cleared on resolution either
  // way; on failure the selection falls back to lastConfirmed.fit by
  // derivation, which is exactly D55's revert.
  const [pendingFit, setPendingFit] = useState<string | null>(null);
  // The panel field + toggled value whose revision insert is on the wire,
  // plus the optimistic array it would store (D78): the toggled chip
  // renders pending and the panel shows the would-be selection. Cleared on
  // resolution either way; on failure the panel reverts to the last
  // confirmed array by derivation (D55).
  const [pendingPanel, setPendingPanel] = useState<{
    field: PanelKey;
    value: string;
    values: string[] | null;
  } | null>(null);
  // The answer echo (D58): the settled rung's word, displayed large in
  // the vacated home-zone box. Set on every rung settle; cleared when
  // the card returns home (cancel, or a failed FIRST drop); set to the
  // last confirmed word on a failed revision, because that is where the
  // card lands (D55). Survey taps never touch it, and it never tracks the
  // drag live — the swell is the mid-drag signal (D58, ratified).
  const [echoWord, setEchoWord] = useState<string | null>(null);
  // The surface's phase (D79): the current screen in the sequence. One
  // screen renders at a time; the ladder's state (shared values included)
  // lives up here and survives every screen change, so Back to the ladder
  // lands on the intact card-on-rung state.
  const [phase, setPhase] = useState<Phase>('ladder');

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
  // Home-zone release means no settled answer, so no echo (D58). A
  // runOnJS target: the releasing path is the gesture's worklet.
  const clearEcho = () => setEchoWord(null);

  // The D79 screen order. Spark decides whether fit is asked (D73): a
  // non-null spark inserts the fit screen before closing; a null spark
  // (the aimless session) advances straight to closing. Panels and closing
  // are terminals of the switch — they never auto-advance.
  const nextScreen = (current: Phase, sparkValue: string | null): Phase => {
    switch (current) {
      case 'ladder':
        return 'energy';
      case 'energy':
        return 'environment';
      case 'environment':
        return 'spark';
      case 'spark':
        return sparkValue !== null ? 'fit' : 'closing';
      case 'fit':
        return 'closing';
      default:
        return current;
    }
  };
  // Back is navigation only (D79): the linear predecessor. From closing it
  // is fit when spark was answered, spark otherwise; from panels it is the
  // closing screen.
  const backTarget = (current: Phase): Phase => {
    switch (current) {
      case 'energy':
        return 'ladder';
      case 'environment':
        return 'energy';
      case 'spark':
        return 'environment';
      case 'fit':
        return 'spark';
      case 'closing':
        return lastConfirmed !== null && lastConfirmed.spark !== null ? 'fit' : 'spark';
      case 'panels':
        return 'closing';
      default:
        return 'ladder';
    }
  };
  // Skip and re-selecting the confirmed value both advance without a write
  // (D79): the sequence moves on, the snapshot is untouched (Skip on an
  // answered axis leaves the value — axis deselection-to-null is banked).
  const advanceNoWrite = () => {
    setSaveError(null);
    setPhase((current) => nextScreen(current, lastConfirmed?.spark ?? null));
  };
  // Back affordance: navigation only, never a write, cleared error.
  const goBack = () => {
    setSaveError(null);
    setPhase((current) => backTarget(current));
  };

  // The save attempt (D54): every path is the same insert — same chain,
  // full snapshot (D52). A drop sends its rung with every fact-class
  // answer carried forward; an axis tap sends the confirmed word + score
  // with the one axis set (fit nulled iff Spark, D72); a fit tap or panel
  // toggle sends the confirmed snapshot with its one field changed
  // (D65/D78). Only a failed DROP moves the card (D55) — every other
  // failure reverts its own control's rendered state only.
  const insertEntry = (snapshot: Snapshot, source: InsertSource) => {
    const chainId = sessionId ?? uuid.v4();
    if (sessionId === null) {
      setSessionId(chainId);
    }
    setSaveError(null);
    setInFlightSource(source);
    if (source === 'fit') {
      setPendingFit(snapshot.fit);
    }
    onBusyChange(true);

    // Hermes has no AbortSignal.timeout; compose abort from a timer.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), INSERT_TIMEOUT_MS);

    const finish = (failed: boolean) => {
      clearTimeout(timer);
      setInFlightSource(null);
      setPendingAxis(null);
      setPendingFit(null);
      setPendingPanel(null);
      onBusyChange(false);
      if (!failed) {
        setLastConfirmed(snapshot);
        // Advance on CONFIRM, not on tap (D79): the write landed, so the
        // sequence moves forward. Spark's just-confirmed value decides the
        // fit branch. Panel toggles settle in place — nextScreen returns
        // the panels phase unchanged (it is a switch terminal).
        setPhase((current) => nextScreen(current, snapshot.spark));
        return;
      }
      setSaveError("Couldn't save — check your connection.");
      if (source !== 'drop') {
        // A failed axis, fit, or panel insert never moves the card or
        // touches the echo (D55): clearing its pending state already
        // reverted the rendered answer to the last confirmed value.
        return;
      }
      if (lastConfirmed !== null) {
        // D55: back to the last CONFIRMED rung, never the home zone —
        // the last confirmed entry is the truth, and the card lands on
        // it. The echo names that rung too (D58): the confirmed word,
        // sharing the box with the error.
        activeRung.value = lastConfirmed.index;
        setEchoWord(lastConfirmed.word);
        tx.value = withSpring(0, SPRING);
        ty.value = withSpring(rungOffset(lastConfirmed.index), SPRING);
      } else {
        // Nothing confirmed yet: back to the home zone (D54). Retry is
        // simply re-dropping. No answer, no echo (D58) — the error has
        // the box to itself.
        activeRung.value = -1;
        setEchoWord(null);
        tx.value = withSpring(0, SPRING);
        ty.value = withSpring(0, SPRING);
      }
    };

    // created_by and deleted are server defaults, never sent. Full
    // snapshot (D52): every fact-class field rides every insert at its
    // snapshot value — axes and panels carried forward on a rung drop, one
    // field changed on a revision (D57/D65/D78). On the lazy path every
    // fact field stays null (the overall word is the only mandatory field).
    supabase
      .from('session_entries')
      .insert({
        session_id: chainId,
        coa_id: coa.id,
        lexicon_version: LEXICON_VERSION,
        overall_word: snapshot.word,
        overall_score: snapshot.score,
        energy: snapshot.energy,
        environment: snapshot.environment,
        spark: snapshot.spark,
        fit: snapshot.fit,
        co_consumption: snapshot.co_consumption,
        physical_state: snapshot.physical_state,
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

  // Rung settle (drop or re-drag): every fact-class answer is carried
  // forward from the last confirmed entry — a re-drag changes the word,
  // not the questions: the axes stand, so fit stands too (D72's nulling is
  // for Spark CHANGES only). Entry 1 sends all fact fields null (the
  // overall word is the only mandatory field).
  const settleOnRung = (index: number) => {
    const rung = RUNGS[index];
    // Echo on settle (D58): the box shows the settling word at once,
    // pending-translucent until the insert confirms — same condition
    // as the card's pending visual.
    setEchoWord(rung.word);
    insertEntry(
      lastConfirmed === null
        ? {
            index,
            word: rung.word,
            score: rung.score,
            energy: null,
            environment: null,
            spark: null,
            fit: null,
            co_consumption: null,
            physical_state: null,
          }
        : { ...lastConfirmed, index, word: rung.word, score: rung.score },
      'drop'
    );
  };

  // Axis tap (D71/D57): a single-select revision insert copying the
  // confirmed snapshot with the one axis set. Re-tapping the confirmed
  // value is a no-op — an identical row carries zero information; a
  // different value corrects it (append-only, the prior survives beneath).
  // Spark is the fit referent (D72): changing Spark nulls fit; Energy and
  // Environment never touch fit. Axis deselection-to-null is banked (D78).
  const tapAxis = (axis: AxisKey, value: string) => {
    if (lastConfirmed === null) {
      return;
    }
    if (value === lastConfirmed[axis]) {
      // Re-tapping the confirmed value writes nothing (identical row) but
      // still advances the sequence (D79).
      advanceNoWrite();
      return;
    }
    setPendingAxis({ axis, value });
    const revised: Snapshot = { ...lastConfirmed };
    revised[axis] = value;
    if (axis === 'spark') {
      revised.fit = null;
    }
    insertEntry(revised, 'axis');
  };

  // Fit tap (D65): the axis-chip grammar reused wholesale — a revision
  // insert with everything else carried forward; re-tapping the confirmed
  // fit is a no-op (D57's rule).
  const tapFit = (fit: string) => {
    if (lastConfirmed === null) {
      return;
    }
    if (fit === lastConfirmed.fit) {
      // Re-tapping the confirmed fit is a no-op write; advance anyway (D79).
      advanceNoWrite();
      return;
    }
    insertEntry({ ...lastConfirmed, fit }, 'fit');
  };

  // Panel toggle (D78): the two multi-select panels. Tapping an unselected
  // value adds it; tapping a selected value removes it; either way a
  // revision insert carrying everything else forward. Removing the last
  // value normalizes to null, never [] — checked-none and unanswered are
  // one ratified state (D75). Presence-only; panels never touch fit.
  const togglePanel = (field: PanelKey, value: string) => {
    if (lastConfirmed === null) {
      return;
    }
    const current = lastConfirmed[field] ?? [];
    const next = current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];
    const normalized = next.length === 0 ? null : next;
    setPendingPanel({ field, value, values: normalized });
    const revised: Snapshot = { ...lastConfirmed };
    revised[field] = normalized;
    insertEntry(revised, 'panel');
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
        // Home-zone release: the cancel (D51). The echo clears with it
        // (D58) — the box only ever names a rung the card sits on.
        tx.value = withSpring(0, SPRING);
        ty.value = withSpring(0, SPRING);
        runOnJS(clearEcho)();
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

  // The confirmed (or pending) value of a single-select axis (D71): the
  // pending value while that axis's insert is on the wire, the last
  // confirmed value otherwise — so a failed tap reverts by derivation
  // (D55).
  const selectedAxis = (axis: AxisKey): string | null => {
    if (pendingAxis !== null && pendingAxis.axis === axis) {
      return pendingAxis.value;
    }
    return lastConfirmed === null ? null : lastConfirmed[axis];
  };
  // Fit's selection mirrors the axis rows' (D65): pending while its insert
  // is on the wire, the last confirmed fit otherwise.
  const selectedFit = pendingFit ?? (lastConfirmed === null ? null : lastConfirmed.fit);
  // A panel's selected set (D78): the optimistic array while its toggle is
  // on the wire, the last confirmed array otherwise (null -> empty).
  const panelValues = (field: PanelKey): readonly string[] => {
    if (pendingPanel !== null && pendingPanel.field === field) {
      return pendingPanel.values ?? [];
    }
    return lastConfirmed === null ? [] : lastConfirmed[field] ?? [];
  };
  // The axis config for the current axis screen (D79), undefined off the
  // axis screens — one PillScreen serves all three.
  const currentAxis =
    phase === 'energy' || phase === 'environment' || phase === 'spark'
      ? AXES.find((axis) => axis.key === phase)
      : undefined;

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        {phase === 'ladder' && (
          <>
            <View style={styles.rungRegion} onLayout={onRungRegionLayout}>
              {RUNG_WORDS.map((word, index) => (
                <Rung key={word} word={word} index={index} activeRung={activeRung} />
              ))}
            </View>

            {/* The home zone: the card's resting shelf and the cancel —
                the card renders above the rungs because this zone is the
                later sibling. The vacated box carries the answer echo
                (D58) and the inline save error (D54), stacked when both
                are visible; neither intercepts the card's gesture. */}
            <View
              style={[styles.homeZone, { backgroundColor: theme.backgroundSelected }]}
              onLayout={onHomeLayout}>
              {(echoWord !== null || saveError !== null) && (
                <View style={styles.notice} pointerEvents="none">
                  {echoWord !== null && (
                    <ThemedText
                      type="title"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={[
                        styles.echoWord,
                        // Mirrors the card's pending translucency exactly
                        // (D58): same condition, same style — a DROP
                        // insert on the wire, solid on confirmation.
                        inFlightSource === 'drop' && styles.cardPending,
                      ]}>
                      {echoWord.toUpperCase()}
                    </ThemedText>
                  )}
                  {saveError !== null && <ThemedText type="small">{saveError}</ThemedText>}
                </View>
              )}
              <GestureDetector gesture={pan}>
                <Animated.View
                  style={[
                    styles.cardChip,
                    { backgroundColor: theme.backgroundElement },
                    // Pending until confirmed (D54): translucent while a
                    // DROP insert is on the wire (an axis, fit, or panel
                    // revision's pending visual belongs to its own
                    // control, not the card), solid on confirmation.
                    // Feel is gate-tuned.
                    inFlightSource === 'drop' && styles.cardPending,
                    cardStyle,
                  ]}>
                  <ThemedText type="smallBold">{coa.strain}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {coa.brand}
                  </ThemedText>
                </Animated.View>
              </GestureDetector>
            </View>

            {/* Close is the ladder's pre-drop exit (D79): a fullScreen
                modal has no OS dismissal gesture, so the entry screen
                carries its own Close. Disabled while a drop is on the wire
                (D54). Every other exit lives on the closing screen. */}
            <Pressable
              disabled={inFlight}
              onPress={onClose}
              style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">Close</ThemedText>
            </Pressable>
          </>
        )}

        {/* The three intent axis screens (D71/D79): one axis per screen,
            title = axis name, values as full-width bottom-anchored pills,
            tap-advance on confirm, first-class Skip. Spark's confirm nulls
            fit (D72) and branches to the fit screen when answered. */}
        {currentAxis !== undefined && (
          <PillScreen
            theme={theme}
            title={currentAxis.label}
            values={currentAxis.values}
            selected={selectedAxis(currentAxis.key)}
            pendingValue={
              pendingAxis !== null && pendingAxis.axis === currentAxis.key
                ? pendingAxis.value
                : null
            }
            disabled={inFlight}
            error={saveError}
            onSelect={(value) => tapAxis(currentAxis.key, value)}
            onSkip={advanceNoWrite}
            onBack={goBack}
          />
        )}

        {/* The fit screen (D73/D79): shown only when Spark was answered;
            spark's advance goes straight to closing otherwise. Same
            pill-and-Skip pattern, FITS vocabulary unchanged. */}
        {phase === 'fit' && (
          <PillScreen
            theme={theme}
            title="Did it do what you wanted?"
            values={FITS}
            selected={selectedFit}
            pendingValue={pendingFit}
            disabled={inFlight}
            error={saveError}
            onSelect={tapFit}
            onSkip={advanceNoWrite}
            onBack={goBack}
          />
        )}

        {/* The closing screen (D79): Close plus an optional panels entry,
            off the required path. Close is a sibling of the entry, never
            blocked by it (both disable only while an insert is on the
            wire, D54). */}
        {phase === 'closing' && (
          <View style={styles.sequenceScreen}>
            <View style={styles.sequenceHeader}>
              <Pressable disabled={inFlight} onPress={goBack} style={styles.backButton}>
                <ThemedText type="smallBold">Back</ThemedText>
              </Pressable>
            </View>
            <View style={styles.closingActions}>
              <Pressable
                disabled={inFlight}
                onPress={() => setPhase('panels')}
                style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">Anything else?</ThemedText>
              </Pressable>
              <Pressable
                disabled={inFlight}
                onPress={onClose}
                style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">Close</ThemedText>
              </Pressable>
            </View>
          </View>
        )}

        {/* The panels screen (D75/D76/D78): the two multi-select confound
            panels, off the required path (reached only from closing). Reuse
            the chip visual language wholesale — selected inverts, the
            toggled value renders pending. No advance-on-confirm: toggles
            settle in place. Back returns to closing. */}
        {phase === 'panels' && (
          <View style={styles.sequenceScreen}>
            <View style={styles.sequenceHeader}>
              <Pressable disabled={inFlight} onPress={goBack} style={styles.backButton}>
                <ThemedText type="smallBold">Back</ThemedText>
              </Pressable>
              <ThemedText
                type="title"
                numberOfLines={1}
                adjustsFontSizeToFit
                style={styles.sequenceTitle}>
                Anything else?
              </ThemedText>
            </View>
            <View style={styles.panelsBody}>
              {PANELS.map((panel) => {
                const values = panelValues(panel.key);
                return (
                  <View key={panel.key} style={styles.richQuestion}>
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={styles.chipQuestion}>
                      {panel.label}
                    </ThemedText>
                    <View style={styles.chipRow}>
                      {panel.values.map((value) => {
                        const isSelected = values.includes(value);
                        const isPending =
                          pendingPanel !== null &&
                          pendingPanel.field === panel.key &&
                          pendingPanel.value === value;
                        return (
                          <Pressable
                            key={value}
                            disabled={inFlight}
                            onPress={() => togglePanel(panel.key, value)}
                            style={[
                              styles.chip,
                              {
                                backgroundColor: isSelected
                                  ? theme.text
                                  : theme.backgroundElement,
                              },
                              isPending && styles.chipPending,
                            ]}>
                            <ThemedText
                              type="small"
                              style={isSelected ? { color: theme.background } : undefined}>
                              {value}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
              {saveError !== null && (
                <ThemedText type="small" style={styles.sequenceError}>
                  {saveError}
                </ThemedText>
              )}
            </View>
          </View>
        )}
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
    gap: Spacing.half,
  },
  echoWord: {
    maxWidth: '100%',
    paddingHorizontal: Spacing.three,
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
  richQuestion: {
    gap: Spacing.one,
  },
  // The one-screen sequence (D79): a flex column with the header at the
  // top and the answer stack anchored to the bottom (thumb reach) via
  // marginTop:auto.
  sequenceScreen: {
    flex: 1,
  },
  sequenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sequenceTitle: {
    flex: 1,
    textAlign: 'center',
  },
  sequenceError: {
    textAlign: 'center',
  },
  pillStack: {
    marginTop: 'auto',
    gap: Spacing.two,
  },
  pill: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: Spacing.four,
    paddingVertical: Spacing.three,
  },
  skipPill: {
    marginTop: Spacing.one,
  },
  closingActions: {
    marginTop: 'auto',
    gap: Spacing.two,
  },
  panelsBody: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.four,
  },
  backButton: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
});
