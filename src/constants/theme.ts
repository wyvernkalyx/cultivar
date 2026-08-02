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
    'alpha-pinene': '#7AB8A0',
    camphene: '#B8C78F',
  },
  radius: { badge: 8, row: 12, card: 16 },
} as const;
