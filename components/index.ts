// Re-export components from subfolders
export * from './todo';
export * from './ui';
export * from './Collapsible';
export * from './ExternalLink';
export * from './ThemedText';
export * from './ThemedView';
export * from './calendar';
export { AddEventModal } from "./calendar/AddEventModal";
export type { Event } from "./calendar/AddEventModal";
export { Todo, ScheduleTodo, TodoOptimalTimeAssistant } from "./todo";
export { AddButton, IconSymbol, TabBarBackground, useBottomTabOverflow } from "./ui";
export { ThemedText } from "./ThemedText";
export { ThemedView } from "./ThemedView";
export { Collapsible } from "./Collapsible";
export { ExternalLink } from "./ExternalLink";
export { HelloWave } from "./HelloWave";

// Add ParallaxScrollView and ManageLockedAppsModal if needed
// export { ParallaxScrollView } from './ParallaxScrollView';
// export { ManageLockedAppsModal } from './ManageLockedAppsModal';
// export { Onboarding } from './Onboarding'; 