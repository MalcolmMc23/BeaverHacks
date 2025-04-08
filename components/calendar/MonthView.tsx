import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

interface MonthViewProps {
  onDayPress?: (date: Date) => void; // Optional handler for when a day is pressed
  // Add other props as needed, e.g., initialDate
}

interface Styles {
  container: ViewStyle;
  header: ViewStyle;
  headerText: TextStyle;
  weekDaysContainer: ViewStyle;
  weekDayText: TextStyle;
  daysGrid: ViewStyle;
  dayCell: ViewStyle;
  dayText: TextStyle;
  emptyCell: ViewStyle;
  // Add more styles as needed
}

// Helper function to get days in a month (simplified for now)
const getDaysInMonth = (year: number, month: number): Date[] => {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

// Helper function to get the name of the month
const getMonthName = (monthIndex: number): string => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return monthNames[monthIndex];
};

export const MonthView: React.FC<MonthViewProps> = ({ onDayPress }) => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = colorScheme === "dark" ? Colors.dark : Colors.light;
  const [currentDate, setCurrentDate] = useState(new Date()); // Default to current date

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Create empty cells for days before the 1st of the month
  const emptyCells = Array(firstDayOfMonth).fill(null);
  const allCells = [...emptyCells, ...daysInMonth];

  const handleDayClick = (day: Date | null) => {
    if (day && onDayPress) {
      onDayPress(day);
    } else if (day) {
      console.log("Day pressed:", day.toDateString()); // Default action
    }
  };

  // --- Dummy Navigation Handlers (Implement actual logic later) ---
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    console.log("Go to previous month");
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    console.log("Go to next month");
  };
  // --- End Dummy Navigation Handlers ---

  const styles = StyleSheet.create<Styles>({
    container: {
      flex: 1,
      padding: 10,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
      paddingHorizontal: 10,
    },
    headerText: {
      fontSize: 18,
      fontWeight: "bold",
      color: themeColors.text,
    },
    weekDaysContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 5,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: themeColors.border,
      paddingBottom: 5,
    },
    weekDayText: {
      fontSize: 12,
      color: themeColors.text,
      fontWeight: "500",
      width: "14%", // Ensure equal spacing
      textAlign: "center",
    },
    daysGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-start", // Start days from the left
    },
    dayCell: {
      width: "14%", // 7 days a week
      aspectRatio: 1, // Make cells square-ish
      justifyContent: "center",
      alignItems: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: themeColors.border, // Subtle border
    },
    emptyCell: {
      width: "14%",
      aspectRatio: 1,
      backgroundColor: themeColors.border, // Use border color for empty cells
    },
    dayText: {
      fontSize: 14,
      color: themeColors.text,
    },
    // Add styles for navigation buttons if needed
  });

  return (
    <View style={styles.container}>
      {/* Header with Month Name and Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth}>
          <Text style={{ color: themeColors.tint }}>{"< "}</Text>
          {/* Basic navigation */}
        </TouchableOpacity>
        <Text style={styles.headerText}>{`${getMonthName(
          month
        )} ${year}`}</Text>
        <TouchableOpacity onPress={goToNextMonth}>
          <Text style={{ color: themeColors.tint }}>{" >"}</Text>
          {/* Basic navigation */}
        </TouchableOpacity>
      </View>

      {/* Week Day Headers */}
      <View style={styles.weekDaysContainer}>
        {weekDays.map((day) => (
          <Text key={day} style={styles.weekDayText}>
            {day}
          </Text>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.daysGrid}>
        {allCells.map((day, index) =>
          day ? (
            <TouchableOpacity
              key={day.toISOString()} // Use ISO string for unique key
              style={styles.dayCell}
              onPress={() => handleDayClick(day)}
            >
              <Text style={styles.dayText}>{day.getDate()}</Text>
              {/* TODO: Add indicators for events later */}
            </TouchableOpacity>
          ) : (
            <View key={`empty-${index}`} style={styles.emptyCell} />
          )
        )}
      </View>
    </View>
  );
};
