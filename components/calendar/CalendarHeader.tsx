import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

type CalendarViewMode = "day" | "month";

interface CalendarHeaderProps {
  currentView: CalendarViewMode;
  onViewChange: (view: CalendarViewMode) => void;
}

interface Styles {
  container: ViewStyle;
  buttonContainer: ViewStyle;
  button: ViewStyle;
  activeButton: ViewStyle;
  buttonText: TextStyle;
  activeButtonText: TextStyle;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentView,
  onViewChange,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = colorScheme === "dark" ? Colors.dark : Colors.light;

  const styles = StyleSheet.create<Styles>({
    container: {
      flexDirection: "row",
      justifyContent: "center", // Center the toggle buttons
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: themeColors.border,
      backgroundColor: themeColors.background,
    },
    buttonContainer: {
      flexDirection: "row",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.tint,
      overflow: "hidden", // Keep button backgrounds contained
    },
    button: {
      paddingVertical: 6,
      paddingHorizontal: 15,
      backgroundColor: themeColors.background, // Default background
    },
    activeButton: {
      backgroundColor: themeColors.tint, // Active background
    },
    buttonText: {
      fontSize: 14,
      fontWeight: "500",
      color: themeColors.tint, // Default text color
    },
    activeButtonText: {
      color: themeColors.background, // Text color when active (use background for contrast)
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            currentView === "day" ? styles.activeButton : null,
          ]}
          onPress={() => onViewChange("day")}
        >
          <Text
            style={[
              styles.buttonText,
              currentView === "day" ? styles.activeButtonText : null,
            ]}
          >
            Day
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            currentView === "month" ? styles.activeButton : null,
          ]}
          onPress={() => onViewChange("month")}
        >
          <Text
            style={[
              styles.buttonText,
              currentView === "month" ? styles.activeButtonText : null,
            ]}
          >
            Month
          </Text>
        </TouchableOpacity>
      </View>
      {/* Add other header elements like current date display later if needed */}
    </View>
  );
};
