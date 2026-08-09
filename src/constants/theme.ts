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

/**
 * Font-family token roles (D137). One source for the loaded family names:
 * a font swap edits this object, never a component. Sizes, weights-as-
 * numbers, and tracking stay in the consuming styles until each surface's
 * restyle slice adopts the reference's type roles.
 */
export const Type = {
  family: {
    regular: 'Sora_400Regular',
    medium: 'Sora_500Medium',
    semibold: 'Sora_600SemiBold',
    bold: 'Sora_700Bold',
    display: 'Sora_800ExtraBold',
    serifItalic: 'Newsreader_400Regular_Italic',
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

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
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
