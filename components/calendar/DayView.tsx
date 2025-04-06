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
  importance?: 'urgent' | 'high' | 'medium' | 'low';
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

// Update the EVENT_COLORS with the updated brown shades
const EVENT_COLORS = [
  "#5D1C09", // Deep chocolate brown - for urgent events
  "#8B4513", // Saddle brown - for high importance events 
  "#AA7039", // Medium caramel brown - for medium importance events
  "#C8A27D", // Light sandy brown - for low importance events
  "#AA7039", // Default medium caramel brown
];

// Helper function to get color based on importance
const getColorByImportance = (event: CalendarEvent): string => {
  // If event already has a color that's not related to importance, preserve it
  if (event.color && !event.importance) {
    return event.color;
  }
  
  // Determine color based on importance
  if (event.importance) {
    switch(event.importance) {
      case 'urgent': return EVENT_COLORS[0]; // Deep chocolate
      case 'high': return EVENT_COLORS[1];   // Saddle brown
      case 'medium': return EVENT_COLORS[2]; // Caramel brown
      case 'low': return EVENT_COLORS[3];    // Light sandy
      default: return EVENT_COLORS[4];       // Default caramel
    }
  }
  
  // Default color for events without importance
  return EVENT_COLORS[4];
};

// Modified random color function to return default brown
const getRandomColor = () => EVENT_COLORS[4];

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
    color?: string | null;
    fromDrag?: boolean;
    draggedEventIndex?: number;
    importance?: 'urgent' | 'high' | 'medium' | 'low';
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
  const DOUBLE_TAP_DELAY = 1000; // ms between taps to count as double-tap (reduced from 10000ms)

  const [dragEvent, setDragEvent] = useState<{
    visible: boolean;
    startY: number;
    color: string;
  }>({
    visible: false,
    startY: 0,
    color: EVENT_COLORS[2], // Medium importance for default new events
  });
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const LONG_PRESS_DURATION = 1200; // 1.2 seconds to trigger event creation modal
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTooltip, setShowTooltip] = useState(false); // Change to false by default
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

  // Position events on the time grid with precise alignment
  const positionEvent = (event: CalendarEvent) => {
    const startHour = event.start.getHours();
    const startMinute = event.start.getMinutes();
    const endHour = event.end.getHours();
    const endMinute = event.end.getMinutes();

    // Calculate position in pixels (60px per hour, 1px per minute)
    const startPosition = startHour * 60 + startMinute;
    const endPosition = endHour * 60 + endMinute;
    
    // Calculate exact height in pixels
    const exactHeight = endPosition - startPosition;

    return {
      top: startPosition,
      height: exactHeight,
      endPosition: endPosition,
    };
  };

  // Detect and handle overlapping events
  const handleOverlappingEvents = () => {
    if (!events.length) return [];
    
    // Sort events by start time first, then by duration (shorter events first for better visual hierarchy)
    const sortedEvents = [...events].sort((a, b) => {
      const aStart = a.start.getTime();
      const bStart = b.start.getTime();
      if (aStart !== bStart) return aStart - bStart;
      
      // If start times are the same, sort by duration (shorter first)
      const aDuration = a.end.getTime() - a.start.getTime();
      const bDuration = b.end.getTime() - b.start.getTime();
      return aDuration - bDuration;
    });
    
    // Ensure each event has a color based on importance
    sortedEvents.forEach(event => {
      if (!event.color) {
        // Assign color based on importance
        event.color = getColorByImportance(event);
      }
    });
    
    // Group overlapping events with a more precise algorithm
    const groups: CalendarEvent[][] = [];
    let currentGroup: CalendarEvent[] = [];
    
    sortedEvents.forEach((event, index) => {
      if (index === 0) {
        currentGroup.push(event);
        return;
      }
      
      // Check if current event overlaps with any event in current group
      const overlaps = currentGroup.some(groupEvent => {
        // Standard overlap check: events overlap in time
        const timeOverlap = event.start < groupEvent.end && event.end > groupEvent.start;
        
        // Check if events end at the same time (within 1 minute)
        const sameEndTime = Math.abs(event.end.getTime() - groupEvent.end.getTime()) <= 60000;
        
        // If they end at the same time, we want to treat them as overlapping
        // only if they're within 30 minutes of each other
        const closeStartTimes = sameEndTime && 
          Math.abs(event.start.getTime() - groupEvent.start.getTime()) <= 30 * 60 * 1000;
          
        return timeOverlap || closeStartTimes;
      });
      
      if (overlaps) {
        currentGroup.push(event);
      } else {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
        }
        currentGroup = [event];
      }
    });
    
    // Add the last group if it's not empty
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    // Calculate layout for each event
    const eventLayouts = sortedEvents.map(event => {
      // Find the group this event belongs to
      const eventGroup = groups.find(group => group.includes(event));
      if (!eventGroup || eventGroup.length === 1) {
        // No overlap - use full width
        return {
          event,
          left: 60, // Default left position
          width: '100%',
          column: 0,
          totalColumns: 1
        };
      }
      
      // For overlapping events, implement a smarter column algorithm
      // Find all events that overlap with the current event's time range
      const overlappingEvents = eventGroup.filter(e => 
        (e.start < event.end && e.end > event.start)
      );
      
      const totalOverlapping = overlappingEvents.length;
      const overlapIndex = overlappingEvents.indexOf(event);
      
      // Calculate width based on number of overlapping events
      const columnWidth = 100 / totalOverlapping;
      
      return {
        event,
        left: 60 + (columnWidth * overlapIndex * 0.9), // Slight adjustment for visual appearance
        width: `${columnWidth * 0.95}%`, // Make slightly narrower for visual separation
        column: overlapIndex,
        totalColumns: totalOverlapping
      };
    });
    
    return eventLayouts;
  };

  // Calculate event layouts once when events change
  const [eventLayouts, setEventLayouts] = useState<any[]>([]);
  
  useEffect(() => {
    setEventLayouts(handleOverlappingEvents());
  }, [events]);

  // Get time from Y position in the timeline
  const getTimeFromPosition = (yPosition: number) => {
    // Calculate hour and minute from y position (1 hour = 60px)
    const hour = Math.floor(yPosition / 60);
    const minute = Math.round((yPosition % 60) / 15) * 15; // Round to nearest 15 min

    // Create date object at the selected date with the calculated time
    const date = new Date(selectedDate);
    date.setHours(hour);
    date.setMinutes(minute);
    date.setSeconds(0); // Reset seconds
    date.setMilliseconds(0); // Reset milliseconds

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
        
        // Round to nearest 15-minute interval for better alignment
        const roundedY = Math.round(tapY / 15) * 15;

        // Store the starting Y position
        setDragEvent({
          visible: false, // Don't show preview immediately
          startY: roundedY,
          color: EVENT_COLORS[2], // Medium importance for new events
        });

        // Start a timer to differentiate between tap and long press
        const timer = setTimeout(() => {
          // Only if we're not scrolling or dragging already
          if (scrollViewRef.current) {
            scrollViewRef.current.setNativeProps({ scrollEnabled: false });

            // Show the preview event at this position
            setDragEvent({
              visible: true,
              startY: roundedY,
              color: EVENT_COLORS[2], // Medium importance for new events
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
          // Calculate the start time from the position
          const startDate = getTimeFromPosition(dragEvent.startY);
          
          // Round to 15-minute intervals for precision
          const roundedMinutes = Math.round(startDate.getMinutes() / 15) * 15;
          startDate.setMinutes(roundedMinutes);
          startDate.setSeconds(0);
          startDate.setMilliseconds(0);
          
          // Create an end time exactly 1 hour later
          const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Exactly 1 hour (60 min * 60 sec * 1000 ms)
          
          // Call the creation handler
          if (onInitiateEventCreation) {
            onInitiateEventCreation({
              startDate,
              endDate,
              color: undefined, // Let parent component determine color
              importance: undefined, // Let user choose importance in the modal
              fromDrag: true,
            });
          }

          // Reset the drag event
          setDragEvent({
            visible: false,
            startY: 0,
            color: EVENT_COLORS[2], // Keep using medium color for preview only
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
      // Ensure the event has a color based on importance
      if (!updatedEvents[eventIndex].color) {
        updatedEvents[eventIndex].color = getColorByImportance(updatedEvents[eventIndex]);
      }
      
      // Calculate the exact duration to preserve it
      const originalDuration = updatedEvents[eventIndex].end.getTime() - updatedEvents[eventIndex].start.getTime();
      
      // Use the new start time, but preserve the exact duration
      const preservedEnd = new Date(newStart.getTime() + originalDuration);
      updatedEvents[eventIndex] = {
        ...updatedEvents[eventIndex],
        start: newStart,
        end: preservedEnd,
      };

      // Trigger any parent component updates with specific drag data
      if (onInitiateEventCreation) {
        onInitiateEventCreation({
          startDate: newStart,
          endDate: preservedEnd, // Use the preserved end time
          color: updatedEvents[eventIndex].color || EVENT_COLORS[2], // Ensure color is never undefined
          importance: updatedEvents[eventIndex].importance || 'medium',
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
      
      // Create end time exactly 1 hour later (60 minutes)
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      // Round to 15-minute intervals for better time alignment
      const roundedMinutes = Math.round(startTime.getMinutes() / 15) * 15;
      startTime.setMinutes(roundedMinutes);
      startTime.setSeconds(0);
      startTime.setMilliseconds(0);
      
      // Calculate end time based on start time
      endTime.setMinutes(roundedMinutes);
      endTime.setSeconds(0);
      endTime.setMilliseconds(0);

      if (onInitiateEventCreation) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onInitiateEventCreation({
          startDate: startTime,
          endDate: endTime,
          color: undefined, // Let parent component determine color
          importance: undefined, // Let user choose importance in the modal
          fromDrag: true, // Indicate this was from user interaction
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
          {selectedDayName} — Apr 6, 2025
        </Text>
      </View>

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
            const ampm = index < 12 ? "AM" : (index === 12 ? "PM" : "PM");
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
                    {isNoon ? "PM" : ampm}
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

          {/* Events - Now using the calculated layouts */}
          {eventLayouts.map((layout, index) => {
            const { event, left, width, column, totalColumns } = layout;
            
            // Calculate position directly from the event times
            const startHour = event.start.getHours();
            const startMinute = event.start.getMinutes();
            const endHour = event.end.getHours();
            const endMinute = event.end.getMinutes();

            // Calculate exact pixel positions (60px per hour)
            const startPosition = startHour * 60 + startMinute;
            const endPosition = endHour * 60 + endMinute;
            
            // Calculate exact height from the time difference (in minutes)
            const exactHeight = endPosition - startPosition;
            
            // Calculate precise positioning for overlapping events
            const eventWidth = totalColumns > 1 
              ? `${(100 - 5) / totalColumns}%`  // Slight adjustment for visual clarity
              : undefined;
            
            const eventLeft = column === 0 
              ? 60 
              : `calc(60px + ${(column / totalColumns) * 95}%)`; // 95% to leave small gap
            
            const eventRight = column === totalColumns - 1 ? 10 : undefined;
            
            // Get color based on event importance
            const eventColor = getColorByImportance(event);
            
            return (
              <DraggableEvent
                key={index}
                event={{
                  ...event, 
                  color: eventColor,
                  // Ensure we have the importance data
                  importance: event.importance || 'medium'
                }}
                index={events.indexOf(event)}
                position={{ 
                  top: startPosition, 
                  height: exactHeight,
                  endPosition: endPosition,
                }}
                style={{
                  left: eventLeft,
                  right: eventRight,
                  width: eventWidth,
                  marginLeft: 1,
                  marginRight: 1,
                  borderRadius: 8,
                  borderLeftWidth: column > 0 ? 2 : 0,
                  borderLeftColor: 'rgba(255,255,255,0.6)',
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
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
                  height: 60, // Exactly 1 hour (60px)
                  backgroundColor: EVENT_COLORS[2], // Medium importance brown
                  left: 60,
                  right: 10,
                  borderRadius: 8,
                },
              ]}
            >
              <Text style={[styles.eventTitle, styles.textShadow]}>New Event</Text>
              <Text style={[styles.importanceLabel, styles.textShadow]}>Medium</Text>
              <Text style={[styles.eventTime, styles.textShadow]}>
                {formatTime(getTimeFromPosition(dragEvent.startY))} -{" "}
                {formatTime(
                  new Date(
                    getTimeFromPosition(dragEvent.startY).getTime() + 60 * 60 * 1000 // Exactly 1 hour
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
  textShadow: TextStyle;
  importanceLabel: TextStyle;
  onboardingBanner: ViewStyle;
  onboardingText: TextStyle;
  dismissButton: ViewStyle;
  dismissText: TextStyle;
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
    padding: 16,
    paddingVertical: 14,
    borderRadius: 12,
    top: 80, // Position it more centrally
    left: 40,
    right: 40,
    alignSelf: "center",
    zIndex: 9999, // Extremely high to ensure visibility
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  tooltipText: {
    color: "white",
    fontWeight: "700",
    fontSize: 18,
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  textShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  importanceLabel: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
    fontStyle: "italic",
  },
  onboardingBanner: {
    backgroundColor: "#A0430A", // Burnt copper
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    margin: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    flexDirection: "row", // Allow for dismiss button
    position: "relative", // For absolute positioning of the dismiss button
  },
  onboardingText: {
    color: "white",
    fontWeight: "600",
    fontSize: 15,
    textAlign: "center",
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dismissButton: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  dismissText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    lineHeight: 22,
  },
});

export default DayView;
