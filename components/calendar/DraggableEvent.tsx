import React, { useState, useRef } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from "react-native";
import * as Haptics from "expo-haptics";
import { CalendarEvent } from "./DayView";

interface DraggableEventProps {
  event: CalendarEvent;
  index: number;
  position: { 
    top: number; 
    height: number; 
    endPosition?: number; // Add optional endPosition property
  };
  formatTime: (date: Date) => string;
  getTimeFromPosition: (yPosition: number) => Date;
  onEventPress: (event: CalendarEvent, index: number) => void;
  onDragStart: () => void;
  onDragEnd: (index: number, newStart: Date, newEnd: Date) => void;
  style?: any;
}

const DraggableEvent: React.FC<DraggableEventProps> = ({
  event,
  index,
  position,
  formatTime,
  getTimeFromPosition,
  onEventPress,
  onDragStart,
  onDragEnd,
  style = {},
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [eventTop, setEventTop] = useState(position.top);
  const eventDuration = event.end.getTime() - event.start.getTime();

  // Store original position for calculations
  const originalTop = useRef(position.top);
  const lastTouch = useRef({ x: 0, y: 0 });
  const hasActivatedDrag = useRef(false);
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);

  // Set up pan responder for drag events with improved event capturing
  const panResponder = useRef(
    PanResponder.create({
      // Ensure we always capture initial touches on events with high priority
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      // Always capture moves on the event with high priority
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (event: GestureResponderEvent) => {
        // Stop event propagation
        event.stopPropagation?.();

        // Immediately disable scrolling and signal drag operation is starting
        onDragStart();

        // Store initial position
        const { locationX, locationY } = event.nativeEvent;
        lastTouch.current = { x: locationX, y: locationY };
        originalTop.current = position.top;

        // Clear any existing timeout
        if (longPressTimeout.current) {
          clearTimeout(longPressTimeout.current);
        }

        // Set a timeout to trigger haptic feedback and visually indicate dragging
        longPressTimeout.current = setTimeout(() => {
          setIsDragging(true);
          hasActivatedDrag.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          longPressTimeout.current = null;
        }, 100); // Short delay for better UX
      },
      onPanResponderMove: (event: GestureResponderEvent, gestureState) => {
        // Stop event propagation
        event.stopPropagation?.();

        const { dx, dy } = gestureState;

        // Only consider it dragging if there's significant movement
        if (!isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
          // If we've moved significantly, activate drag mode immediately
          setIsDragging(true);
          hasActivatedDrag.current = true;

          // Clear the timeout if it still exists
          if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current);
            longPressTimeout.current = null;
          }

          // Ensure parent knows we're dragging to prevent new event creation
          onDragStart();

          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        if (isDragging || hasActivatedDrag.current) {
          // Calculate new position based on drag
          const newTop = originalTop.current + gestureState.dy;
          // Snap to 15-minute intervals (15px in a 60px/hour grid)
          const snappedTop = Math.round(newTop / 15) * 15;
          // Ensure we don't go below 0
          setEventTop(Math.max(0, snappedTop));
        }
      },
      onPanResponderRelease: (e: GestureResponderEvent) => {
        // Stop event propagation
        e.stopPropagation?.();

        // Clear timeout if it exists
        if (longPressTimeout.current) {
          clearTimeout(longPressTimeout.current);
          longPressTimeout.current = null;
        }

        if (isDragging || hasActivatedDrag.current) {
          // Calculate new times based on position
          const newStart = getTimeFromPosition(eventTop);
          const newEnd = new Date(newStart.getTime() + eventDuration);

          // Call back to parent to update the event
          onDragEnd(index, newStart, newEnd);

          // Reset dragging state
          setIsDragging(false);
          hasActivatedDrag.current = false;
        } else {
          // If not dragging, treat as a normal press
          onEventPress(event, index);
          // Make sure to re-enable scrolling
          onDragEnd(index, event.start, event.end);
        }
      },
      onPanResponderTerminate: (e: GestureResponderEvent) => {
        // Stop event propagation
        e.stopPropagation?.();

        // Clear timeout if it exists
        if (longPressTimeout.current) {
          clearTimeout(longPressTimeout.current);
          longPressTimeout.current = null;
        }

        // Reset if interrupted
        setIsDragging(false);
        hasActivatedDrag.current = false;
        setEventTop(position.top);

        // Let DayView know we're done with drag operations
        const newStart = getTimeFromPosition(position.top);
        const newEnd = new Date(newStart.getTime() + eventDuration);
        onDragEnd(index, newStart, newEnd);
      },
    })
  ).current;

  // Update eventTop when position.top changes
  React.useEffect(() => {
    if (!isDragging) {
      setEventTop(position.top);
    }
  }, [position.top, isDragging]);

  // Clean up timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
      }
    };
  }, []);

  // Calculate the time label based on current position
  const getTimeLabel = () => {
    // When in dragging mode, calculate based on the drag position
    if (isDragging) {
      const newStart = getTimeFromPosition(eventTop);
      const newEnd = new Date(newStart.getTime() + eventDuration);
      return `${formatTime(newStart)} - ${formatTime(newEnd)}`;
    } else {
      // When not dragging, use the actual event start and end times directly
      return `${formatTime(event.start)} - ${formatTime(event.end)}`;
    }
  };

  // Handle event press without letting event propagate to parent components
  const handleEventPress = (e: GestureResponderEvent) => {
    // Explicitly stop propagation
    e.stopPropagation?.();

    // Don't let the press event bubble up to parent time slots
    if (!isDragging && !hasActivatedDrag.current) {
      onEventPress(event, index);
    }
  };

  // Helper function to get the capitalized importance label
  const getImportanceLabel = (importance?: string): string => {
    if (!importance) return '';
    return importance.charAt(0).toUpperCase() + importance.slice(1);
  };

  return (
    <TouchableOpacity
      style={[
        styles.eventItem,
        {
          top: isDragging ? eventTop : position.top,
          height: position.height,
          // If endPosition is provided, position from the bottom instead of using height
          ...(position.endPosition && position.endPosition > position.top && {
            bottom: 1440 - position.endPosition, // 1440 = 24 hours * 60 minutes
            height: position.endPosition - position.top, // Force explicit height
          }),
          backgroundColor: event.color || '#A0430A', // Default to burntCopper if no color specified
          opacity: isDragging ? 0.7 : 1,
          zIndex: isDragging ? 1000 : 100,
          elevation: isDragging ? 5 : 2,
          // Add a shadow or border when dragging for better visual feedback
          ...(isDragging && {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            borderWidth: 2,
            borderColor: "#fff",
          }),
        },
        style,
      ]}
      activeOpacity={0.9}
      onPress={handleEventPress}
      {...panResponder.panHandlers}
    >
      <Text 
        style={[
          styles.eventTitle,
          styles.textShadow,
        ]} 
        numberOfLines={1}
      >
        {event.title}
      </Text>
      
      {/* Display importance if there is one */}
      {event.importance && position.height >= 50 && (
        <Text 
          style={[
            styles.importanceLabel,
            styles.textShadow,
          ]}
        >
          {getImportanceLabel(event.importance)}
        </Text>
      )}
      
      {position.height >= 40 ? (
        <Text 
          style={[
            styles.eventTime,
            styles.textShadow,
          ]} 
          numberOfLines={1}
        >
          {getTimeLabel()}
        </Text>
      ) : (
        // For very short events, show abbreviated time format
        <Text 
          style={[
            styles.eventTimeCompact,
            styles.textShadow,
          ]} 
          numberOfLines={1}
        >
          {formatTime(event.start)}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  eventItem: {
    position: "absolute",
    left: 60,
    right: 10,
    borderRadius: 6,
    padding: 8,
    overflow: "hidden",
    // Make sure content is properly positioned within event
    justifyContent: "center",
  },
  eventTitle: {
    color: "white",
    fontWeight: "600", // Make text slightly bolder for better readability
    fontSize: 14,
  },
  importanceLabel: {
    color: "rgba(255, 255, 255, 0.85)", 
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
    fontStyle: "italic",
  },
  eventTime: {
    color: "rgba(255, 255, 255, 0.9)", // Increased opacity for better contrast
    fontSize: 12,
    marginTop: 2,
  },
  eventTimeCompact: {
    color: "rgba(255, 255, 255, 0.9)", // Increased opacity for better contrast
    fontSize: 10,
    marginTop: 1,
  },
  textShadow: {
    // Add text shadow to make text readable on any background
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default DraggableEvent;
