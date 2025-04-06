/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// New color palette
const burntCopper = '#A0430A'; // Primary accent color
const seaMist = '#DFE8E6';     // Secondary/background color

// Importance level colors (brown shades)
const importanceColors = {
  low: '#D4A276',      // Light brown
  medium: '#B87C4C',   // Medium brown
  high: '#A0430A',     // Burnt copper (darker brown)
  urgent: '#692B0A',   // Very dark brown
};

export const Colors = {
  light: {
    text: '#000',
    background: '#fff',
    tint: '#A0430A',
    icon: '#999',
    tabIconDefault: '#ccc',
    tabIconSelected: '#A0430A',
    border: '#E1E1E1',
    importance: {
      low: '#4CAF50',
      medium: '#FFC107',
      high: '#FF9800',
      urgent: '#F44336',
    },
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: '#A0430A',
    icon: '#fff',
    tabIconDefault: '#ccc',
    tabIconSelected: '#A0430A',
    border: '#333',
    importance: {
      low: '#4CAF50',
      medium: '#FFC107',
      high: '#FF9800',
      urgent: '#F44336',
    },
  },
} as const;

export type ColorScheme = typeof Colors.light & typeof Colors.dark;
