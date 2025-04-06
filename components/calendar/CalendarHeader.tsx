import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";

type ViewMode = "day" | "month";
type ColorScheme = "light" | "dark";

interface CalendarHeaderProps {
  currentMonth: string;
  selectedDate: string;
  viewMode: ViewMode;
  colorScheme: ColorScheme;
  onToggleViewMode: () => void;
  onAddEventPress: () => void;
  onNavigatePress?: () => void; // Optional for backward compatibility
}

interface HeaderStyles {
  header: ViewStyle;
  headerLeft: ViewStyle;
  headerButton: ViewStyle;
  headerButtonText: TextStyle;
  headerTitle: TextStyle;
  headerRight: ViewStyle;
  headerIconButton: ViewStyle;
}

export default function CalendarHeader({
  currentMonth,
  selectedDate,
  viewMode,
  colorScheme,
  onToggleViewMode,
  onAddEventPress,
  onNavigatePress,
}: CalendarHeaderProps) {
  // Determine if current month is selected or not
  const isCurrentMonth =
    new Date().getMonth() === new Date(selectedDate).getMonth();

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity style={styles.headerButton} onPress={onNavigatePress}>
          <IconSymbol
            name="chevron.left"
            size={24}
            color={Colors[colorScheme].tint}
          />
          <Text
            style={[
              styles.headerButtonText,
              { color: Colors[colorScheme].tint },
            ]}
          >
            {isCurrentMonth ? "Today" : "Previous"}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.headerTitle, { color: Colors[colorScheme].tint }]}>
        {currentMonth.split(" ")[0]} {/* Just show month name */}
      </Text>
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={onToggleViewMode}
        >
          <IconSymbol
            name={viewMode === "day" ? "calendar" : "clock"}
            size={22}
            color={Colors[colorScheme].tint}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIconButton}>
          <IconSymbol
            name="magnifyingglass"
            size={22}
            color={Colors[colorScheme].tint}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={onAddEventPress}
        >
          <IconSymbol name="plus" size={22} color={Colors[colorScheme].tint} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create<HeaderStyles>({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButtonText: {
    fontSize: 17,
    fontWeight: "400",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
  },
  headerIconButton: {
    padding: 5,
  },
});
