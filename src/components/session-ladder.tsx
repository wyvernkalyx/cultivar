import { uuid } from 'expo-modules-core';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type LayoutChangeEvent } from 'react-native';
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
import { AIMLESS_INTENT, FITS, INTENTS, LEXICON_VERSION, RUNGS } from '@/lib/lexicon';
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

// One entry's writable fields (D52 full snapshot): the rung answer plus
// every fact-class field. lastConfirmed holds exactly this shape, and
// every insert sends one — the rich fields ride along at their snapshot
// values (D65).
type Snapshot = {
  index: number;
  word: string;
  score: number;
  intent: string | null;
  fit: string | null;
  context: string | null;
  co_alcohol: boolean | null;
};

// Which control fired the insert. Only a failed DROP moves the card
// (D55); every other source reverts by derivation when its pending
// state clears.
type InsertSource = 'drop' | 'chip' | 'fit' | 'context' | 'alcohol';

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
 * chip row, D64-D66 rich path): the vertical ladder. A drop on a rung is
 * the save attempt — it inserts a session entry immediately and the card
 * renders pending until the insert confirms (D54). A re-drag inserts a
 * revision row into the same chain (D52); a failed revision reverts to
 * the last confirmed truth (D55). The intent chip row fades in only on
 * confirmed insert — it IS the success indicator (D54): seven uniform
 * chips (D56); a different chip revises with word + score carried
 * forward and fit nulled (D66 — fit is intent-relative), re-tapping the
 * confirmed chip is a no-op (D57). The vacated home-zone box echoes the
 * settled answer word in large type (D58) — echo on settle only, never
 * live tracking during the drag. A More affordance appears with the
 * chip row and swaps the surface to its rich phase (D64): fit, context,
 * co-alcohol replacing the ladder render whole, each answer its own
 * revision insert under the same persistence grammar (D65).
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
  // D65). Its fact-class fields are null until their answers confirm
  // (entry 1 sends all null, D48). State for the same reason as
  // sessionId.
  const [lastConfirmed, setLastConfirmed] = useState<Snapshot | null>(null);
  // The chip whose revision insert is on the wire (D54): renders
  // pending-selected. Cleared on resolution either way — on failure the
  // selection falls back to lastConfirmed.intent by derivation, which is
  // exactly D55's revert.
  const [pendingIntent, setPendingIntent] = useState<string | null>(null);
  // The fit chip whose revision insert is on the wire (D65): the intent
  // chips' pending grammar reused wholesale — cleared on resolution
  // either way; on failure the selection falls back to lastConfirmed.fit
  // by derivation, which is exactly D55's revert.
  const [pendingFit, setPendingFit] = useState<string | null>(null);
  // The answer echo (D58): the settled rung's word, displayed large in
  // the vacated home-zone box. Set on every rung settle; cleared when
  // the card returns home (cancel, or a failed FIRST drop); set to the
  // last confirmed word on a failed revision, because that is where the
  // card lands (D55). Chip taps never touch it, and it never tracks the
  // drag live — the swell is the mid-drag signal (D58, ratified).
  const [echoWord, setEchoWord] = useState<string | null>(null);
  // The surface's phase (D64): 'rich' replaces the ladder render whole
  // — no overlay, no squeeze, no rung compression, no keyboard over the
  // drag surface. Back swaps back with the card still on its rung: the
  // ladder's state (shared values included) lives up here and survives
  // the swap.
  const [phase, setPhase] = useState<'ladder' | 'rich'>('ladder');
  // The context input's draft (D65): free text needs local state the
  // way chips do not. Set to the trimmed text on submit, so on confirm
  // it equals lastConfirmed.context; a failed submit restores the last
  // confirmed text (D55, for a value that cannot revert by derivation).
  const [contextDraft, setContextDraft] = useState('');

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

  // The save attempt (D54): every path is the same insert — same chain,
  // full snapshot (D52). A drop sends its rung with every fact-class
  // answer carried forward; a chip tap sends the confirmed word + score
  // with the tapped chip and fit nulled (D57, D66); each rich answer
  // sends the confirmed snapshot with its one field changed (D65). Only
  // a failed DROP moves the card (D55) — every other failure reverts
  // its own control's rendered state only.
  const insertEntry = (snapshot: Snapshot, source: InsertSource) => {
    const chainId = sessionId ?? uuid.v4();
    if (sessionId === null) {
      setSessionId(chainId);
    }
    setSaveError(null);
    setInFlightSource(source);
    if (source === 'chip') {
      setPendingIntent(snapshot.intent);
    }
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
      setPendingIntent(null);
      setPendingFit(null);
      onBusyChange(false);
      if (!failed) {
        setLastConfirmed(snapshot);
        return;
      }
      setSaveError("Couldn't save — check your connection.");
      if (source === 'context') {
        // D55 for the text field: a TextInput's value cannot revert by
        // derivation alone, so the draft is restored to the last
        // confirmed context explicitly.
        setContextDraft(
          lastConfirmed === null || lastConfirmed.context === null ? '' : lastConfirmed.context
        );
      }
      if (source !== 'drop') {
        // A failed chip or rich insert never moves the card or touches
        // the echo (D55, D65): clearing its pending state already
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
    // snapshot (D52/D65): the rich fields ride every insert at their
    // snapshot values — the wiring slice's rule that intent was the only
    // fact-class field this surface writes ended when D64-D66 placed the
    // rich path here. On the lazy path all three stay null (D48).
    supabase
      .from('session_entries')
      .insert({
        session_id: chainId,
        coa_id: coa.id,
        lexicon_version: LEXICON_VERSION,
        overall_word: snapshot.word,
        overall_score: snapshot.score,
        intent: snapshot.intent,
        fit: snapshot.fit,
        context: snapshot.context,
        co_alcohol: snapshot.co_alcohol,
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
  // not the questions: the intent stands, so fit stands too (D66's
  // nulling is for intent CHANGES only). Entry 1 sends all null (D48 —
  // unanswered is not an answer).
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
            intent: null,
            fit: null,
            context: null,
            co_alcohol: null,
          }
        : { ...lastConfirmed, index, word: rung.word, score: rung.score },
      'drop'
    );
  };

  // Chip tap (D57): a revision insert copying word + score from the last
  // confirmed entry. Re-tapping the confirmed chip is a no-op — an
  // identical row carries zero information. An intent change sends fit
  // null (D66): fit is intent-relative, and full-snapshot carry must not
  // attach an old answer to a question never asked — the old fit
  // survives beneath in the chain. Context and co-alcohol carry forward
  // untouched.
  const tapChip = (chip: string) => {
    if (lastConfirmed === null || chip === lastConfirmed.intent) {
      return;
    }
    insertEntry({ ...lastConfirmed, intent: chip, fit: null }, 'chip');
  };

  // Fit tap (D65): the intent-chip grammar reused wholesale — a revision
  // insert with everything else carried forward; re-tapping the
  // confirmed fit is a no-op (D57's rule).
  const tapFit = (fit: string) => {
    if (lastConfirmed === null || fit === lastConfirmed.fit) {
      return;
    }
    insertEntry({ ...lastConfirmed, fit }, 'fit');
  };

  // Context submit (D65): commits on keyboard submit. A trimmed-empty
  // submit is a no-op — an empty string is never recorded, and null
  // stays null (recorded = chosen). Resubmitting the confirmed text is
  // likewise a no-op (an identical row carries zero information);
  // different text is a revision.
  const submitContext = () => {
    if (lastConfirmed === null) {
      return;
    }
    const trimmed = contextDraft.trim();
    if (trimmed === '' || trimmed === lastConfirmed.context) {
      return;
    }
    setContextDraft(trimmed);
    insertEntry({ ...lastConfirmed, context: trimmed }, 'context');
  };

  // Alcohol tap (D65): inserts true; re-tapping when confirmed true is a
  // no-op. Deselection stays banked with its cost named — a mis-tap is
  // stuck true until deselection is designed; this surface writes null
  // or true only, never false.
  const tapAlcohol = () => {
    if (lastConfirmed === null || lastConfirmed.co_alcohol === true) {
      return;
    }
    insertEntry({ ...lastConfirmed, co_alcohol: true }, 'alcohol');
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
  // Fit's selection mirrors the intent row's (D65): pending while its
  // insert is on the wire, the last confirmed fit otherwise.
  const selectedFit = pendingFit ?? (lastConfirmed === null ? null : lastConfirmed.fit);
  // Fit renders only when the chain's confirmed intent is non-null and
  // not aimless (lexicon rule, inherited hard by rich-path.md): "did it
  // do what you wanted" has no referent without a wanted. An intent
  // change re-opens the question (D66 consequence — correct, not a bug).
  const fitAskable =
    lastConfirmed !== null &&
    lastConfirmed.intent !== null &&
    lastConfirmed.intent !== AIMLESS_INTENT;
  // The alcohol chip's selection (D65): pending while its insert is on
  // the wire, the confirmed value otherwise.
  const alcoholSelected =
    inFlightSource === 'alcohol' || (lastConfirmed !== null && lastConfirmed.co_alcohol === true);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.content}>
        {phase === 'ladder' ? (
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
                    // DROP insert is on the wire (a chip or rich
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

            {/* The intent chip row (D56): seven uniform chips, seed-list
                order, none promoted — no default exists until onboarding
                ships, and faking one would encode a choice the user
                never made. A fixed layout sibling below the home zone;
                hidden by opacity, so the ladder's geometry is identical
                before and after it appears. */}
            <Animated.View
              style={[styles.chipSection, chipRowStyle]}
              pointerEvents={lastConfirmed !== null ? 'auto' : 'none'}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.chipQuestion}>
                What was this for?
              </ThemedText>
              <View style={styles.chipRow}>
                {INTENTS.map((chip) => {
                  // Selected = full inversion (text token as fill,
                  // background token as label): the strongest contrast
                  // the existing tokens offer. backgroundSelected vs
                  // backgroundElement is imperceptible at arm's length
                  // in dark mode (gate finding). Same dimensions in
                  // every state (D56: uniform, none promoted).
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
                        // Pending-selected while this chip's revision is
                        // on the wire (D54): the selected treatment at
                        // the card's pending opacity; settles on confirm.
                        chip === pendingIntent && styles.chipPending,
                      ]}>
                      <ThemedText
                        type="small"
                        style={selected ? { color: theme.background } : undefined}>
                        {chip}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
              {/* The More affordance (D64): the door to the rich phase.
                  Mounted with the chip row so it shares the
                  confirmed-only visibility (and never reflows the rung
                  geometry); small on purpose — form is gate-tuned. */}
              <Pressable disabled={inFlight} onPress={() => setPhase('rich')} style={styles.more}>
                <ThemedText type="small" themeColor="textSecondary">
                  More
                </ThemedText>
              </Pressable>
            </Animated.View>
          </>
        ) : (
          /* The rich phase (D64): the optional now-facts — fit, context,
             co-alcohol — replacing the ladder render whole. Conditional
             rendering is allowed in here: the mounting rule defended the
             rung geometry, and there are no rungs on this screen. Every
             answer is its own revision insert (D65) through the same
             pipeline, same one-in-flight rule, same inline error. */
          <View style={styles.richRegion}>
            {fitAskable && (
              <View style={styles.richQuestion}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.chipQuestion}>
                  Did it do what you wanted?
                </ThemedText>
                <View style={styles.chipRow}>
                  {FITS.map((fit) => {
                    // The intent chips' selection treatment, reused
                    // wholesale (D65): uniform chips, full inversion
                    // when selected, pending at the card's opacity.
                    const selected = fit === selectedFit;
                    return (
                      <Pressable
                        key={fit}
                        disabled={inFlight}
                        onPress={() => tapFit(fit)}
                        style={[
                          styles.chip,
                          { backgroundColor: selected ? theme.text : theme.backgroundElement },
                          fit === pendingFit && styles.chipPending,
                        ]}>
                        <ThemedText
                          type="small"
                          style={selected ? { color: theme.background } : undefined}>
                          {fit}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
            <View style={styles.richQuestion}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.chipQuestion}>
                What were you doing?
              </ThemedText>
              {/* Free text, single line, deliberately unseeded — the
                  operator's first weeks author the vocabulary. Commits
                  on keyboard submit; pending mirrors the chips'
                  translucency while its insert is on the wire. */}
              <TextInput
                value={contextDraft}
                onChangeText={setContextDraft}
                onSubmitEditing={submitContext}
                editable={!inFlight}
                returnKeyType="done"
                style={[
                  styles.contextInput,
                  { backgroundColor: theme.backgroundElement, color: theme.text },
                  inFlightSource === 'context' && styles.chipPending,
                ]}
              />
            </View>
            {/* Co-alcohol: one chip, no question line — the v1 form as
                designed (rich-path.md). Stuck true once confirmed;
                deselection is banked with its cost named. */}
            <View style={styles.chipRow}>
              <Pressable
                disabled={inFlight}
                onPress={tapAlcohol}
                style={[
                  styles.chip,
                  { backgroundColor: alcoholSelected ? theme.text : theme.backgroundElement },
                  inFlightSource === 'alcohol' && styles.chipPending,
                ]}>
                <ThemedText
                  type="small"
                  style={alcoholSelected ? { color: theme.background } : undefined}>
                  alcohol
                </ThemedText>
              </Pressable>
            </View>
            {/* The same inline error (D54/D65) — the home-zone box is
                off-screen in this phase, so the rich phase carries its
                own slot for it. */}
            {saveError !== null && (
              <ThemedText type="small" style={styles.richError}>
                {saveError}
              </ThemedText>
            )}
            {/* Back swaps phases again (D64): the ladder returns with
                the card still on its rung — its state never left. */}
            <Pressable
              disabled={inFlight}
              onPress={() => setPhase('ladder')}
              style={styles.backButton}>
              <ThemedText type="smallBold">Back</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Dismissal is disabled while an insert is in flight (D54);
            Close is the only exit, from either phase. */}
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
  more: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
  },
  richRegion: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.four,
  },
  richQuestion: {
    gap: Spacing.one,
  },
  contextInput: {
    alignSelf: 'stretch',
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  richError: {
    textAlign: 'center',
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
