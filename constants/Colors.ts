/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// New color palette
const burntCopper = '#A0430A'; // Primary accent color
const seaMist = '#DFE8E6';     // Secondary/background color

export const Colors = {
  light: {
    text: '#11181C',
    background: seaMist,
    tint: burntCopper,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: burntCopper,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: burntCopper,
    icon: seaMist,
    tabIconDefault: seaMist,
    tabIconSelected: burntCopper,
  },
};
