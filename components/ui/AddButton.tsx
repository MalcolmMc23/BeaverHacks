import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { IconSymbol } from "./IconSymbol";

type AddButtonProps = {
  onPress: () => void;
};

export function AddButton({ onPress }: AddButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <IconSymbol name="plus" size={24} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 16,
    alignSelf: "center",
  },
});
