import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "./ui/IconSymbol";
import { Colors } from "@/constants/Colors";

export type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
};

type TodoProps = {
  item: TodoItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  colorScheme?: "light" | "dark";
};

export function Todo({
  item,
  onToggle,
  onDelete,
  colorScheme = "light",
}: TodoProps) {
  const burntCopper = Colors[colorScheme].tint;

  return (
    <View style={styles.container}>
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

      <Text
        style={[
          styles.text,
          { color: Colors[colorScheme].text },
          item.completed && styles.completedText,
        ]}
      >
        {item.text}
      </Text>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(item.id)}
      >
        <IconSymbol name="xmark.circle" size={24} color={burntCopper} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  checkbox: {
    marginRight: 12,
  },
  text: {
    flex: 1,
    fontSize: 16,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#9E9E9E",
  },
  deleteButton: {
    padding: 4,
  },
});
