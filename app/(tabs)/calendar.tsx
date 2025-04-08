import {
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";
import React from "react"; // Remove useState import
import { Text, View, SafeAreaView } from "react-native";
import { Colors } from "@/constants/Colors";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/useColorScheme"; // Import useColorScheme

// Keep only necessary styles in the interface
interface Styles {
  container: ViewStyle;
  tabBar: ViewStyle;
  tabBarButton: ViewStyle;
  tabBarText: TextStyle;
  placeholderText: TextStyle; // Add style for placeholder
}

export default function CalendarScreen() {
  const colorScheme = useColorScheme() ?? "light";
  // Use a conditional to explicitly get the theme colors object
  const themeColors = colorScheme === "dark" ? Colors.dark : Colors.light;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      {/* Remove CalendarHeader */}
      {/* Remove Month View */}
      {/* Remove Day View */}

      {/* Add a placeholder */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={[styles.placeholderText, { color: themeColors.text }]}>
          Calendar Content Removed
        </Text>
      </View>

      {/* Keep TabBar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: themeColors.background,
            borderTopColor: themeColors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.tabBarButton}
          // onPress={handleNavigatePress} // Remove press handler as function is removed
        >
          <Text style={[styles.tabBarText, { color: themeColors.tint }]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarButton}>
          <Text style={[styles.tabBarText, { color: themeColors.text }]}>
            Calendars
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarButton}>
          <Text style={[styles.tabBarText, { color: themeColors.text }]}>
            Inbox (4)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Remove Add Event Modal */}
    </SafeAreaView>
  );
}

// Keep only necessary styles
const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    paddingBottom: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabBarButton: {},
  tabBarText: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  placeholderText: {
    fontSize: 16,
  },
  // Remove all other styles
});
