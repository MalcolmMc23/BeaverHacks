import React, { useRef } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  PanResponder,
} from "react-native";
import { IconSymbol } from "../ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { TodoOptimalTimeAssistant } from "./TodoOptimalTimeAssistant";

export type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
  startDate?: Date;
  endDate?: Date;
  description?: string;
};

type TodoProps = {
  item: TodoItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPress?: (id: string) => void;
  onSchedule?: (id: string, startTime: string, endTime: string) => void;
  colorScheme?: "light" | "dark";
};

export function Todo({
  item,
  onToggle,
  onDelete,
  onPress,
  onSchedule,
  colorScheme = "light",
}: TodoProps) {
  const burntCopper = Colors[colorScheme].tint;
  const pan = useRef(new Animated.Value(0)).current;
  const deleteThreshold = 80;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to horizontal movements greater than 5 units
      return (
        Math.abs(gestureState.dx) > 5 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
      );
    },
    onPanResponderMove: (_, gestureState) => {
      // Only allow swiping right (positive dx) for left-to-right swipe
      if (gestureState.dx > 0) {
        // Dampen the movement as it gets further right
        const newX = Math.min(gestureState.dx, deleteThreshold * 1.5);
        pan.setValue(newX);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > deleteThreshold) {
        // If swiped far enough right, trigger delete
        Animated.timing(pan, {
          toValue: 1000,
          duration: 250,
          useNativeDriver: true,
        }).start(() => onDelete(item.id));
      } else {
        // Otherwise snap back
        Animated.spring(pan, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const formatDate = (date?: Date) => {
    if (!date) return null;
    return (
      date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }) +
      " at " +
      date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      })
    );
  };

  const startDateFormatted = formatDate(item.startDate);
  const endDateFormatted = formatDate(item.endDate);

  // Background delete button becomes visible as the card is swiped right
  const deleteButtonOpacity = pan.interpolate({
    inputRange: [20, deleteThreshold],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Background color changes from transparent to red as the card is swiped right
  const backgroundColorInterpolate = pan.interpolate({
    inputRange: [0, deleteThreshold],
    outputRange: ["transparent", "#ff3b30"],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.containerOuter}>
      {/* Background delete container with trash icon */}
      <Animated.View
        style={[
          styles.deleteContainer,
          {
            opacity: deleteButtonOpacity,
            backgroundColor: backgroundColorInterpolate,
          },
        ]}
      >
        <View style={styles.deleteButtonContainer}>
          <IconSymbol name="trash" size={24} color="white" />
          <Text style={styles.deleteText}>Delete</Text>
        </View>
      </Animated.View>

      {/* Main todo card that gets swiped */}
      <Animated.View
        style={[styles.container, { transform: [{ translateX: pan }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => onToggle(item.id)}
        >
          {item.completed ? (
            <IconSymbol name="checkmark.circle" size={24} color={burntCopper} />
          ) : (
            <IconSymbol name="circle" size={24} color="#687076" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contentContainer}
          onPress={() => onPress && onPress(item.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.text,
              { color: Colors[colorScheme].text },
              item.completed && styles.completedText,
            ]}
          >
            {item.text}
          </Text>

          {(item.startDate || item.endDate) && (
            <View style={styles.dateContainer}>
              {startDateFormatted && (
                <View style={styles.dateItem}>
                  <IconSymbol name="calendar" size={13} color="#767676" />
                  <Text style={styles.dateText}>{startDateFormatted}</Text>
                </View>
              )}

              {endDateFormatted && (
                <View style={styles.dateItem}>
                  <IconSymbol name="clock" size={13} color="#767676" />
                  <Text style={styles.dateText}>{endDateFormatted}</Text>
                </View>
              )}
            </View>
          )}

          {item.description && (
            <Text style={styles.description} numberOfLines={1}>
              {item.description}
            </Text>
          )}

          {onSchedule && (
            <TodoOptimalTimeAssistant
              item={item}
              onSchedule={onSchedule}
              colorScheme={colorScheme}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.arrowButton}>
          <IconSymbol name="arrow.right.circle" size={24} color="#007AFF" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerOuter: {
    position: "relative",
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1,
  },
  deleteContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 20,
    borderRadius: 12,
  },
  deleteButtonContainer: {
    alignItems: "center",
  },
  deleteText: {
    color: "white",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  checkbox: {
    marginRight: 12,
    paddingTop: 2,
  },
  contentContainer: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 6,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#9E9E9E",
  },
  dateContainer: {
    marginTop: 2,
    flexDirection: "column",
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: "#767676",
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: "#767676",
    marginTop: 2,
  },
  arrowButton: {
    padding: 4,
  },
});
