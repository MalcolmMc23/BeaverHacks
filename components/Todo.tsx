import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { IconSymbol } from "./ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { findOptimalTimeForTodo } from "@/services/aiService";

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
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    startTime: string | null;
    endTime: string | null;
    reasoning: string | null;
  } | null>(null);

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

  const handleFindOptimalTime = async () => {
    setIsLoading(true);
    setAiSuggestion(null);

    const result = await findOptimalTimeForTodo(item);

    if (
      result.success &&
      result.suggestedStartTime &&
      result.suggestedEndTime
    ) {
      setAiSuggestion({
        startTime: result.suggestedStartTime,
        endTime: result.suggestedEndTime,
        reasoning: result.reasoning,
      });
    } else {
      // Could show an error toast here
      console.error(result.error || "No suitable time found");
    }

    setIsLoading(false);
  };

  const handleScheduleSuggestion = () => {
    if (aiSuggestion?.startTime && aiSuggestion?.endTime && onSchedule) {
      onSchedule(item.id, aiSuggestion.startTime, aiSuggestion.endTime);
      setAiSuggestion(null);
    }
  };

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

        {!item.completed && !isLoading && !aiSuggestion && (
          <TouchableOpacity
            style={styles.findTimeButton}
            onPress={handleFindOptimalTime}
          >
            <IconSymbol name="calendar.badge.clock" size={14} color="#FFFFFF" />
            <Text style={styles.findTimeText}>Find optimal time</Text>
          </TouchableOpacity>
        )}

        {isLoading && (
          <View style={styles.findTimeButton}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.findTimeText}>Finding optimal time...</Text>
          </View>
        )}

        {aiSuggestion && (
          <View style={styles.suggestionContainer}>
            <Text style={styles.suggestionText}>
              Suggested:{" "}
              {new Date(aiSuggestion.startTime || "").toLocaleString()}
            </Text>
            <TouchableOpacity
              style={styles.scheduleButton}
              onPress={handleScheduleSuggestion}
            >
              <Text style={styles.scheduleButtonText}>Schedule</Text>
            </TouchableOpacity>
          </View>
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
  findTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5048E5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  findTimeText: {
    color: "white",
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "500",
  },
  suggestionContainer: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F0FF",
    padding: 8,
    borderRadius: 6,
  },
  suggestionText: {
    color: "#5048E5",
    fontSize: 12,
    flex: 1,
  },
  scheduleButton: {
    backgroundColor: "#5048E5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  scheduleButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
});
