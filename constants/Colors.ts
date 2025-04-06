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
    text: '#11181C',
    background: seaMist,
    tint: burntCopper,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: burntCopper,
    importance: importanceColors,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: burntCopper,
    icon: seaMist,
    tabIconDefault: seaMist,
    tabIconSelected: burntCopper,
    importance: importanceColors,
  },
};
