import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IconSymbol } from "./ui/IconSymbol";
import { Colors } from "@/constants/Colors";

// Predefined list of popular apps
const POPULAR_APPS = [
  "Facebook",
  "Instagram",
  "TikTok",
  "YouTube",
  "Twitter",
  "Snapchat",
  "WhatsApp",
  "Netflix",
  "Spotify",
  "Pinterest",
  "Discord",
  "Twitch",
  "Reddit",
  "Telegram",
];

const LOCKED_APPS_STORAGE_KEY = "lockedApps";

type ManageLockedAppsModalProps = {
  visible: boolean;
  onClose: () => void;
  colorScheme: "light" | "dark";
};

export const ManageLockedAppsModal = ({
  visible,
  onClose,
  colorScheme = "light",
}: ManageLockedAppsModalProps) => {
  const [lockedApps, setLockedApps] = useState<string[]>([]);
  const [newApp, setNewApp] = useState("");
  const [customApps, setCustomApps] = useState<string[]>([]);

  const burntCopper = Colors[colorScheme].tint;
  const textColor = Colors[colorScheme].text;
  const backgroundColor = Colors[colorScheme].background;

  // Load previously locked apps from storage
  useEffect(() => {
    const loadLockedApps = async () => {
      try {
        const storedApps = await AsyncStorage.getItem(LOCKED_APPS_STORAGE_KEY);
        if (storedApps) {
          const parsedData = JSON.parse(storedApps);
          setLockedApps(parsedData.lockedApps || []);
          setCustomApps(parsedData.customApps || []);
        }
      } catch (error) {
        console.error("Error loading locked apps:", error);
      }
    };

    if (visible) {
      loadLockedApps();
    }
  }, [visible]);

  // Save locked apps to storage
  const saveLockedApps = async () => {
    try {
      await AsyncStorage.setItem(
        LOCKED_APPS_STORAGE_KEY,
        JSON.stringify({
          lockedApps,
          customApps,
        })
      );
      onClose();
    } catch (error) {
      console.error("Error saving locked apps:", error);
    }
  };

  // Toggle app selection
  const toggleApp = (app: string) => {
    setLockedApps((prev) =>
      prev.includes(app) ? prev.filter((a) => a !== app) : [...prev, app]
    );
  };

  // Add custom app
  const addCustomApp = () => {
    if (newApp.trim() && !customApps.includes(newApp.trim())) {
      const trimmedApp = newApp.trim();
      setCustomApps((prev) => [...prev, trimmedApp]);
      setLockedApps((prev) => [...prev, trimmedApp]);
      setNewApp("");
    }
  };

  // Remove custom app
  const removeCustomApp = (app: string) => {
    setCustomApps((prev) => prev.filter((a) => a !== app));
    setLockedApps((prev) => prev.filter((a) => a !== app));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.centeredView}
      >
        <View style={[styles.modalView, { backgroundColor }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>
              Manage Locked Apps
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark" size={24} color={burntCopper} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: textColor }]}>
            Select apps you want to lock during focus sessions
          </Text>

          <ScrollView style={styles.appListContainer}>
            {POPULAR_APPS.map((app) => (
              <TouchableOpacity
                key={app}
                style={styles.appItem}
                onPress={() => toggleApp(app)}
              >
                <View style={styles.labelContainer}>
                  <IconSymbol name="app" size={20} color="#687076" />
                  <Text style={[styles.appName, { color: textColor }]}>
                    {app}
                  </Text>
                </View>

                {lockedApps.includes(app) ? (
                  <IconSymbol
                    name="checkmark.circle.fill"
                    size={24}
                    color={burntCopper}
                  />
                ) : (
                  <IconSymbol name="circle" size={24} color="#687076" />
                )}
              </TouchableOpacity>
            ))}

            {customApps.map((app) => (
              <TouchableOpacity
                key={`custom-${app}`}
                style={styles.appItem}
                onPress={() => toggleApp(app)}
              >
                <View style={styles.labelContainer}>
                  <IconSymbol name="app" size={20} color="#687076" />
                  <Text style={[styles.appName, { color: textColor }]}>
                    {app}
                  </Text>
                </View>

                <View style={styles.customAppActions}>
                  {lockedApps.includes(app) ? (
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={24}
                      color={burntCopper}
                    />
                  ) : (
                    <IconSymbol name="circle" size={24} color="#687076" />
                  )}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeCustomApp(app)}
                  >
                    <IconSymbol name="xmark.circle" size={22} color="#687076" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.addCustomContainer}>
            <Text style={[styles.subtitle, { color: textColor }]}>
              Add custom app
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: textColor,
                    borderColor: colorScheme === "dark" ? "#444" : "#e0e0e0",
                  },
                ]}
                value={newApp}
                onChangeText={setNewApp}
                placeholder="Enter app name"
                placeholderTextColor="#9E9E9E"
                returnKeyType="done"
                onSubmitEditing={addCustomApp}
              />
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: burntCopper }]}
                onPress={addCustomApp}
                disabled={!newApp.trim()}
              >
                <IconSymbol name="plus" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: burntCopper }]}
            onPress={saveLockedApps}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  appListContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  appItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  appName: {
    fontSize: 16,
    marginLeft: 12,
  },
  customAppActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButton: {
    marginLeft: 8,
    padding: 2,
  },
  addCustomContainer: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
