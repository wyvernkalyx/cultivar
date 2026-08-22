import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Dash, Type, terpeneHue, verdictHue } from '@/constants/theme';

// Font families registered app-wide in the root layout (D83 Decision 1),
// referenced by name; an unloaded family falls back to the system font rather
// than blocking the render. Sora 800 is the reference's display role and is
// loaded from this slice on (src/app/_layout.tsx).
const SORA_REGULAR = Type.family.regular;
const SORA_SEMIBOLD = Type.family.semibold;
const SORA_BOLD = Type.family.bold;
const SORA_DISPLAY = Type.family.display;
const SERIF_ITALIC = Type.family.serifItalic;

// DB shape (D41): exactly the selected columns, snake_case, as the coas
// table stores them — not the parser shape. `type` and `favorite` join the
// selection in D99; both are nullable, and null `favorite` is UNANSWERED,
// never "No".
export type ShelfCoa = {
  id: string;
  strain: string | null;
  brand: string | null;
  lab: string | null;
  source_lab: string | null;
  type: string | null;
  favorite: boolean | null;
  total_thc: number | null;
  total_cbd: number | null;
  total_terpenes: number | null;
  sampled_on: string | null;
  tested_on: string | null;
  created_at: string;
  on_shelf_count: number;
};

// One live session of this COA (session_current grain, D59). Ascending by
// time; an empty array IS the untried state (D61: absence, never a value).
export type CardSession = { word: string; at: string };

// Top reported terpenes for this COA, already ranked. Unreported (null pct)
// analytes are excluded upstream, so every entry here is a lab-reported value.
export type CardTerpene = { name: string; pct: number };

// Top reported cannabinoids (D132), same contract as CardTerpene: ranked
// upstream, null pct excluded upstream, every entry a lab-reported value.
export type CardCannabinoid = { name: string; pct: number };

// The retirement event that took the last package off the shelf (D90's
// record, D101's display). `reason` is the stored text, rendered verbatim --
// never paraphrased, never mapped through a second vocabulary.
export type CardRetirement = { reason: string; at: string };

// Session-derived top effects for this COA (D133b): the user's own recorded
// tags, ranked upstream by the one counting core -- never chemistry. The
// count rides along for future surfaces; the card renders names only. An
// empty array renders nothing at all: unlike the lab-absence lines, no
// stated absence -- an untagged history is not a fact about the product.
export type CardEffect = { name: string; count: number };

export type ShelfCardProps = {
  coa: ShelfCoa;
  sessions: CardSession[];
  topTerpenes: CardTerpene[];
  topCannabinoids: CardCannabinoid[];
  effects: CardEffect[];
  onOpen: () => void;
  // Absent on the off-shelf archive (D101): a surface with no logging path
  // renders no Log button at all. Not a disabled one -- an affordance that
  // can never act on this surface is absence, not a disabled state.
  onLog?: () => void;
  // Answering repurchase intent from the card (D113). Optional on the same
  // Reaching the retirement ritual from the card (D114). The PROP is the
  // archive's exclusion, exactly as the Log handler is: the shelf passes it
  // and the archive omits it. The count check below is defense in depth, not
  // the mechanism -- an archive row is count 0 anyway, but a surface that
  // never wants the control should not be relying on its data to hide it.
  onRetire?: (coa: ShelfCoa) => void;
  // D135: attach a lab document to a manually entered row. Rendered in the
  // overflow only when the handler is supplied AND the row's provenance is
  // manual -- a parsed row has its document already.
  onAttach?: (coa: ShelfCoa) => void;
  // Present only off the shelf, where it is the archive marker.
  retirement?: CardRetirement;
  // D149: the History collapse, both props present only on the History
  // surface (the prop-omission scoping Log and retire use). `collapsed`
  // is the resting state; `onToggleCollapse` flips it. Active cards never
  // receive either and render exactly as before.
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

// A `date` column arrives as 'YYYY-MM-DD'. `new Date('YYYY-MM-DD')` parses at
// UTC midnight, which renders as the prior day west of UTC; constructing from
// the parts yields local midnight, so the displayed day never shifts.
function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString();
}

