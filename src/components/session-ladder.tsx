import { uuid } from 'expo-modules-core';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Dash, MaxContentWidth, Spacing, verdictHue } from '@/constants/theme';
import { GLOSSARY, type GlossaryEntry, LEXICON_VERSION, RUNGS } from '@/lib/lexicon';
import { supabase } from '@/lib/supabase';

// Rung order is the lexicon's (D51, preserved as visual order by D80): up =
// better, best word at the top, "Neutral" at dead center, worst at the bottom.
// Words and scores resolve through the one source.
const RUNG_WORDS = RUNGS.map((rung) => rung.word);

// ~10s client abort (D54): a hung insert fails visibly instead of holding
// the surface's dismissal guard forever.
const INSERT_TIMEOUT_MS = 10000;

// The card chip renders identity; the insert needs the id (coa_id).
type LadderCoa = {
  id: string;
  strain: string | null;
  brand: string | null;
};

// One entry's writable fields (D52 full snapshot). The survey cut (D93)
// retired every fact class as a question and D94 dropped their columns, so
// what remains is the rung answer plus the optional free-text note (D95).
// lastConfirmed holds exactly this shape, and every insert sends one.
type Snapshot = {
  index: number;
  word: string;
  score: number;
  notes: string | null;
};

// Which control fired the insert. Both sources revert by derivation when their
// pending state clears (D55); the source is still tracked because a score tap
// advances to closing on confirm while a note write ends the survey (D95).
type InsertSource = 'drop' | 'note';

// The survey is two screens (D92): the score pill screen, then closing. The
// score screen advances on insert CONFIRM (not on tap); closing terminates.
// Everything between them — the three intent axes, fit, and the two confound
// panels — retired with D93, so there is no conditional branch left in the
// sequence and no Skip (D92: with no optional questions there is nothing to
// skip; D79's principle is not repealed, it has no surface left). Conditional
// render wrapped in the D83 advance transition.
type Phase = 'ladder' | 'closing';

// Font families registered app-wide in the root layout (D83 Decision 1).
// Referenced by name; when a family is not yet loaded RN falls back to the
// system font — the ratified fallback, so the survey never blocks on a font.
const SORA_MEDIUM = 'Sora_500Medium';
const SORA_SEMIBOLD = 'Sora_600SemiBold';
const SORA_BOLD = 'Sora_700Bold';
const SORA_DISPLAY = 'Sora_800ExtraBold';
const SERIF_ITALIC = 'Newsreader_400Regular_Italic';

// The inline save-error banner's two hues (D54's error state). The reference
// token set carries no error color: its verdict band is a band identity, and
// borrowing a rung's hue here would make a failed insert read as a verdict.
// These are the values the banner already rendered, carried across the token
// move unchanged; the literal-hex precedent is sign-in.tsx.
const ERROR_BORDER = '#d6725d';
const ERROR_DOT = '#eb8656';

