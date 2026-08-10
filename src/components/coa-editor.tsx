import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Local mirror of the parser's output shape (observed on animal-face.pdf at
// HEAD). Server types under supabase/ must not enter the Metro bundle, so the
// duplication is the accepted debt for this slice.
export interface CoaAnalyte {
  name: string;
  pct: number | null;
}

export interface CoaSafetyRow {
  category: string;
  status: string;
}

export interface CoaParseResult {
  // Absent text is null, never '' (D97). No sync enforcement exists between
  // this mirror and supabase/functions/_shared/coa/types.ts; they widen
  // together or the client silently keeps the old contract.
  lab: string | null;
  brand: string | null;
  strain: string | null;
  batch: string | null;
  sampledDate: string | null;
  testedDate: string | null;
  totalThcPct: number | null;
  totalCbdPct: number | null;
  totalTerpenesPct: number | null;
  cannabinoids: CoaAnalyte[];
  terpenes: CoaAnalyte[];
  safety: CoaSafetyRow[];
  sourceLab: string;
}

// Draft rows carry a stable generated id (names are editable, so the name
// cannot key; an index breaks under delete) and their grouping as frozen at
// draft init — membership never follows the current pct (D37).
interface DraftAnalyte {
  id: string;
  name: string;
  pct: number | null;
  detectedAtInit: boolean;
  // Manual mode only (D134): true while the user has not touched the row.
  // An na row is form scaffolding, not data -- emit drops it. Distinct from
  // pct null, which is an explicit ND (a transcribed lab attestation).
  na: boolean;
}

interface Draft {
  // Null carries through from the parse (D97) until the user types into the
  // field; the binding renders it blank, and emit normalizes it back.
  strain: string | null;
  brand: string | null;
  batch: string | null;
  lab: string | null;
  // Carried through unedited (D84): dates are not editable this slice, so
  // they ride the draft like `safety` -- init copies them, emit returns them.
  sampledDate: string | null;
  testedDate: string | null;
  totalThcPct: number | null;
  totalCbdPct: number | null;
  totalTerpenesPct: number | null;
  terpenes: DraftAnalyte[];
  cannabinoids: DraftAnalyte[];
  // Display only this slice: no edit affordance.
  safety: CoaSafetyRow[];
  sourceLab: string;
}

function initDraft(coa: CoaParseResult, manual: boolean): Draft {
  const toRows = (prefix: string, analytes: CoaAnalyte[]): DraftAnalyte[] =>
    analytes.map((a, i) => ({
      id: `${prefix}${i}`,
      name: a.name,
      pct: a.pct,
      // Manual mode has no detected/ND grouping (D134): every row inits into
      // the detected branch, so the section renders one flat list and the
      // "Not detected" toggle never appears (nd.length is 0 by construction).
      detectedAtInit: manual ? true : a.pct !== null,
      na: manual,
    }));
  return {
    strain: coa.strain,
    brand: coa.brand,
    batch: coa.batch,
    lab: coa.lab,
    sampledDate: coa.sampledDate,
    testedDate: coa.testedDate,
    totalThcPct: coa.totalThcPct,
    totalCbdPct: coa.totalCbdPct,
    totalTerpenesPct: coa.totalTerpenesPct,
    terpenes: toRows('t', coa.terpenes),
    cannabinoids: toRows('c', coa.cannabinoids),
    safety: coa.safety,
    sourceLab: coa.sourceLab,
  };
}

