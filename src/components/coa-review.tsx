import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

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
  lab: string;
  brand: string;
  strain: string;
  batch: string;
  totalThcPct: number | null;
  totalCbdPct: number | null;
  totalTerpenesPct: number | null;
  cannabinoids: CoaAnalyte[];
  terpenes: CoaAnalyte[];
  safety: CoaSafetyRow[];
  sourceLab: string;
}

// Three-state invariant: null is ND / <LOQ / not reported and renders as the
// literal string "ND" — never 0, never blank.
function pctLabel(pct: number | null): string {
  return pct === null ? 'ND' : `${pct}%`;
}

function Row({
  label,
  value,
  secondary = false,
}: {
  label: string;
  value: string;
  secondary?: boolean;
}) {
  const color = secondary ? ('textSecondary' as const) : undefined;
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor={color}>
        {label}
      </ThemedText>
      <ThemedText type="small" themeColor={color} style={styles.rowValue}>
        {value}
      </ThemedText>
    </View>
  );
}

// Detected rows first (parser emission order preserved); ND rows collapse
// under an always-present count control — collapsed, never hidden.
function AnalyteSection({ title, analytes }: { title: string; analytes: CoaAnalyte[] }) {
  const [showNd, setShowNd] = useState(false);
  const detected = analytes.filter((a) => a.pct !== null);
  const nd = analytes.filter((a) => a.pct === null);

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {detected.map((a, i) => (
        <Row key={`${i}-${a.name}`} label={a.name} value={pctLabel(a.pct)} />
      ))}
      {nd.length > 0 && (
        <>
          <Pressable onPress={() => setShowNd((s) => !s)} style={styles.ndToggle}>
            <ThemedText type="small" themeColor="textSecondary">
              {showNd ? '▾' : '▸'} Not detected ({nd.length})
            </ThemedText>
          </Pressable>
          {showNd &&
            nd.map((a, i) => <Row key={`${i}-${a.name}`} label={a.name} value="ND" secondary />)}
        </>
      )}
    </View>
  );
}

/**
 * Read-only render of a parsed COA (slice 4). Props-only and presentational:
 * no fetch, no knowledge of the ingest state machine. Displays exactly what
 * the parse contains — nothing computed, derived, or estimated.
 */
export function CoaReview({ coa }: { coa: CoaParseResult }) {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <ThemedText type="smallBold">Metadata</ThemedText>
        <Row label="Strain" value={coa.strain} />
        <Row label="Brand" value={coa.brand} />
        <Row label="Batch" value={coa.batch} />
        <Row label="Lab" value={coa.lab} />
        <ThemedText type="small" themeColor="textSecondary">
          source: {coa.sourceLab}
        </ThemedText>
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold">Totals</ThemedText>
        <Row label="THC" value={pctLabel(coa.totalThcPct)} />
        <Row label="CBD" value={pctLabel(coa.totalCbdPct)} />
        <Row label="Total terpenes" value={pctLabel(coa.totalTerpenesPct)} />
      </View>

      <AnalyteSection title="Terpenes" analytes={coa.terpenes} />
      <AnalyteSection title="Cannabinoids" analytes={coa.cannabinoids} />

      <View style={styles.section}>
        <ThemedText type="smallBold">Safety</ThemedText>
        {coa.safety.map((s, i) => (
          <Row key={`${i}-${s.category}`} label={s.category} value={s.status} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
    paddingBottom: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  ndToggle: {
    paddingVertical: Spacing.one,
  },
});
