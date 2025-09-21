/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// App accent (purple from your mockups)
const tintColorLight = '#a855f7';
const tintColorDark = '#a855f7';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Extended tokens for UI surfaces
    screenBg: '#f6f7fb',
    surface: '#f1f5f9',
    surfaceSoft: '#eef2f7',
    surfaceBorder: '#e8ecf4',
    placeholder: '#9ca3af',
    textMuted: '#6b7280',
    badgeBg: '#38bdf8',
    badgeText: '#ffffff',
    accent2: '#3C95A6',
    error: '#ef4444',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Extended tokens for UI surfaces
    screenBg: '#0a0a0a',
    surface: '#0f172a',
    surfaceSoft: '#111827',
    surfaceBorder: '#1f2937',
    placeholder: '#9aa3b2',
    textMuted: '#9ca3af',
    badgeBg: '#22d3ee',
    badgeText: '#0f172a',
    accent2: '#3C95A6',
    error: '#f87171',
  },
};

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
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
