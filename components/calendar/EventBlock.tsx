import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  useAnimatedReaction,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { Event } from "./AddEventModal"; // Import Event from AddEventModal where it's defined
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

// Define constants used in DayView for calculations (or import them)
const HOUR_HEIGHT = 60;
const MINUTES_IN_HOUR = 60;

interface EventBlockProps {
  event: Event;
  onPress: (event: Event) => void;
  onDragEnd: (eventId: string, newStartTime: Date, newEndTime: Date) => void; // Callback for drag end
  style?: ViewStyle;
}

interface EventBlockStyles {
  eventBlock: ViewStyle;
  eventText: TextStyle;
  eventTimeText: TextStyle;
}

// Helper to calculate time from Y offset, snapping to 15-minute intervals
const calculateTimeFromY = (y: number, originalDate: Date): Date => {
  const totalMinutesFromTop = (y / HOUR_HEIGHT) * MINUTES_IN_HOUR;
  let hours = Math.floor(totalMinutesFromTop / MINUTES_IN_HOUR);
  let minutes = totalMinutesFromTop % MINUTES_IN_HOUR;

  // Snap minutes to the nearest 15-minute interval
  const snappedMinutes = Math.round(minutes / 15) * 15;

  // Handle case where rounding pushes minutes to 60
  if (snappedMinutes === 60) {
    hours += 1;
    minutes = 0;
  } else {
    minutes = snappedMinutes;
  }

  // Ensure hours stay within 0-23 range (although clamping later helps too)
  hours = Math.max(0, Math.min(23, hours));

  // Create a new date object based on the original event date but with new time
  const newDate = new Date(originalDate);
  // Set hours and snapped minutes, reset seconds and milliseconds
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};

// Helper to calculate Y offset from time
const calculateYFromTime = (time: Date): number => {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const totalMinutes = hours * MINUTES_IN_HOUR + minutes;
  const y = (totalMinutes / MINUTES_IN_HOUR) * HOUR_HEIGHT;
  return y;
};