// Card date line (D84.4), one line by strict precedence: tested, else
// sampled (each labeled as such), else the existing created_at provenance.
// created_at is a timestamptz and keeps its own timezone-aware treatment.
// Moved here from shelf-list.tsx with its logic unchanged (D99).
function cardDateLine(coa: ShelfCoa): string {
  if (coa.tested_on) return `Tested ${formatIsoDate(coa.tested_on)}`;
  if (coa.sampled_on) return `Sampled ${formatIsoDate(coa.sampled_on)}`;
  return `Added ${new Date(coa.created_at).toLocaleDateString()}`;
}

// Two decimals, TRUNCATED (D102: cards truncate, detail shows full lab
// precision; truncation never rounds into a false precision claim). Same
// convention as the slice-1 summary, and done on the fixed-notation string
// rather than by multiply-and-trunc: `Math.trunc(8.29 * 100) / 100` is 8.28,
// and that artifact reads as a different lab value.
function truncate2(value: number): string {
  const fixed = value.toFixed(10);
  return fixed.slice(0, fixed.indexOf('.') + 3);
}

// Three-state invariant, same as the editor: a null total is ND / <LOQ /
// not reported and renders the literal "ND" — never 0, never blank.
function totalLabel(value: number | null): string {
  return value === null ? 'ND' : `${truncate2(value)}%`;
}

// At most eight dots, the MOST RECENT eight — the oldest drop off the left.
// The count beside them is still every session, so the cap is a display
// bound and never a claim about how many sessions exist.
const MAX_DOTS = 8;

function Total({ label, value }: { label: string; value: number | null }) {
  return (
    <View style={styles.total}>
      <Text style={styles.totalLabel}>{label}</Text>
      <Text style={[styles.totalValue, value === null && styles.totalValueNd]}>
        {totalLabel(value)}
      </Text>
    </View>
  );
}

