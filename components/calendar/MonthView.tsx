import React, { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";

interface MonthViewProps {
  onDayPress?: (date: Date) => void; // Optional handler for when a day is pressed
  // Add other props as needed, e.g., initialDate
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

// Function to check if two dates are the same day
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const MonthView: React.FC<MonthViewProps> = ({ onDayPress }) => {
  const tintColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background"); // For current day text color inversion
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "border");

  const [currentDisplayDate, setCurrentDisplayDate] = useState(new Date()); // Renamed for clarity
  const today = new Date(); // Get today's date for highlighting

  const year = currentDisplayDate.getFullYear();
  const month = currentDisplayDate.getMonth(); // 0-indexed

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
  const weekDayLetters = ["S", "M", "T", "W", "T", "F", "S"]; // Single letters

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

  const goToPreviousMonth = () => {
    setCurrentDisplayDate(new Date(year, month - 1, 1));
    console.log("Go to previous month");
  };

  const goToNextMonth = () => {
    setCurrentDisplayDate(new Date(year, month + 1, 1));
    console.log("Go to next month");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 15,
      paddingTop: 10,
    },
    monthHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "center",
      marginBottom: 15,
      position: "relative",
    },
    monthText: {
      fontSize: 28,
      fontWeight: "bold",
      marginRight: 8,
    },
    yearTextInline: {
      fontSize: 26,
      fontWeight: "600",
      opacity: 0.9,
    },
    monthNavButton: {
      position: "absolute",
      top: 0,
      bottom: 0,
      justifyContent: "center",
      paddingHorizontal: 15,
      zIndex: 1,
    },
    weekDaysContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 8, // Adjusted spacing
      borderBottomWidth: StyleSheet.hairlineWidth,
      paddingBottom: 8,
      borderColor: borderColor, // Use themed border color
    },
    weekDayText: {
      fontSize: 12, // Slightly smaller for single letters
      fontWeight: "500", // Medium weight
      width: "14%",
      textAlign: "center",
      color: textColor, // Use standard text color
      opacity: 0.6, // Apply opacity for subtle effect
    },
    daysGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-start",
    },
    dayCellTouchable: {
      width: "14.28%", // More precise width for 7 columns
      aspectRatio: 0.9, // Make cells slightly taller than wide
      justifyContent: "flex-start", // Align content top
      alignItems: "center",
      paddingTop: 5, // Padding for the number
      // Remove border here, apply to inner view if needed
    },
    dayCellView: {
      // Inner view for content and potential background/border
      width: "100%",
      height: "100%",
      alignItems: "center",
    },
    dayText: {
      fontSize: 15, // Slightly larger day number
      marginBottom: 3, // Space for event indicators
    },
    todayIndicator: {
      // Style for the current day background
      width: 28, // Size of the circle
      height: 28,
      borderRadius: 14, // Make it a circle
      justifyContent: "center",
      alignItems: "center",
      position: "absolute", // Position behind the text
      top: 3, // Adjust position slightly
    },
    todayText: {
      // Style for text on the current day (inverted color)
      fontSize: 15,
      fontWeight: "bold", // Make today's number bold
      color: backgroundColor, // Use background color for text
    },
    eventIndicatorPlaceholder: {
      // Placeholder for dots/bars
      height: 4,
      width: "60%",
      borderRadius: 2,
      backgroundColor: borderColor, // Use border color as placeholder
      opacity: 0.5,
      marginTop: 2, // Space below number
    },
    emptyCell: {
      width: "14.28%",
      aspectRatio: 0.9,
      // Keep empty cells visually blank or with a subtle background
    },
    navText: {
      fontSize: 20, // Slightly larger nav arrows
      fontWeight: "bold",
    },
  });

  return (
    <ThemedView style={styles.container}>
      {/* Month Header with Inline Year */}
      <ThemedView style={styles.monthHeader}>
        <TouchableOpacity
          onPress={goToPreviousMonth}
          style={[styles.monthNavButton, { left: 0 }]}
        >
          <ThemedText style={[styles.navText, { color: tintColor }]}>
            {"‹"}
          </ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.monthText}>{getMonthName(month)}</ThemedText>
        <ThemedText style={styles.yearTextInline}>{year}</ThemedText>
        <TouchableOpacity
          onPress={goToNextMonth}
          style={[styles.monthNavButton, { right: 0 }]}
        >
          <ThemedText style={[styles.navText, { color: tintColor }]}>
            {"›"}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Week Day Letters */}
      <ThemedView style={styles.weekDaysContainer}>
        {weekDayLetters.map((letter, index) => (
          <ThemedText key={index} style={styles.weekDayText}>
            {letter}
          </ThemedText>
        ))}
      </ThemedView>

      {/* Days Grid */}
      <ThemedView style={styles.daysGrid}>
        {allCells.map((day, index) => {
          const isCurrentDay = day ? isSameDay(day, today) : false;
          return day ? (
            <TouchableOpacity
              key={day.toISOString()}
              style={styles.dayCellTouchable}
              onPress={() => handleDayClick(day)}
            >
              <ThemedView style={styles.dayCellView}>
                {isCurrentDay && (
                  <ThemedView
                    style={[
                      styles.todayIndicator,
                      { backgroundColor: tintColor },
                    ]}
                  />
                )}
                <ThemedText
                  style={isCurrentDay ? styles.todayText : styles.dayText}
                >
                  {day.getDate()}
                </ThemedText>
                {/* Placeholder for event indicators */}
                <ThemedView style={styles.eventIndicatorPlaceholder} />
              </ThemedView>
            </TouchableOpacity>
          ) : (
            <ThemedView key={`empty-${index}`} style={styles.emptyCell} />
          );
        })}
      </ThemedView>
    </ThemedView>
  );
};
