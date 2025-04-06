import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
  ScrollView,
  Button,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Todo, TodoItem } from "@/components/Todo";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function TodoScreen() {
  const colorScheme = useColorScheme();
  const theme = (useColorScheme() ?? "light") as "light" | "dark";
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const router = useRouter();

  // Load todos from AsyncStorage on component mount
  useEffect(() => {
    const loadTodos = async () => {
      try {
        const storedTodos = await AsyncStorage.getItem("todos");
        if (storedTodos) {
          const parsedTodos = JSON.parse(storedTodos);
          // Convert date strings back to Date objects
          const todosWithDates = parsedTodos.map((todo: any) => ({
            ...todo,
            startDate: todo.startDate ? new Date(todo.startDate) : undefined,
            endDate: todo.endDate ? new Date(todo.endDate) : undefined,
          }));
          setTodos(todosWithDates);
        } else {
          // Default sample todos only if no stored todos exist
          setTodos([
            {
              id: "1",
              text: "Complete homework",
              completed: false,
              description: "Math assignment due tomorrow",
              startDate: new Date(Date.now() + 3600000), // 1 hour from now
              endDate: new Date(Date.now() + 86400000), // 24 hours from now
            },
            {
              id: "2",
              text: "Go for a run",
              completed: true,
              startDate: new Date(Date.now() - 7200000), // 2 hours ago
              endDate: new Date(Date.now() - 3600000), // 1 hour ago
            },
            {
              id: "3",
              text: "Buy groceries",
              completed: false,
              description: "Milk, eggs, bread",
            },
          ]);
        }
      } catch (error) {
        console.error("Error loading todos:", error);
      }
    };

    loadTodos();
  }, []);

  // Save todos to AsyncStorage whenever they change
  useEffect(() => {
    const saveTodos = async () => {
      try {
        await AsyncStorage.setItem("todos", JSON.stringify(todos));
      } catch (error) {
        console.error("Error saving todos:", error);
      }
    };

    if (todos.length > 0) {
      saveTodos();
    }
  }, [todos]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [activePickerType, setActivePickerType] = useState<"start" | "end">(
    "start"
  );

  // Reset form when modal closes
  useEffect(() => {
    if (!modalVisible) {
      setNewTaskText("");
      setNewTaskDescription("");
      setStartDate(null);
      setEndDate(null);
      setEditingTodo(null);
      setShowStartPicker(false);
      setShowEndPicker(false);
    }
  }, [modalVisible]);

  // Set form values when editing
  useEffect(() => {
    if (editingTodo) {
      setNewTaskText(editingTodo.text);
      setNewTaskDescription(editingTodo.description || "");
      setStartDate(editingTodo.startDate || null);
      setEndDate(editingTodo.endDate || null);
      setModalVisible(true);
    }
  }, [editingTodo]);

  const handleAddTodo = () => {
    if (newTaskText.trim()) {
      if (editingTodo) {
        // Update existing todo
        setTodos(
          todos.map((todo) =>
            todo.id === editingTodo.id
              ? {
                  ...todo,
                  text: newTaskText.trim(),
                  description: newTaskDescription.trim() || undefined,
                  startDate: startDate || undefined,
                  endDate: endDate || undefined,
                }
              : todo
          )
        );
      } else {
        // Create new todo
        const newTodo: TodoItem = {
          id: Date.now().toString(),
          text: newTaskText.trim(),
          completed: false,
          description: newTaskDescription.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        };
        setTodos([...todos, newTodo]);
      }
      setModalVisible(false);
    }
  };

  const handleToggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleEditTodo = (id: string) => {
    const todoToEdit = todos.find((todo) => todo.id === id);
    if (todoToEdit) {
      setEditingTodo(todoToEdit);
    }
  };

  const formatDateDisplay = (date?: Date | null) => {
    if (!date) return "";

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if the date is today, tomorrow, or yesterday
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    // Format the date part
    let dateStr = "";
    if (isToday) {
      dateStr = "Today";
    } else if (isTomorrow) {
      dateStr = "Tomorrow";
    } else if (isYesterday) {
      dateStr = "Yesterday";
    } else {
      const currentYear = today.getFullYear();
      const dateYear = date.getFullYear();

      // Format without year if it's the current year
      if (currentYear === dateYear) {
        dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      } else {
        dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    }

    // Format the time part
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });

    return `${dateStr} at ${timeStr}`;
  };

  // Popup date picker component
  const DatePickerPopup = ({
    visible,
    onClose,
    initialDate,
    onSave,
    pickerType,
    theme,
  }: {
    visible: boolean;
    onClose: () => void;
    initialDate?: Date | null;
    onSave: (date: Date) => void;
    pickerType: "start" | "end";
    theme: "light" | "dark";
  }) => {
    const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
    const [selectedHours, setSelectedHours] = useState(selectedDate.getHours());
    const [selectedMinutes, setSelectedMinutes] = useState(
      selectedDate.getMinutes()
    );
    const isAM = selectedHours < 12;

    useEffect(() => {
      if (initialDate) {
        setSelectedDate(initialDate);
        setSelectedHours(initialDate.getHours());
        setSelectedMinutes(initialDate.getMinutes());
      }
    }, [initialDate, visible]);

    const setHours = (hours: number, am: boolean) => {
      let newHours = hours;
      if (am && hours === 12) newHours = 0;
      if (!am && hours !== 12) newHours = hours + 12;
      setSelectedHours(newHours);
    };

    const handleSave = () => {
      const newDate = new Date(selectedDate);
      newDate.setHours(selectedHours);
      newDate.setMinutes(selectedMinutes);
      onSave(newDate);
      onClose();
    };

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Generate days for the month
    const getDaysInMonth = (year: number, month: number) => {
      return new Date(year, month + 1, 0).getDate();
    };

    const generateDays = () => {
      const days = [];
      const daysInMonth = getDaysInMonth(
        selectedDate.getFullYear(),
        selectedDate.getMonth()
      );
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
      }
      return days;
    };

    const changeMonth = (increment: number) => {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() + increment);
      setSelectedDate(newDate);
    };

    const selectDay = (day: number) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(day);
      setSelectedDate(newDate);
    };

    const isSelected = (day: number) => {
      return selectedDate.getDate() === day;
    };

    if (!visible) return null;

    return (
      <Modal
        transparent={true}
        visible={visible}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerPopup}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>
                {pickerType === "start" ? "Start Date" : "End Date"}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closePickerButton}
              >
                <IconSymbol name="xmark" size={20} color="#687076" />
              </TouchableOpacity>
            </View>

            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <IconSymbol name="chevron.left" size={20} color="#687076" />
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {monthNames[selectedDate.getMonth()]}{" "}
                {selectedDate.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)}>
                <IconSymbol name="chevron.right" size={20} color="#687076" />
              </TouchableOpacity>
            </View>

            <View style={styles.daysContainer}>
              {generateDays().map((day) => (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.dayButton,
                    isSelected(day) && styles.selectedDayButton,
                    isSelected(day) && { backgroundColor: Colors[theme].tint },
                  ]}
                  onPress={() => selectDay(day)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected(day) && styles.selectedDayText,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.timeSelector}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>Hour</Text>
                <ScrollView
                  style={styles.timeScrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                    <TouchableOpacity
                      key={`hour-${hour}`}
                      style={[
                        styles.timeButton,
                        (isAM &&
                          hour ===
                            (selectedHours === 0 ? 12 : selectedHours)) ||
                        (!isAM &&
                          hour ===
                            (selectedHours % 12 === 0
                              ? 12
                              : selectedHours % 12))
                          ? styles.selectedTimeButton
                          : null,
                      ]}
                      onPress={() => setHours(hour, isAM)}
                    >
                      <Text style={styles.timeButtonText}>{hour}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>Minute</Text>
                <ScrollView
                  style={styles.timeScrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                    <TouchableOpacity
                      key={`minute-${minute}`}
                      style={[
                        styles.timeButton,
                        selectedMinutes === minute
                          ? styles.selectedTimeButton
                          : null,
                      ]}
                      onPress={() => setSelectedMinutes(minute)}
                    >
                      <Text style={styles.timeButtonText}>
                        {minute.toString().padStart(2, "0")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>AM/PM</Text>
                <View style={styles.amPmContainer}>
                  <TouchableOpacity
                    style={[
                      styles.amPmButton,
                      isAM && styles.selectedAmPmButton,
                      isAM && {
                        backgroundColor: Colors[theme].tint,
                        borderColor: Colors[theme].tint,
                      },
                    ]}
                    onPress={() => setHours(selectedHours % 12, true)}
                  >
                    <Text
                      style={[styles.amPmText, isAM && styles.selectedAmPmText]}
                    >
                      AM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.amPmButton,
                      !isAM && styles.selectedAmPmButton,
                      !isAM && {
                        backgroundColor: Colors[theme].tint,
                        borderColor: Colors[theme].tint,
                      },
                    ]}
                    onPress={() => setHours(selectedHours % 12, false)}
                  >
                    <Text
                      style={[
                        styles.amPmText,
                        !isAM && styles.selectedAmPmText,
                      ]}
                    >
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.datePickerFooter}>
              <TouchableOpacity
                style={[
                  styles.savePickerButton,
                  { backgroundColor: Colors[theme].tint },
                ]}
                onPress={handleSave}
              >
                <Text style={styles.savePickerButtonText}>
                  {pickerType === "start" ? "Set Start Time" : "Set End Time"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Handler for when start date picker value is set
  const handleStartDateSet = (date: Date) => {
    setStartDate(date);

    // If end date is before start date or not set, update it
    if (!endDate || date > endDate) {
      const newEndDate = new Date(date);
      newEndDate.setHours(newEndDate.getHours() + 1);
      setEndDate(newEndDate);
    }
  };

  // Handler for when end date picker value is set
  const handleEndDateSet = (date: Date) => {
    // Ensure end date is not before start date
    if (startDate && date < startDate) {
      const adjustedDate = new Date(startDate);
      adjustedDate.setHours(date.getHours(), date.getMinutes());
      setEndDate(adjustedDate);
    } else {
      setEndDate(date);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors[theme].background }]}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[theme].text }]}>
          Todo List
        </Text>
        <Text style={styles.subtitle}>
          {todos.filter((t) => !t.completed).length} tasks remaining
        </Text>
      </View>

      <FlatList
        style={styles.list}
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Todo
            item={item}
            onToggle={handleToggleTodo}
            onDelete={handleDeleteTodo}
            onPress={handleEditTodo}
            colorScheme={theme}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={() => (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <View style={styles.addButtonCircle}>
              <IconSymbol name="plus" size={16} color="#687076" />
            </View>
            <Text style={styles.addButtonText}>Add new task</Text>
          </TouchableOpacity>
        )}
      />

      {/* Task Creation/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTodo ? "Edit Task" : "New Task"}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <IconSymbol name="xmark" size={24} color="#687076" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.inputLabel}>Task</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="What needs to be done?"
                value={newTaskText}
                onChangeText={setNewTaskText}
                autoFocus
              />

              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.descriptionInput]}
                placeholder="Add details"
                value={newTaskDescription}
                onChangeText={setNewTaskDescription}
                multiline
              />

              <Text style={styles.inputLabel}>Start Time</Text>
              <Pressable
                style={styles.dateSelector}
                onPress={() => {
                  setActivePickerType("start");
                  setShowStartPicker(true);
                }}
              >
                <IconSymbol name="calendar" size={20} color="#687076" />
                <Text style={styles.dateSelectorText}>
                  {startDate
                    ? formatDateDisplay(startDate)
                    : "Add start date & time"}
                </Text>
              </Pressable>

              <Text style={styles.inputLabel}>End Time</Text>
              <Pressable
                style={styles.dateSelector}
                onPress={() => {
                  setActivePickerType("end");
                  setShowEndPicker(true);
                }}
              >
                <IconSymbol name="clock" size={20} color="#687076" />
                <Text style={styles.dateSelectorText}>
                  {endDate ? formatDateDisplay(endDate) : "Add end date & time"}
                </Text>
              </Pressable>
            </ScrollView>

            {/* Custom Date Picker Popups */}
            <DatePickerPopup
              visible={showStartPicker}
              onClose={() => setShowStartPicker(false)}
              initialDate={startDate || new Date()}
              onSave={handleStartDateSet}
              pickerType="start"
              theme={theme}
            />

            <DatePickerPopup
              visible={showEndPicker}
              onClose={() => setShowEndPicker(false)}
              initialDate={
                endDate ||
                (startDate
                  ? new Date(startDate.getTime() + 3600000)
                  : new Date())
              }
              onSave={handleEndDateSet}
              pickerType="end"
              theme={theme}
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: newTaskText.trim()
                      ? Colors[theme].tint
                      : "#cccccc",
                  },
                ]}
                onPress={handleAddTodo}
                disabled={!newTaskText.trim()}
              >
                <Text style={styles.saveButtonText}>
                  {editingTodo ? "Update" : "Add Task"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <TouchableOpacity
        style={[styles.chatFab, { backgroundColor: '#8B4513' }]}
        onPress={() => router.push('/chat')}
      >
        <IconSymbol name="mic" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const seaMistLight = "#F5F5F5"; // Use a very light gray for inputs to match screenshot

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#687076",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 120, // Increased padding at bottom for tab bar
  },
  addButton: {
    marginTop: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  addButtonCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#687076',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addButtonText: {
    fontSize: 16,
    color: '#687076',
    fontWeight: '400',
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "500",
  },
  closeButton: {
    padding: 4,
  },
  modalForm: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "400",
    marginBottom: 8,
    color: "#333333",
  },
  modalInput: {
    backgroundColor: seaMistLight,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: seaMistLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  dateSelectorText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#999999",
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "500",
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerPopup: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "85%",
    maxHeight: "80%",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closePickerButton: {
    padding: 4,
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: "500",
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  dayButton: {
    width: "14.285%", // 7 days per row
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedDayButton: {
    borderRadius: 50,
  },
  dayText: {
    fontSize: 15,
  },
  selectedDayText: {
    color: "white",
    fontWeight: "500",
  },
  timeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  timeColumn: {
    alignItems: "center",
    width: "30%",
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#687076",
  },
  timeScrollView: {
    height: 150,
  },
  timeButton: {
    paddingVertical: 10,
    width: 50,
    alignItems: "center",
  },
  selectedTimeButton: {
    backgroundColor: seaMistLight,
    borderRadius: 8,
  },
  timeButtonText: {
    fontSize: 16,
  },
  amPmContainer: {
    height: 150,
    justifyContent: "center",
  },
  amPmButton: {
    paddingVertical: 12,
    width: 50,
    alignItems: "center",
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectedAmPmButton: {},
  amPmText: {
    fontSize: 16,
    fontWeight: "500",
  },
  selectedAmPmText: {
    color: "white",
    fontWeight: "500",
  },
  datePickerFooter: {
    alignItems: "center",
  },
  savePickerButton: {
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  savePickerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  addFloatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  chatFab: {
    position: 'absolute',
    right: 20,
    bottom: 90, // Positioned above the tab bar
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1,
  },
});