// One explainer line per screen (D83 Decision 2), verbatim from
// documentation/design/art-direction.md — personal, observational, zero
// pharmacology, each pointing at the user's own log. Occupies the empty middle
// in serif italic. None of these strings contains a double quote, so they read
// cleanly as double-quoted literals; the "--" is the doc's ASCII em dash.
const EXPLAINERS: Record<Phase, string> = {
  ladder: "Gut call. How this run stacked up against the rest of your shelf.",
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

// The completion bloom (D83 Unfurl 2a), redrawn to reference 05: a bloom mark
// of rounded bars over a center dot, accent on a 14%-accent circle. Reference
// 05 describes the mark as THREE rotated bars; a bar spans the full diameter,
// so three bars at 60deg apart and six center-rooted arms at 60deg apart are
// the same six-fold figure. The six-arm form is what is drawn here, because it
// is the form the six ratified Animated.Values already drive — the motion
// budget, count, stagger, timings, and the held-settled latch are untouched
// (D83), and only the art they animate is redrawn.
//
// The value names (petalAnims, calyxAnim) keep their ratified spelling for the
// same reason: the values are the ratified thing. The style keys below carry
// the reference's vocabulary.
//
// All motion is passed in as native-driven Animated.Values owned by
// SessionLadder, so a Back-and-return to closing shows the held (settled)
// bloom rather than replaying it. Each arm wrapper carries a static 60deg
// rotation; the inner bar scales up from its base (transformOrigin 50% 100%).
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
        <View style={styles.bloomCircle} />
        {petalAnims.map((anim, i) => (
          <View key={i} style={[styles.bloomBarRoot, { transform: [{ rotate: `${i * 60}deg` }] }]}>
            <Animated.View
              style={[
                styles.bloomBar,
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
            styles.bloomDot,
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
  onInfo,
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
  // The glossary info trigger (D86): present only on a term-bearing phase, so
  // omitting it is how closing structurally carries no trigger (D86.6, restated
  // by D96). Opens the read-only definition sheet; it never touches survey
  // state.
  onInfo?: () => void;
}) {
  // The dominant line is the strain when present, the brand otherwise, so a
  // single-named COA reads as one strong line rather than a lonely label over
  // an empty product. The brand label shows above only when both exist.
  const productLine = strain ?? brand ?? '';
  const brandLabel = strain !== null ? brand : null;
  return (
    <View style={[styles.sequenceHeader, saving && styles.headerSaving]}>
      {/* The top row holds the leading nav chip and, on a term-bearing phase,
          the trailing glossary trigger (D86). space-between keeps the nav chip
          left when the trigger is absent (closing). */}
      <View style={styles.headerTopRow}>
        <Pressable disabled={disabled} onPress={onLeading} style={styles.controlChip}>
          {/* Leading glyph per D83 item 9: cross for Close, single-angle for
              Back. */}
          <ThemedText style={styles.controlChipLabel}>
            {(leadingLabel === 'Close' ? '✕ ' : '‹ ') + leadingLabel}
          </ThemedText>
        </Pressable>
        {onInfo !== undefined && (
          <Pressable disabled={disabled} onPress={onInfo} style={styles.controlChip}>
            {/* An ASCII label, not a glyph: Sora's cmap is not guaranteed to
                carry an info codepoint (cf. the U+2713 checkbox fix), and a
                word is unambiguously discoverable at the gate. */}
            <ThemedText style={styles.controlChipLabel}>Info</ThemedText>
          </Pressable>
        )}
      </View>
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

// The score screen (D80): a header, the values as full-width bottom-anchored
// pills in thumb reach, and the inline save error. Tap is the save and the
// screen advances on CONFIRM. There is no Skip — the overall word is the
// skeleton's one mandatory field (D80) — and no multi-select grammar: D92 left
// exactly one call site here, so the Done/checkbox machinery the panels needed
// retired with them rather than sitting unused. Tap semantics live in the
// owner; this renders selection/pending state and the error only. The chip
// visual grammar is unchanged — selected inverts (text token as fill), pending
// rides with the spinner (D57/D80).
function PillScreen({
  brand,
  strain,
  title,
  explainer,
  values,
  selected,
  pendingValue,
  tierStripe = false,
  disabled,
  error,
  glossary,
  onSelect,
  onLeading,
  leadingLabel = 'Back',
}: {
  brand: string | null;
  strain: string | null;
  title: string;
  explainer: string;
  values: readonly string[];
  // This phase's glossary group (D86): the term+definition entries its
  // read-only sheet shows. The one term-bearing phase left is the ladder
  // (D96), so the trigger always shows here; closing does not render a
  // PillScreen and therefore carries no trigger (D86.6).
  glossary: readonly GlossaryEntry[];
  selected: string | null;
  pendingValue: string | null;
  // The score screen (D83, ratified item 2): a 5pt leading tier stripe per
  // pill, best -> worst, so hue reinforces the order score already carries.
  tierStripe?: boolean;
  disabled: boolean;
  error: string | null;
  onSelect: (value: string) => void;
  onLeading: () => void;
  leadingLabel?: string;
}) {
  // Saving state (D83 Layer 1): an insert on this screen is on the wire iff a
  // pill is pending. The tapped pill spins; header + siblings dim.
  const saving = pendingValue !== null;
  // The glossary sheet's only state (D86.7: nothing beyond this visibility
  // boolean). The sheet's Modal covers the pills, so a phase cannot advance
  // while it is open; the Info trigger is also disabled in flight (below), so
  // the phase never changes under an open sheet and no reset effect is needed.
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  return (
    <>
    <View style={styles.sequenceScreen}>
      <SequenceHeader
        leadingLabel={leadingLabel}
        onLeading={onLeading}
        disabled={disabled}
        brand={brand}
        strain={strain}
        title={title}
        saving={saving}
        onInfo={() => setGlossaryOpen(true)}
      />
      {/* The explainer occupies the empty middle as the reading surface (D83):
          one line of personal context, serif italic, quiet. */}
      <View style={styles.explainerWrap}>
        <ThemedText style={styles.explainer}>{explainer}</ThemedText>
      </View>
      <View style={styles.pillStack}>
        {values.map((value) => {
          const isSelected = value === selected;
          const isPending = value === pendingValue;
          const labelColor = isSelected ? Dash.bg : Dash.text;
          return (
            <Pressable
              key={value}
              // Disabled while any insert is on the wire (D54).
              disabled={disabled}
              onPress={() => onSelect(value)}
              style={[
                styles.pill,
                // Selection inverts (the unchanged D57/D80 chip grammar,
                // restyled): a rung card is a surface until it is the answer.
                // The inversion is not decoration -- it is the only thing that
                // renders the confirmed selection on a Back-and-retap revisit,
                // so it survives the restyle rather than being dropped for the
                // reference's resting state.
                { backgroundColor: isSelected ? Dash.text : Dash.surface },
                // Saving state (D83 Layer 1): siblings of the tapped pill dim to
                // 32%; the tapped pill stays lit and shows the spinner below.
                saving && !isPending && styles.chipDim,
              ]}>
              {/* The rung's leading band (D83's stripe, retuned by D103 to the
                  reference's verdict hues): only the band is colored, the body
                  stays surface. Absolute so it never shifts the centered label.
                  Keyed by the rung WORD through the one hue source, not by pill
                  index -- an index-keyed ramp reads correctly only for as long
                  as nobody reorders the array. */}
              {tierStripe && (
                <View style={[styles.tierStripe, { backgroundColor: verdictHue(value) }]} />
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
      </View>
    </View>
    {/* The glossary sheet (D86): a pageSheet Modal matching the app's overlay
        grammar (D86.7). Read-only — it lists this phase's ratified definitions
        and a Close, and touches no survey state. Dismissible by Close or the
        native pageSheet pull-down (D86.2). */}
    <Modal
      visible={glossaryOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setGlossaryOpen(false)}
      onDismiss={() => setGlossaryOpen(false)}>
      <ThemedView style={styles.glossarySheet}>
        <View style={styles.glossaryHeader}>
          <Pressable onPress={() => setGlossaryOpen(false)} style={styles.controlChip}>
            <ThemedText style={styles.controlChipLabel}>Close</ThemedText>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.glossaryList}>
          {glossary.map((entry) => (
            <View key={entry.term} style={styles.glossaryEntry}>
              <ThemedText style={styles.glossaryTerm}>{entry.term}</ThemedText>
              <ThemedText style={styles.glossaryDef}>{entry.definition}</ThemedText>
            </View>
          ))}
        </ScrollView>
      </ThemedView>
    </Modal>
    </>
  );
}

/**
 * The session-logging surface, cut to two screens by D92: the score screen,
 * then closing. Minimum cost is two taps; maximum is two taps plus typing.
 *
 * The score screen (D80) leads — the five RUNGS as full-width stacked pills,
 * Loved at top, Hated at bottom, carrying D51's up-is-better geometry as visual
 * order. A score tap is the save attempt: it inserts a session entry
 * immediately (the D50 tap-is-the-save contract, motion changed from the
 * retired drag) and the tapped pill renders pending until the insert confirms
 * (D54). The flow advances on CONFIRM, not on tap. Back from closing and
 * tapping a different pill inserts a revision row into the same chain (D52)
 * under the same grammar; a failed revision reverts to the last confirmed truth
 * by derivation (D55).
 *
 * Closing (D92) carries the product identification (D81), the completion bloom,
 * an optional free-text note (D95), and Close. The note is the one deliberate
 * exception to tap-is-the-save — text has no tap — so it writes a single
 * revision insert when Close fires, never keystroke-by-keystroke, and closing
 * with an empty note writes nothing at all. Empty normalizes to null, never ''
 * (the ND != 0 family, D78's rule for the retired panels). Every write rides
 * the one insertEntry pipeline under the same D54/D55 grammar.
 *
 * The three intent axes, fit, and the two confound panels retired as questions
 * with D93 and as columns with D94. Nothing removed ever touched the score, the
 * band, or the shelf (skeleton item 1), so this cut cannot corrupt them.
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
  // Plain inline error (D54), rendered beneath the pills on the score screen
  // and above Close on closing; cleared when the next insert fires.
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
  // D95). Its note is null until a note write confirms (entry 1 sends null).
  // State for the same reason as sessionId.
  const [lastConfirmed, setLastConfirmed] = useState<Snapshot | null>(null);
  // The score word whose insert is on the wire (D80): renders pending on its
  // pill. Cleared on resolution either way — on failure the selection falls
  // back to the last confirmed word by derivation, which is exactly D55's
  // revert.
  const [pendingScore, setPendingScore] = useState<string | null>(null);
  // The note's draft text (D95). It lives at surface scope, not on the closing
  // screen, so a Back to the score screen and a return does not lose what was
  // typed. It is NOT the confirmed value — lastConfirmed.notes is — so the
  // comparison on Close is draft-vs-confirmed and an unchanged note writes
  // nothing.
  const [noteText, setNoteText] = useState('');
  // The surface's phase (D92): the current screen of the two. One screen
  // renders at a time; the flow state lives up here and survives every screen
  // change, so Back to the score screen lands on the intact confirmed
  // selection.
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

  // The D92 screen order, now linear and unconditional: the score screen leads
  // into closing, the one terminal. Main Goal's fit branch retired with the
  // question (D93), so nothing decides this any more.
  const nextScreen = (current: Phase): Phase => (current === 'ladder' ? 'closing' : current);
  // Back is navigation only (D79's grammar, the part that survives): the linear
  // predecessor. With two screens there is exactly one — closing goes back to
  // the score screen, which is where revision by Back-and-retap happens (D92).
  // The score screen renders Close, not Back, so no other case exists to
  // answer and the target takes no argument.
  const backTarget = (): Phase => 'ladder';
  // Back affordance: navigation only, never a write, cleared error.
  const goBack = () => {
    setSaveError(null);
    setPhase(backTarget());
  };

  // The save attempt (D54): every path is the same insert — same chain,
  // full snapshot (D52). A score tap sends its rung with the note carried
  // forward; the note write sends the confirmed snapshot with its one field
  // changed (D95). Every failure reverts its own control's rendered state by
  // derivation (D55) — no card to move (D80 retired the drag).
  const insertEntry = (snapshot: Snapshot, source: InsertSource) => {
    const chainId = sessionId ?? uuid.v4();
    if (sessionId === null) {
      setSessionId(chainId);
    }
    setSaveError(null);
    setInFlightSource(source);
    onBusyChange(true);

    // Hermes has no AbortSignal.timeout; compose abort from a timer.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), INSERT_TIMEOUT_MS);

    const finish = (failed: boolean) => {
      clearTimeout(timer);
      setInFlightSource(null);
      setPendingScore(null);
      onBusyChange(false);
      if (!failed) {
        setLastConfirmed(snapshot);
        // A confirmed note write ends the survey (D95: the note writes once, on
        // Close, and Close is what fired it) rather than advancing a phase —
        // closing is already the terminal. A confirmed score advances on
        // CONFIRM, not on tap (D79's rule, unchanged).
        if (source === 'note') {
          onClose();
          return;
        }
        setPhase((current) => nextScreen(current));
        return;
      }
      // A failed insert never advances, never closes, and touches no snapshot
      // (D55): clearing the source's pending state above already reverted the
      // rendered answer to the last confirmed value, and a failed note write
      // leaves the surface on closing with the draft intact. Retry is
      // re-tapping — the pill on the score screen, Close on closing.
      setSaveError("Couldn't save — check your connection.");
    };

    // created_by and deleted are server defaults, never sent. Full
    // snapshot (D52): the note rides every insert at its snapshot value —
    // carried forward on a score tap, changed on the one note write (D95).
    // On the lazy path it stays null (the overall word is the only mandatory
    // field). The six retired fact columns are gone from the schema (D94) and
    // are not sent.
    supabase
      .from('session_entries')
      .insert({
        session_id: chainId,
        coa_id: coa.id,
        lexicon_version: LEXICON_VERSION,
        overall_word: snapshot.word,
        overall_score: snapshot.score,
        notes: snapshot.notes,
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

  // Score tap (D80): tap is the save. The first-entry shape when nothing is
  // confirmed yet (the note null, the overall word being the only mandatory
  // field), the revision shape carrying the note forward otherwise. Fires
  // through the one writer with the same 'drop' source. A different pill on a
  // Back-revisit is a revision insert with no special-casing (D80); an
  // identical row on a same-pill re-tap is a semantic no-op the schema
  // absorbs (D54).
  const tapScore = (word: string) => {
    const index = RUNGS.findIndex((rung) => rung.word === word);
    const rung = RUNGS[index];
    setPendingScore(rung.word);
    insertEntry(
      lastConfirmed === null
        ? { index, word: rung.word, score: rung.score, notes: null }
        : { ...lastConfirmed, index, word: rung.word, score: rung.score },
      'drop'
    );
  };

  // Closing's Close (D95): the note's one write, then the dismissal. Empty is
  // null, never '' — the same normalization the panels carried (D78) and the
  // same family as ND != 0. An unchanged note (including the untouched-empty
  // case, and the touched-then-emptied case, both of which normalize to null)
  // writes nothing: no revision insert, no row churn. A null lastConfirmed
  // takes the same no-write path — closing is only reachable on a confirmed
  // score, so there is no row to revise and nothing to fabricate.
  const closeWithNote = () => {
    const trimmed = noteText.trim();
    const normalized = trimmed === '' ? null : trimmed;
    if (lastConfirmed === null || normalized === lastConfirmed.notes) {
      onClose();
      return;
    }
    insertEntry({ ...lastConfirmed, notes: normalized }, 'note');
  };

  // The confirmed (or pending) score word (D80): the tapped word while its
  // insert is on the wire, the last confirmed word otherwise — a failed tap
  // reverts by derivation (D55).
  const selectedScore = pendingScore ?? (lastConfirmed === null ? null : lastConfirmed.word);

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
            title="Rate this session"
            explainer={EXPLAINERS.ladder}
            glossary={GLOSSARY.ladder}
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

        {/* The closing screen (D92): the survey's terminus, now the second of
            two. It asks nothing, so its header shows the product line alone
            (D81: no title passed) and carries no glossary trigger (D86.6's
            structural exclusion, restated by D96). It holds the optional
            free-text note (D95), whose single revision insert fires on Close,
            and Close itself — both disabled while an insert is on the wire
            (D54). Back returns to the score screen, which is where revision by
            Back-and-retap lives.

            This is the one screen with a text input, so it is the one screen
            that avoids the keyboard: the note and Close are bottom-anchored and
            the keyboard would otherwise cover both. The 2026-07-27 device gate
            failed exactly there — the operator typed a note and could not reach
            Close. KeyboardAvoidingView behavior="padding" was the first attempt
            and does not work here: it is not the outermost container, it sits
            inside a padded parent and an Animated.View carrying a transform, and
            its measured frame yields no usable inset. A keyboardVerticalOffset
            would only trade that for a per-device constant, so the container is a
            ScrollView instead and the platform supplies the inset itself.

            Both scroll props are load-bearing and neither substitutes for the
            other. automaticallyAdjustKeyboardInsets is what makes Close
            reachable. keyboardShouldPersistTaps="handled" is what makes the FIRST
            tap on Close register: without it the tap is swallowed as a keyboard
            dismissal, nothing saves, and Close reads as a dead button.

            The score screen has no input and keeps its plain View container. */}
        {phase === 'closing' && (
          <ScrollView
            style={styles.sequenceScreen}
            contentContainerStyle={styles.closingContent}
            automaticallyAdjustKeyboardInsets
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
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
              {/* The same inline save-error banner the score screen carries
                  (D54): a failed note write stays on closing and shows it, so
                  retry is re-tapping Close. */}
              {saveError !== null && (
                <View style={styles.errorBanner}>
                  <View style={styles.errorBadge}>
                    <ThemedText style={styles.errorBadgeGlyph}>!</ThemedText>
                  </View>
                  <ThemedText style={styles.errorText}>{saveError}</ThemedText>
                </View>
              )}
              {/* The note (D95): optional, multiline, never mandatory, and
                  never in the inference path — it is the channel through which
                  the operator discovers which structured question deserves to
                  exist later. Its value is held at surface scope so a Back to
                  the score screen and a return keeps the draft. */}
              <TextInput
                style={styles.noteInput}
                value={noteText}
                onChangeText={setNoteText}
                editable={!inFlight}
                multiline
                placeholder="Add a note"
                placeholderTextColor={Dash.textMuted}
              />
              <Pressable disabled={inFlight} onPress={closeWithNote} style={styles.closeButton}>
                <ThemedText style={styles.closeLabel}>Close</ThemedText>
              </Pressable>
            </View>
          </ScrollView>
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
    backgroundColor: Dash.bg,
  },
  content: {
    flex: 1,
    // 26pt sides / 38pt bottom safe padding (D83 item 9).
    paddingHorizontal: 26,
    paddingBottom: 38,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    backgroundColor: Dash.bg,
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
  // The closing screen's scroll content (keyboard-inset fix). A ScrollView's
  // children do not inherit flex from its `style` — that sizes the scroll frame,
  // not the content — so the growth has to live here or the column collapses to
  // content height and the bottom anchor is lost. flexGrow: 1 reproduces exactly
  // what sequenceScreen's flex: 1 gave the plain View: header at the top, the
  // explainer/bloom middle taking the slack, the actions pinned at the bottom.
  closingContent: {
    flexGrow: 1,
  },
  // The left-aligned header block (D83): the control chip over the product
  // identification, both flush left.
  sequenceHeader: {
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  // The header's top row (D86): the leading nav chip and the trailing glossary
  // trigger. space-between pins the nav chip left; when the trigger is absent
  // (closing) the lone chip stays left, unchanged from the pre-D86 layout.
  headerTopRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // The header dims to 40% while a save is on the wire (D83 Layer 1).
  headerSaving: {
    opacity: 0.4,
  },
  // The control chip (D83 item 9), now the reference's pill: 44pt tall, pill
  // radius, surface fill, a leading glyph + label, sized to its content.
  controlChip: {
    height: 44,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Dash.surface,
  },
  controlChipLabel: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 16,
    color: Dash.text,
  },
  headerBlock: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
  // The brand eyebrow above the strain. Rendered only when the COA carries a
  // brand AND a strain (see SequenceHeader) -- never an empty eyebrow, and
  // never a lonely label over a promoted brand.
  brandLabel: {
    fontFamily: SORA_MEDIUM,
    fontSize: 15,
    // .14em at 15pt.
    letterSpacing: 2.1,
    textTransform: 'uppercase',
    lineHeight: 20,
    color: Dash.textMuted,
  },
  // The display role (Sora 800, uppercase strain names) at D83's ratified
  // survey size: the survey's product line is the screen's dominant element
  // and keeps its 38pt, where the card's poster treatment sits at 28.
  productLine: {
    fontFamily: SORA_DISPLAY,
    fontSize: 38,
    lineHeight: 39,
    textTransform: 'uppercase',
    color: Dash.text,
  },
  question: {
    fontFamily: SORA_BOLD,
    fontSize: 23,
    lineHeight: 30,
    color: Dash.accent,
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
    color: Dash.textBody,
  },
  pillStack: {
    gap: Spacing.two,
  },
  // A rung card (reference 04): 56pt tall, radius 15, surface. Fixed height
  // rather than vertical padding, so the five cards are one rhythm regardless
  // of what a label does.
  pill: {
    alignSelf: 'stretch',
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    // Clips the leading band to the card's rounded leading edge.
    overflow: 'hidden',
  },
  pillLabel: {
    fontFamily: SORA_SEMIBOLD,
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
  // The rung's leading band (D83's stripe, D103's hue retune): a 5pt colored
  // bar on the leading edge, clipped to the card radius by overflow:hidden.
  tierStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  // The inline save-error banner (D54 error, D83 treatment): the raised
  // surface with a 1px error border, a round badge, and the message.
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ERROR_BORDER,
    backgroundColor: Dash.surface2,
  },
  errorBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ERROR_DOT,
  },
  errorBadgeGlyph: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 13,
    color: Dash.bg,
  },
  errorText: {
    flex: 1,
    fontFamily: SORA_MEDIUM,
    fontSize: 15,
    lineHeight: 20,
    color: Dash.text,
  },
  closingActions: {
    gap: Spacing.two,
  },
  // The note field (D95, restyled only): the reference's nested-row surface and
  // radius, and the serif italic the explainer voice already uses — what the
  // user types is their own words, so it reads in the voice the survey reserves
  // for them. D95's semantics are untouched: same state, same one write on
  // Close, same normalization, same placeholder. multiline needs an explicit
  // minHeight and top-aligned text; it stays a note-sized box, not an essay.
  noteInput: {
    alignSelf: 'stretch',
    minHeight: 88,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    backgroundColor: Dash.surface2,
    fontFamily: SERIF_ITALIC,
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 22,
    color: Dash.text,
    textAlignVertical: 'top',
  },
  // The closing Close (D83): the confirm treatment — accent-filled, dark text.
  closeButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: Spacing.four,
    paddingVertical: Spacing.three,
    backgroundColor: Dash.accent,
  },
  closeLabel: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 16,
    color: Dash.bg,
  },
  // The completion bloom (D83 Unfurl 2a). Art box over caption, centered.
  bloomWrap: {
    alignItems: 'center',
    gap: Spacing.five,
  },
  // The bloom art field; the bars root at its center and overflow it.
  bloomArt: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The 14%-accent circle the mark sits on (reference 05). It replaces the
  // former blur-approximating glow disc: the reference names a defined circle,
  // which RN core draws exactly, so nothing here is an approximation any more.
  bloomCircle: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(126, 217, 155, 0.14)',
  },
  // One arm's 0x0 root at the art center; its static 60deg rotation is applied
  // inline per index, and the animated bar hangs off it.
  bloomBarRoot: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 0,
    height: 0,
  },
  // One arm of the mark (reference 05): a fully rounded 22x46 bar running from
  // the center outward, rooted at its base so scaleY unfurls outward. Six of
  // these at 60deg is the reference's three rotated bars; the inner ends meet
  // under the center dot.
  bloomBar: {
    position: 'absolute',
    left: -11,
    top: -46,
    width: 22,
    height: 46,
    borderRadius: 11,
    backgroundColor: Dash.accent,
    transformOrigin: '50% 100%',
  },
  // The center dot (reference 05): 22pt at the art center, over the bars.
  bloomDot: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 22,
    height: 22,
    marginLeft: -11,
    marginTop: -11,
    borderRadius: 11,
    backgroundColor: Dash.text,
  },
  // "Logged." in the reference's display role (Sora 800, 28/1.1).
  loggedText: {
    fontFamily: SORA_DISPLAY,
    fontSize: 28,
    lineHeight: 31,
    textAlign: 'center',
    color: Dash.text,
  },
  // The serif-italic completion line (D83), reference 05's copy.
  loggedSub: {
    fontFamily: SERIF_ITALIC,
    fontStyle: 'italic',
    fontSize: 15,
    marginTop: Spacing.half,
    textAlign: 'center',
    color: Dash.textMuted,
  },
  // The glossary sheet (D86): a read-only pageSheet, re-themed only. Its
  // entries, its trigger, and its read-only nature are untouched (D96). Its
  // container carries the survey background and the D83 side margins; the
  // pageSheet supplies its own top offset from the notch.
  glossarySheet: {
    flex: 1,
    backgroundColor: Dash.bg,
    paddingHorizontal: 26,
    paddingTop: Spacing.four,
    paddingBottom: 38,
    gap: Spacing.three,
  },
  // Close sits top-right, mirroring the survey header's control-chip grammar.
  glossaryHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  glossaryList: {
    gap: Spacing.four,
    paddingBottom: Spacing.four,
  },
  glossaryEntry: {
    gap: Spacing.one,
  },
  // The term leads in accent (the survey's emphasis color); the definition
  // reads beneath it in body text, verbatim from the ratified language (D86.3).
  glossaryTerm: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 18,
    lineHeight: 24,
    color: Dash.accent,
  },
  glossaryDef: {
    fontFamily: SORA_MEDIUM,
    fontSize: 15,
    lineHeight: 21,
    color: Dash.text,
  },
});
