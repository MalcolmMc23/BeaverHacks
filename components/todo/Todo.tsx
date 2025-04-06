import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress && onPress(item.id)}
      activeOpacity={0.7}
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

      <View style={styles.contentContainer}>
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
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(item.id)}
      >
        <IconSymbol name="xmark.circle" size={24} color={burntCopper} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  deleteButton: {
    padding: 4,
  },
});
