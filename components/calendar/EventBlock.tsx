import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Event } from "./DayView"; // Assuming Event interface is exported from DayView or moved elsewhere
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

interface EventBlockProps {
  event: Event;
  onPress: (event: Event) => void;
  style?: ViewStyle; // Allow passing positioning styles (top, height)
}

interface EventBlockStyles {
  eventBlock: ViewStyle;
  eventText: TextStyle;
  eventTimeText: TextStyle;
}

export const EventBlock: React.FC<EventBlockProps> = ({
  event,
  onPress,
  style,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = colorScheme === "dark" ? Colors.dark : Colors.light;
  const height = typeof style?.height === "number" ? style.height : 0;

  const styles = StyleSheet.create<EventBlockStyles>({
    eventBlock: {
      // Removed absolute positioning - handled by parent
      left: 0,
      right: 0,
      backgroundColor: event.color || themeColors.tint, // Use event's color or default
      borderRadius: 4,
      padding: 4,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: themeColors.border,
      // Height is applied via the style prop
    },
    eventText: {
      fontSize: 10,
      color: themeColors.background, // Text color contrasts with background
      fontWeight: "bold",
    },
    eventTimeText: {
      fontSize: 8,
      color: themeColors.background, // Adjust if needed for better contrast on event color
      opacity: 0.8, // Slightly less prominent
    },
  });

  return (
    <TouchableOpacity
      style={[styles.eventBlock, style]} // Combine base styles with passed position styles
      onPress={() => onPress(event)}
      activeOpacity={0.7} // Provide visual feedback on press
    >
      <Text style={styles.eventText} numberOfLines={1}>
        {event.title}
      </Text>
      {/* Optional: Add start/end times if height allows */}
      {height > 30 && (
        <Text style={styles.eventTimeText}>
          {`${event.startTime.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })} - ${event.endTime.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}`}
        </Text>
      )}
    </TouchableOpacity>
  );
};
