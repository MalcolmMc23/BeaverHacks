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

type EditEventModalProps = {
  event: {
    title: string;
    location: string;
    isAllDay: boolean;
    startDate: Date;
    endDate: Date;
    description?: string;
    notification?: NotificationTime;
    showAs?: string;
    importance?: ImportanceLevel;
    color?: string;
  };
  onCancel: () => void;
  onSave: (event: {
    title: string;
    location: string;
    isAllDay: boolean;
    startDate: Date;
    endDate: Date;
    description?: string;
    notification?: NotificationTime;
    showAs?: string;
    importance: ImportanceLevel;
    color?: string;
  }) => void;
  onDelete?: () => void;
};

export function EditEventModal({
  event,
  onCancel,
  onSave,
  onDelete,
}: EditEventModalProps) {
  const [title, setTitle] = useState(event.title);
  const [location, setLocation] = useState(event.location || "");
  const [isAllDay, setIsAllDay] = useState(event.isAllDay || false);
  const [startDate, setStartDate] = useState(event.startDate);
  const [endDate, setEndDate] = useState(event.endDate);
  const [description, setDescription] = useState(event.description || "");
  const [notification, setNotification] = useState<NotificationTime>(
    event.notification || notificationOptions[0]
  );
  const [showAs, setShowAs] = useState(event.showAs || "Busy");
  const [importance, setImportance] = useState<ImportanceLevel>(
    event.importance || "low"
  );
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

  const handleSave = () => {
    if (!title.trim()) return;

    onSave({
      title,
      location,
      isAllDay,
      startDate,
      endDate,
      description,
      notification,
      showAs,
      importance,
      color: event.color,
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
        <ThemedText style={styles.headerTitle}>Edit</ThemedText>
        <TouchableOpacity onPress={handleSave}>
          <ThemedText
            style={[
              styles.saveButton,
              title.trim() ? styles.saveButtonEnabled : null,
            ]}
          >
            Save
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
                onChange={(event, date) => date && setStartDate(date)}
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
                onChange={(event, date) => date && setEndDate(date)}
                textColor={Colors.light.text}
              />
            </View>
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
          placeholder="Add description or notes"
          value={description}
          onChangeText={setDescription}
          placeholderTextColor={Colors.light.icon}
          multiline
          textAlignVertical="top"
        />

        {onDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <ThemedText style={styles.deleteButtonText}>
              Delete Event
            </ThemedText>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modals */}
      <Modal visible={showNotificationModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowNotificationModal(false)}>
                <ThemedText style={styles.modalCancelButton}>Cancel</ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.modalTitle}>Alert</ThemedText>
              <TouchableOpacity
                onPress={() => {
                  if (showCustomInput) {
                    handleCustomNotification();
                  } else {
                    setShowNotificationModal(false);
                  }
                }}
              >
                <ThemedText style={styles.modalDoneButton}>Done</ThemedText>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList}>
              {notificationOptions.map(renderNotificationOption)}

              {showCustomInput && (
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
                    style={styles.customSaveButton}
                    onPress={handleCustomNotification}
                  >
                    <ThemedText style={styles.customSaveButtonText}>
                      Save
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showImportanceModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowImportanceModal(false)}>
                <ThemedText style={styles.modalCancelButton}>Cancel</ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.modalTitle}>Importance</ThemedText>
              <TouchableOpacity onPress={() => setShowImportanceModal(false)}>
                <ThemedText style={styles.modalDoneButton}>Done</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.optionsList}>
              {importanceLevels.map(renderImportanceOption)}
            </View>
          </View>
        </View>
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
  saveButton: {
    fontSize: 17,
    color: Colors.light.icon,
  },
  saveButtonEnabled: {
    color: Colors.light.tint,
    fontWeight: "600",
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
  label: {
    fontSize: 17,
    color: Colors.light.text,
  },
  dateLabel: {
    fontSize: 17,
    color: Colors.light.text,
    width: 80,
  },
  datePickerContainer: {
    flex: 1,
    alignItems: "flex-end",
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
    fontSize: 17,
    color: Colors.light.text,
    marginRight: 8,
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
  importanceColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  importanceValueText: {
    fontSize: 17,
    color: Colors.light.text,
    marginRight: 8,
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
  deleteButton: {
    backgroundColor: Colors.light.background,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.light.icon,
    marginTop: 20,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 40,
  },
  deleteButtonText: {
    fontSize: 17,
    color: "#FF3B30",
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.icon,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.light.text,
  },
  modalCancelButton: {
    fontSize: 17,
    color: Colors.light.tint,
  },
  modalDoneButton: {
    fontSize: 17,
    color: Colors.light.tint,
    fontWeight: "600",
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.icon,
  },
  optionText: {
    fontSize: 17,
    color: Colors.light.text,
  },
  customInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.icon,
  },
  customInput: {
    flex: 1,
    fontSize: 17,
    color: Colors.light.text,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.light.icon,
    borderRadius: 8,
    marginRight: 10,
  },
  customSaveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  customSaveButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  importanceOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.icon,
  },
  importanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  importanceText: {
    fontSize: 17,
    color: Colors.light.text,
  },
});
