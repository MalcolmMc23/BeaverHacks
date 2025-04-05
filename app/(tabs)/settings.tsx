import { StyleSheet } from "react-native";
import { Text, View, SafeAreaView } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { StatusBar } from "expo-status-bar";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? "light"].background },
      ]}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <View style={styles.content}>
        <Text
          style={[styles.title, { color: Colors[colorScheme ?? "light"].text }]}
        >
          Settings
        </Text>
        <Text
          style={[
            styles.description,
            { color: Colors[colorScheme ?? "light"].icon },
          ]}
        >
          This feature is coming soon!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
  },
});
