import { uuid } from 'expo-modules-core';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing, Survey } from '@/constants/theme';
import {
  CO_CONSUMPTION,
  ENERGY,
  ENVIRONMENT,
  FITS,
  LEXICON_VERSION,
  MAIN_GOAL,
  PHYSICAL_STATE,
  RUNGS,
} from '@/lib/lexicon';
import { supabase } from '@/lib/supabase';

// Rung order is the lexicon's (D51, preserved as visual order by D80): up =
// better, best word at the top, "Neutral" at dead center, worst at the bottom.
// Words and scores resolve through the one source.
const RUNG_WORDS = RUNGS.map((rung) => rung.word);

// ~10s client abort (D54): a hung insert fails visibly instead of holding
// the surface's dismissal guard forever.
const INSERT_TIMEOUT_MS = 10000;

// The three intent axes (D71) as single-select chip rows, and the two
// multi-select panels (D75/D76) as toggle rows: `key` indexes the Snapshot
// field; `values` come from the one lexicon source. Labels are transitional
// copy — the wheel pass supersedes this surface (session-logging, banked).
type AxisKey = 'energy' | 'environment' | 'main_goal';
type PanelKey = 'co_consumption' | 'physical_state';
const AXES: { key: AxisKey; label: string; values: readonly string[] }[] = [
  { key: 'energy', label: 'Target Energy', values: ENERGY },
  { key: 'environment', label: 'Setting', values: ENVIRONMENT },
  { key: 'main_goal', label: 'Main Goal', values: MAIN_GOAL },
];
// D82: order matches the survey sequence — physical_state (starting out)
// precedes co_consumption (anything else), the specific question before the
// catch-all.
const PANELS: { key: PanelKey; label: string; values: readonly string[] }[] = [
  { key: 'physical_state', label: 'How were you starting out?', values: PHYSICAL_STATE },
  { key: 'co_consumption', label: 'Anything else?', values: CO_CONSUMPTION },
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
  main_goal: string | null;
  fit: string | null;
  co_consumption: string[] | null;
  physical_state: string[] | null;
};

// Which control fired the insert. Every source reverts by derivation when its
// pending state clears (D55); the source is still tracked so a screen can
// render its own pending visual (D80: the tapped pill, D65: the fit chip).
type InsertSource = 'drop' | 'axis' | 'fit' | 'panel';

// The D82 screen sequence: one screen renders at a time. Single-select
// screens advance on insert CONFIRM (not on tap); the two multi-select
// panels toggle in place and advance on a Done pill (D82). Order: ladder
// (the score pill screen) -> energy -> environment -> main_goal -> fit (only
// when main_goal is answered, D73) -> physical_state -> co_consumption ->
// closing (D82: the panels join the required sequence). Field keys double
// as phase names so currentPanel/currentAxis derive config straight from
// phase. Conditional render wrapped in the D83 advance transition (slice 2).
type Phase =
  | 'ladder'
  | 'energy'
  | 'environment'
  | 'main_goal'
  | 'fit'
  | 'physical_state'
  | 'co_consumption'
  | 'closing';

// Font families registered app-wide in the root layout (D83 Decision 1).
// Referenced by name; when a family is not yet loaded RN falls back to the
// system font — the ratified fallback, so the survey never blocks on a font.
const SORA_MEDIUM = 'Sora_500Medium';
const SORA_SEMIBOLD = 'Sora_600SemiBold';
const SORA_BOLD = 'Sora_700Bold';
const SERIF_ITALIC = 'Newsreader_400Regular_Italic';

// One explainer line per screen (D83 Decision 2), verbatim from
// documentation/design/art-direction.md — personal, observational, zero
// pharmacology, each pointing at the user's own log. Occupies the empty middle
// in serif italic. None of these strings contains a double quote, so they read
// cleanly as double-quoted literals; the "--" is the doc's ASCII em dash.
const EXPLAINERS: Record<Phase, string> = {
  ladder: "Gut call. How this run stacked up against the rest of your shelf.",
  energy: "Where it left you on the dial -- mellow to wired. Only next to your own past logs.",
  environment: "Who was around. Solo and social runs can read like two different strains in your logs.",
  main_goal: "The itch it scratched, if any. Your word for the moment, nothing more.",
  fit: "Measured against what you came for -- nothing else.",
  physical_state: "Where you started from. The same run reads different against a different baseline.",
  co_consumption: "What else was in the mix. Logged so this run isn't judged alone.",
  closing: "That's the run logged. It'll show up next to the rest of this strain.",
};

