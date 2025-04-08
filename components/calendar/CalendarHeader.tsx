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

// Helper function to get the start of the week (Sunday)
const getStartOfWeek = (date: Date): Date => {
  const dayOfWeek = date.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = date.getDate() - dayOfWeek;
  return new Date(date.setDate(diff));
};

// Helper function to check if two dates are the same day
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

type CalendarViewMode = "day" | "month";

interface CalendarHeaderProps {
  currentView: CalendarViewMode;
  onViewChange: (view: CalendarViewMode) => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void; // Add handler for date selection
}

interface Styles {
  container: ViewStyle;
  monthContainer: ViewStyle;
  monthText: TextStyle;
  arrowButton: ViewStyle;
  arrowText: TextStyle;
  weekRow: ViewStyle; // Renamed from daysRow
  dayCell: ViewStyle; // Container for each day in the week row
  dayText: TextStyle; // Style for the day number (date)
  dayInitialText: TextStyle; // Style for the day initial (S, M, T...)
  selectedDayCell: ViewStyle; // Style for the selected day's cell
  selectedDayText: TextStyle; // Style for the selected day's text
  toggleContainer: ViewStyle;
  toggleButton: ViewStyle;
  activeToggleButton: ViewStyle;
  toggleButtonText: TextStyle;
  activeToggleButtonText: TextStyle;
}

const dayInitials = ["S", "M", "T", "W", "T", "F", "S"];

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentView,
  onViewChange,
  selectedDate,
  onDateSelect, // Destructure the new handler
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = colorScheme === "dark" ? Colors.dark : Colors.light;

  const monthYearString = selectedDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  // Calculate the dates for the current week
  const startOfWeek = getStartOfWeek(new Date(selectedDate)); // Use a copy
  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDates.push(date);
  }

  const styles = StyleSheet.create<Styles>({
    container: {
      paddingTop: 10,
      paddingBottom: 5, // Reduced bottom padding
      paddingHorizontal: 10, // Adjusted horizontal padding
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: themeColors.border,
      backgroundColor: themeColors.background,
      alignItems: "center",
    },
    monthContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10, // Reduced space
      width: "100%",
      paddingHorizontal: 5, // Reduced padding
    },
    monthText: {
      fontSize: 18,
      fontWeight: "600",
      color: themeColors.tint,
      textAlign: "center",
      flex: 1,
    },
    arrowButton: {
      padding: 5,
    },
    arrowText: {
      fontSize: 20,
      color: themeColors.tint,
    },
    weekRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      width: "100%",
      marginBottom: 10, // Space below week row
    },
    dayCell: {
      alignItems: "center",
      paddingVertical: 5,
      paddingHorizontal: 4, // Reduce horizontal padding slightly
      borderRadius: 15, // Make it circular/rounded
      width: 30, // Fixed width for alignment
      height: 55, // Increased height to fit initial + date
      justifyContent: "center", // Center content vertically
    },
    selectedDayCell: {
      backgroundColor: themeColors.tint, // Highlight background
    },
    dayInitialText: {
      fontSize: 11, // Slightly smaller
      fontWeight: "500",
      color: themeColors.icon,
      marginBottom: 3, // Space between initial and date
    },
    dayText: {
      fontSize: 12,
      fontWeight: "600",
      color: themeColors.text, // Default text color for date number
    },
    selectedDayText: {
      color: themeColors.background, // Contrasting color for selected date text
    },
    toggleContainer: {
      flexDirection: "row",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.tint,
      overflow: "hidden",
      // Removed marginTop: 5, spacing handled by weekRow marginBottom
    },
    toggleButton: {
      paddingVertical: 6,
      paddingHorizontal: 15,
      backgroundColor: themeColors.background,
    },
    activeToggleButton: {
      backgroundColor: themeColors.tint,
    },
    toggleButtonText: {
      fontSize: 14,
      fontWeight: "500",
      color: themeColors.tint,
    },
    activeToggleButtonText: {
      color: themeColors.background,
    },
  });

  return (
    <View style={styles.container}>
      {/* Month and Year Display */}
      <View style={styles.monthContainer}>
        <Text style={styles.monthText}>{monthYearString}</Text>
      </View>

      {/* Week Row (Touchable Days) */}
      <View style={styles.weekRow}>
        {weekDates.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isSelected ? styles.selectedDayCell : null,
              ]}
              onPress={() => onDateSelect(date)} // Call handler on press
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayInitialText,
                  isSelected ? styles.selectedDayText : null,
                ]}
              >
                {dayInitials[date.getDay()]}{" "}
                {/* Get initial based on date's day */}
              </Text>
              <Text
                style={[
                  styles.dayText,
                  isSelected ? styles.selectedDayText : null,
                ]}
              >
                {date.getDate()} {/* Display the day number */}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Day/Month View Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            currentView === "day" ? styles.activeToggleButton : null,
          ]}
          onPress={() => onViewChange("day")}
        >
          <Text
            style={[
              styles.toggleButtonText,
              currentView === "day" ? styles.activeToggleButtonText : null,
            ]}
          >
            Day
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            currentView === "month" ? styles.activeToggleButton : null,
          ]}
          onPress={() => onViewChange("month")}
        >
          <Text
            style={[
              styles.toggleButtonText,
              currentView === "month" ? styles.activeToggleButtonText : null,
            ]}
          >
            Month
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
