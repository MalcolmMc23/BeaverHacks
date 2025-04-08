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
import AsyncStorage from "@react-native-async-storage/async-storage";

type ScheduleTodoProps = {
  todos: TodoItem[];
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onUpdateTodo: (todo: TodoItem) => void;
  colorScheme?: "light" | "dark";
};

export function ScheduleTodo({
  todos,
  onToggleTodo,
  onDeleteTodo,
  onUpdateTodo,
  colorScheme = "light",
}: ScheduleTodoProps) {
  // Removed selectedTodoId, showAddEventModal, scheduledStartTime, scheduledEndTime state

  // Handle when the user taps on a todo item
  const handleTodoPress = (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    // Simplified: Currently does nothing on press, maybe toggle in future?
    console.log(`[ScheduleTodo] Todo pressed: "${todo.text}" (id: ${id})`);

    // Removed previous alert logic for scheduling
  };

  return (
    <View style={styles.container}>
      {todos.map((todo) => (
        <Todo
          key={todo.id}
          item={todo}
          onToggle={onToggleTodo}
          onDelete={onDeleteTodo}
          onPress={(id) => handleTodoPress(id)} // Pass the simplified handler
          colorScheme={colorScheme}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
