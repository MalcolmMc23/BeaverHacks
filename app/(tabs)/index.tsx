import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Todo, TodoItem } from "@/components/Todo";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

export default function TodoScreen() {
  const colorScheme = useColorScheme();
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: "1", text: "Complete homework", completed: false },
    { id: "2", text: "Go for a run", completed: true },
    { id: "3", text: "Buy groceries", completed: false },
  ]);
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleAddTodo = () => {
    if (text.trim()) {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text: text.trim(),
        completed: false,
      };
      setTodos([...todos, newTodo]);
      setText("");
    }
  };

  const handleToggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? "light"].background },
      ]}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      <View style={styles.header}>
        <Text
          style={[styles.title, { color: Colors[colorScheme ?? "light"].text }]}
        >
          Todo List
        </Text>
        <Text style={styles.subtitle}>
          {todos.filter((t) => !t.completed).length} tasks remaining
        </Text>
      </View>

      <FlatList
        style={styles.list}
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Todo
            item={item}
            onToggle={handleToggleTodo}
            onDelete={handleDeleteTodo}
            colorScheme={colorScheme}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
        style={[styles.inputContainer, { backgroundColor: "white" }]}
      >
        <TextInput
          ref={inputRef}
          style={[styles.input, { backgroundColor: seaMistLight }]}
          placeholder="Add a new task..."
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleAddTodo}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: Colors[colorScheme ?? "light"].tint },
          ]}
          onPress={handleAddTodo}
        >
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const seaMistLight = "#EDF3F1"; // Lighter version of Sea Mist for input background

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#687076",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginRight: 12,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
});
