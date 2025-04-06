import { StyleSheet } from "react-native";
import {
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Clipboard,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ManageLockedAppsModal } from "@/components/ManageLockedAppsModal";
import { IconSymbol } from "@/components/ui/IconSymbol";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { getTodoAndCalendarData } from "@/services/dataService";

type ColorSchemeType = "light" | "dark";

const FORCE_REFRESH_KEY = "forceRefreshTimestamp";

// Type for the JSON data returned by getTodoAndCalendarData
type TodoCalendarData = {
  todos: Array<{
    id: string;
    text: string;
    completed: boolean;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
  }>;
  calendarEvents: Array<{
    id: string;
    title: string;
    location: string;
    isAllDay: boolean;
    startDate: string;
    endDate: string;
    description: string | null;
    importance: "low" | "medium" | "high" | "urgent";
  }>;
  userPreferences: {
    workHours: {
      startTime: string;
      endTime: string;
      days: string[];
    };
    bufferTimeMinutes: number;
  };
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = (colorScheme ?? "light") as ColorSchemeType;
  const [showLockedAppsModal, setShowLockedAppsModal] = useState(false);
  const [jsonData, setJsonData] = useState<TodoCalendarData | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);

  const handleRedoOnboarding = () => {
    Alert.alert(
      "Restart Onboarding",
      "This will restart the app to show the onboarding screens. Continue?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Continue",
          onPress: async () => {
            try {
              // Clear all onboarding data and set force refresh timestamp
              await AsyncStorage.multiSet([
                ["hasCompletedOnboarding", "false"],
                ["onboardingTimestamp", ""],
                [FORCE_REFRESH_KEY, new Date().toISOString()],
              ]);

              // Navigate to root
              router.replace("/");
            } catch (error) {
              console.error("Error resetting onboarding:", error);
              Alert.alert(
                "Error",
                "Failed to restart onboarding. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleShowJsonData = async () => {
    try {
      const data = await getTodoAndCalendarData();
      setJsonData(data);
      setShowJsonModal(true);
    } catch (error) {
      console.error("Error fetching JSON data:", error);
      Alert.alert("Error", "Failed to load todo and calendar data");
    }
  };

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

          <TouchableOpacity
            style={[
              styles.settingItem,
              { borderColor: colorScheme === "dark" ? "#333" : "#e0e0e0" },
            ]}
            onPress={handleRedoOnboarding}
          >
            <View style={styles.settingInfo}>
              <IconSymbol
                name="arrow.clockwise"
                size={24}
                color={Colors[theme].tint}
              />
              <View style={styles.settingTextContainer}>
                <Text
                  style={[styles.settingTitle, { color: Colors[theme].text }]}
                >
                  Redo Onboarding
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: Colors[theme].icon },
                  ]}
                >
                  Change your preferences and rest days
                </Text>
              </View>
            </View>
            <IconSymbol
              name="chevron.right"
              size={20}
              color={Colors[theme].icon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { borderColor: colorScheme === "dark" ? "#333" : "#e0e0e0" },
            ]}
            onPress={handleShowJsonData}
          >
            <View style={styles.settingInfo}>
              <IconSymbol
                name="doc.text"
                size={24}
                color={Colors[theme].tint}
              />
              <View style={styles.settingTextContainer}>
                <Text
                  style={[styles.settingTitle, { color: Colors[theme].text }]}
                >
                  View Todo & Calendar Data
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: Colors[theme].icon },
                  ]}
                >
                  Display JSON data for debugging
                </Text>
              </View>
            </View>
            <IconSymbol
              name="chevron.right"
              size={20}
              color={Colors[theme].icon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ManageLockedAppsModal
        visible={showLockedAppsModal}
        onClose={() => setShowLockedAppsModal(false)}
        colorScheme={theme}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={showJsonModal}
        onRequestClose={() => setShowJsonModal(false)}
      >
        <SafeAreaView
          style={[
            styles.jsonModalContainer,
            { backgroundColor: Colors[theme].background },
          ]}
        >
          <View style={styles.jsonModalHeader}>
            <Text
              style={[styles.jsonModalTitle, { color: Colors[theme].text }]}
            >
              Todo & Calendar Data
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => {
                  if (jsonData) {
                    Clipboard.setString(JSON.stringify(jsonData, null, 2));
                    Alert.alert("Success", "JSON data copied to clipboard");
                  }
                }}
              >
                <IconSymbol
                  name="doc.on.doc"
                  size={20}
                  color={Colors[theme].tint}
                />
                <Text
                  style={[styles.copyButtonText, { color: Colors[theme].tint }]}
                >
                  Copy
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowJsonModal(false)}>
                <IconSymbol name="xmark" size={24} color={Colors[theme].text} />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView style={styles.jsonScrollView}>
            <Text style={[styles.jsonText, { color: Colors[theme].text }]}>
              {jsonData ? JSON.stringify(jsonData, null, 2) : "Loading..."}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  jsonModalContainer: {
    flex: 1,
    marginTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  jsonModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  jsonModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  jsonScrollView: {
    flex: 1,
    padding: 16,
  },
  jsonText: {
    fontFamily: "monospace",
    fontSize: 14,
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  copyButtonText: {
    marginLeft: 4,
    fontWeight: "500",
  },
});
