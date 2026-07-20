import { uuid } from 'expo-modules-core';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

// Rung order is the lexicon's (D51, preserved as visual order by D80): up =
// better, best word at the top, "Mid" at dead center, worst at the bottom.
// Words and scores resolve through the one source.
const RUNG_WORDS = RUNGS.map((rung) => rung.word);

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
  spark: string | null;
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
// (the score pill screen) -> energy -> environment -> spark -> fit (only
// when spark is answered, D73) -> physical_state -> co_consumption ->
// closing (D82: the panels join the required sequence). Field keys double
// as phase names so currentPanel/currentAxis derive config straight from
// phase. Plain conditional render; transition animation banked to the art pass.
type Phase =
  | 'ladder'
  | 'energy'
  | 'environment'
  | 'spark'
  | 'fit'
  | 'physical_state'
  | 'co_consumption'
  | 'closing';

// The shared sequence-screen header (D80 scaffold, D81 product line): a
// leading control, a truly-centered two-line unit — the product
// identification on top (D81: every screen names the product, so the user
// never rates an unnamed thing) with the screen's question beneath it as a
// subordinate subheading — and an equal-width trailing spacer that balances
// the leading control so the unit sits at the true center regardless of the
// control's label. A screen that asks nothing (the closing screen) passes no
// title and shows the product line alone.
function SequenceHeader({
  leadingLabel,
  onLeading,
  disabled,
  product,
  title,
}: {
  leadingLabel: string;
  onLeading: () => void;
  disabled: boolean;
  product: string;
  title?: string;
}) {
  return (
    <View style={styles.sequenceHeader}>
      <Pressable disabled={disabled} onPress={onLeading} style={styles.headerSide}>
        <ThemedText type="smallBold">{leadingLabel}</ThemedText>
      </Pressable>
      <View style={styles.headerCenter}>
        {/* The product line is the prominent line (D81), gate-tuned larger
            than the pill labels (type "default"); the question subheading
            scales up with it but stays subordinate — one size step down and
            in the secondary color. */}
        <ThemedText
          type="title"
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          style={styles.productLine}>
          {product}
        </ThemedText>
        {title !== undefined && (
          <ThemedText
            type="subtitle"
            themeColor="textSecondary"
            numberOfLines={1}
            adjustsFontSizeToFit
            style={styles.headerSubtitle}>
            {title}
          </ThemedText>
        )}
      </View>
      <View style={styles.headerSide} />
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
  theme,
  product,
  title,
  values,
  selected,
  selectedValues,
  pendingValue,
  disabled,
  error,
  onSelect,
  onLeading,
  onSkip,
  onDone,
  leadingLabel = 'Back',
}: {
  theme: ReturnType<typeof useTheme>;
  product: string;
  title: string;
  values: readonly string[];
  selected: string | null;
  // Multi-select (D82): when present, a pill is lit iff this set includes it,
  // and `selected` is unused (call sites pass selected={null}).
  selectedValues?: readonly string[];
  pendingValue: string | null;
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
  return (
    <View style={styles.sequenceScreen}>
      <SequenceHeader
        leadingLabel={leadingLabel}
        onLeading={onLeading}
        disabled={disabled}
        product={product}
        title={title}
      />
      <View style={styles.pillStack}>
        {values.map((value) => {
          // Multi-select lights every value in the set (D82); single-select
          // lights the one equal to `selected`.
          const isMulti = selectedValues !== undefined;
          const isSelected = isMulti ? selectedValues.includes(value) : value === selected;
          const isPending = value === pendingValue;
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
                { backgroundColor: isSelected ? theme.text : theme.backgroundElement },
                isPending && styles.chipPending,
              ]}>
              {/* The leading checkbox is the pre-tap cue (D82.1) that this
                  screen is pick-any and needs Done — a bare pill is pick-one
                  and advances on tap. Empty square off, checked square on;
                  final treatment is art-pass scope. */}
              {isMulti && (
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: isSelected ? theme.background : theme.textSecondary },
                  ]}>
                  {isSelected && (
                    <ThemedText type="small" style={{ color: theme.background }}>
                      ✓
                    </ThemedText>
                  )}
                </View>
              )}
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
            an answer, that advances and writes nothing. Absent on the score
            screen (D80): the overall word is the only mandatory field. */}
        {onSkip !== undefined && (
          <Pressable
            disabled={disabled}
            onPress={onSkip}
            style={[styles.pill, styles.skipPill, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="default" themeColor="textSecondary">
              Skip
            </ThemedText>
          </Pressable>
        )}
        {/* Done advances a multi-select panel (D82): the toggles already saved
            per tap, so Done writes nothing — it only moves on, and Done with
            nothing selected is the skip by construction. Same geometry as Skip
            but the primary text color (not Skip's secondary), so the two
            grammars' trailing pills read as distinct. Mutually exclusive with
            onSkip. Final treatment is art-pass scope. */}
        {onDone !== undefined && (
          <Pressable
            disabled={disabled}
            onPress={onDone}
            style={[styles.pill, styles.skipPill, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="default">Done</ThemedText>
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
 * Elite at top, Trash at bottom, carrying D51's up-is-better geometry as visual
 * order. A score tap is the save attempt: it inserts a session entry
 * immediately (the D50 tap-is-the-save contract, motion changed from the
 * retired drag) and the tapped pill renders pending until the insert confirms
 * (D54). Back to the score screen and tapping a different pill inserts a
 * revision row into the same chain (D52) under the same grammar the axis
 * screens use; a failed revision reverts to the last confirmed truth by
 * derivation (D55).
 *
 * On a confirmed score the flow advances (D79) to the axis screens: Energy,
 * Environment, Spark, one per screen, each a full-snapshot revision insert
 * (D71) carrying the rest forward, with the advance firing on CONFIRM, not on
 * tap. Changing Spark nulls fit (D72); a first-class Skip advances and writes
 * nothing. Fit is its own screen shown only when Spark was answered (D73),
 * then the two multi-select confound panels join the sequence in order (D82):
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
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // The product identification (D81): every survey screen leads with it, so
  // the user never rates an unnamed thing. "Brand - Strain" when the COA
  // carries both; whichever part is present otherwise — never fabricated.
  const product = [coa.brand, coa.strain].filter(Boolean).join(' - ');
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

  // The D82 screen order. Spark decides whether fit is asked (D73): a
  // non-null spark inserts the fit screen before the panels; a null spark
  // (the aimless session) skips fit straight to the first panel. The two
  // panels (physical_state then co_consumption) trail the verdict block and
  // lead into closing, the one switch terminal (D82).
  const nextScreen = (current: Phase, sparkValue: string | null): Phase => {
    switch (current) {
      case 'ladder':
        return 'energy';
      case 'energy':
        return 'environment';
      case 'environment':
        return 'spark';
      case 'spark':
        return sparkValue !== null ? 'fit' : 'physical_state';
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
  // panel (physical_state) it is fit when spark was answered, spark otherwise
  // (the derivation that used to live on closing); co_consumption goes back
  // to physical_state; closing goes back to co_consumption (D82).
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
      case 'physical_state':
        return lastConfirmed !== null && lastConfirmed.spark !== null ? 'fit' : 'spark';
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
    setPhase((current) => nextScreen(current, lastConfirmed?.spark ?? null));
  };
  // Back affordance: navigation only, never a write, cleared error.
  const goBack = () => {
    setSaveError(null);
    setPhase((current) => backTarget(current));
  };

  // The save attempt (D54): every path is the same insert — same chain,
  // full snapshot (D52). A score tap sends its rung with every fact-class
  // answer carried forward; an axis tap sends the confirmed word + score
  // with the one axis set (fit nulled iff Spark, D72); a fit tap or panel
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
        // by rule now — not by a terminal phase. Spark's just-confirmed
        // value decides the fit branch.
        if (source !== 'panel') {
          setPhase((current) => nextScreen(current, snapshot.spark));
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

  // Score tap (D80): tap is the save. Builds exactly the payload the retired
  // drop built — the first-entry shape when nothing is confirmed yet (all
  // fact fields null, the overall word being the only mandatory field), the
  // revision shape carrying every fact-class answer forward otherwise (a new
  // score changes the word, not the questions: the axes stand, so fit stands
  // too — D72's nulling is for Spark CHANGES only). Fires through the one
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
    phase === 'energy' || phase === 'environment' || phase === 'spark'
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
        {/* The score screen (D80): the five RUNGS as full-width bottom-
            anchored pills, Elite top to Trash bottom (D51's up-is-better as
            visual order). Tap is the save (D50 contract, D54 pending). No
            Skip — score is the skeleton's mandatory field. The leading
            control is Close (this is the flow's entry, there is no Back):
            it dismisses without writing, disabled while an insert is on the
            wire (D54). */}
        {phase === 'ladder' && (
          <PillScreen
            theme={theme}
            product={product}
            title="Rate this Session"
            values={RUNG_WORDS}
            selected={selectedScore}
            pendingValue={pendingScore}
            disabled={inFlight}
            error={saveError}
            onSelect={tapScore}
            onLeading={onClose}
            leadingLabel="Close"
          />
        )}

        {/* The three intent axis screens (D71/D79): one axis per screen,
            title = axis name, values as full-width bottom-anchored pills,
            tap-advance on confirm, first-class Skip. Spark's confirm nulls
            fit (D72) and branches to the fit screen when answered. */}
        {currentAxis !== undefined && (
          <PillScreen
            theme={theme}
            product={product}
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
            onLeading={goBack}
          />
        )}

        {/* The fit screen (D73/D79): shown only when Spark was answered;
            spark's advance goes straight to closing otherwise. Same
            pill-and-Skip pattern, FITS vocabulary unchanged. */}
        {phase === 'fit' && (
          <PillScreen
            theme={theme}
            product={product}
            title="Did it do what you wanted?"
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
            theme={theme}
            product={product}
            title={currentPanel.label}
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
              product={product}
            />
            <View style={styles.closingActions}>
              <Pressable
                disabled={inFlight}
                onPress={onClose}
                style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">Close</ThemedText>
              </Pressable>
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
    paddingBottom: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  chipPending: {
    opacity: 0.5,
  },
  // The one-screen sequence (D79/D80): a flex column with the header at the
  // top and the answer stack anchored to the bottom (thumb reach) via
  // marginTop:auto.
  sequenceScreen: {
    flex: 1,
  },
  sequenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Leading control and the balancing trailing spacer share this width so
  // the flex:1 centered title sits at the true screen center (D80 scaffold).
  headerSide: {
    width: 72,
    paddingVertical: Spacing.one,
    justifyContent: 'center',
  },
  // The centered two-line unit (D80 balanced-spacer centering, D81 product +
  // question): flex:1 so it fills between the equal-width side controls, its
  // lines stretched to that width so each centers and shrinks to fit.
  headerCenter: {
    flex: 1,
  },
  productLine: {
    textAlign: 'center',
  },
  headerSubtitle: {
    textAlign: 'center',
    marginTop: Spacing.half,
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
  // Multi-select pills (D82.1): the checkbox and label sit in a centered row.
  pillMulti: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  // The leading checkbox square (D82.1): border color and check glyph are set
  // inline by selection state.
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipPill: {
    marginTop: Spacing.one,
  },
  closingActions: {
    marginTop: 'auto',
    gap: Spacing.two,
  },
  button: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
});
