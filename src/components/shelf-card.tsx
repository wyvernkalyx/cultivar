import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Dash, terpeneHue, verdictHue } from '@/constants/theme';

// Font families registered app-wide in the root layout (D83 Decision 1),
// referenced by name; an unloaded family falls back to the system font rather
// than blocking the render. Sora 800 is the reference's display role and is
// loaded from this slice on (src/app/_layout.tsx).
const SORA_REGULAR = 'Sora_400Regular';
const SORA_SEMIBOLD = 'Sora_600SemiBold';
const SORA_BOLD = 'Sora_700Bold';
const SORA_DISPLAY = 'Sora_800ExtraBold';
const SERIF_ITALIC = 'Newsreader_400Regular_Italic';

// DB shape (D41): exactly the selected columns, snake_case, as the coas
// table stores them — not the parser shape. `type` and `favorite` join the
// selection in D99; both are nullable, and null `favorite` is UNANSWERED,
// never "No".
export type ShelfCoa = {
  id: string;
  strain: string | null;
  brand: string | null;
  lab: string | null;
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

// The retirement event that took the last package off the shelf (D90's
// record, D101's display). `reason` is the stored text, rendered verbatim --
// never paraphrased, never mapped through a second vocabulary.
export type CardRetirement = { reason: string; at: string };

export type ShelfCardProps = {
  coa: ShelfCoa;
  sessions: CardSession[];
  topTerpenes: CardTerpene[];
  onOpen: () => void;
  // Absent on the off-shelf archive (D101): a surface with no logging path
  // renders no Log button at all. Not a disabled one -- an affordance that
  // can never act on this surface is absence, not a disabled state.
  onLog?: () => void;
  // Answering repurchase intent from the card (D113). Optional on the same
  // grounds the Log handler is: a surface that omits it gets the pre-D113
  // display-only chip back, unanswered rows included. Both card surfaces
  // pass it, so the optionality is the contract, not a live branch.
  onFavorite?: (coa: ShelfCoa) => void;
  // Reaching the retirement ritual from the card (D114). The PROP is the
  // archive's exclusion, exactly as the Log handler is: the shelf passes it
  // and the archive omits it. The count check below is defense in depth, not
  // the mechanism -- an archive row is count 0 anyway, but a surface that
  // never wants the control should not be relying on its data to hide it.
  onRetire?: (coa: ShelfCoa) => void;
  // Present only off the shelf, where it is the archive marker.
  retirement?: CardRetirement;
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

// The chip's three states (D113). A null favorite reads as the QUESTION,
// never as an answer: the card still renders no verdict that was not given,
// which is what keeps D48 intact while the ask becomes visible.
function favoriteLabel(favorite: boolean | null): string {
  if (favorite === null) return 'Buy again?';
  return favorite ? 'Would buy again' : "Wouldn't buy again";
}

// The answered states keep their existing fills verbatim; the unanswered one
// is deliberately the quietest thing on the card -- an outline, no fill, and
// the faintest text token. The Log button stays the card's one loud control.
function favoriteChipStyle(favorite: boolean | null) {
  if (favorite === null) return styles.chipAsk;
  return favorite ? styles.chipYes : styles.chipNo;
}

function favoriteTextStyle(favorite: boolean | null) {
  if (favorite === null) return styles.chipAskText;
  return favorite ? styles.chipYesText : styles.chipNoText;
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
function Fingerprint({ total, terpenes }: { total: number; terpenes: CardTerpene[] }) {
  return (
    <View style={styles.fingerprint}>
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
  onOpen,
  onLog,
  onFavorite,
  onRetire,
  retirement,
}: ShelfCardProps) {
  // Reported AND non-zero: a zero total has no share to divide, so there is
  // no fingerprint to draw and the ND line carries the truth instead.
  const hasFingerprint =
    coa.total_terpenes !== null && coa.total_terpenes > 0 && topTerpenes.length > 0;
  const meta = coa.type === null ? cardDateLine(coa) : `${coa.type} · ${cardDateLine(coa)}`;
  const latest = sessions.length === 0 ? null : sessions[sessions.length - 1];

  return (
    <Pressable onPress={onOpen}>
      <View style={styles.card}>
        <View style={styles.strainRow}>
          {/* Null or whitespace-only strain is stated, not left as a blank
              title line (D97, the same treatment brand gets below). */}
          <Text
            style={coa.strain?.trim() ? styles.strain : styles.strainAbsent}
            numberOfLines={2}>
            {coa.strain?.trim() ? coa.strain : 'Strain not reported'}
          </Text>
          <View style={styles.strainRowActions}>
            {/* Quantity badge (D89): one card per COA regardless of count, so
                the count rides the strain line. Rendered only above a single
                package -- at one package there is no badge at all, because
                absence says it and a stated count of one is noise. */}
            {coa.on_shelf_count > 1 && (
              <Text style={styles.badge}>{`x${coa.on_shelf_count}`}</Text>
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
                      { text: 'Retire a package', onPress: () => onRetire(coa) },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  )
                }
                accessibilityRole="button"
                accessibilityLabel="More actions for this package">
                <Text style={styles.overflowGlyph}>…</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Repurchase intent (D113). With a handler the chip is a control and
            always renders, the unanswered ask included: a question-affordance
            is not a displayed answer, so D48 still holds -- the card shows no
            verdict that was not given, it shows the question. Without a
            handler this is the pre-D113 display, where an unanswered COA
            renders NOTHING at all, never a "No" chip and never a
            placeholder. */}
        {onFavorite === undefined ? (
          coa.favorite !== null && (
            <View style={favoriteChipStyle(coa.favorite)}>
              <Text style={favoriteTextStyle(coa.favorite)}>{favoriteLabel(coa.favorite)}</Text>
            </View>
          )
        ) : (
          /* Nested inside the card's Pressable exactly as the Log button is:
             RN grants the responder to the innermost view that wants it, so
             answering the question does not also open the detail. */
          <Pressable
            style={favoriteChipStyle(coa.favorite)}
            hitSlop={8}
            onPress={() => onFavorite(coa)}
            accessibilityRole="button"
            accessibilityLabel="Set whether you would buy this again">
            <Text style={favoriteTextStyle(coa.favorite)}>{favoriteLabel(coa.favorite)}</Text>
          </Pressable>
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
        {hasFingerprint ? (
          <Fingerprint total={coa.total_terpenes as number} terpenes={topTerpenes} />
        ) : (
          <Text style={styles.ndTerpenes}>Terpenes not reported by lab.</Text>
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
              <Text style={styles.logLabel}>Log</Text>
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
  badge: {
    fontFamily: SORA_BOLD,
    fontSize: 11.5,
    fontVariant: ['tabular-nums'],
    color: Dash.textMuted,
  },
  // Quiet by construction (D114): a muted glyph on no surface at all. The tap
  // target comes from hitSlop rather than a box, so the control adds nothing
  // to the strain line's height.
  overflowGlyph: {
    fontFamily: SORA_BOLD,
    fontSize: 16,
    color: Dash.textMuted,
  },
  chipYes: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(126, 217, 155, 0.14)',
  },
  chipYesText: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 10,
    color: Dash.accent,
  },
  chipNo: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Dash.surface2,
  },
  chipNoText: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 10,
    color: Dash.textMuted,
  },
  // The unanswered ask (D113): an outline where the answered chips carry a
  // fill, so it reads as an open question rather than a third verdict. The
  // 1pt border makes it a shade taller than the answered chips; the chip owns
  // its row, so nothing aligns to it and the difference costs no layout.
  chipAsk: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Dash.surface2,
  },
  chipAskText: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 10,
    color: Dash.textFaint,
  },
  brand: {
    fontFamily: SORA_REGULAR,
    fontSize: 11.5,
    color: Dash.textBody,
  },
  brandAbsent: {
    fontFamily: SORA_REGULAR,
    fontSize: 11.5,
    color: Dash.textMuted,
  },
  meta: {
    fontFamily: SORA_REGULAR,
    fontSize: 11.5,
    color: Dash.textFaint,
  },
  retired: {
    fontFamily: SORA_REGULAR,
    fontSize: 11.5,
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
    fontFamily: SORA_BOLD,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Dash.textFaint,
  },
  totalValue: {
    fontFamily: SORA_SEMIBOLD,
    fontSize: 11.5,
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
  ndTerpenes: {
    fontFamily: SERIF_ITALIC,
    fontSize: 14.5,
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
    fontFamily: SORA_REGULAR,
    fontSize: 11.5,
    color: Dash.textBody,
  },
  footerAbsent: {
    fontFamily: SORA_REGULAR,
    fontSize: 11.5,
    color: Dash.textMuted,
  },
  logButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Dash.accent,
  },
  logLabel: {
    fontFamily: SORA_BOLD,
    fontSize: 11.5,
    color: Dash.bg,
  },
});
