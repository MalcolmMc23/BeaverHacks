import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { IconSymbol } from "../ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { findOptimalTimeForTodo } from "@/services/aiService";
import { scheduleTodoAsCalendarEvent } from "@/services/todoSchedulingService";
import { TodoItem } from "./Todo";

type TodoOptimalTimeAssistantProps = {
  item: TodoItem;
  onSchedule: (id: string, startTime: string, endTime: string) => void;
  colorScheme?: "light" | "dark";
};

export function TodoOptimalTimeAssistant({
  item,
  onSchedule,
  colorScheme = "light",
}: TodoOptimalTimeAssistantProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    startTime: string | null;
    endTime: string | null;
    reasoning: string | null;
  } | null>(null);

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
      // Show error alert with AI's detailed reasoning if available
      Alert.alert(
        "Scheduling Error",
        result.reasoning
          ? `Couldn't find a suitable time: ${result.reasoning}`
          : result.error || "No suitable time found. Please try again.",
        [{ text: "OK" }]
      );
      console.error(
        result.error || result.reasoning || "No suitable time found"
      );
    }

    setIsLoading(false);
  };

  const handleScheduleSuggestion = async () => {
    if (aiSuggestion?.startTime && aiSuggestion?.endTime) {
      // Add validation to ensure the start time is today
      const suggestedStartDate = new Date(aiSuggestion.startTime);
      const now = new Date();

      // Create today boundaries
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);

      // Check if suggested time is not today
      if (suggestedStartDate < today || suggestedStartDate > endOfToday) {
        console.error(
          `[TodoAssistant] ❌ Rejected non-today date scheduling: "${
            item.text
          }" at ${suggestedStartDate.toLocaleString()}`
        );
        Alert.alert(
          "Scheduling Error",
          "Can only schedule for today. Please try finding a new time.",
          [{ text: "OK" }]
        );

        // Clear the invalid suggestion
        setAiSuggestion(null);
        return;
      }

      // Check if time is in the past (earlier today)
      if (suggestedStartDate < now) {
        console.error(
          `[TodoAssistant] ❌ Rejected past time scheduling: "${
            item.text
          }" at ${suggestedStartDate.toLocaleString()}`
        );
        Alert.alert(
          "Scheduling Error",
          "Cannot schedule for a time that has already passed today. Please try finding a new time.",
          [{ text: "OK" }]
        );

        // Clear the invalid suggestion
        setAiSuggestion(null);
        return;
      }

      setIsScheduling(true);

      try {
        // Schedule the todo as a calendar event
        const success = await scheduleTodoAsCalendarEvent(
          item,
          aiSuggestion.startTime,
          aiSuggestion.endTime
        );

        if (success) {
          // Call the parent's onSchedule callback (for backward compatibility)
          onSchedule(item.id, aiSuggestion.startTime, aiSuggestion.endTime);

          // Enhanced console logging for scheduling success
          console.log(
            `[TodoAssistant] 🎯 Successfully scheduled todo: "${item.text}"`
          );
          console.log(
            `[TodoAssistant] ⏰ Time slot: ${new Date(
              aiSuggestion.startTime
            ).toLocaleString()} to ${new Date(
              aiSuggestion.endTime
            ).toLocaleString()}`
          );
          console.log(
            `[TodoAssistant] 💡 Reasoning: ${
              aiSuggestion.reasoning || "No reasoning provided"
            }`
          );

          // Notify the user
          Alert.alert(
            "Todo Scheduled",
            `"${item.text}" has been added to your calendar.`,
            [{ text: "OK" }]
          );

          // Clear the suggestion
          setAiSuggestion(null);
        } else {
          console.error(
            `[TodoAssistant] ❌ Failed to schedule todo: "${item.text}"`
          );
          Alert.alert(
            "Scheduling Error",
            "Failed to schedule todo. Please try again.",
            [{ text: "OK" }]
          );
        }
      } catch (error) {
        console.error(
          "[TodoAssistant] ❌ Error in handleScheduleSuggestion:",
          error
        );
        Alert.alert(
          "Scheduling Error",
          "An unexpected error occurred while scheduling.",
          [{ text: "OK" }]
        );
      } finally {
        setIsScheduling(false);
      }
    }
  };

  // If the todo is completed, don't show any AI scheduling options
  if (item.completed) {
    return null;
  }

  return (
    <View style={styles.container}>
      {!isLoading && !aiSuggestion && (
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
            Suggested: {new Date(aiSuggestion.startTime || "").toLocaleString()}
          </Text>
          {aiSuggestion.reasoning && (
            <Text style={styles.reasoningText}>{aiSuggestion.reasoning}</Text>
          )}
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={handleScheduleSuggestion}
            disabled={isScheduling}
          >
            {isScheduling ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.scheduleButtonText}>Schedule</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  findTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  findTimeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  suggestionContainer: {
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  reasoningText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  scheduleButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
    minWidth: 100,
    alignItems: "center",
  },
  scheduleButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
});