// Metadata normalization on emit (D97): trim, and a trimmed-empty field emits
// null. A field the user cleared and a field the document never stated are the
// same claim -- absence -- and must leave here as the same null.
function normalizeMeta(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

// Emission back to parser shape (slice 6b, D40): ids and detectedAtInit are
// stripped by constructing the mapped object; deleted rows are absent because
// they are no longer in the draft. A null pct emits as JSON null — never 0,
// never dropped.
function emitDraft(draft: Draft, manual: boolean): CoaParseResult {
  // Manual mode (D134): a row still on Not Available was never touched and a
  // row without a name cannot be a record; both are dropped, failing closed
  // to omission. Parsed mode emits every surviving row, as before.
  const rows = (panel: DraftAnalyte[]): DraftAnalyte[] =>
    manual ? panel.filter((r) => !r.na && r.name.trim() !== '') : panel;
  return {
    lab: normalizeMeta(draft.lab),
    brand: normalizeMeta(draft.brand),
    strain: normalizeMeta(draft.strain),
    batch: normalizeMeta(draft.batch),
    sampledDate: draft.sampledDate,
    testedDate: draft.testedDate,
    totalThcPct: draft.totalThcPct,
    totalCbdPct: draft.totalCbdPct,
    totalTerpenesPct: draft.totalTerpenesPct,
    terpenes: rows(draft.terpenes).map(({ name, pct }) => ({ name, pct })),
    cannabinoids: rows(draft.cannabinoids).map(({ name, pct }) => ({ name, pct })),
    safety: draft.safety,
    sourceLab: draft.sourceLab,
  };
}

// Three-state invariant: null is ND / <LOQ / not reported and renders as the
// literal string "ND" — never 0, never blank.
function pctLabel(pct: number | null): string {
  return pct === null ? 'ND' : `${pct}%`;
}

// Value commit rules (D37): trimmed empty → ND; 'nd' in any case → ND; a
// parseable number → that number (an explicitly typed 0 is legal — the
// invariant bans fabricated zeros, not deliberate ones); anything else
// reverts silently. No error UI this slice.
// Manual divergence (D134): a blank commit REVERTS instead of landing on ND.
// In parsed mode the row provably existed in the document, so blank-to-ND is
// sound; in manual mode it would convert "didn't finish typing" into "lab
// says not detected". ND requires the explicit act (typed nd).
function commitValueText(
  text: string,
  prior: { pct: number | null; na: boolean },
  manual: boolean,
): { pct: number | null; na: boolean } {
  const trimmed = text.trim();
  if (trimmed === '') return manual ? prior : { pct: null, na: false };
  if (trimmed.toLowerCase() === 'nd') return { pct: null, na: false };
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? { pct: parsed, na: false } : prior;
}

function ValueCell({
  value,
  na = false,
  manual = false,
  onCommit,
  secondary = false,
}: {
  value: number | null;
  na?: boolean;
  manual?: boolean;
  onCommit: (next: { pct: number | null; na: boolean }) => void;
  secondary?: boolean;
}) {
  const theme = useTheme();
  // null = not editing; a string is the in-progress edit text.
  const [text, setText] = useState<string | null>(null);

  if (text === null) {
    return (
      <Pressable
        onPress={() => setText(na || value === null ? '' : String(value))}
        hitSlop={Spacing.two}>
        <ThemedText
          type="small"
          themeColor={secondary || na ? 'textSecondary' : undefined}
          style={styles.cellValue}>
          {na ? 'Not Available' : pctLabel(value)}
        </ThemedText>
      </Pressable>
    );
  }
  return (
    <TextInput
      style={[
        styles.input,
        styles.valueInput,
        { backgroundColor: theme.backgroundElement, color: theme.text },
      ]}
      value={text}
      onChangeText={setText}
      keyboardType="decimal-pad"
      autoFocus
      onBlur={() => {
        onCommit(commitValueText(text, { pct: value, na }, manual));
        setText(null);
      }}
    />
  );
}

function NameCell({
  name,
  onCommit,
  secondary = false,
}: {
  name: string;
  onCommit: (next: string) => void;
  secondary?: boolean;
}) {
  const theme = useTheme();
  const [text, setText] = useState<string | null>(null);

  if (text === null) {
    return (
      <Pressable onPress={() => setText(name)} style={styles.nameCell} hitSlop={Spacing.two}>
        <ThemedText type="small" themeColor={secondary || name === '' ? 'textSecondary' : undefined}>
          {/* A fresh manual add-row arrives unnamed; an invisible empty label
              would be untappable. Display-only -- emit drops unnamed rows. */}
          {name === '' ? 'Tap to name' : name}
        </ThemedText>
      </Pressable>
    );
  }
  return (
    <TextInput
      style={[
        styles.input,
        styles.nameInput,
        { backgroundColor: theme.backgroundElement, color: theme.text },
      ]}
      value={text}
      onChangeText={setText}
      autoFocus
      autoCapitalize="none"
      autoCorrect={false}
      onBlur={() => {
        const trimmed = text.trim();
        // Trimmed-empty reverts to the prior name.
        if (trimmed !== '') onCommit(trimmed);
        setText(null);
      }}
    />
  );
}

function AnalyteRow({
  row,
  onEdit,
  onDelete,
  secondary = false,
  manual = false,
}: {
  row: DraftAnalyte;
  onEdit: (patch: Partial<Pick<DraftAnalyte, 'name' | 'pct' | 'na'>>) => void;
  onDelete: () => void;
  secondary?: boolean;
  manual?: boolean;
}) {
  const confirmDelete = () =>
    // With no add-row, a mistaken delete is unrecoverable short of a full
    // repick, so the confirmation earns its friction (D37).
    Alert.alert('Delete row', `Remove "${row.name}" from this COA?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);

  return (
    <View style={styles.row}>
      <NameCell name={row.name} secondary={secondary} onCommit={(name) => onEdit({ name })} />
      <ValueCell
        value={row.pct}
        na={row.na}
        manual={manual}
        secondary={secondary}
        onCommit={(next) => onEdit({ pct: next.pct, na: next.na })}
      />
      <Pressable onPress={confirmDelete} hitSlop={Spacing.two}>
        <ThemedText type="small" themeColor="textSecondary">
          ✕
        </ThemedText>
      </Pressable>
    </View>
  );
}

// Grouping is frozen at draft init (D37): a reading aid, not a data property.
// A row edited to ND stays put; a frozen-ND row edited to a number stays in
// the ND group. ND rows are editable too — collapsed, never hidden.
function AnalyteSection({
  title,
  rows,
  onEdit,
  onDelete,
  manual = false,
  onAdd,
}: {
  title: string;
  rows: DraftAnalyte[];
  onEdit: (id: string, patch: Partial<Pick<DraftAnalyte, 'name' | 'pct' | 'na'>>) => void;
  onDelete: (id: string) => void;
  manual?: boolean;
  onAdd?: () => void;
}) {
  const [showNd, setShowNd] = useState(false);
  const detected = rows.filter((r) => r.detectedAtInit);
  const nd = rows.filter((r) => !r.detectedAtInit);

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {detected.map((r) => (
        <AnalyteRow
          key={r.id}
          row={r}
          manual={manual}
          onEdit={(patch) => onEdit(r.id, patch)}
          onDelete={() => onDelete(r.id)}
        />
      ))}
      {manual && onAdd && (
        <Pressable onPress={onAdd} style={styles.ndToggle} hitSlop={Spacing.two}>
          <ThemedText type="small" themeColor="textSecondary">
            + Add analyte
          </ThemedText>
        </Pressable>
      )}
      {nd.length > 0 && (
        <>
          <Pressable onPress={() => setShowNd((s) => !s)} style={styles.ndToggle}>
            <ThemedText type="small" themeColor="textSecondary">
              {showNd ? '▾' : '▸'} Not detected ({nd.length})
            </ThemedText>
          </Pressable>
          {showNd &&
            nd.map((r) => (
              <AnalyteRow
                key={r.id}
                row={r}
                secondary
                manual={manual}
                onEdit={(patch) => onEdit(r.id, patch)}
                onDelete={() => onDelete(r.id)}
              />
            ))}
        </>
      )}
    </View>
  );
}

function MetadataField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (text: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <ThemedText type="small">{label}</ThemedText>
      <TextInput
        style={[
          styles.input,
          styles.metadataInput,
          { backgroundColor: theme.backgroundElement, color: theme.text },
        ]}
        // null is absence, not a value: it is not a valid controlled-input
        // value, so it renders as blank here and normalizes back on emit (D97).
        value={value ?? ''}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

function TotalRow({
  label,
  value,
  manual = false,
  onCommit,
}: {
  label: string;
  value: number | null;
  manual?: boolean;
  onCommit: (next: number | null) => void;
}) {
  return (
    <View style={styles.row}>
      <ThemedText type="small">{label}</ThemedText>
      {/* Totals are single columns, not rows: there is no row to drop, so a
          manual total left untouched and an explicit ND both store NULL. The
          Not Available label here is editor display only (D134, stated). */}
      <ValueCell
        value={value}
        na={manual && value === null}
        manual={manual}
        onCommit={(next) => onCommit(next.pct)}
      />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small">{label}</ThemedText>
      <ThemedText type="small" style={styles.rowValue}>
        {value}
      </ThemedText>
    </View>
  );
}

/**
 * Editable draft of a parsed COA (slice 5b). Draft state lives here,
 * initialized once from the `coa` prop — the parent remount-keys on pick
 * identity so a repick mounts a fresh draft (D38). Editing is reconciliation:
 * the user makes the record match what the lab actually printed. Confirm
 * emits the corrected parse to `onConfirm` (slice 6b); the insert itself is
 * the parent's job.
 */
export function CoaEditor({
  coa,
  onConfirm,
  busy = false,
  manual = false,
}: {
  coa: CoaParseResult;
  onConfirm: (coa: CoaParseResult) => void;
  busy?: boolean;
  // D134 manual mode: the coa prop is the pre-populated seed, every analyte
  // row inits Not Available, blank commits revert instead of landing on ND,
  // add-row is available, and emit drops untouched and unnamed rows.
  manual?: boolean;
}) {
  const theme = useTheme();
  const [draft, setDraft] = useState<Draft>(() => initDraft(coa, manual));
  // Ids for manual add-rows; the m prefix cannot collide with init's t/c.
  const [nextAddId, setNextAddId] = useState(0);

  const setMeta = (key: 'strain' | 'brand' | 'batch' | 'lab') => (text: string) =>
    setDraft((d) => ({ ...d, [key]: text }));
  const setTotal =
    (key: 'totalThcPct' | 'totalCbdPct' | 'totalTerpenesPct') => (pct: number | null) =>
      setDraft((d) => ({ ...d, [key]: pct }));
  const editAnalyte =
    (panel: 'terpenes' | 'cannabinoids') =>
    (id: string, patch: Partial<Pick<DraftAnalyte, 'name' | 'pct' | 'na'>>) =>
      setDraft((d) => ({
        ...d,
        [panel]: d[panel].map((r) => (r.id === id ? { ...r, ...patch } : r)),
      }));
  const deleteAnalyte = (panel: 'terpenes' | 'cannabinoids') => (id: string) =>
    setDraft((d) => ({ ...d, [panel]: d[panel].filter((r) => r.id !== id) }));
  const addAnalyte = (panel: 'terpenes' | 'cannabinoids') => () => {
    const id = `m${nextAddId}`;
    setNextAddId((n) => n + 1);
    setDraft((d) => ({
      ...d,
      [panel]: [
        ...d[panel],
        // Unnamed and Not Available until the user says otherwise; emit
        // drops it in either state, so an abandoned add-row stores nothing.
        { id, name: '', pct: null, detectedAtInit: true, na: true },
      ],
    }));
  };

  return (
    // Fixed-footer column (D43): the sections scroll; the confirm control is
    // the scroll's sibling, visible without scrolling whenever the editor
    // renders.
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <ThemedText type="smallBold">Metadata</ThemedText>
          <MetadataField label="Strain" value={draft.strain} onChange={setMeta('strain')} />
          <MetadataField label="Brand" value={draft.brand} onChange={setMeta('brand')} />
          <MetadataField label="Batch" value={draft.batch} onChange={setMeta('batch')} />
          <MetadataField label="Lab" value={draft.lab} onChange={setMeta('lab')} />
          <ThemedText type="small" themeColor="textSecondary">
            source: {draft.sourceLab}
          </ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold">Totals</ThemedText>
          <TotalRow
            label="THC"
            value={draft.totalThcPct}
            manual={manual}
            onCommit={setTotal('totalThcPct')}
          />
          <TotalRow
            label="CBD"
            value={draft.totalCbdPct}
            manual={manual}
            onCommit={setTotal('totalCbdPct')}
          />
          <TotalRow
            label="Total terpenes"
            value={draft.totalTerpenesPct}
            manual={manual}
            onCommit={setTotal('totalTerpenesPct')}
          />
        </View>

        <AnalyteSection
          title="Terpenes"
          rows={draft.terpenes}
          manual={manual}
          onAdd={addAnalyte('terpenes')}
          onEdit={editAnalyte('terpenes')}
          onDelete={deleteAnalyte('terpenes')}
        />
        <AnalyteSection
          title="Cannabinoids"
          rows={draft.cannabinoids}
          manual={manual}
          onAdd={addAnalyte('cannabinoids')}
          onEdit={editAnalyte('cannabinoids')}
          onDelete={deleteAnalyte('cannabinoids')}
        />

        <View style={styles.section}>
          <ThemedText type="smallBold">Safety</ThemedText>
          {draft.safety.map((s, i) => (
            <Row key={`${i}-${s.category}`} label={s.category} value={s.status} />
          ))}
        </View>
      </ScrollView>

      <Pressable
        onPress={() => onConfirm(emitDraft(draft, manual))}
        disabled={busy}
        style={[
          styles.confirmButton,
          { backgroundColor: theme.backgroundElement },
          busy && styles.confirmButtonDisabled,
        ]}>
        <ThemedText type="smallBold">Add to stash</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.three,
  },
  scrollContent: {
    gap: Spacing.four,
    paddingBottom: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rowValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  nameCell: {
    flex: 1,
  },
  cellValue: {
    textAlign: 'right',
  },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    fontSize: 14,
  },
  nameInput: {
    flex: 1,
  },
  valueInput: {
    minWidth: 80,
    textAlign: 'right',
  },
  metadataInput: {
    flex: 1,
    textAlign: 'right',
  },
  ndToggle: {
    paddingVertical: Spacing.one,
  },
  confirmButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
});