export const EventBlock: React.FC<EventBlockProps> = ({
  event,
  onPress,
  onDragEnd, // Receive the callback
  style,
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = colorScheme === "dark" ? Colors.dark : Colors.light;
  const height = typeof style?.height === "number" ? style.height : 0;
  const originalTop = typeof style?.top === "number" ? style.top : 0;

  // Shared values for position
  const offsetY = useSharedValue(0);
  const startY = useSharedValue(0); // Keep track of drag start offset

  // Use animated reaction to reset offset *after* the top prop changes
  useAnimatedReaction(
    () => style?.top, // Input: watch the top prop from style
    (currentTop, previousTop) => {
      if (
        currentTop !== undefined &&
        currentTop !== previousTop &&
        offsetY.value !== 0 // Only reset if there *was* an offset
      ) {
        // When the parent re-renders and provides a new `top` style,
        // and we actually dragged (offsetY is not 0), reset the visual offset.
        offsetY.value = 0;
      }
    },
    [style?.top, offsetY] // Dependencies for the reaction setup
  );

  // --- Gesture Handler ---
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startY.value = offsetY.value; // Store current offset when drag begins
    })
    .onUpdate((e) => {
      // Calculate the tentative visual Y position based on where the finger is
      const tentativeVisualY = Math.max(
        0,
        originalTop + startY.value + e.translationY
      );

      // Calculate the time corresponding to this tentative position, snapping it
      const tentativeTime = calculateTimeFromY(
        tentativeVisualY,
        event.startTime
      ); // This snaps

      // Convert the snapped time back to a Y position
      const snappedVisualY = calculateYFromTime(tentativeTime);

      // Calculate the required offset to reach the snapped position
      // Prevent exceeding 24 hours visually during drag (onEnd handles final clamping)
      const maxPossibleTop = 24 * HOUR_HEIGHT - (height || HOUR_HEIGHT / 4); // Use min height if actual height is 0
      const clampedSnappedVisualY = Math.min(snappedVisualY, maxPossibleTop);

      const snappedOffsetY = clampedSnappedVisualY - originalTop;

      // Update the visual offset
      offsetY.value = snappedOffsetY;
    })
    .onEnd(() => {
      // Calculate the final visual Y position based on the original prop and the drag offset
      const finalVisualY = Math.max(0, originalTop + offsetY.value);

      // Calculate the logical new start/end times based on this final visual position
      const newStartTime = calculateTimeFromY(finalVisualY, event.startTime);

      // Calculate duration in milliseconds
      const durationMs = event.endTime.getTime() - event.startTime.getTime();

      // Calculate new end time by adding the original duration
      const newEndTime = new Date(newStartTime.getTime() + durationMs);

      // Clamp new start time to prevent going before 00:00
      const minTime = new Date(newStartTime);
      minTime.setHours(0, 0, 0, 0);

      let clampedStartTime = newStartTime;
      let clampedEndTime = newEndTime;

      if (clampedStartTime.getTime() < minTime.getTime()) {
        clampedStartTime = minTime;
        clampedEndTime = new Date(clampedStartTime.getTime() + durationMs);
      }

      // Prevent end time from exceeding the day boundary (24:00)
      const dayEndTimeLimit = new Date(newStartTime);
      dayEndTimeLimit.setHours(24, 0, 0, 0); // Start of next day

      if (clampedEndTime.getTime() >= dayEndTimeLimit.getTime()) {
        // Adjust end time to be exactly the end of the day (23:59:59.999)
        clampedEndTime = new Date(dayEndTimeLimit.getTime() - 1);
        // Adjust start time accordingly to maintain duration
        clampedStartTime = new Date(clampedEndTime.getTime() - durationMs);
        // Re-clamp start time if duration pushes it before 00:00
        if (clampedStartTime.getTime() < minTime.getTime()) {
          clampedStartTime = minTime;
          // Recalculate end time if start time was clamped
          clampedEndTime = new Date(clampedStartTime.getTime() + durationMs);
          // Ensure end time doesn't exceed 24:00 again
          if (clampedEndTime.getTime() >= dayEndTimeLimit.getTime()) {
            clampedEndTime = new Date(dayEndTimeLimit.getTime() - 1);
          }
        }
      }

      // Call the callback on the JS thread to trigger state update
      runOnJS(onDragEnd)(event.id, clampedStartTime, clampedEndTime);

      // !! DO NOT reset offsetY here !!
      // The useAnimatedReaction handles resetting the offset visually
      // *after* the parent component supplies the new `top` style.
    })
    .runOnJS(true); // Ensure onEnd runs on JS thread for state updates

  // Animated style for translation
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: offsetY.value }],
      // Optional: Add visual feedback during drag (e.g., slight scale or shadow)
      // elevation: offsetY.value !== 0 ? 5 : 1, // Example elevation change
    };
  });
  // --- End Gesture Handler ---

  const styles = StyleSheet.create<EventBlockStyles>({
    eventBlock: {
      // Base styles (keep position absolute from parent's perspective)
      left: 0, // Keep L/R positioning relative to the DayView's event container
      right: 0,
      backgroundColor: event.color || themeColors.tint,
      borderRadius: 4,
      padding: 4,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: themeColors.border,
      // Height and Top are applied via the style prop
    },
    eventText: {
      fontSize: 10,
      color: themeColors.background,
      fontWeight: "bold",
    },
    eventTimeText: {
      fontSize: 8,
      color: themeColors.background,
      opacity: 0.8,
    },
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.eventBlock, style, animatedStyle]}>
        {/* Use TouchableOpacity for press handling, but gesture handles drag */}
        <TouchableOpacity
          onPress={() => onPress(event)}
          activeOpacity={0.7}
          style={{ flex: 1 }} // Make sure touchable area fills the block
        >
          <Text style={styles.eventText} numberOfLines={1}>
            {event.title}
          </Text>
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
      </Animated.View>
    </GestureDetector>
  );
};
