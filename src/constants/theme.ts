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

/**
 * The session survey's fixed palette (D83 "Moody & tactile"). A named token
 * set distinct from the app-wide light/dark `Colors`: the survey commits to a
 * single dark surface regardless of scheme, and it carries survey-only tokens
 * (accent, the score tier ramp) the general theme has no place for. The hex
 * values are the architect's oklch->sRGB conversions of the design doc's
 * tokens; `documentation/design/art-direction.md` keeps the oklch source of
 * truth, these are the RN-consumable form (RN does not parse oklch()).
 */
export const Survey = {
  background: '#090d0a',
  surface: '#131b15',
  surfaceHi: '#1b241d',
  text: '#e9f1ea',
  subtext: '#7f8f84',
  accent: '#7fdc9a',
  onAccent: '#08120b',
  errorBorder: '#d6725d',
  errorDot: '#eb8656',
  // Tier ramp best -> worst, aligned to the score pill order Elite -> Trash.
  tier: ['#76cf8a', '#a9cb7d', '#d7c477', '#e4965c', '#d6725d'],
} as const;

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