// The saving-state spinner (D83 Layer 1): a 20pt ring rotating on a linear
// loop, core Animated only. Sits beside the swapped "Saving…" label on the
// tapped pill. `color` matches the pill's label so it reads on either fill.
function SavingSpinner({ color }: { color: string }) {
  // Lazy state, not a ref: the value is stable across renders and read in
  // render (interpolate) without tripping the no-refs-in-render rule.
  const [spin] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 700,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  return (
    <Animated.View
      style={[
        styles.spinner,
        {
          borderColor: color,
          borderTopColor: 'transparent',
          transform: [
            { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
          ],
        },
      ]}
    />
  );
}

// The completion bloom (D83 Unfurl 2a, per reference/claude-design-survey mock):
// six petals unfurl from a rooted calyx, then the "Logged." caption rises. All
// motion is passed in as native-driven Animated.Values owned by SessionLadder,
// so a Back-and-return to closing shows the held (settled) bloom rather than
// replaying it. Each petal wrapper carries a static 60deg rotation; the inner
// petal scales up from its base (transformOrigin 50% 100%). The glow halo
// approximates the mock's filter:blur — RN core has no blur (see report).
function CompletionBloom({
  petalAnims,
  calyxAnim,
  captionAnim,
}: {
  petalAnims: Animated.Value[];
  calyxAnim: Animated.Value;
  captionAnim: Animated.Value;
}) {
  return (
    <View style={styles.bloomWrap}>
      <View style={styles.bloomArt}>
        <View style={styles.bloomGlow} />
        {petalAnims.map((anim, i) => (
          <View key={i} style={[styles.petalRoot, { transform: [{ rotate: `${i * 60}deg` }] }]}>
            <Animated.View
              style={[
                styles.petal,
                {
                  opacity: anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }),
                  transform: [
                    { scaleY: anim.interpolate({ inputRange: [0, 1], outputRange: [0.08, 1] }) },
                  ],
                },
              ]}
            />
          </View>
        ))}
        <Animated.View
          style={[
            styles.calyx,
            {
              opacity: calyxAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
              transform: [
                { scale: calyxAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
              ],
            },
          ]}
        />
      </View>
      <Animated.View
        style={{
          opacity: captionAnim,
          transform: [
            { translateY: captionAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
          ],
        }}>
        <ThemedText style={styles.loggedText}>Logged.</ThemedText>
        <ThemedText style={styles.loggedSub}>On the shelf with the rest.</ThemedText>
      </Animated.View>
    </View>
  );
}

// The shared sequence-screen header (D83 header block, over D80/D81): a styled
// leading control chip, then a left-aligned block — a quiet brand label on top,
// the product line dominant beneath it (D81: every screen names the product, so
// the user never rates an unnamed thing), and the screen's question as an
// accent subheading. The identification is never fabricated: whichever of brand
// / strain the COA carries shows, and the dominant line always names something.
// A screen that asks nothing (closing) passes no title and shows the
// identification alone.
function SequenceHeader({
  leadingLabel,
  onLeading,
  disabled,
  brand,
  strain,
  title,
  saving = false,
}: {
  leadingLabel: string;
  onLeading: () => void;
  disabled: boolean;
  brand: string | null;
  strain: string | null;
  title?: string;
  // D83 Layer 1 saving state: the header dims to 40% while an insert is on
  // the wire (the tapped pill stays lit; siblings dim to 32%).
  saving?: boolean;
}) {
  // The dominant line is the strain when present, the brand otherwise, so a
  // single-named COA reads as one strong line rather than a lonely label over
  // an empty product. The brand label shows above only when both exist.
  const productLine = strain ?? brand ?? '';
  const brandLabel = strain !== null ? brand : null;
  return (
    <View style={[styles.sequenceHeader, saving && styles.headerSaving]}>
      <Pressable disabled={disabled} onPress={onLeading} style={styles.controlChip}>
        {/* Leading glyph per D83 item 9: cross for Close, single-angle for
            Back. */}
        <ThemedText style={styles.controlChipLabel}>
          {(leadingLabel === 'Close' ? '✕ ' : '‹ ') + leadingLabel}
        </ThemedText>
      </Pressable>
      <View style={styles.headerBlock}>
        {brandLabel !== null && (
          <ThemedText style={styles.brandLabel} numberOfLines={1}>
            {brandLabel}
          </ThemedText>
        )}
        {/* Wrap-only (D83, ratified item 1): up to two lines at full size, no
            shrink. A real overflow at the device gate is the only thing that
            reopens it. */}
        <ThemedText style={styles.productLine} numberOfLines={2}>
          {productLine}
        </ThemedText>
        {title !== undefined && (
          <ThemedText style={styles.question} numberOfLines={2}>
            {title}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

// One sequence screen (D79 axis/fit, D80 score, D82 panels): a header, the
// values as full-width bottom-anchored pills in thumb reach, and a trailing
// action pill. Two grammars share this one screen (D82). A single-select
// screen advances on the answer tap and carries an optional first-class Skip
// (omit onSkip on the mandatory score screen — the skeleton's one required
// field, D80). A multi-select panel passes selectedValues (a pill is lit iff
// the set includes it, the single-select equality path unused) and onDone (a
// Done pill that writes nothing and advances — the toggles themselves saved
// per tap, D78). onSkip and onDone are mutually exclusive and never both
// passed. Tap, Skip, Done, and toggle semantics live in the owner; this
// renders selection/pending state and the inline save error only. The chip
// visual grammar is reused wholesale — selected inverts (text token as fill),
// pending rides at half opacity (D57/D65/D78/D80).
function PillScreen({
  brand,
  strain,
  title,
  explainer,
  values,
  selected,
  selectedValues,
  pendingValue,
  tierStripe = false,
  disabled,
  error,
  onSelect,
  onLeading,
  onSkip,
  onDone,
  leadingLabel = 'Back',
}: {
  brand: string | null;
  strain: string | null;
  title: string;
  explainer: string;
  values: readonly string[];
  selected: string | null;
  // Multi-select (D82): when present, a pill is lit iff this set includes it,
  // and `selected` is unused (call sites pass selected={null}).
  selectedValues?: readonly string[];
  pendingValue: string | null;
  // The score screen (D83, ratified item 2): a 5pt leading tier stripe per
  // pill, best -> worst, so hue reinforces the order score already carries.
  tierStripe?: boolean;
  disabled: boolean;
  error: string | null;
  onSelect: (value: string) => void;
  onLeading: () => void;
  // Mutually exclusive with onDone (D82): a screen is single-select (Skip) or
  // multi-select (Done), never both.
  onSkip?: () => void;
  onDone?: () => void;
  leadingLabel?: string;
}) {
  // Saving state (D83 Layer 1): an insert on this screen is on the wire iff a
  // pill is pending. The tapped pill spins; header + siblings dim.
  const saving = pendingValue !== null;
  return (
    <View style={styles.sequenceScreen}>
      <SequenceHeader
        leadingLabel={leadingLabel}
        onLeading={onLeading}
        disabled={disabled}
        brand={brand}
        strain={strain}
        title={title}
        saving={saving}
      />
      {/* The explainer occupies the empty middle as the reading surface (D83):
          one line of personal context, serif italic, quiet. */}
      <View style={styles.explainerWrap}>
        <ThemedText style={styles.explainer}>{explainer}</ThemedText>
      </View>
      <View style={styles.pillStack}>
        {values.map((value, index) => {
          // Multi-select lights every value in the set (D82); single-select
          // lights the one equal to `selected`.
          const isMulti = selectedValues !== undefined;
          const isSelected = isMulti ? selectedValues.includes(value) : value === selected;
          const isPending = value === pendingValue;
          const labelColor = isSelected ? Survey.background : Survey.text;
          return (
            <Pressable
              key={value}
              // Disabled while any insert is on the wire (D54).
              disabled={disabled}
              onPress={() => onSelect(value)}
              style={[
                styles.pill,
                // Multi-select pills lay label beside the checkbox (D82.1);
                // single-select pills are unchanged.
                isMulti && styles.pillMulti,
                { backgroundColor: isSelected ? Survey.text : Survey.surface },
                // Saving state (D83 Layer 1): siblings of the tapped pill dim to
                // 32%; the tapped pill stays lit and shows the spinner below.
                saving && !isPending && styles.chipDim,
              ]}>
              {/* Score-pill tier stripe (D83): only the stripe is colored, the
                  body stays surface. Absolute so it never shifts the centered
                  label; order best -> worst by pill index (Elite -> Trash). */}
              {tierStripe && (
                <View style={[styles.tierStripe, { backgroundColor: Survey.tier[index] }]} />
              )}
              {/* The leading checkbox is the pre-tap cue (D82.1) that this
                  screen is pick-any and needs Done — a bare pill is pick-one
                  and advances on tap. D83 treatment: 20pt square, 1.5pt subtext
                  border unchecked; accent fill + dark glyph checked. */}
              {isMulti && (
                <View
                  style={[
                    styles.checkbox,
                    isSelected
                      ? { backgroundColor: Survey.accent, borderColor: Survey.accent }
                      : { borderColor: Survey.subtext },
                  ]}>
                  {isSelected && <View style={styles.checkMark} />}
                </View>
              )}
              {/* D83 Layer 1 saving treatment: the tapped pill swaps its label
                  for a 20pt spinner + "Saving…" while its insert is on the wire
                  (D54); every other pill keeps its label. */}
              {isPending ? (
                <View style={styles.savingRow}>
                  <SavingSpinner color={labelColor} />
                  <ThemedText style={[styles.pillLabel, { color: labelColor }]}>
                    Saving…
                  </ThemedText>
                </View>
              ) : (
                <ThemedText style={[styles.pillLabel, { color: labelColor }]}>{value}</ThemedText>
              )}
            </Pressable>
          );
        })}
        {/* Inline save error (D54) as the D83 banner: surface-hi, 1px error
            border, round badge, above the pills so a retry is one tap away. */}
        {error !== null && (
          <View style={styles.errorBanner}>
            <View style={styles.errorBadge}>
              <ThemedText style={styles.errorBadgeGlyph}>!</ThemedText>
            </View>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          </View>
        )}
        {/* Skip is first-class (D79): a persistent pill, never smaller than
            an answer, that advances and writes nothing. Absent on the score
            screen (D80): the overall word is the only mandatory field. */}
        {onSkip !== undefined && (
          <Pressable
            disabled={disabled}
            onPress={onSkip}
            style={[styles.pill, styles.skipPill, saving && styles.chipDim]}>
            <ThemedText style={[styles.pillLabel, { color: Survey.subtext }]}>Skip</ThemedText>
          </Pressable>
        )}
        {/* Done advances a multi-select panel (D82): the toggles already saved
            per tap, so Done writes nothing — it only moves on, and Done with
            nothing selected is the skip by construction. D83 confirm treatment:
            accent-filled with dark text (same as closing's Close), so the two
            grammars' trailing pills read as distinct. Mutually exclusive with
            onSkip. */}
        {onDone !== undefined && (
          <Pressable
            disabled={disabled}
            onPress={onDone}
            style={[styles.pill, styles.donePill, saving && styles.chipDim]}>
            <ThemedText style={[styles.pillLabel, { color: Survey.onAccent }]}>Done</ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/**
 * The session-logging surface (D80 unified pill sequence, D54-D55 persistence,
 * D70-D79 survey): one pill screen per question, advancing on insert CONFIRM.
 * The score screen (D80) leads — the five RUNGS as full-width stacked pills,
 * Loved at top, Hated at bottom, carrying D51's up-is-better geometry as visual
 * order. A score tap is the save attempt: it inserts a session entry
 * immediately (the D50 tap-is-the-save contract, motion changed from the
 * retired drag) and the tapped pill renders pending until the insert confirms
 * (D54). Back to the score screen and tapping a different pill inserts a
 * revision row into the same chain (D52) under the same grammar the axis
 * screens use; a failed revision reverts to the last confirmed truth by
 * derivation (D55).
 *
 * On a confirmed score the flow advances (D79) to the axis screens: Target
 * Energy, Setting, Main Goal, one per screen, each a full-snapshot revision
 * insert (D71) carrying the rest forward, with the advance firing on CONFIRM,
 * not on tap. Changing Main Goal nulls fit (D72); a first-class Skip advances
 * and writes nothing. Fit is its own screen shown only when Main Goal was
 * answered (D73), then the two multi-select confound panels join the sequence
 * in order (D82):
 * physical-state (D76) then co-consumption (D75), each a toggle-and-save
 * screen (D78) that advances on a Done pill, not on tap. A closing screen (a
 * single Close) terminates the survey. Every write rides the one insertEntry
 * pipeline under the same D54/D55 grammar.
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
  const insets = useSafeAreaInsets();
  // One in-flight insert at a time (D54): the source whose insert is on
  // the wire, null when idle. Drives the pending visuals (each source's
  // pending visual belongs to its own control) and disables every tap and
  // both dismissal paths — the Close control here, onRequestClose in the
  // owner via onBusyChange.
  const [inFlightSource, setInFlightSource] = useState<InsertSource | null>(null);
  const inFlight = inFlightSource !== null;
  // Plain inline error (D54), rendered beneath the pills; cleared when the
  // next insert fires.
  const [saveError, setSaveError] = useState<string | null>(null);

  // The chain key (D52): minted lazily at the first score tap of this
  // presentation and held for its lifetime. A failed insert does NOT
  // discard it — a retry lands in the same chain, which is what makes
  // D54's duplicate-on-retry absorption true. A Close before any save mints
  // nothing. State, not a ref: one-in-flight (D54) guarantees a re-render
  // between inserts, so the captured value is never stale.
  const [sessionId, setSessionId] = useState<string | null>(null);
  // Last confirmed entry (D55): the revert target when a revision fails,
  // and the snapshot every revision copies its carried fields from (D57,
  // D65, D78). Its fact-class fields are null until their answers confirm
  // (entry 1 sends all null). State for the same reason as sessionId.
  const [lastConfirmed, setLastConfirmed] = useState<Snapshot | null>(null);
  // The score word whose insert is on the wire (D80): renders pending on its
  // pill. Cleared on resolution either way — on failure the selection falls
  // back to the last confirmed word by derivation, which is exactly D55's
  // revert.
  const [pendingScore, setPendingScore] = useState<string | null>(null);
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
  // The surface's phase (D79): the current screen in the sequence. One
  // screen renders at a time; the flow state lives up here and survives
  // every screen change, so Back to the score screen lands on the intact
  // confirmed selection.
  const [phase, setPhase] = useState<Phase>('ladder');

  // Screen-advance transition (D83): a gentle ~240ms fade-and-advance on every
  // phase change. One native-driven value re-runs from 0 whenever `phase`
  // changes; the whole screen layer fades in and slides a few dp home. Motion
  // decorates the existing advance — the flow, gate, and persistence are
  // untouched.
  const [phaseAnim] = useState(() => new Animated.Value(1));
  useEffect(() => {
    phaseAnim.setValue(0);
    const anim = Animated.timing(phaseAnim, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [phase, phaseAnim]);

  // Completion bloom (D83 Unfurl 2a): six petals, the calyx, and the caption,
  // each a native-driven Animated.Value owned here so they survive the closing
  // screen's unmount/remount on a Back-and-return. `bloomPlayed` latches the
  // one play — on revisit the effect early-returns and the values render at
  // their settled 1, so the bloom holds and never replays (gate requirement).
  const [petalAnims] = useState(() => Array.from({ length: 6 }, () => new Animated.Value(0)));
  const [calyxAnim] = useState(() => new Animated.Value(0));
  const [captionAnim] = useState(() => new Animated.Value(0));
  // A genuine mutable latch, read only inside the effect (never in render).
  const bloomPlayed = useRef(false);
  useEffect(() => {
    if (phase !== 'closing' || bloomPlayed.current) {
      return;
    }
    bloomPlayed.current = true;
    // Petals unfurl on a 70ms stagger with the ratified cubic-bezier; the calyx
    // swells alongside; the caption rises after a 500ms beat. Nothing loops —
    // each timing settles at 1 and holds (play-once).
    Animated.parallel([
      Animated.stagger(
        70,
        petalAnims.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 700,
            easing: Easing.bezier(0.2, 0.8, 0.3, 1),
            useNativeDriver: true,
          })
        )
      ),
      Animated.timing(calyxAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(captionAnim, {
        toValue: 1,
        duration: 600,
        delay: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [phase, petalAnims, calyxAnim, captionAnim]);

  // The D82 screen order. Main Goal decides whether fit is asked (D73): a
  // non-null main_goal inserts the fit screen before the panels; a null
  // main_goal (the aimless session) skips fit straight to the first panel. The
  // two panels (physical_state then co_consumption) trail the verdict block and
  // lead into closing, the one switch terminal (D82).
  const nextScreen = (current: Phase, mainGoalValue: string | null): Phase => {
    switch (current) {
      case 'ladder':
        return 'energy';
      case 'energy':
        return 'environment';
      case 'environment':
        return 'main_goal';
      case 'main_goal':
        return mainGoalValue !== null ? 'fit' : 'physical_state';
      case 'fit':
        return 'physical_state';
      case 'physical_state':
        return 'co_consumption';
      case 'co_consumption':
        return 'closing';
      default:
        return current;
    }
  };
  // Back is navigation only (D79): the linear predecessor. From the first
  // panel (physical_state) it is fit when main_goal was answered, main_goal
  // otherwise (the derivation that used to live on closing); co_consumption
  // goes back to physical_state; closing goes back to co_consumption (D82).
  const backTarget = (current: Phase): Phase => {
    switch (current) {
      case 'energy':
        return 'ladder';
      case 'environment':
        return 'energy';
      case 'main_goal':
        return 'environment';
      case 'fit':
        return 'main_goal';
      case 'physical_state':
        return lastConfirmed !== null && lastConfirmed.main_goal !== null ? 'fit' : 'main_goal';
      case 'co_consumption':
        return 'physical_state';
      case 'closing':
        return 'co_consumption';
      default:
        return 'ladder';
    }
  };
  // Skip and re-selecting the confirmed value both advance without a write
  // (D79): the sequence moves on, the snapshot is untouched (Skip on an
  // answered axis leaves the value — axis deselection-to-null is banked).
  const advanceNoWrite = () => {
    setSaveError(null);
    setPhase((current) => nextScreen(current, lastConfirmed?.main_goal ?? null));
  };
  // Back affordance: navigation only, never a write, cleared error.
  const goBack = () => {
    setSaveError(null);
    setPhase((current) => backTarget(current));
  };

  // The save attempt (D54): every path is the same insert — same chain,
  // full snapshot (D52). A score tap sends its rung with every fact-class
  // answer carried forward; an axis tap sends the confirmed word + score
  // with the one axis set (fit nulled iff Main Goal, D72); a fit tap or panel
  // toggle sends the confirmed snapshot with its one field changed
  // (D65/D78). Every failure reverts its own control's rendered state by
  // derivation (D55) — no card to move (D80 retired the drag).
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
      setPendingScore(null);
      setPendingAxis(null);
      setPendingFit(null);
      setPendingPanel(null);
      onBusyChange(false);
      if (!failed) {
        setLastConfirmed(snapshot);
        // Advance on CONFIRM, not on tap (D79), for single-select screens
        // only. A panel toggle's confirm must NOT advance (D82): the
        // multi-select grammar settles in place and moves on only when the
        // Done pill fires, so the panel source is gated out of the advance
        // by rule now — not by a terminal phase. Main Goal's just-confirmed
        // value decides the fit branch.
        if (source !== 'panel') {
          setPhase((current) => nextScreen(current, snapshot.main_goal));
        }
        return;
      }
      // A failed insert never advances and touches no snapshot (D55):
      // clearing the source's pending state above already reverted the
      // rendered answer to the last confirmed value. Retry is re-tapping.
      setSaveError("Couldn't save — check your connection.");
    };

    // created_by and deleted are server defaults, never sent. Full
    // snapshot (D52): every fact-class field rides every insert at its
    // snapshot value — axes and panels carried forward on a score tap, one
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
        main_goal: snapshot.main_goal,
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

  // Score tap (D80): tap is the save. Builds exactly the payload the retired
  // drop built — the first-entry shape when nothing is confirmed yet (all
  // fact fields null, the overall word being the only mandatory field), the
  // revision shape carrying every fact-class answer forward otherwise (a new
  // score changes the word, not the questions: the axes stand, so fit stands
  // too — D72's nulling is for Main Goal CHANGES only). Fires through the one
  // writer with the same 'drop' source. A different pill on a Back-revisit is
  // a revision insert with no special-casing (D80); an identical row on a
  // same-pill re-tap is a semantic no-op the schema absorbs (D54).
  const tapScore = (word: string) => {
    const index = RUNGS.findIndex((rung) => rung.word === word);
    const rung = RUNGS[index];
    setPendingScore(rung.word);
    insertEntry(
      lastConfirmed === null
        ? {
            index,
            word: rung.word,
            score: rung.score,
            energy: null,
            environment: null,
            main_goal: null,
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
  // Main Goal is the fit referent (D72): changing Main Goal nulls fit; Target
  // Energy and Setting never touch fit. Axis deselection-to-null is banked
  // (D78).
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
    if (axis === 'main_goal') {
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
  // The confirmed (or pending) score word (D80): the tapped word while its
  // insert is on the wire, the last confirmed word otherwise — a failed tap
  // reverts by derivation (D55).
  const selectedScore = pendingScore ?? (lastConfirmed === null ? null : lastConfirmed.word);
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
    phase === 'energy' || phase === 'environment' || phase === 'main_goal'
      ? AXES.find((axis) => axis.key === phase)
      : undefined;
  // The panel config for the current multi-select screen (D82), undefined off
  // the two panel screens — one PillScreen serves both, mirroring currentAxis.
  const currentPanel =
    phase === 'physical_state' || phase === 'co_consumption'
      ? PANELS.find((panel) => panel.key === phase)
      : undefined;

  return (
    <ThemedView style={styles.container}>
      {/* One shared screen container (D80 scaffold): a safe-area top inset
          plus breathing room above every screen's header, so no header sits
          under the notch. */}
      <ThemedView style={[styles.content, { paddingTop: insets.top + Spacing.four }]}>
        {/* The advance transition layer (D83): the whole screen fades and
            slides home on every phase change. One screen renders at a time
            inside it. */}
        <Animated.View
          style={[
            styles.transitionLayer,
            {
              opacity: phaseAnim,
              transform: [
                { translateX: phaseAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
              ],
            },
          ]}>
          {/* The score screen (D80): the five RUNGS as full-width bottom-
            anchored pills, Loved top to Hated bottom (D51's up-is-better as
            visual order). Tap is the save (D50 contract, D54 pending). No
            Skip — score is the skeleton's mandatory field. The leading
            control is Close (this is the flow's entry, there is no Back):
            it dismisses without writing, disabled while an insert is on the
            wire (D54). */}
        {phase === 'ladder' && (
          <PillScreen
            brand={coa.brand}
            strain={coa.strain}
            title="Rate this Session"
            explainer={EXPLAINERS.ladder}
            values={RUNG_WORDS}
            selected={selectedScore}
            pendingValue={pendingScore}
            tierStripe
            disabled={inFlight}
            error={saveError}
            onSelect={tapScore}
            onLeading={onClose}
            leadingLabel="Close"
          />
        )}

        {/* The three intent axis screens (D71/D79): one axis per screen,
            title = axis name, values as full-width bottom-anchored pills,
            tap-advance on confirm, first-class Skip. Main Goal's confirm nulls
            fit (D72) and branches to the fit screen when answered. */}
        {currentAxis !== undefined && (
          <PillScreen
            brand={coa.brand}
            strain={coa.strain}
            title={currentAxis.label}
            explainer={EXPLAINERS[currentAxis.key]}
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
            onLeading={goBack}
          />
        )}

        {/* The fit screen (D73/D79): shown only when Main Goal was answered;
            main_goal's advance goes straight to closing otherwise. Same
            pill-and-Skip pattern, FITS vocabulary unchanged. */}
        {phase === 'fit' && (
          <PillScreen
            brand={coa.brand}
            strain={coa.strain}
            title="Did it do what you wanted?"
            explainer={EXPLAINERS.fit}
            values={FITS}
            selected={selectedFit}
            pendingValue={pendingFit}
            disabled={inFlight}
            error={saveError}
            onSelect={tapFit}
            onSkip={advanceNoWrite}
            onLeading={goBack}
          />
        )}

        {/* The two multi-select panel screens (D75/D76/D78/D82): one panel
            per screen, now in the required sequence (physical_state then
            co_consumption). PillScreen in multi mode — a tap toggles and
            saves per toggle (D78), the toggled value renders pending, and the
            Done pill advances without writing (Done with nothing selected is
            the skip). Back is the linear predecessor. */}
        {currentPanel !== undefined && (
          <PillScreen
            brand={coa.brand}
            strain={coa.strain}
            title={currentPanel.label}
            explainer={EXPLAINERS[currentPanel.key]}
            values={currentPanel.values}
            selected={null}
            selectedValues={panelValues(currentPanel.key)}
            pendingValue={
              pendingPanel !== null && pendingPanel.field === currentPanel.key
                ? pendingPanel.value
                : null
            }
            disabled={inFlight}
            error={saveError}
            onSelect={(value) => togglePanel(currentPanel.key, value)}
            onDone={advanceNoWrite}
            onLeading={goBack}
          />
        )}

        {/* The closing screen (D82): the survey's terminus. The panels now
            live in the required sequence, so closing loses its "Anything
            else?" entry — a single Close remains, disabled only while an
            insert is on the wire (D54). It asks nothing, so its header shows
            the product line alone (D81: no title passed). Back returns to the
            co-consumption screen (D82). */}
        {phase === 'closing' && (
          <View style={styles.sequenceScreen}>
            <SequenceHeader
              leadingLabel="Back"
              onLeading={goBack}
              disabled={inFlight}
              brand={coa.brand}
              strain={coa.strain}
            />
            {/* The completion bloom (D83 Unfurl 2a) occupies closing's empty
                middle. Per the ratified screen mock the bloom state replaces
                the explainer line (the middle hosts one or the other, not
                both); EXPLAINERS.closing remains the copy of record. */}
            <View style={styles.explainerWrap}>
              <CompletionBloom
                petalAnims={petalAnims}
                calyxAnim={calyxAnim}
                captionAnim={captionAnim}
              />
            </View>
            <View style={styles.closingActions}>
              <Pressable disabled={inFlight} onPress={onClose} style={styles.closeButton}>
                <ThemedText style={styles.closeLabel}>Close</ThemedText>
              </Pressable>
            </View>
          </View>
        )}
        </Animated.View>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: Survey.background,
  },
  content: {
    flex: 1,
    // 26pt sides / 38pt bottom safe padding (D83 item 9).
    paddingHorizontal: 26,
    paddingBottom: 38,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    backgroundColor: Survey.background,
  },
  // Siblings of the tapped pill dim during a save (D83 Layer 1); the tapped
  // pill stays lit and carries the spinner.
  chipDim: {
    opacity: 0.32,
  },
  // The advance transition wraps the one rendered screen (D83); flex so the
  // screen fills exactly as it did unwrapped.
  transitionLayer: {
    flex: 1,
  },
  // The one-screen sequence (D79/D80): a flex column — header at the top, the
  // explainer filling the empty middle, the answer stack anchored to the
  // bottom (thumb reach).
  sequenceScreen: {
    flex: 1,
  },
  // The left-aligned header block (D83): the control chip over the product
  // identification, both flush left.
  sequenceHeader: {
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  // The header dims to 40% while a save is on the wire (D83 Layer 1).
  headerSaving: {
    opacity: 0.4,
  },
  // The control chip (D83 item 9): 44pt tall, r22, surface, a leading glyph +
  // label, sized to its content and pinned left.
  controlChip: {
    height: 44,
    borderRadius: 22,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Survey.surface,
  },
  controlChipLabel: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 16,
    color: Survey.text,
  },
  headerBlock: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
  brandLabel: {
    fontFamily: SORA_MEDIUM,
    fontSize: 15,
    // .14em at 15pt.
    letterSpacing: 2.1,
    textTransform: 'uppercase',
    lineHeight: 20,
    color: Survey.subtext,
  },
  productLine: {
    fontFamily: SORA_BOLD,
    fontSize: 38,
    lineHeight: 39,
    color: Survey.text,
  },
  question: {
    fontFamily: SORA_MEDIUM,
    fontSize: 23,
    lineHeight: 30,
    color: Survey.accent,
  },
  // The empty middle is the reading surface (D83): the explainer centered in it.
  explainerWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  explainer: {
    fontFamily: SERIF_ITALIC,
    fontStyle: 'italic',
    fontSize: 18,
    lineHeight: 28,
    color: Survey.subtext,
  },
  pillStack: {
    gap: Spacing.two,
  },
  pill: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.four,
    paddingVertical: Spacing.three,
    // Clips the tier stripe to the pill's rounded leading edge.
    overflow: 'hidden',
  },
  // Multi-select pills (D82.1): the checkbox and label sit in a centered row.
  pillMulti: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pillLabel: {
    fontFamily: SORA_MEDIUM,
    fontSize: 16,
  },
  // The tapped pill's saving row (D83 Layer 1): spinner beside "Saving…".
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  // The 20pt saving spinner (D83 Layer 1): a ring with one transparent edge;
  // border color is set inline to match the pill's label.
  spinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.5,
  },
  // The score-pill tier stripe (D83): a 5pt colored bar on the leading edge,
  // clipped to the pill radius by the pill's overflow:hidden.
  tierStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  // The leading checkbox square (D82.1 grammar, D83 treatment): 20pt, r6, a
  // 1.5pt border; fill and glyph color are set inline by selection state.
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The check itself is drawn, never typed: Sora carries no U+2713, so a text
  // check resolved to an iOS fallback face whose ink escaped the square. Two
  // borders on a rotated box give deterministic geometry and no font dependence.
  checkMark: {
    width: 10,
    height: 5,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Survey.onAccent,
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
  },
  skipPill: {
    marginTop: Spacing.one,
    backgroundColor: Survey.surface,
  },
  donePill: {
    marginTop: Spacing.one,
    backgroundColor: Survey.accent,
  },
  // The inline save-error banner (D54 error, D83 treatment): surface-hi with a
  // 1px error border, a round badge, and the message.
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Survey.errorBorder,
    backgroundColor: Survey.surfaceHi,
  },
  errorBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Survey.errorDot,
  },
  errorBadgeGlyph: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 13,
    color: Survey.onAccent,
  },
  errorText: {
    flex: 1,
    fontFamily: SORA_MEDIUM,
    fontSize: 15,
    lineHeight: 20,
    color: Survey.text,
  },
  closingActions: {
    gap: Spacing.two,
  },
  // The closing Close (D83): the confirm treatment — accent-filled, dark text.
  closeButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: Survey.accent,
  },
  closeLabel: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 16,
    color: Survey.onAccent,
  },
  // The completion bloom (D83 Unfurl 2a). Art box over caption, centered.
  bloomWrap: {
    alignItems: 'center',
    gap: Spacing.five,
  },
  // The bloom art field; petals root at its center and overflow it.
  bloomArt: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The glow halo (D83): a soft accent disc centered behind the petals. RN
  // core has no blur, so this translucent disc approximates the mock's
  // filter:blur(26px) (see report item 5).
  bloomGlow: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Survey.accent,
    opacity: 0.3,
  },
  // A petal's 0x0 root at the art center; its static 60deg rotation is applied
  // inline per index, and the animated petal hangs off it.
  petalRoot: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 0,
    height: 0,
  },
  // One petal (D83): 24x48, rounded (RN circular radii approximate the mock's
  // elliptical border-radius), rooted at its base so scaleY unfurls upward.
  petal: {
    position: 'absolute',
    left: -12,
    top: -56,
    width: 24,
    height: 48,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    backgroundColor: Survey.accent,
    transformOrigin: '50% 100%',
  },
  // The calyx dot (D83): 22pt, white, at the art center beneath the petals.
  calyx: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 22,
    height: 22,
    marginLeft: -11,
    marginTop: -11,
    borderRadius: 11,
    backgroundColor: Survey.text,
  },
  // "Logged." (D83): 26/600, calm.
  loggedText: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 26,
    textAlign: 'center',
    color: Survey.text,
  },
  // The serif-italic completion line (D83).
  loggedSub: {
    fontFamily: SERIF_ITALIC,
    fontStyle: 'italic',
    fontSize: 15,
    marginTop: Spacing.half,
    textAlign: 'center',
    color: Survey.subtext,
  },
});
