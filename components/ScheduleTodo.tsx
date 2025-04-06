import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Todo, TodoItem } from "./Todo";
import { AddEventModal } from "./AddEventModal";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ScheduleTodoProps = {
  todos: TodoItem[];
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onUpdateTodo: (todo: TodoItem) => void;
  onAddEvent: (event: any) => void;
  colorScheme?: "light" | "dark";
};

export function ScheduleTodo({
  todos,
  onToggleTodo,
  onDeleteTodo,
  onUpdateTodo,
  onAddEvent,
  colorScheme = "light",
}: ScheduleTodoProps) {
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [scheduledStartTime, setScheduledStartTime] = useState<string | null>(
    null
  );
  const [scheduledEndTime, setScheduledEndTime] = useState<string | null>(null);

  // Handle scheduling a todo item
  const handleScheduleTodo = (
    id: string,
    startTime: string,
    endTime: string
  ) => {
    // Store the scheduled times
    setScheduledStartTime(startTime);
    setScheduledEndTime(endTime);

    // Find the todo item
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    // Set the selected todo and show the add event modal
    setSelectedTodoId(id);
    setShowAddEventModal(true);
  };

  // Handle when the user taps on a todo item
  const handleTodoPress = (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    // If the todo already has a start date, allow editing it
    if (todo.startDate) {
      // Handle editing existing dates...
    } else {
      // Show options or directly trigger AI suggestion
      Alert.alert("Schedule Todo", "Would you like to schedule this todo?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Schedule Manually",
          onPress: () => {
            setSelectedTodoId(id);
            setShowAddEventModal(true);
          },
        },
        {
          text: "Find Optimal Time",
          // This will use the "Find optimal time" button on the Todo component
        },
      ]);
    }
  };

  // Handle adding event
  const handleAddEvent = (event: any) => {
    // Call the parent's onAddEvent
    onAddEvent(event);

    // Also update the todo item with the start and end dates
    if (selectedTodoId) {
      const todo = todos.find((t) => t.id === selectedTodoId);
      if (todo) {
        const updatedTodo = {
          ...todo,
          startDate: event.startDate,
          endDate: event.endDate,
        };

        onUpdateTodo(updatedTodo);
      }
    }

    // Reset state
    setSelectedTodoId(null);
    setShowAddEventModal(false);
    setScheduledStartTime(null);
    setScheduledEndTime(null);
  };

  // Handle cancel of add event
  const handleCancelAddEvent = () => {
    setSelectedTodoId(null);
    setShowAddEventModal(false);
    setScheduledStartTime(null);
    setScheduledEndTime(null);
  };

  return (
    <View style={styles.container}>
      {todos.map((todo) => (
        <Todo
          key={todo.id}
          item={todo}
          onToggle={onToggleTodo}
          onDelete={onDeleteTodo}
          onPress={(id) => handleTodoPress(id)}
          onSchedule={handleScheduleTodo}
          colorScheme={colorScheme}
        />
      ))}

      {/* Add Event Modal */}
      {showAddEventModal && selectedTodoId && (
        <AddEventModal
          onCancel={handleCancelAddEvent}
          onAdd={handleAddEvent}
          initialData={{
            title: todos.find((t) => t.id === selectedTodoId)?.text || "",
            startDate: scheduledStartTime
              ? new Date(scheduledStartTime)
              : new Date(),
            endDate: scheduledEndTime
              ? new Date(scheduledEndTime)
              : new Date(Date.now() + 60 * 60 * 1000),
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
