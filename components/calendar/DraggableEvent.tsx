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
  position: { top: number; height: number };
  formatTime: (date: Date) => string;
  getTimeFromPosition: (yPosition: number) => Date;
  onEventPress: (event: CalendarEvent, index: number) => void;
  onDragStart: () => void;
  onDragEnd: (index: number, newStart: Date, newEnd: Date) => void;
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
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [eventTop, setEventTop] = useState(position.top);
  const eventDuration = event.end.getTime() - event.start.getTime();

  // Store original position for calculations
  const originalTop = useRef(position.top);
  const lastTouch = useRef({ x: 0, y: 0 });
  const hasActivatedDrag = useRef(false);

  // Set up pan responder for drag events with improved event capturing
  const panResponder = useRef(
    PanResponder.create({
      // Always capture initial touches on the event
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      // Always capture moves on the event
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (event: GestureResponderEvent) => {
        // Immediately call onDragStart to prevent scrolling
        onDragStart();

        // Store initial position
        const { locationX, locationY } = event.nativeEvent;
        lastTouch.current = { x: locationX, y: locationY };
        originalTop.current = position.top;
        hasActivatedDrag.current = false;
      },
      onPanResponderMove: (event: GestureResponderEvent, gestureState) => {
        const { dx, dy } = gestureState;

        // Only consider it dragging if there's significant movement
        if (!isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
          setIsDragging(true);
          hasActivatedDrag.current = true;
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
      onPanResponderRelease: () => {
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
        }
      },
      onPanResponderTerminate: () => {
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

  // Calculate the time label based on current position
  const getTimeLabel = () => {
    if (isDragging) {
      const newStart = getTimeFromPosition(eventTop);
      const newEnd = new Date(newStart.getTime() + eventDuration);
      return `${formatTime(newStart)} - ${formatTime(newEnd)}`;
    }
    return `${formatTime(event.start)} - ${formatTime(event.end)}`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.eventItem,
        {
          top: isDragging ? eventTop : position.top,
          height: position.height,
          backgroundColor: event.color,
          opacity: isDragging ? 0.7 : 1,
          zIndex: isDragging ? 1000 : 100,
          elevation: isDragging ? 5 : 2,
        },
      ]}
      activeOpacity={0.9}
      {...panResponder.panHandlers}
    >
      <Text style={styles.eventTitle} numberOfLines={1}>
        {event.title}
      </Text>
      <Text style={styles.eventTime} numberOfLines={1}>
        {getTimeLabel()}
      </Text>
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

export default DraggableEvent;
