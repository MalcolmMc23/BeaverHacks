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
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { Text, View } from "react-native";
import { Colors } from "@/constants/Colors";
import * as Haptics from "expo-haptics";
import CurrentTimeIndicator from "./CurrentTimeIndicator";

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
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) < 5 && Math.abs(dy) < 5;
      },
      onPanResponderGrant: (event: GestureResponderEvent) => {
        const { locationY } = event.nativeEvent;
        const yPosition = locationY + scrollOffset;

        const timer = setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

          setDragEvent({
            visible: true,
            startY: yPosition,
            color: getRandomColor(),
          });

          setIsDragging(true);

          const modalTimer = setTimeout(() => {
            const startTime = getTimeFromPosition(yPosition);

            const endTime = new Date(startTime);
            endTime.setHours(endTime.getHours() + 1);

            // Trigger event creation through parent component
            if (onInitiateEventCreation) {
              onInitiateEventCreation({
                startDate: startTime,
                endDate: endTime,
                color: dragEvent.color,
              });
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            setLongPressTimer(null);
          }, LONG_PRESS_DURATION);

          setLongPressTimer(modalTimer);
        }, 200);

        setLongPressTimer(timer);
      },
      onPanResponderMove: (event: GestureResponderEvent, gestureState) => {
        if (!dragEvent.visible) return;

        // If significant vertical movement is detected and a drag hasn't been initiated,
        // this is likely a scroll attempt - terminate the pending event creation
        if (Math.abs(gestureState.dy) > 15 && !isDragging) {
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
          }
          return;
        }

        // Update event position as user drags
        const { locationY } = event.nativeEvent;
        const yPosition = locationY + scrollOffset;

        // Snap to 5-minute increments
        const snappedY = Math.round(yPosition / 5) * 5;

        setDragEvent((prev) => ({
          ...prev,
          startY: snappedY,
        }));
      },
      onPanResponderRelease: () => {
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

      <ScrollView
        ref={scrollViewRef}
        style={styles.timelineContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        scrollEnabled={true}
      >
        <View style={styles.timelineContent} {...panResponder.panHandlers}>
          {/* Time slots */}
          {HOURS.map((hour, index) => {
            const isNoon = hour === "Noon";
            const displayHour = isNoon ? "12" : hour;
            const ampm = index < 12 ? "AM" : "PM";
            const timeLabel = isNoon ? "Noon" : `${displayHour} ${ampm}`;
            const actualHour = index;

            return (
              <TouchableOpacity
                key={index}
                style={styles.hourRow}
                onPress={() => onTimeSlotPress(actualHour)}
              >
                <View style={styles.hourLabelContainer}>
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
                </View>
                <View
                  style={[
                    styles.hourSlot,
                    {
                      borderBottomColor: isDark
                        ? `${burntCopper}30`
                        : `${burntCopper}20`,
                    },
                  ]}
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
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Use the dedicated current time indicator component */}
          <CurrentTimeIndicator
            key={`time-indicator-${selectedDate}`}
            colorScheme={colorScheme}
            isToday={isToday}
          />

          {/* Events */}
          {events.map((event, index) => {
            const { top, height } = positionEvent(event);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.eventItem,
                  {
                    top: top,
                    height: height,
                    backgroundColor: event.color,
                  },
                ]}
                onPress={() => onEventPress(event, index)}
              >
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {event.title}
                </Text>
                <Text style={styles.eventTime} numberOfLines={1}>
                  {formatTime(event.start)} - {formatTime(event.end)}
                </Text>
              </TouchableOpacity>
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
}

const styles = StyleSheet.create<DayViewStyles>({
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
  timelineContent: {
    position: "relative",
    paddingBottom: 20, // Add some padding at the bottom
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
});

export default DayView;
