import * as Haptics from 'expo-haptics';
import { uuid } from 'expo-modules-core';
import { useEffect, useState } from 'react';
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
import { Dash, MaxContentWidth, Spacing, Type, verdictHue } from '@/constants/theme';
import { appAlert } from '@/lib/app-alert';
import {
  EFFECTS,
  type EffectGroup,
  GLOSSARY,
  type GlossaryEntry,
  LEXICON_VERSION,
  RUNGS,
} from '@/lib/lexicon';
import { supabase } from '@/lib/supabase';

// Rung order is the lexicon's (D51, preserved as visual order by D80): up =
// better, best word at the top, "Neutral" at dead center, worst at the bottom.
// Words and scores resolve through the one source.
const RUNG_WORDS = RUNGS.map((rung) => rung.word);

// The reference's fixed emoji pair per rung (D141): display-only identity
// beside the word, keyed by the word through the one source. Never stored --
// the row carries the word and the hidden score exactly as before.
const RUNG_EMOJI: Record<string, string> = {
  Loved: '\u{1F929}',
  Liked: '\u{1F44D}',
  Neutral: '\u{1F610}',
  Disliked: '\u{1F44E}',
  Hated: '\u{1F6AB}',
};

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
// what remains is the rung answer plus the closing screen's two optional
// fields: the free-text note (D95) and the effect tags (D119). Tags are one
// flat array in tap order; null and empty mean the same thing to the column,
// so the client collapses to null and never sends an empty array (D119's
// restatement of the D75 collapse). lastConfirmed holds exactly this shape,
// and every insert sends one.
// `deleted` joins the shape because soft delete IS an entry, not an operation
// on one (D52): the discard path writes a tombstone through the same pipeline
// as every other write, so the flag has to travel in the snapshot rather than
// beside it. Every non-discard write carries false explicitly instead of
// leaning on the column default, so the payload states the entry's whole
// truth rather than half of it.
type Snapshot = {
  index: number;
  word: string;
  score: number;
  notes: string | null;
  effects: string[] | null;
  deleted: boolean;
};

// Which control fired the insert. Both sources revert by derivation when their
// pending state clears (D55); the source is still tracked because a score tap
// advances to closing on confirm while the closing write ends the survey
// (D95). The closing source covers the whole screen, not the note alone: one
// insert carries the note and the tags together (D95's exception extended to
// the screen by the 2026-08-04 ruling). 'discard' is the tombstone write: the
// same pipeline, the same D54/D55 grammar, a snapshot whose deleted is true.
type InsertSource = 'drop' | 'closing' | 'discard';

// How this presentation ended, reported to the owner.
//
// The outcome is derived from STATE — whether a score ever confirmed — and
// never from which control fired. That is the whole correction of the
// 2026-08-04 device-gate defect: page-1's Close reported 'cancelled'
// unconditionally, so a rated session reached by Back and then closed from the
// top was announced as if nothing had been logged, while its row sat on the
// shelf. A control knows what the user pressed; only the state knows what
// exists.
//
// - 'logged'    — a score confirmed and its row stands. Every non-discard
//                 dismissal of a rated session reports this, including an
//                 outside or system dismissal: closing from the top saves
//                 (operator ruling).
// - 'cancelled' — nothing was ever confirmed, so nothing was written.
// - 'discarded' — a score confirmed and the user then discarded it; a
//                 tombstone row was written. Distinct from 'cancelled'
//                 because a write happened, and reporting a write as
//                 'cancelled' would be a false report to the owner.
//
// A FAILED insert is none of these: it does not dismiss at all (D54), so the
// surface stays open on the error and the owner is never told anything
// happened. Only 'logged' earns the completion transient.
export type CloseOutcome = 'logged' | 'cancelled' | 'discarded';

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
const SORA_MEDIUM = Type.family.medium;
const SORA_SEMIBOLD = Type.family.semibold;
const SORA_BOLD = Type.family.bold;
const SORA_DISPLAY = Type.family.display;
const SERIF_ITALIC = Type.family.serifItalic;

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
  ladder: "Gut call. How this run stacked up against the rest of your stash.",
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

