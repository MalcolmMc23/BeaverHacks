import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  PanResponder,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
  Animated,
  Text as RNText,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { Text, View } from "react-native";
import { Colors } from "@/constants/Colors";
import * as Haptics from "expo-haptics";
import CurrentTimeIndicator from "./CurrentTimeIndicator";
import DraggableEvent from "./DraggableEvent";

// Constants
const burntCopper = "#A0430A"; // Primary accent color from constants

// Define types for our events
export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  color?: string;
  isAllDay?: boolean;
  alert?: string;
  showAs?: string;
}

// Array of all hours for day view
const HOURS = [
  "12",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "Noon",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];

// Update the EVENT_COLORS with brown tones
const EVENT_COLORS = [
  burntCopper,
  "#5856D6",
  "#8B4513", // Another brown tone
  "#654321", // Darker brown
  "#6B4226", // Medium brown
  "#AF52DE",
];

const getRandomColor = () =>
  EVENT_COLORS[Math.floor(Math.random() * EVENT_COLORS.length)];

// Props definition
interface DayViewProps {
  selectedDate: string;
  events: CalendarEvent[];
  colorScheme: "light" | "dark";
  isDark?: boolean;
  onEventPress: (event: CalendarEvent, index: number) => void;
  onTimeSlotPress: (hour: number, minutes?: number) => void;
  onInitiateEventCreation?: (data: {
    startDate: Date;
    endDate: Date;
    color: string;
    fromDrag?: boolean;
    draggedEventIndex?: number;
  }) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  selectedDate,
  events,
  colorScheme,
  isDark = false,
  onEventPress,
  onTimeSlotPress,
  onInitiateEventCreation,
}) => {
  // State variables
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [lastTapPosition, setLastTapPosition] = useState(0);
  const DOUBLE_TAP_DELAY = 10000; // ms between taps to count as double-tap

  const [dragEvent, setDragEvent] = useState<{
    visible: boolean;
    startY: number;
    color: string;
  }>({
    visible: false,
    startY: 0,
    color: getRandomColor(),
  });
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const LONG_PRESS_DURATION = 1200; // 1.2 seconds to trigger event creation modal
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipOpacity = useRef(new Animated.Value(0)).current;

  // Update current time every minute
  useEffect(() => {
    // Set initial time
    setCurrentTime(new Date());

    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Position events on the time grid
  const positionEvent = (event: CalendarEvent) => {
    const startHour = event.start.getHours();
    const startMinute = event.start.getMinutes();
    const endHour = event.end.getHours();
    const endMinute = event.end.getMinutes();

    // Calculate position and height
    const startPosition = startHour * 60 + startMinute;
    const endPosition = endHour * 60 + endMinute;
    const duration = endPosition - startPosition;

    return {
      top: startPosition,
      height: Math.max(duration, 30), // Minimum height for visibility
    };
  };

  // Get time from Y position in the timeline
  const getTimeFromPosition = (yPosition: number) => {
    // Calculate hour and minute from y position
    const hour = Math.floor(yPosition / 60);
    const minute = Math.round((yPosition % 60) / 15) * 15; // Round to nearest 15 min

    // Create date object at the selected date with the calculated time
    const date = new Date(selectedDate);
    date.setHours(hour);
    date.setMinutes(minute);

    return date;
  };

  // Handle scroll events to track scroll position
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollOffset(event.nativeEvent.contentOffset.y);
  };

  // Get day information
  const selectedDayName = new Date(selectedDate).toLocaleString("default", {
    weekday: "long",
  });

  const selectedDayFormatted = new Date(selectedDate).toLocaleString(
    "default",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  // Check if selected date is today
  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  // Scroll to appropriate time when the component mounts or selected date changes
  useEffect(() => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        if (isToday) {
          // If today, scroll to current hour minus 1 for context
          const currentHour = new Date().getHours();
          const scrollPosition = Math.max(0, (currentHour - 1) * 60);
          scrollViewRef.current.scrollTo({
            y: scrollPosition,
            animated: false,
          });
        } else {
          // Otherwise scroll to 8 AM
          scrollViewRef.current.scrollTo({ y: 8 * 60, animated: false });
        }
      }
    }, 100);
  }, [selectedDate, isToday]);

  // Calculate current time position
  const currentTimePosition =
    currentTime.getHours() * 60 + currentTime.getMinutes();

  // Pan responder for creating events with long press and drag
  const panResponder = useRef(
    PanResponder.create({
      // Only capture if it's a true long press, not a scroll attempt
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,

      // Make it harder to accidentally trigger event creation
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;

        // Explicitly prevent pan responder from activating if already dragging an event
        if (isDragging) {
          return false;
        }

        // If there's significant movement, assume it's a scroll attempt
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          return false;
        }

        // Only allow very small movements to be considered for event creation
        return true;
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: (event: GestureResponderEvent) => {
        // Skip if we're already in a dragging state or if the user clicked on an event
        if (isDragging) {
          return;
        }

        // Check if the tap is on a calendar event by inspecting the target
        // If event.target has a parent with a certain class or high z-index, it might be an event
        const target = event.target as any;
        const isOnEvent =
          target &&
          (target.className?.includes?.("eventItem") ||
            target.style?.zIndex > 50 ||
            target.parentNode?.className?.includes?.("eventItem"));

        if (isOnEvent) {
          return; // Don't handle tap on an event
        }

        // Get the tap position accounting for scroll
        const { locationY } = event.nativeEvent;
        const tapY = locationY + scrollOffset;

        // Store the starting Y position
        setDragEvent({
          visible: false, // Don't show preview immediately
          startY: tapY,
          color: getRandomColor(),
        });

        // Start a timer to differentiate between tap and long press
        const timer = setTimeout(() => {
          // Only if we're not scrolling or dragging already
          if (scrollViewRef.current) {
            scrollViewRef.current.setNativeProps({ scrollEnabled: false });

            // Show the preview event at this position
            setDragEvent({
              visible: true,
              startY: tapY,
              color: getRandomColor(),
            });

            // Provide haptic feedback
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Set dragging state
            setIsDragging(true);
          }
        }, LONG_PRESS_DURATION);

        setLongPressTimer(timer);
      },
      onPanResponderMove: (event: GestureResponderEvent, gestureState) => {
        // Skip if the tap was on an event (we're checking the original event.target here)
        const target = event.target as any;
        const isOnEvent =
          target &&
          (target.className?.includes?.("eventItem") ||
            target.style?.zIndex > 50 ||
            target.parentNode?.className?.includes?.("eventItem"));

        if (isOnEvent) {
          // Cancel any pending long press
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
          }
          return;
        }

        // Only proceed with dragging if significant movement has occurred
        const { dx, dy } = gestureState;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          // Cancel the long press timer if it exists
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
          }

          // If we're in drag mode, update the preview position
          if (isDragging && dragEvent.visible) {
            // Get the initial position plus the drag amount
            const dragY = dragEvent.startY + gestureState.dy;
            // Snap to 15-minute intervals
            const snappedY = Math.round(dragY / 15) * 15;

            // Update the position
            setDragEvent({
              visible: true,
              startY: snappedY,
              color: dragEvent.color,
            });
          }
        }
      },
      onPanResponderRelease: (event: GestureResponderEvent) => {
        // Clear the long press timer if it exists
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          setLongPressTimer(null);
        }

        // Skip if the tap was on an event
        const target = event.target as any;
        const isOnEvent =
          target &&
          (target.className?.includes?.("eventItem") ||
            target.style?.zIndex > 50 ||
            target.parentNode?.className?.includes?.("eventItem"));

        if (isOnEvent) {
          return;
        }

        // If we're showing a preview event, finalize its creation
        if (isDragging && dragEvent.visible) {
          // Calculate the start and end times
          const startDate = getTimeFromPosition(dragEvent.startY);
          const endDate = new Date(startDate);
          endDate.setHours(endDate.getHours() + 1); // Default 1 hour duration

          // Call the creation handler
          if (onInitiateEventCreation) {
            onInitiateEventCreation({
              startDate,
              endDate,
              color: dragEvent.color,
              fromDrag: true,
            });
          }

          // Reset the drag event
          setDragEvent({
            visible: false,
            startY: 0,
            color: getRandomColor(),
          });
        }

        // Reset the dragging state
        setIsDragging(false);

        // Re-enable scrolling
        if (scrollViewRef.current) {
          scrollViewRef.current.setNativeProps({ scrollEnabled: true });
        }
      },
      onPanResponderTerminate: () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          setLongPressTimer(null);
        }

        setDragEvent({
          visible: false,
          startY: 0,
          color: getRandomColor(),
        });
        setIsDragging(false);
      },
    })
  ).current;

  // Handle drag operations
  const handleDragStart = () => {
    // Cancel any existing long press operations to prevent new event creation
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    // Clear any pending drag event preview
    if (dragEvent.visible) {
      setDragEvent({
        visible: false,
        startY: 0,
        color: getRandomColor(),
      });
    }

    // Disable scroll when dragging an event
    if (scrollViewRef.current) {
      scrollViewRef.current.setNativeProps({ scrollEnabled: false });
    }

    // Set dragging state to prevent other interactions
    setIsDragging(true);
  };

  const handleDragEnd = (eventIndex: number, newStart: Date, newEnd: Date) => {
    // Re-enable scroll
    if (scrollViewRef.current) {
      scrollViewRef.current.setNativeProps({ scrollEnabled: true });
    }

    // Clear dragging state
    setIsDragging(false);

    // Create a copy of the events array
    const updatedEvents = [...events];
    if (updatedEvents[eventIndex]) {
      // Update the event with new times
      updatedEvents[eventIndex] = {
        ...updatedEvents[eventIndex],
        start: newStart,
        end: newEnd,
      };

      // Trigger any parent component updates with specific drag data
      if (onInitiateEventCreation) {
        onInitiateEventCreation({
          startDate: newStart,
          endDate: newEnd,
          color: updatedEvents[eventIndex].color || getRandomColor(),
          fromDrag: true,
          draggedEventIndex: eventIndex,
        });
      }

      // Provide haptic feedback for successful drag
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Handle a tap on a time slot with double-tap detection
  const handleTimeSlotTap = (event: GestureResponderEvent, hour: number) => {
    // Check if tap is on an event, in which case ignore it
    const target = event.target as any;
    const isOnEvent =
      target &&
      (target.className?.includes?.("eventItem") ||
        target.style?.zIndex > 50 ||
        target.parentNode?.className?.includes?.("eventItem"));

    if (isOnEvent) {
      return; // Don't handle taps on events
    }

    const { locationY } = event.nativeEvent;
    const tapPosition = locationY + scrollOffset;
    const now = Date.now();

    // Check if this is a double-tap at roughly the same position
    if (
      now - lastTapTime < DOUBLE_TAP_DELAY &&
      Math.abs(lastTapPosition - tapPosition) < 40
    ) {
      // This is a double tap - create an event
      const startTime = getTimeFromPosition(tapPosition);
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1); // 1 hour event

      if (onInitiateEventCreation) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onInitiateEventCreation({
          startDate: startTime,
          endDate: endTime,
          color: getRandomColor(),
        });
      }
    } else {
      // Store this tap info for potential double-tap detection
      setLastTapTime(now);
      setLastTapPosition(tapPosition);

      // Regular single tap - just call the hour press handler
      onTimeSlotPress(hour);
    }
  };

  // Show tooltip after first tap to guide user
  useEffect(() => {
    if (lastTapTime > 0 && !showTooltip) {
      setShowTooltip(true);
      Animated.sequence([
        Animated.timing(tooltipOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(tooltipOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowTooltip(false);
      });
    }
  }, [lastTapTime]);

  return (
    <>
      <View
        style={[
          styles.dayHeader,
          { borderColor: isDark ? `${burntCopper}80` : `${burntCopper}40` },
        ]}
      >
        <Text
          style={[styles.dayHeaderText, { color: Colors[colorScheme].text }]}
        >
          {selectedDayName} — {selectedDayFormatted}
        </Text>
      </View>

      {/* Tooltip to guide users on how to create events */}
      {showTooltip && (
        <Animated.View
          style={[
            styles.tooltip,
            {
              opacity: tooltipOpacity,
              backgroundColor: Colors[colorScheme].tint,
            },
          ]}
        >
          <RNText style={styles.tooltipText}>
            Double-tap to create a new event
          </RNText>
        </Animated.View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.timelineContainer}
        showsVerticalScrollIndicator={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        scrollEnabled={!isDragging} // Directly tie scroll enabling to the isDragging state
        decelerationRate="normal"
        contentContainerStyle={styles.timelineContentContainer}
      >
        <View
          style={styles.timelineContent}
          pointerEvents="box-none" // Allow scrolling to pass through where there's no content
          {...panResponder.panHandlers}
        >
          {/* Time slots */}
          {HOURS.map((hour, index) => {
            const isNoon = hour === "Noon";
            const displayHour = isNoon ? "12" : hour;
            const ampm = index < 12 ? "AM" : "PM";
            const timeLabel = isNoon ? "Noon" : `${displayHour} ${ampm}`;
            const actualHour = index;

            return (
              <View key={index} style={styles.hourRow}>
                <TouchableOpacity
                  style={styles.hourLabelContainer}
                  onPress={() => onTimeSlotPress(actualHour)}
                >
                  <Text
                    style={[
                      styles.hourLabel,
                      { color: Colors[colorScheme].icon },
                    ]}
                  >
                    {displayHour}
                  </Text>
                  <Text
                    style={[styles.ampm, { color: Colors[colorScheme].icon }]}
                  >
                    {hour !== "Noon" ? ampm : ""}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.hourSlot,
                    {
                      borderBottomColor: isDark
                        ? `${burntCopper}30`
                        : `${burntCopper}20`,
                    },
                  ]}
                  onPress={(e) => handleTimeSlotTap(e, actualHour)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.halfHourLine,
                      {
                        borderTopColor: isDark
                          ? `${burntCopper}20`
                          : `${burntCopper}15`,
                      },
                    ]}
                  />
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Use the dedicated current time indicator component */}
          <CurrentTimeIndicator
            key={`time-indicator-${selectedDate}`}
            colorScheme={colorScheme}
            isToday={isToday}
          />

          {/* Events - Replace the TouchableOpacity with DraggableEvent */}
          {events.map((event, index) => {
            const { top, height } = positionEvent(event);
            return (
              <DraggableEvent
                key={index}
                event={event}
                index={index}
                position={{ top, height }}
                formatTime={formatTime}
                getTimeFromPosition={getTimeFromPosition}
                onEventPress={onEventPress}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            );
          })}

          {/* Preview event during drag */}
          {dragEvent.visible && (
            <View
              style={[
                styles.eventItem,
                styles.previewEvent,
                {
                  top: dragEvent.startY,
                  height: 60, // Default 1 hour height
                  backgroundColor: dragEvent.color,
                },
              ]}
            >
              <Text style={styles.eventTitle}>New Event</Text>
              <Text style={styles.eventTime}>
                {formatTime(getTimeFromPosition(dragEvent.startY))} -{" "}
                {formatTime(
                  new Date(
                    getTimeFromPosition(dragEvent.startY).getTime() +
                      60 * 60 * 1000
                  )
                )}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
};

// Styles specific to DayView
interface DayViewStyles {
  dayHeader: ViewStyle;
  dayHeaderText: TextStyle;
  timelineContainer: ViewStyle;
  timelineContent: ViewStyle;
  hourRow: ViewStyle;
  hourLabelContainer: ViewStyle;
  hourLabel: TextStyle;
  ampm: TextStyle;
  hourSlot: ViewStyle;
  halfHourLine: ViewStyle;
  eventItem: ViewStyle;
  previewEvent: ViewStyle;
  currentTimeIndicator: ViewStyle;
  currentTimeDot: ViewStyle;
  currentTimeLine: ViewStyle;
  eventTitle: TextStyle;
  eventTime: TextStyle;
  tooltip: ViewStyle;
  tooltipText: TextStyle;
}

const styles = StyleSheet.create<
  DayViewStyles & { timelineContentContainer: ViewStyle }
>({
  dayHeader: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  dayHeaderText: {
    fontSize: 16,
    fontWeight: "500",
  },
  timelineContainer: {
    flex: 1,
  },
  timelineContentContainer: {
    paddingBottom: 80, // Add padding at the bottom for easier scrolling
  },
  timelineContent: {
    position: "relative",
    paddingBottom: 20,
  },
  hourRow: {
    flexDirection: "row",
    height: 60,
    position: "relative",
    zIndex: 10,
  },
  hourLabelContainer: {
    width: 50,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 8,
  },
  hourLabel: {
    fontSize: 15,
    fontWeight: "400",
  },
  ampm: {
    fontSize: 11,
    marginTop: -2,
  },
  hourSlot: {
    flex: 1,
    borderBottomWidth: 0.5,
    minHeight: 1,
    position: "relative",
  },
  halfHourLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 30,
    borderTopWidth: 0.5,
  },
  eventItem: {
    position: "absolute",
    left: 60,
    right: 10,
    borderRadius: 6,
    padding: 8,
    overflow: "hidden",
    zIndex: 40,
  },
  previewEvent: {
    opacity: 0.8,
    borderWidth: 2,
    borderColor: "white",
    zIndex: 100,
    justifyContent: "space-between",
  },
  currentTimeIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 120,
    flexDirection: "row",
    alignItems: "center",
  },
  currentTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 46,
    marginRight: -4,
  },
  currentTimeLine: {
    flex: 1,
    height: 1,
    marginRight: 10,
  },
  eventTitle: {
    color: "white",
    fontWeight: "500",
    fontSize: 14,
  },
  eventTime: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  tooltip: {
    position: "absolute",
    padding: 10,
    borderRadius: 8,
    top: 50,
    alignSelf: "center",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  tooltipText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default DayView;
