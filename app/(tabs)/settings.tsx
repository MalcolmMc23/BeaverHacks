import { StyleSheet } from "react-native";
import { Text, View, SafeAreaView, TouchableOpacity } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ManageLockedAppsModal } from "@/components/ManageLockedAppsModal";
import { IconSymbol } from "@/components/ui/IconSymbol";

type ColorSchemeType = "light" | "dark";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = (colorScheme ?? "light") as ColorSchemeType;
  const [showLockedAppsModal, setShowLockedAppsModal] = useState(false);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors[theme].background }]}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: Colors[theme].text }]}>
          Settings
        </Text>

        <View style={styles.settingsContainer}>
          <TouchableOpacity
            style={[
              styles.settingItem,
              { borderColor: colorScheme === "dark" ? "#333" : "#e0e0e0" },
            ]}
            onPress={() => setShowLockedAppsModal(true)}
          >
            <View style={styles.settingInfo}>
              <IconSymbol name="lock" size={24} color={Colors[theme].tint} />
              <View style={styles.settingTextContainer}>
                <Text
                  style={[styles.settingTitle, { color: Colors[theme].text }]}
                >
                  Manage Locked Apps
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: Colors[theme].icon },
                  ]}
                >
                  Select apps to disable during focus time
                </Text>
              </View>
            </View>
            <IconSymbol
              name="chevron.right"
              size={20}
              color={Colors[theme].icon}
            />
          </TouchableOpacity>

          {/* Additional settings items can be added here */}
        </View>
      </View>

      <ManageLockedAppsModal
        visible={showLockedAppsModal}
        onClose={() => setShowLockedAppsModal(false)}
        colorScheme={theme}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
  },
  settingsContainer: {
    marginTop: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingTextContainer: {
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
});
