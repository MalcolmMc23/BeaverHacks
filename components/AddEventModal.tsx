import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Switch,
  TouchableOpacity,
  Platform,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import { IconSymbol } from "./ui/IconSymbol";
import { Colors } from "@/constants/Colors";

type ImportanceLevel = "low" | "medium" | "high" | "urgent";

type NotificationTime = {
  label: string;
  value: number; // minutes before event
};

const notificationOptions: NotificationTime[] = [
  { label: "At time of event", value: 0 },
  { label: "5 minutes before", value: 5 },
  { label: "10 minutes before", value: 10 },
  { label: "15 minutes before", value: 15 },
  { label: "30 minutes before", value: 30 },
  { label: "1 hour before", value: 60 },
  { label: "2 hours before", value: 120 },
  { label: "Custom", value: -1 },
];

type AddEventModalProps = {
  onCancel: () => void;
  onAdd: (event: {
    title: string;
    location: string;
    isAllDay: boolean;
    startDate: Date;
    endDate: Date;
    description?: string;
    notification?: NotificationTime;
    showAs?: string;
    importance: ImportanceLevel;
  }) => void;
  initialData?: {
    startDate?: Date;
    endDate?: Date;
    title?: string;
  };
};

export function AddEventModal({
  onCancel,
  onAdd,
  initialData,
}: AddEventModalProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [location, setLocation] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [startDate, setStartDate] = useState(
    initialData?.startDate || new Date()
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate || new Date(Date.now() + 60 * 60 * 1000)
  );
  const [description, setDescription] = useState("");
  const [notification, setNotification] = useState<NotificationTime>(
    notificationOptions[0]
  );
  const [showAs, setShowAs] = useState("Busy");
  const [importance, setImportance] = useState<ImportanceLevel>("low");
  const [showImportanceModal, setShowImportanceModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const importanceLevels: ImportanceLevel[] = [
    "low",
    "medium",
    "high",
    "urgent",
  ];

  const handleAdd = () => {
    if (!title.trim()) return;

    // Validate that end time is not before start time
    if (endDate < startDate) {
      // Set end date to be 1 hour after start date
      const newEndDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      setEndDate(newEndDate);
      Alert.alert("Invalid Time", "End time cannot be before start time. End time has been adjusted.");
      return;
    }

    onAdd({
      title,
      location,
      isAllDay,
      startDate,
      endDate,
      description,
      notification,
      showAs,
      importance,
    });
  };

  const handleNotificationSelect = (option: NotificationTime) => {
    if (option.value === -1) {
      setShowCustomInput(true);
    } else {
      setNotification(option);
      setShowNotificationModal(false);
      setShowCustomInput(false);
    }
  };

  const handleCustomNotification = () => {
    const minutes = parseInt(customMinutes);
    if (!isNaN(minutes) && minutes > 0) {
      setNotification({
        label: `${minutes} minutes before`,
        value: minutes,
      });
      setShowCustomInput(false);
      setShowNotificationModal(false);
    }
  };

  const renderNotificationOption = (option: NotificationTime) => (
    <TouchableOpacity
      key={option.label}
      style={styles.optionItem}
      onPress={() => handleNotificationSelect(option)}
    >
      <ThemedText style={styles.optionText}>{option.label}</ThemedText>
      {notification.value === option.value && (
        <IconSymbol name="checkmark" size={20} color={Colors.light.tint} />
      )}
    </TouchableOpacity>
  );

  const renderImportanceOption = (level: ImportanceLevel) => (
    <TouchableOpacity
      key={level}
      style={styles.importanceOption}
      onPress={() => {
        setImportance(level);
        setShowImportanceModal(false);
      }}
    >
      <View style={styles.importanceRow}>
        <View
          style={[
            styles.importanceColor,
            { backgroundColor: Colors.light.importance[level] },
          ]}
        />
        <ThemedText style={styles.importanceText}>
          {level.charAt(0).toUpperCase() + level.slice(1)}
        </ThemedText>
      </View>
      {importance === level && (
        <IconSymbol name="checkmark" size={20} color={Colors.light.tint} />
      )}
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <ThemedText style={styles.cancelButton}>Cancel</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>New</ThemedText>
        <TouchableOpacity onPress={handleAdd}>
          <ThemedText
            style={[
              styles.addButton,
              title.trim() ? styles.addButtonEnabled : null,
            ]}
          >
            Add
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form}>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={Colors.light.icon}
          />
          <TextInput
            style={styles.locationInput}
            placeholder="Location or Video Call"
            value={location}
            onChangeText={setLocation}
            placeholderTextColor={Colors.light.icon}
          />
        </View>

        <View style={styles.timeGroup}>
          <View style={styles.switchRow}>
            <ThemedText style={styles.label}>All-day</ThemedText>
            <Switch
              value={isAllDay}
              onValueChange={setIsAllDay}
              trackColor={{ false: Colors.light.icon, true: Colors.light.tint }}
              thumbColor={Colors.light.background}
              ios_backgroundColor={Colors.light.icon}
            />
          </View>

          <View style={styles.dateRow}>
            <ThemedText style={styles.dateLabel}>Starts</ThemedText>
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={startDate}
                mode={isAllDay ? "date" : "datetime"}
                is24Hour={false}
                onChange={(event, date) => {
                  if (date) {
                    setStartDate(date);
                    if (date > endDate) {
                      const newEndDate = new Date(date.getTime() + 60 * 60 * 1000);
                      setEndDate(newEndDate);
                    }
                  }
                }}
                textColor={Colors.light.text}
              />
            </View>
          </View>

          <View style={styles.dateRow}>
            <ThemedText style={styles.dateLabel}>Ends</ThemedText>
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={endDate}
                mode={isAllDay ? "date" : "datetime"}
                is24Hour={false}
                onChange={(event, date) => {
                  if (date) {
                    if (date >= startDate) {
                      setEndDate(date);
                    } else {
                      const newEndDate = new Date(startDate.getTime() + 60 * 60 * 1000);
                      setEndDate(newEndDate);
                      Alert.alert("Invalid Time", "End time cannot be before start time. End time has been adjusted.");
                    }
                  }
                }}
                textColor={Colors.light.text}
              />
            </View>
          </View>
          
          <View style={styles.timeConstraintRow}>
            <IconSymbol name="info.circle" size={16} color={Colors.light.tint} />
            <ThemedText style={styles.timeConstraintText}>
              End time must be after start time
            </ThemedText>
          </View>
        </View>

        <View style={styles.optionsGroup}>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setShowNotificationModal(true)}
          >
            <ThemedText style={styles.label}>Push Notification</ThemedText>
            <View style={styles.optionValue}>
              <ThemedText style={styles.optionValueText}>
                {notification.label}
              </ThemedText>
              <IconSymbol
                name="chevron.right"
                size={20}
                color={Colors.light.icon}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow}>
            <ThemedText style={styles.label}>Show As</ThemedText>
            <View style={styles.optionValue}>
              <ThemedText style={styles.optionValueText}>{showAs}</ThemedText>
              <IconSymbol
                name="chevron.right"
                size={20}
                color={Colors.light.icon}
              />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.importanceGroup}
          onPress={() => setShowImportanceModal(true)}
        >
          <View style={styles.importanceHeader}>
            <ThemedText style={styles.label}>Importance</ThemedText>
            <View style={styles.importanceValue}>
              <View
                style={[
                  styles.importanceColor,
                  { backgroundColor: Colors.light.importance[importance] },
                ]}
              />
              <ThemedText style={styles.importanceValueText}>
                {importance.charAt(0).toUpperCase() + importance.slice(1)}
              </ThemedText>
              <IconSymbol
                name="chevron.right"
                size={20}
                color={Colors.light.icon}
              />
            </View>
          </View>
        </TouchableOpacity>

        <TextInput
          style={styles.descriptionInput}
          placeholder="URL"
          value={description}
          onChangeText={setDescription}
          placeholderTextColor={Colors.light.icon}
          multiline
        />
      </ScrollView>

      <Modal
        visible={showNotificationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                Push Notification
              </ThemedText>
            </View>
            {showCustomInput ? (
              <View style={styles.customInputContainer}>
                <TextInput
                  style={styles.customInput}
                  placeholder="Enter minutes"
                  value={customMinutes}
                  onChangeText={setCustomMinutes}
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.light.icon}
                />
                <TouchableOpacity
                  style={styles.customInputButton}
                  onPress={handleCustomNotification}
                >
                  <ThemedText style={styles.customInputButtonText}>
                    Set
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              notificationOptions.map(renderNotificationOption)
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showImportanceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImportanceModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImportanceModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                Select Importance
              </ThemedText>
            </View>
            {importanceLevels.map(renderImportanceOption)}
          </View>
        </TouchableOpacity>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 16,
    backgroundColor: Colors.light.background,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.light.text,
  },
  cancelButton: {
    fontSize: 17,
    color: Colors.light.tint,
  },
  addButton: {
    fontSize: 17,
    color: Colors.light.tint,
    opacity: 0.5,
  },
  addButtonEnabled: {
    opacity: 1,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.icon,
  },
  titleInput: {
    height: 44,
    paddingHorizontal: 16,
    fontSize: 17,
    color: Colors.light.text,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.icon,
  },
  locationInput: {
    height: 44,
    paddingHorizontal: 16,
    fontSize: 17,
    color: Colors.light.text,
  },
  timeGroup: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.icon,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dateLabel: {
    width: 80,
    color: Colors.light.text,
  },
  label: {
    color: Colors.light.text,
    fontSize: 17,
  },
  datePickerContainer: {
    flex: 1,
  },
  optionsGroup: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.icon,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.icon,
  },
  optionValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionValueText: {
    marginRight: 8,
    color: Colors.light.icon,
  },
  importanceGroup: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.icon,
  },
  importanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  importanceValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  importanceValueText: {
    marginHorizontal: 8,
    color: Colors.light.icon,
    fontSize: 17,
  },
  importanceColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.icon,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    color: Colors.light.text,
  },
  importanceOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.icon,
  },
  importanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  importanceText: {
    marginLeft: 12,
    fontSize: 17,
    color: Colors.light.text,
  },
  descriptionInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    minHeight: 100,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.icon,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.icon,
  },
  optionText: {
    fontSize: 17,
    color: Colors.light.text,
  },
  customInputContainer: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.icon,
  },
  customInput: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.icon,
  },
  customInputButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  customInputButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  timeConstraintRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  timeConstraintText: {
    marginLeft: 8,
    color: Colors.light.text,
  },
});