// The signature (reference 01): each top terpene as a segment of one track,
// width proportional to its share of the COA's total terpenes. The track's
// own background IS the remainder — no filler view, so the unaccounted share
// is visibly unclaimed rather than attributed to anything.
// D150: total may be null -- a lab that reports individual terpenes without
// a total. Shares cannot be drawn without a divisor, so the track is
// omitted and the legend (reported name + value) stands alone; the values
// are facts, the bar would be an estimate. The shelf card never passes
// null (its own guard runs first); the Insights product list does.
export function Fingerprint({
  total,
  terpenes,
}: {
  total: number | null;
  terpenes: CardTerpene[];
}) {
  return (
    <View style={styles.fingerprint}>
      {total !== null && total > 0 && (
        <View style={styles.track}>
          {terpenes.map((terpene) => (
            <View
              key={terpene.name}
              style={{
                width: `${Math.min(100, (terpene.pct / total) * 100)}%`,
                backgroundColor: terpeneHue(terpene.name),
              }}
            />
          ))}
        </View>
      )}
      <View style={styles.legendRow}>
        {terpenes.map((terpene) => (
          <View key={terpene.name} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: terpeneHue(terpene.name) }]} />
            {/* D131: the reported value beside the name, truncated to two
                decimals (D102 -- truncate, never round), fainter tabular
                figures per the reference mock. Every entry here is a
                lab-reported value: null pct never reaches the legend. */}
            <Text style={styles.legendText}>
              {`${terpene.name} `}
              <Text style={styles.legendPct}>{`${truncate2(terpene.pct)}%`}</Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * One shelf card (D99), presentational: props in, nothing fetched here. The
 * band word is gone — D62's v1 display is superseded by verdict dots and a
 * session count, display only; D59/D61 semantics are untouched, and an
 * untried COA still renders no verdict, only the ratified honesty line.
 */
export function ShelfCard({
  coa,
  sessions,
  topTerpenes,
  topCannabinoids,
  effects,
  onOpen,
  onLog,
  onRetire,
  onAttach,
  retirement,
  collapsed,
  onToggleCollapse,
}: ShelfCardProps) {
  // D150 gate finding 2026-08-21: a lab can report individual terpenes and
  // no total (a manual COA did). Reported rows draw the legend; a reported,
  // non-zero total draws the track above it; zero reported rows is the only
  // case the ND line describes. Previously rows-without-total was labeled
  // "not reported" -- false copy.
  const hasReportedTerpenes = topTerpenes.length > 0;
  const fingerprintTotal =
    coa.total_terpenes !== null && coa.total_terpenes > 0 ? coa.total_terpenes : null;
  const meta = coa.type === null ? cardDateLine(coa) : `${coa.type} · ${cardDateLine(coa)}`;
  const latest = sessions.length === 0 ? null : sessions[sessions.length - 1];

  // D149: the collapsed History form. One compact block -- strain, brand,
  // disclosure chevron -- and one press target that EXPANDS rather than
  // opens the detail: the fast-scroll resting state. minHeight carries the
  // D145 44pt floor on the card's single control.
  if (collapsed === true) {
    return (
      <Pressable
        onPress={onToggleCollapse}
        accessibilityRole="button"
        accessibilityLabel={`${coa.strain?.trim() ? coa.strain.trim() : 'Strain not reported'}, ${
          coa.brand ?? 'Brand not reported'
        }`}
        accessibilityState={{ expanded: false }}
        style={styles.collapsedCard}>
        <View style={styles.collapsedText}>
          <Text
            style={coa.strain?.trim() ? styles.strain : styles.strainAbsent}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}>
            {coa.strain?.trim() ? coa.strain : 'Strain not reported'}
          </Text>
          <Text style={coa.brand === null ? styles.brandAbsent : styles.brand} numberOfLines={1}>
            {coa.brand ?? 'Brand not reported'}
          </Text>
        </View>
        <Text style={styles.chevron}>{'\u203a'}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onOpen} accessibilityRole="button">
      <View style={styles.card}>
        <View style={styles.strainRow}>
          {/* Null or whitespace-only strain is stated, not left as a blank
              title line (D97, the same treatment brand gets below). */}
          <Text
            style={coa.strain?.trim() ? styles.strain : styles.strainAbsent}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}>
            {coa.strain?.trim() ? coa.strain : 'Strain not reported'}
          </Text>
          <View style={styles.strainRowActions}>
            {/* D149: the collapse control on an expanded History card.
                Nested inside the card's Pressable exactly as the overflow
                is, so collapsing does not also open the detail. Renders
                only where the toggle exists -- the History surface. */}
            {onToggleCollapse !== undefined && (
              <Pressable
                hitSlop={12}
                onPress={onToggleCollapse}
                accessibilityRole="button"
                accessibilityLabel="Collapse this card"
                accessibilityState={{ expanded: true }}>
                <Text style={styles.chevron}>{'\u2304'}</Text>
              </Pressable>
            )}
            {/* The overflow (D114). Top-right, diagonally opposite the Log
                button, so the card's one loud control keeps its own corner
                and this one crowds nothing. Nested inside the card's
                Pressable exactly as Log and the chip are: RN grants the
                responder to the innermost view that wants it, so opening the
                menu does not also open the detail. */}
            {onRetire !== undefined && coa.on_shelf_count > 0 && (
              <Pressable
                hitSlop={12}
                onPress={() =>
                  Alert.alert(
                    coa.strain?.trim() ? coa.strain.trim() : 'this COA',
                    undefined,
                    [
                      // D135: the attach entry precedes retire when it
                      // renders at all; the condition is provenance, not
                      // the absence of a document column the card never
                      // fetched.
                      ...(onAttach !== undefined && coa.source_lab === 'manual'
                        ? [{ text: 'Attach COA document', onPress: () => onAttach(coa) }]
                        : []),
                      { text: 'Retire', onPress: () => onRetire(coa) },
                      { text: 'Cancel', style: 'cancel' as const },
                    ]
                  )
                }
                accessibilityRole="button"
                accessibilityLabel="More actions for this item">
                <Text style={styles.overflowGlyph}>…</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Repurchase intent, display-only since D140: the ask lives in the
            retirement prompt alone, and the card states a Yes that was
            given -- never the question, never a "No" badge, never a
            placeholder (D48 held by rendering nothing below true). */}
        {coa.favorite === true && (
          <View style={styles.buyAgainBadge}>
            <Text style={styles.buyAgainText}>{'\u2713 buy again'}</Text>
          </View>
        )}

        {/* Null brand is stated, not left as an empty-looking gap (D97: the
            column is null, and the card says so in words). */}
        <Text style={coa.brand === null ? styles.brandAbsent : styles.brand}>
          {coa.brand ?? 'Brand not reported'}
        </Text>
        <Text style={styles.meta}>{meta}</Text>

        {/* The archive marker (D101), and the ONLY thing that distinguishes an
            off-shelf card: the reason verbatim from coa_retirements, beside
            the date the event was recorded. Everything else on the card is
            unchanged, because an off-shelf COA's chemistry and its logged
            history did not change when its package emptied. */}
        {retirement !== undefined && (
          <Text style={styles.retired}>
            {`Retired ${new Date(retirement.at).toLocaleDateString()} · ${retirement.reason}`}
          </Text>
        )}

        <View style={styles.totalsRow}>
          <Total label="THC" value={coa.total_thc} />
          <Total label="CBD" value={coa.total_cbd} />
          <Total label="Total terpenes" value={coa.total_terpenes} />
        </View>

        {/* ND is information, never a blank (D98/D99): a COA whose lab did
            not report terpenes says so in the fingerprint's place. */}
        {hasReportedTerpenes ? (
          <Fingerprint total={fingerprintTotal} terpenes={topTerpenes} />
        ) : (
          <Text style={styles.ndTerpenes}>Terpenes not reported by lab.</Text>
        )}

        {/* D132: top-3 reported cannabinoids as one text line, after the
            fingerprint per the detail's terpenes-before-cannabinoids order.
            Values truncated two decimals (D102), value token fainter than
            the name (the D131 legend treatment). The separator is the
            card's established middot, written as an escape so the source
            line stays ASCII. Zero reported rows states the absence in the
            terpene ND line's own voice -- never a blank. */}
        {topCannabinoids.length > 0 ? (
          <Text style={styles.cannabinoidLine}>
            {topCannabinoids.map((cannabinoid, index) => (
              <Text key={cannabinoid.name}>
                {index > 0 ? ' \u00b7 ' : ''}
                {`${cannabinoid.name} `}
                <Text style={styles.legendPct}>{`${truncate2(cannabinoid.pct)}%`}</Text>
              </Text>
            ))}
          </Text>
        ) : (
          <Text style={styles.ndTerpenes}>Cannabinoids not reported by lab.</Text>
        )}

        {/* The D133b line, register per D133a's dashboard line: the ratified
            qualifier plus this COA's top tags, exact stored strings, serif
            italic -- a register the chemistry lines never wear, so outcome
            and lab data cannot be misread as one family. Absent entirely
            when no live session of this COA carries tags. */}
        {effects.length > 0 && (
          <Text style={styles.effectsLine}>
            {`Often ${effects.map((effect) => effect.name).join(' \u00b7 ')}`}
          </Text>
        )}

        <View style={styles.footerRow}>
          <View style={styles.footerLeft}>
            {sessions.length > 0 && (
              <View style={styles.dotsRow}>
                {sessions.slice(-MAX_DOTS).map((session, index) => (
                  <View
                    key={`${session.at}-${index}`}
                    style={[styles.dot, { backgroundColor: verdictHue(session.word) }]}
                  />
                ))}
              </View>
            )}
            <Text style={latest === null ? styles.footerAbsent : styles.footerText}>
              {latest === null
                ? 'No sessions yet'
                : `${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'} · last ${new Date(latest.at).toLocaleDateString()}`}
            </Text>
          </View>
          {/* One tap from every shelf card, landing directly on the verdict
              screen (D99). Nested inside the card's Pressable: RN grants the
              responder to the innermost view that wants it, so a Log press
              does not also open the detail. Rendered only where a logging
              path exists (D101): the footer's left side keeps its layout, and
              nothing takes the button's place. */}
          {onLog !== undefined && (
            <Pressable
              style={styles.logButton}
              hitSlop={8}
              onPress={onLog}
              accessibilityRole="button"
              accessibilityLabel="Log a session">
              <Text style={styles.logLabel}>{'+ Log Session'}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Dash.surface,
    borderRadius: Dash.radius.card,
    padding: 16,
    gap: 8,
  },
  // D149: the collapsed History block. minHeight 44 is the D145 floor on
  // the card's one press target; strain and brand keep their existing
  // type roles, so the collapsed row is the full card's own first lines.
  collapsedCard: {
    backgroundColor: Dash.surface,
    borderRadius: Dash.radius.card,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  collapsedText: {
    flex: 1,
    gap: 2,
  },
  chevron: {
    color: Dash.textMuted,
    fontSize: 18,
    lineHeight: 20,
  },
  strainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  strain: {
    flexShrink: 1,
    fontFamily: SORA_DISPLAY,
    fontSize: 28,
    lineHeight: 31,
    textTransform: 'uppercase',
    color: Dash.text,
  },
  strainAbsent: {
    flexShrink: 1,
    fontFamily: SORA_DISPLAY,
    fontSize: 28,
    lineHeight: 31,
    textTransform: 'uppercase',
    color: Dash.textMuted,
  },
  // The badge and the overflow share the strain line's trailing end, so they
  // group rather than being spread apart by the row's space-between. Baseline
  // alignment is inherited deliberately: it is what kept the badge sitting on
  // the strain's baseline before the group existed.
  strainRowActions: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  // Quiet by construction (D114): a muted glyph on no surface at all. The tap
  // target comes from hitSlop rather than a box, so the control adds nothing
  // to the strain line's height.
  overflowGlyph: {
    fontFamily: SORA_BOLD,
    fontSize: 16,
    color: Dash.textMuted,
  },
  // Repurchase display (D140): the one badge the card ever shows for it,
  // rendered only above a stored Yes.
  buyAgainBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Dash.radius.pill,
    borderWidth: 1,
    borderColor: Dash.accent,
  },
  buyAgainText: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 10,
    color: Dash.accent,
  },
  brand: {
    ...Type.role.body,
    color: Dash.textBody,
  },
  brandAbsent: {
    ...Type.role.body,
    color: Dash.textMuted,
  },
  meta: {
    ...Type.role.body,
    color: Dash.textFaint,
  },
  retired: {
    ...Type.role.body,
    color: Dash.textMuted,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 4,
  },
  total: {
    gap: 2,
  },
  totalLabel: {
    ...Type.role.label,
    color: Dash.textFaint,
  },
  totalValue: {
    ...Type.role.value,
    fontVariant: ['tabular-nums'],
    color: Dash.text,
  },
  totalValueNd: {
    color: Dash.textMuted,
  },
  fingerprint: {
    gap: 8,
    marginTop: 4,
  },
  track: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontFamily: SORA_REGULAR,
    fontSize: 10,
    color: Dash.textMuted,
  },
  // D131: the value token is one step fainter than the name it follows,
  // tabular so columns of legends do not shimmer across cards.
  legendPct: {
    fontFamily: SORA_REGULAR,
    fontSize: 10,
    fontVariant: ['tabular-nums'],
    color: Dash.textFaint,
  },
  effectsLine: {
    fontFamily: SERIF_ITALIC,
    fontSize: 13,
    color: Dash.textBody,
  },
  // D132: the cannabinoid line wears the legend's clothes -- same size,
  // same muted name token; its values reuse legendPct above.
  cannabinoidLine: {
    fontFamily: SORA_REGULAR,
    fontSize: 10,
    color: Dash.textMuted,
  },
  ndTerpenes: {
    ...Type.role.serif,
    color: Dash.textMuted,
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  footerLeft: {
    flexShrink: 1,
    gap: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footerText: {
    ...Type.role.body,
    color: Dash.textBody,
  },
  footerAbsent: {
    ...Type.role.body,
    color: Dash.textMuted,
  },
  // The reference's pill (screen 01), sized by its label: the 4b gate
  // caught the longer label stuffed into the old 48pt circle.
  logButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Dash.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Dash.accent,
  },
  logLabel: {
    ...Type.role.action,
    color: Dash.bg,
  },
});
