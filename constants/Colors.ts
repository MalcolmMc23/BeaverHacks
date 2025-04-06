/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// New color palette
const burntCopper = '#A0430A'; // Primary accent color
const seaMist = '#DFE8E6';     // Secondary/background color

// Importance level colors (more distinct brown shades)
const importanceColors = {
  low: '#C8A27D',      // Light sandy brown
  medium: '#AA7039',    // Medium caramel brown
  high: '#8B4513',      // Saddle brown
  urgent: '#5D1C09',    // Deep chocolate brown
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
      low: '#C8A27D',      // Light sandy brown
      medium: '#AA7039',    // Medium caramel brown
      high: '#8B4513',      // Saddle brown
      urgent: '#5D1C09',    // Deep chocolate brown
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
      low: '#C8A27D',      // Light sandy brown
      medium: '#AA7039',    // Medium caramel brown
      high: '#8B4513',      // Saddle brown
      urgent: '#5D1C09',    // Deep chocolate brown
    },
  },
} as const;

export type ColorScheme = typeof Colors.light & typeof Colors.dark;
