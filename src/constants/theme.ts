/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// Declared beside Type rather than inside it: an object literal cannot
// reference its own properties, and the role layer below is built from
// these names. `Type.family` re-exports it unchanged.
const family = {
  regular: 'Sora_400Regular',
  medium: 'Sora_500Medium',
  semibold: 'Sora_600SemiBold',
  bold: 'Sora_700Bold',
  display: 'Sora_800ExtraBold',
  serifItalic: 'Newsreader_400Regular_Italic',
} as const;

/**
 * Type tokens (D137, completed by the 2026-08-18 amendment in
 * `documentation/design/design-overhaul.md`).
 *
 * `family` is the one source for the loaded family names: a font swap edits
 * this object, never a component.
 *
 * `role` is the sized layer, recording what the restyle slices actually
 * shipped rather than the reference's five-role line -- body 11.5 split on
 * real surfaces into three weights (body/value/action), so the roles are
 * seven. Values come from the audited sites, not from a redesign.
 *
 * A role carries type props only -- never color, never layout, never
 * fontVariant. Consumers spread the role and add their own: tabular
 * numerals stay a per-site prop where numerals render, because the
 * reference scopes them to lab values rather than to a weight tier.
 *
 * Sizes that no role covers stay literals at their sites by design (the
 * stat numeral at 26, the serif voice at 13, the label voice at 13/.14em,
 * and the rest of the amendment's kept-literal list): a token with one or
 * two consumers is scaffolding, not a system.
 */
export const Type = {
  family,
  role: {
    display: { fontFamily: family.display, fontSize: 26, lineHeight: 29 },
    title: { fontFamily: family.bold, fontSize: 13 },
    label: {
      fontFamily: family.bold,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    body: { fontFamily: family.regular, fontSize: 11.5 },
    value: { fontFamily: family.semibold, fontSize: 11.5 },
    action: { fontFamily: family.bold, fontSize: 11.5 },
    // The loaded face is the 400 italic; leaving a heavier weight in place
    // would ask iOS to synthesize one this family has no file for.
    serif: { fontFamily: family.serifItalic, fontWeight: '400', fontSize: 14.5 },
  },
} as const;

/**
 * The v2 reference's 4pt spacing scale (D137). Additive beside the legacy
 * Spacing export: the three Spacing consumers keep rendering unchanged
 * until their own slices retire them (app-tabs.web dies in slice 3, the
 * ladder restyles in slice 5). New and restyled surfaces use Space.
 */
export const Space = {
  inline: 4,
  chip: 8,
  row: 12,
  card: 16,
  gutter: 18,
  section: 24,
} as const;

// Raised for the D138 custom bar (icon + label + FAB overhang); the
// device gate is the arbiter if scroll content still clips.
export const BottomTabInset = Platform.select({ ios: 84, android: 96 }) ?? 0;
export const MaxContentWidth = 800;

/**
 * The app's fixed palette, from the ratified design reference
 * (`reference/handoff/cultivar-reference.md`, Tokens). A second named token
 * set beside the light/dark `Colors`, on grounds the reference's own system
 * earned: the dashboard and the session survey both commit to a single dark
 * surface regardless of scheme and carry tokens (verdict band, terpene
 * identity hues) the general theme has no place for. Values are the
 * reference's hex verbatim.
 *
 * Type roles stay out of this set: consumers reference the loaded font
 * families by name (Sora_400Regular/500/600/700/800ExtraBold,
 * Newsreader_400Regular_Italic) as registered in `src/app/_layout.tsx`.
 */
export const Dash = {
  bg: '#0B0F0C',
  surface: '#131A15',
  surface2: '#171C19',
  text: '#F2F5F1',
  textBody: '#AEBBB1',
  textMuted: '#8FA093',
  textFaint: '#5E6B61',
  accent: '#7ED99B',
  // The D145 Stash-header tokens (documentation/design/delta-stash-header.md):
  // the segmented control's track and its standing segment, the sort chip's
  // fill and hairline border, and the chip's value text. Ratified spec values,
  // carried here rather than inline so a header restyle edits this file.
  segmentTrack: 'rgba(255,255,255,0.06)',
  segmentOn: '#2A342C',
  chipFill: 'rgba(255,255,255,0.05)',
  chipBorder: 'rgba(255,255,255,0.08)',
  textStrong: '#D5DED7',
  // The ink of the segmented control's ratified elevation, tokenized so the
  // one shadow in the app carries no literal at its call site.
  shadowInk: '#000000',
  // Verdict band identity, keyed by the D85 rung words, fixed order.
  verdict: {
    Loved: '#7ED99B',
    Liked: '#C9D96E',
    Neutral: '#E8C86E',
    Disliked: '#E89A62',
    Hated: '#E0685E',
  },
  // Terpene identity hues — identity only, consistent per terpene, no
  // meaning (D99). Keys are the lab-reported names lowercased.
  terpene: {
    caryophyllene: '#DBA96F',
    limonene: '#E4D07A',
    bisabolol: '#B4A8DC',
    'beta-pinene': '#8FC79B',
    terpinolene: '#8FBFD6',
    ocimene: '#D68FA8',
    linalool: '#C7A8D6',
    myrcene: '#9BCF8E',
    humulene: '#C79BB8',
    'alpha-pinene': '#7AB8A0',
    camphene: '#B8C78F',
  },
  radius: { badge: 8, row: 12, card: 16, pill: 999 },
} as const;

// Identity only, consistent per terpene, no meaning (D99). An unlisted lab
// name gets the muted text color rather than an invented hue.
export function terpeneHue(name: string): string {
  const hues = Dash.terpene as Record<string, string>;
  return hues[name.toLowerCase()] ?? Dash.textMuted;
}

// A verdict word the token set does not carry -- including a session whose
// word is absent -- renders faint rather than being dropped or uncolored:
// the session happened. One source for the card's dots, the summary's bars,
// the ladder's tier stripes, and the detail's session rows.
export function verdictHue(word: string | null): string {
  if (word === null) return Dash.textFaint;
  const hues = Dash.verdict as Record<string, string>;
  return hues[word] ?? Dash.textFaint;
}
