import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ViewStyle,
  TextStyle,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

// Define the Event structure (consider moving to a shared types file later)
export interface Event {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  color: string; // Keep color simple for now
}

type AddEventModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onAddEvent: (eventData: Omit<Event, "id">) => void;
  initialDate?: Date; // Optional initial date from DayView
};

interface Styles {
  modalContainer: ViewStyle;
  modalContent: ViewStyle;
  modalTitle: TextStyle;
  input: TextStyle;
  datePickerButton: ViewStyle;
  datePickerText: TextStyle;
  buttonContainer: ViewStyle;
  errorText: TextStyle;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isVisible,
  onClose,
  onAddEvent,
  initialDate = new Date(), // Default to now if no initial date provided
}) => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = colorScheme === "dark" ? Colors.dark : Colors.light;

  const [title, setTitle] = useState("");
  // Initialize startTime and endTime based on initialDate
  const [startTime, setStartTime] = useState(() => {
    const date = new Date(initialDate);
    date.setHours(date.getHours() + 1, 0, 0, 0); // Default to next hour
    return date;
  });
  const [endTime, setEndTime] = useState(() => {
    const date = new Date(startTime);
    date.setHours(date.getHours() + 1); // Default to one hour duration
    return date;
  });
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [pickerMode, setPickerMode] = useState<"startTime" | "endTime">(
    "startTime"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showDatePicker = (mode: "startTime" | "endTime") => {
    setPickerMode(mode);
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date: Date) => {
    hideDatePicker();
    const selectedDate = new Date(date); // Ensure it's a new Date object

    if (pickerMode === "startTime") {
      // If start time changes, adjust end time if it's before the new start time
      setStartTime(selectedDate);
      if (endTime < selectedDate) {
        const newEndTime = new Date(selectedDate);
        newEndTime.setHours(newEndTime.getHours() + 1);
        setEndTime(newEndTime);
      }
    } else {
      // Ensure end time is not before start time
      if (selectedDate > startTime) {
        setEndTime(selectedDate);
      } else {
        setErrorMessage("End time cannot be before start time.");
        // Optionally reset end time or keep the old one
        // const newEndTime = new Date(startTime);
        // newEndTime.setHours(newEndTime.getHours() + 1);
        // setEndTime(newEndTime);
      }
    }
    if (errorMessage && selectedDate > startTime && pickerMode === "endTime") {
      setErrorMessage(null); // Clear error if end time is now valid
    }
  };

  const handleAdd = () => {
    setErrorMessage(null); // Clear previous errors
    if (!title.trim()) {
      setErrorMessage("Please enter an event title.");
      return;
    }
    if (endTime <= startTime) {
      setErrorMessage("End time must be after start time.");
      return;
    }

    const newEventData: Omit<Event, "id"> = {
      title: title.trim(),
      startTime,
      endTime,
      color: themeColors.tint, // Default color for now
    };
    onAddEvent(newEventData);
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle("");
    const nextHour = new Date(initialDate);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    setStartTime(nextHour);
    const oneHourLater = new Date(nextHour);
    oneHourLater.setHours(oneHourLater.getHours() + 1);
    setEndTime(oneHourLater);
    setErrorMessage(null);
  };

  // Reset form state when modal becomes visible after being hidden
  React.useEffect(() => {
    if (isVisible) {
      resetForm();
      // Optionally re-initialize dates based on a potentially updated initialDate
      const nextHour = new Date(initialDate);
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      setStartTime(nextHour);
      const oneHourLater = new Date(nextHour);
      oneHourLater.setHours(oneHourLater.getHours() + 1);
      setEndTime(oneHourLater);
    }
  }, [isVisible, initialDate]);

  const styles = StyleSheet.create<Styles>({
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
    },
    modalContent: {
      width: "85%",
      padding: 20,
      backgroundColor: themeColors.background,
      borderRadius: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 15,
      textAlign: "center",
      color: themeColors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: themeColors.border,
      padding: 10,
      marginBottom: 15,
      borderRadius: 5,
      color: themeColors.text,
      backgroundColor: themeColors.background,
    },
    datePickerButton: {
      backgroundColor: themeColors.background,
      padding: 10,
      borderRadius: 5,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: themeColors.border,
      alignItems: "center",
    },
    datePickerText: {
      color: themeColors.text,
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: 10,
    },
    errorText: {
      color: "red", // Or use themeColors.error if defined
      textAlign: "center",
      marginBottom: 10,
      fontSize: 12,
    },
  });

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleCancel} // Allow closing with back button on Android
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add New Event</Text>

          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Event Title"
            placeholderTextColor={themeColors.icon}
            value={title}
            onChangeText={setTitle}
          />

          {/* Start Time Picker */}
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => showDatePicker("startTime")}
          >
            <Text style={styles.datePickerText}>
              Start:{" "}
              {startTime.toLocaleString([], {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </Text>
          </TouchableOpacity>

          {/* End Time Picker */}
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => showDatePicker("endTime")}
          >
            <Text style={styles.datePickerText}>
              End:{" "}
              {endTime.toLocaleString([], {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </Text>
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="datetime" // Allow selecting both date and time
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
            date={pickerMode === "startTime" ? startTime : endTime} // Pre-select current value
            isDarkModeEnabled={colorScheme === "dark"}
            // Minimum date could be set if needed, e.g., minimumDate={new Date()}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Cancel"
              onPress={handleCancel}
              color={themeColors.tint}
            />
            <Button
              title="Add Event"
              onPress={handleAdd}
              color={themeColors.tint}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};