// The shared sequence-screen header (D83 header block, over D80/D81): a styled
// leading control chip, then a left-aligned block — a quiet brand label on top,
// the product line dominant beneath it (D81: every screen names the product, so
// the user never rates an unnamed thing), and the screen's question as an
// accent subheading. The identification is never fabricated: whichever of brand
// / strain the COA carries shows, and the dominant line always names something.
//
// Both halves are independently optional, which is what lets the two screens
// use one header for opposite compositions: the score screen passes the COA and
// its question, closing passes its question alone. Omitting the identification
// on closing knowingly departs from D81's every-screen-names-the-product
// (operator ruling, 2026-08-04) — by then the product has been named on the
// screen that did the rating, and the remaining question is about the session,
// not about what it was.
function SequenceHeader({
  leadingLabel,
  onLeading,
  disabled,
  brand = null,
  strain = null,
  title,
  saving = false,
  onInfo,
  statusText,
  trailingLabel,
  onTrailing,
}: {
  leadingLabel: string;
  onLeading: () => void;
  disabled: boolean;
  brand?: string | null;
  strain?: string | null;
  title?: string;
  // D83 Layer 1 saving state: the header dims to 40% while an insert is on
  // the wire (the tapped pill stays lit; siblings dim to 32%).
  saving?: boolean;
  // The glossary info trigger (D86): present only on a term-bearing phase, so
  // omitting it is how closing structurally carries no trigger (D86.6, restated
  // by D96). Opens the read-only definition sheet; it never touches survey
  // state.
  onInfo?: () => void;
  // The reference's saved indicator (D141): closing states the standing
  // verdict beside a green dot. Display of already-confirmed state only.
  statusText?: string;
  // The reference's plain-text trailing action (D141): closing's Done, which
  // runs the same commit the CTA runs. Presentation of an existing path.
  trailingLabel?: string;
  onTrailing?: () => void;
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
        <Pressable
          disabled={disabled}
          onPress={onLeading}
          accessibilityRole="button"
          accessibilityLabel={leadingLabel}
          style={styles.controlChip}>
          {/* Leading glyph per D83 item 9: cross for Close, single-angle for
              Back. */}
          <ThemedText style={styles.controlChipLabel}>
            {(leadingLabel === 'Close' ? '✕ ' : '‹ ') + leadingLabel}
          </ThemedText>
        </Pressable>
        <View style={styles.headerTrailing}>
          {statusText !== undefined && (
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <ThemedText style={styles.statusText}>{statusText}</ThemedText>
            </View>
          )}
          {onInfo !== undefined && (
            <Pressable
              disabled={disabled}
              onPress={onInfo}
              accessibilityRole="button"
              style={styles.controlChip}>
              {/* An ASCII label, not a glyph: Sora's cmap is not guaranteed to
                  carry an info codepoint (cf. the U+2713 checkbox fix), and a
                  word is unambiguously discoverable at the gate. */}
              <ThemedText style={styles.controlChipLabel}>Info</ThemedText>
            </Pressable>
          )}
          {onTrailing !== undefined && trailingLabel !== undefined && (
            <Pressable
              disabled={disabled}
              onPress={onTrailing}
              accessibilityRole="button"
              hitSlop={8}>
              <ThemedText style={styles.trailingLabel}>{trailingLabel}</ThemedText>
            </Pressable>
          )}
        </View>
      </View>
      <View style={styles.headerBlock}>
        {brandLabel !== null && (
          <ThemedText style={styles.brandLabel} numberOfLines={1}>
            {brandLabel}
          </ThemedText>
        )}
        {/* Wrap-only (D83, ratified item 1): up to two lines at full size, no
            shrink. A real overflow at the device gate is the only thing that
            reopens it. Absent entirely when no identification was passed —
            never an empty dominant line holding its own height. */}
        {productLine !== '' && (
          <ThemedText style={styles.productLine} numberOfLines={2}>
            {productLine}
          </ThemedText>
        )}
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
              accessibilityRole="button"
              accessibilityLabel={value}
              accessibilityState={{ selected: isSelected, disabled, busy: isPending }}
              style={({ pressed }) => [
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
                // The reference's press acknowledgment (D141): a 0.98 scale
                // while pressed. The haptic half belongs to D143's rebuild
                // slice; this half is pure presentation.
                pressed && !disabled && styles.pillPressed,
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
                <View style={styles.rungRow}>
                  {/* Display-only (D141): the emoji never reaches the row. */}
                  <ThemedText style={styles.rungEmoji}>{RUNG_EMOJI[value] ?? ''}</ThemedText>
                  <ThemedText style={[styles.pillLabel, { color: labelColor }]}>{value}</ThemedText>
                </View>
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
      {/* The reference's footer microcopy (D141): it states the shipped
          save-on-tap behavior in words, changing nothing about it. */}
      <ThemedText style={styles.rungFootnote}>
        {'Tapping a verdict saves it instantly \u2014 everything after is optional.'}
      </ThemedText>
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
          <Pressable
            onPress={() => setGlossaryOpen(false)}
            accessibilityRole="button"
            style={styles.controlChip}>
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

// The effect tags (D119/D120): the ratified vocabulary as toggle chips in its
// three presentation groups, sitting with the note on the closing screen. The
// grouping is presentation only and stops here — the column stores one flat
// array with no valence (D119), so no group name ever reaches the data and
// moving a tag between groups later costs nothing.
//
// Multi-select with no limit and no Done control: a tap toggles and nothing
// else happens, which is what keeps the surface free of the required path
// (D120). Selection state, tap order, and the null collapse all live in the
// owner; this renders selection and reports taps, the same
// card-receives-callbacks split PillScreen already uses. The chip grammar is
// the screens' existing one — surface fill at rest, inverted when selected
// (D57/D80) — and the label font does not change on toggle, so a selection
// never reflows a wrapped row under the user's thumb.
function EffectsPicker({
  groups,
  selected,
  disabled,
  onToggle,
}: {
  groups: readonly EffectGroup[];
  selected: readonly string[];
  disabled: boolean;
  onToggle: (tag: string) => void;
}) {
  return (
    <View style={styles.effectGroups}>
      {groups.map((group) => (
        <View key={group.label} style={styles.effectGroup}>
          {/* Group copy is the doc's verbatim name (operator-owned), rendered
              in the header block's quiet eyebrow idiom. */}
          <ThemedText style={styles.effectGroupLabel}>{group.label}</ThemedText>
          <View style={styles.effectRow}>
            {group.tags.map((tag) => {
              const isSelected = selected.includes(tag);
              return (
                <Pressable
                  key={tag}
                  // Disabled while any insert is on the wire (D54), exactly as
                  // every other control on both screens.
                  disabled={disabled}
                  onPress={() => onToggle(tag)}
                  accessibilityRole="button"
                  accessibilityLabel={tag}
                  accessibilityState={{ selected: isSelected, disabled }}
                  style={[
                    styles.effectChip,
                    // The reference's selected state (D141): solid accent with
                    // a check. Fixed-width grid cells, so the prefix cannot
                    // reflow a neighbor.
                    { backgroundColor: isSelected ? Dash.accent : Dash.surface2 },
                  ]}>
                  <ThemedText
                    numberOfLines={1}
                    // One line is the rule; the longest labels shrink to keep
                    // it rather than truncating -- a lexicon tag the user
                    // cannot read is worse than a smaller one (operator gate,
                    // second finding).
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    style={[styles.effectChipLabel, { color: isSelected ? Dash.bg : Dash.text }]}>
                    {isSelected ? `\u2713 ${tag}` : tag}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

// Tag-list equality for the closing write's no-op check. Order-sensitive on
// purpose: the array is stored in tap order, so a reordered selection is a
// different value and earns its revision insert. Null-aware because null is
// the recorded-nothing value on both sides (D119).
const sameTags = (a: string[] | null, b: string[] | null) =>
  a === null || b === null
    ? a === b
    : a.length === b.length && a.every((tag, i) => tag === b[i]);

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
 * Closing (D92) carries its own question as its header — the product
 * identification leaves this screen by the 2026-08-04 ruling, knowingly
 * amending D81 here — plus the effect tags (D119/D120), an optional free-text
 * note (D95), and Close. The completion
 * bloom is NOT here: the 2026-08-04 ruling moved it off this screen entirely
 * and made it a post-close transient the owner plays over the landing surface
 * (completion-bloom.tsx), because the middle this screen used to spend on it is
 * now the tag surface. This component therefore renders no completion moment at
 * all and owns no motion for one; it only reports how it ended.
 *
 * The note is the one deliberate exception to tap-is-the-save — text has no tap —
 * and the 2026-08-04 ruling extends that exception to the whole screen: the
 * tags and the note ride ONE revision insert when Close fires, never
 * keystroke-by-keystroke and never a second write per surface. Closing with
 * nothing typed and nothing tapped writes nothing at all, so skipping costs
 * exactly the taps it always did. Both fields normalize their empty to null,
 * never '' and never [] (the ND != 0 family: D78's rule for the note, D119's
 * restatement of the D75 collapse for the tags). Every write rides the one
 * insertEntry pipeline under the same D54/D55 grammar.
 *
 * How a presentation ENDS is derived from state, never from the control that
 * ended it (2026-08-04, closing a device-gate defect where page-1's Close
 * announced 'cancelled' about a session already on the shelf). One rule covers
 * every non-discard exit — page-2's Close, and the owner's own dismissal path
 * through onLoggedChange: a confirmed score means 'logged', its absence means
 * 'cancelled'. Closing from the top therefore keeps the session, by ruling.
 *
 * The one exit that destroys anything asks first. Page-1's Close on a rated
 * session raises a two-button confirmation; Discard appends a soft-delete
 * tombstone (D52: a delete IS an entry) through the same insert pipeline and
 * the same D54/D55 grammar as every other write, and a tombstone that fails to
 * land leaves the survey open on its error rather than dismissing — a discard
 * never gets to look like it worked.
 *
 * The three intent axes, fit, and the two confound panels retired as questions
 * with D93 and as columns with D94. Nothing removed ever touched the score, the
 * band, or the shelf (skeleton item 1), so this cut cannot corrupt them.
 */
export function SessionLadder({
  coa,
  onClose,
  onBusyChange,
  onLoggedChange,
}: {
  coa: LadderCoa;
  // Reports how the presentation ended, because the owner's post-close
  // behavior differs by outcome (2026-08-04: the completion transient plays on
  // 'logged' and never on 'cancelled'). Dismissal itself is unconditional and
  // unchanged — this argument tells the owner what happened, it does not ask
  // permission.
  onClose: (outcome: CloseOutcome) => void;
  onBusyChange: (busy: boolean) => void;
  // Whether a score has confirmed and still stands. The owner's Modal owns the
  // one dismissal path this component cannot see (onRequestClose), and that
  // path has to derive its outcome from the same state every other path does
  // (2026-08-04). This is the guard's line of sight into that state, the same
  // shape and the same reason as onBusyChange: the ladder owns the fact, the
  // owner needs to read it.
  onLoggedChange: (logged: boolean) => void;
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
  // The tag draft (D119), held at surface scope for the same reason as the
  // note: a Back to the score screen and a return keeps what was tapped. Tap
  // order IS array order — a tag appended on select and dropped on deselect,
  // so a re-tapped tag lands at the end, which is still the order the user
  // chose it in. Empty here is the recorded-nothing state; the collapse to
  // null happens at the write, never in this list.
  const [effectTags, setEffectTags] = useState<string[]>([]);
  const toggleEffect = (tag: string) => {
    // Touch feedback (D143), the same light tick the verdict tap fires: the
    // feel answers the finger, not the outcome, so a chip that only moves
    // draft state feels identical to a rung that writes. Never awaited and
    // its failure is swallowed -- a device that cannot buzz must not change
    // what the tap does.
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setEffectTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    );
  };
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

  // The dismissal outcome, derived from state rather than from the control the
  // user pressed (2026-08-04). Every non-discard exit runs through this: a
  // confirmed score means the row is on the shelf and the survey ended in a
  // logged session, whichever screen and whichever affordance ended it. The
  // discard path does not use it — it knows what it did.
  const dismissOutcome = (): CloseOutcome => (lastConfirmed === null ? 'cancelled' : 'logged');

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
        // The owner reads this to answer its own dismissal path. A tombstone
        // confirms that the session no longer stands, so it reports false.
        onLoggedChange(!snapshot.deleted);
        // A confirmed tombstone ends the survey as a discard: the row exists,
        // the session does not, and nothing gets celebrated (2026-08-04).
        if (source === 'discard') {
          onClose('discarded');
          return;
        }
        // A confirmed closing write ends the survey (D95: it writes once, on
        // Close, and Close is what fired it) rather than advancing a phase —
        // closing is already the terminal. The outcome still derives rather
        // than being asserted here: reaching this screen required a confirmed
        // score, so the derivation yields 'logged' — but it yields it from the
        // state, like every other exit. A confirmed score advances on CONFIRM,
        // not on tap (D79's rule, unchanged).
        if (source === 'closing') {
          onClose(dismissOutcome());
          return;
        }
        setPhase((current) => nextScreen(current));
        return;
      }
      // A failed insert never advances, never closes, and touches no snapshot
      // (D55): clearing the source's pending state above already reverted the
      // rendered answer to the last confirmed value, and a failed closing write
      // leaves the surface on closing with the note draft and the tapped tags
      // intact. A failed TOMBSTONE is the same rule and matters most: the
      // survey stays open on the error rather than dismissing on a delete that
      // did not land, so a discard can never look like it worked. Retry is
      // re-tapping — the pill on the score screen, Close on closing, Close and
      // Discard again for the tombstone.
      setSaveError("Couldn't save — check your connection.");
    };

    // created_by is a server default, never sent. Full snapshot (D52): the
    // note and the tags ride every insert at their snapshot values — carried
    // forward on a score tap, changed together on the one closing write (D95,
    // D119). On the lazy path both stay null (the overall word is the only
    // mandatory field). `deleted` is now sent EXPLICITLY on every write rather
    // than left to the column default, because the discard path needs it true
    // and a field that is sometimes stated and sometimes defaulted is the kind
    // of half-truth this payload should not carry. The six retired fact
    // columns are gone from the schema (D94) and are not sent.
    supabase
      .from('session_entries')
      .insert({
        session_id: chainId,
        coa_id: coa.id,
        lexicon_version: LEXICON_VERSION,
        overall_word: snapshot.word,
        overall_score: snapshot.score,
        notes: snapshot.notes,
        effects: snapshot.effects,
        deleted: snapshot.deleted,
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
    // Touch feedback (D143): fired first and never gating the write below.
    // It acknowledges the tap, not the save -- the spinner and the error
    // banner own the outcome (D54), and a failed buzz stays invisible.
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const index = RUNGS.findIndex((rung) => rung.word === word);
    const rung = RUNGS[index];
    setPendingScore(rung.word);
    insertEntry(
      lastConfirmed === null
        ? { index, word: rung.word, score: rung.score, notes: null, effects: null, deleted: false }
        : { ...lastConfirmed, index, word: rung.word, score: rung.score },
      'drop'
    );
  };

  // Closing's Close: the screen's ONE write, then the dismissal. The note and
  // the tags are compared and sent together (D95's exception extended to the
  // whole screen, 2026-08-04) — one insert, never one per field, so a screen
  // that changed both still costs a single row.
  //
  // Empty is null on both: '' for the note (D78's normalization, the ND != 0
  // family) and [] for the tags (D119's restatement of the D75 collapse), and
  // the tapped-then-untapped-to-zero case lands on that same null rather than
  // an empty array. An unchanged closing state — including the untouched case
  // and both emptied-again cases — writes nothing: no revision insert, no row
  // churn, and skipping the surface costs exactly the taps it costs today. A
  // null lastConfirmed takes the same no-write path: closing is only reachable
  // on a confirmed score, so there is no row to revise and nothing to
  // fabricate.
  const closeWithClosingState = () => {
    const trimmed = noteText.trim();
    const normalizedNote = trimmed === '' ? null : trimmed;
    const normalizedTags = effectTags.length === 0 ? null : effectTags;
    if (
      lastConfirmed === null ||
      (normalizedNote === lastConfirmed.notes && sameTags(normalizedTags, lastConfirmed.effects))
    ) {
      // The clean no-write close, reported by derivation like every other
      // exit: reaching this screen at all means a score confirmed, so the
      // session is on the shelf whether or not this screen added anything to
      // it.
      onClose(dismissOutcome());
      return;
    }
    insertEntry({ ...lastConfirmed, notes: normalizedNote, effects: normalizedTags }, 'closing');
  };

  // The score screen's leading control (2026-08-04). It is the flow's entry, so
  // it renders Close rather than Back — but what Close MEANS depends on whether
  // anything is on the shelf yet, not on which screen the user is looking at.
  //
  // Nothing confirmed: a plain cancel, exactly as before. Nothing was written,
  // so nothing is being thrown away and a confirmation would be friction over
  // an empty set.
  //
  // Something confirmed (the Back-and-revise case the device gate caught): the
  // session already exists, and dismissing from here would either silently keep
  // it — the old behavior, which reported 'cancelled' about a live row — or
  // silently destroy it. Both are the surface deciding something the user
  // didn't say. So it asks, in the app's own two-button destructive idiom
  // (coa-editor's Delete row, coa-retire's confirmations): Keep leaves the
  // survey exactly where it stood and writes nothing at all; Discard writes a
  // soft-delete tombstone through the one insert pipeline, under the same D54
  // busy/abort/error grammar as every other write. Copy here is
  // operator-reviewable at the gate.
  const closeFromScore = () => {
    if (lastConfirmed === null) {
      onClose('cancelled');
      return;
    }
    appAlert('Discard this session?', "It's already in your stash. Discard removes it.", [
      // Cancel role first, destructive second — the ordering the app's other
      // destructive confirmations already use.
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        // A tombstone is an ENTRY (D52): the confirmed snapshot verbatim with
        // deleted true, appended to the same chain. Nothing is rewritten and
        // nothing is erased — the prior entries stay exactly as they were
        // beneath it, which is the whole point of an append-only chain.
        onPress: () => insertEntry({ ...lastConfirmed, deleted: true }, 'discard'),
      },
    ]);
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
            control is Close (this is the flow's entry, there is no Back);
            it dismisses without writing when nothing is confirmed and asks
            before discarding when something is, and it is disabled while an
            insert is on the wire (D54). */}
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
            onLeading={closeFromScore}
            leadingLabel="Close"
          />
        )}

        {/* The closing screen (D92): the survey's terminus, now the second of
            two. Its header is the score screen's heading idiom with the
            product identification omitted (operator ruling, 2026-08-04,
            knowingly amending D81 for this one screen): the product was named
            on the screen that rated it, and what is left to ask is about the
            session. It still carries no glossary trigger (D86.6's structural
            exclusion, restated by D96). It holds the optional
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
            {/* No brand or strain passed: this screen's header is its question
                alone, in the same accent the score screen's question carries
                (2026-08-04). Back and the leading-control geometry are
                unchanged. */}
            <SequenceHeader
              leadingLabel="Back"
              onLeading={goBack}
              disabled={inFlight}
              title="Anything else? (optional)"
              // The saved indicator (D141): the standing verdict, which is
              // exactly lastConfirmed -- closing is only reachable confirmed.
              statusText={
                lastConfirmed === null ? undefined : `${lastConfirmed.word} \u00B7 saved`
              }
              // Done and the CTA run the same one commit (D95's single write).
              trailingLabel="Done"
              onTrailing={closeWithClosingState}
            />
            {/* Closing's middle renders NOTHING as of the 2026-08-04 ruling.
                The bloom that used to hold it is now a post-close transient
                (completion-bloom.tsx) and the explainer line it displaced was
                already not rendered here (art-direction.md's closing-screen
                resolution; EXPLAINERS.closing remains the copy of record). What
                survives is the flex that made the actions bottom-anchored: the
                slack is the ratified layout property, not the thing that filled
                it. */}
            <View style={styles.closingMiddle} />
            <View style={styles.closingActions}>
              {/* The effect tags (D119/D120): the structured half of the same
                  optional reflection the note already carried, so they sit with
                  it rather than on a screen of their own — above it, so the
                  reading order runs structured, then free text, then Close.
                  Nothing here is mandatory and no control confirms them: their
                  value reaches the database on the same Close the note rides.
                  This is what makes the screen taller than the frame, which is
                  exactly what the ScrollView above is for. */}
              <EffectsPicker
                groups={EFFECTS}
                selected={effectTags}
                disabled={inFlight}
                onToggle={toggleEffect}
              />
              {/* The same inline save-error banner the score screen carries
                  (D54): a failed closing write stays on closing and shows it,
                  so retry is re-tapping Close. */}
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
              <Pressable
                disabled={inFlight}
                onPress={closeWithClosingState}
                accessibilityRole="button"
                style={styles.closeButton}>
                {/* The reference's CTA label (D141); the handler is the same
                    single closing write it always was. */}
                <ThemedText style={styles.closeLabel}>Save Session</ThemedText>
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
  // The header's right cluster (D141): status, Info, or Done, in a row.
  headerTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Dash.accent,
  },
  statusText: {
    fontFamily: SORA_MEDIUM,
    fontSize: 13,
    color: Dash.accent,
  },
  trailingLabel: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 15,
    color: Dash.text,
  },
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
  // The press acknowledgment (D141): scale only, no color change.
  pillPressed: {
    transform: [{ scale: 0.98 }],
  },
  rungRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rungEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  // The footer microcopy (D141): quiet, centered, below the stack.
  rungFootnote: {
    ...Type.role.body,
    lineHeight: 15,
    color: Dash.textFaint,
    textAlign: 'center',
    paddingTop: Spacing.two,
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
  // Closing's empty middle: the same flex:1 slack explainerWrap gave it, with
  // nothing rendered into it. It is what keeps the tags, the note, and Close
  // bottom-anchored in thumb reach (D83) on a short screen; when the tags
  // overflow the frame the ScrollView takes over and this contributes nothing.
  closingMiddle: {
    flex: 1,
  },
  closingActions: {
    gap: Spacing.two,
  },
  // The tag surface (D119/D120): three labeled groups stacked, each a wrapped
  // row of chips. Group spacing is wider than chip spacing so the three read as
  // three without a rule or a box between them.
  effectGroups: {
    gap: Spacing.three,
  },
  effectGroup: {
    gap: Spacing.two,
  },
  // The header block's eyebrow idiom (brandLabel) in the survey's question
  // color: the operator ruled these labels the same green the score screen's
  // question heading carries (2026-08-04), so they read as asked-for rather
  // than as fine print. The token is shared with that heading, never a
  // second copy of its value.
  effectGroupLabel: {
    fontFamily: SORA_MEDIUM,
    fontSize: 13,
    // .14em at 13pt, matching the eyebrow's tracking ratio.
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Dash.accent,
  },
  // The reference's strict two-column grid (D141): fixed-width cells so a
  // selection's check prefix can never reflow a neighboring chip.
  effectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.two,
  },
  // A tag chip: the control chip's pill geometry at a size that wraps into
  // rows, sized to its label. Selection inverts (the D57/D80 chip grammar the
  // rung cards use), and only the colors change on toggle — the font and the
  // metrics hold, so tapping never reflows the row under the thumb.
  // Uniform cells (D141, operator gate fix): fixed height so no label can
  // grow its cell, tight padding and 13pt so the two-phrase labels hold one
  // line, centered both axes.
  effectChip: {
    width: '48.5%',
    height: 44,
    borderRadius: 12,
    paddingHorizontal: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectChipLabel: {
    fontFamily: SORA_MEDIUM,
    fontSize: 13,
    textAlign: 'center',
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
