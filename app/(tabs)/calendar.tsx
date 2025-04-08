import {
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  View,
  SafeAreaView,
  Text,
} from "react-native";
import React, { useState, useRef, useCallback } from "react"; // Add useRef, useCallback
import { Colors } from "@/constants/Colors";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/useColorScheme"; // Import useColorScheme
import { v4 as uuidv4 } from "uuid"; // Import uuid
// Import components from the main components index
import {
  DayView,
  AddButton,
  MonthView,
  CalendarHeader,
  AddEventModal, // Import the modal
  Event, // Import the Event type
} from "@/components"; // Corrected import path
import { GestureHandlerRootView } from "react-native-gesture-handler"; // Import GestureHandlerRootView

type CalendarViewMode = "day" | "month";

// Define the hierarchical structure for events
interface EventsByDate {
  [year: number]: {
    [month: number]: {
      [day: number]: Event[];
    };
  };
}

// Keep only necessary styles in the interface
interface Styles {
  container: ViewStyle;
  contentContainer: ViewStyle; // Container for the main view (Day or Month)
  addButtonContainer: ViewStyle; // Separate container for absolute positioning
  tabBar: ViewStyle;
  tabBarButton: ViewStyle;
  tabBarText: TextStyle;
}

export default function CalendarScreen() {
  const colorScheme = useColorScheme() ?? "light";
  // Use a conditional to explicitly get the theme colors object
  const themeColors = colorScheme === "dark" ? Colors.dark : Colors.light;

  const [currentView, setCurrentView] = useState<CalendarViewMode>("day"); // Default to day view
  const [selectedDate, setSelectedDate] = useState(new Date()); // Add state for selected date
  const [isAddModalVisible, setAddModalVisible] = useState(false); // State for modal
  const [allEvents, setAllEvents] = useState<EventsByDate>({}); // Use hierarchical state

  const handleAddEventPress = () => {
    console.log("Add event button pressed - opening modal");
    setAddModalVisible(true); // Open the modal
  };

  // This function will be called by the modal when an event is added
  const handleAddEventConfirm = useCallback((eventData: Omit<Event, "id">) => {
    const newEvent: Event = {
      ...eventData,
      id: uuidv4(),
    };
    console.log("Adding event (hierarchical):", newEvent);

    const year = newEvent.startTime.getFullYear();
    const month = newEvent.startTime.getMonth(); // 0-indexed
    const day = newEvent.startTime.getDate();

    setAllEvents((prevEvents) => {
      // Create deep copy to ensure immutability
      const newEventsState = { ...prevEvents };

      // Ensure year level exists
      if (!newEventsState[year]) {
        newEventsState[year] = {};
      }
      // Create copy of year object
      newEventsState[year] = { ...newEventsState[year] };

      // Ensure month level exists
      if (!newEventsState[year][month]) {
        newEventsState[year][month] = {};
      }
      // Create copy of month object
      newEventsState[year][month] = { ...newEventsState[year][month] };

      // Ensure day level exists (as an array)
      if (!newEventsState[year][month][day]) {
        newEventsState[year][month][day] = [];
      }
      // Create copy of day array and add the new event
      const dayEvents = [...newEventsState[year][month][day], newEvent];

      // Sort events within the day by start time
      dayEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      // Update the state
      newEventsState[year][month][day] = dayEvents;

      return newEventsState;
    });

    setAddModalVisible(false);
  }, []);

  const handleDayPressFromMonth = (date: Date) => {
    console.log(
      "Day pressed in Month View, switching to Day View:",
      date.toDateString()
    );
    setSelectedDate(date); // Set the selected date
    setCurrentView("day"); // Switch to Day view
  };

  // --- NEW: Handler to update event time after dragging ---
  const handleUpdateEventTime = useCallback(
    (eventId: string, newStartTime: Date, newEndTime: Date) => {
      console.log("Updating event time:", eventId, newStartTime, newEndTime);

      const year = newStartTime.getFullYear();
      const month = newStartTime.getMonth(); // 0-indexed
      const day = newStartTime.getDate();

      setAllEvents((prevEvents) => {
        // Create deep copy to ensure immutability (similar to add)
        const newEventsState = { ...prevEvents };

        // Check if the date path exists
        if (!newEventsState[year]?.[month]?.[day]) {
          console.warn(
            "Tried to update event on a day with no events:",
            year,
            month,
            day
          );
          return prevEvents; // Return previous state if day doesn't exist
        }

        // Create copies of nested objects
        newEventsState[year] = { ...newEventsState[year] };
        newEventsState[year][month] = { ...newEventsState[year][month] };

        // Find the event and update its times
        let eventFound = false;
        const updatedDayEvents = newEventsState[year][month][day].map(
          (event) => {
            if (event.id === eventId) {
              eventFound = true;
              return { ...event, startTime: newStartTime, endTime: newEndTime };
            }
            return event;
          }
        );

        if (!eventFound) {
          console.warn("Event ID not found for update:", eventId);
          return prevEvents; // Return previous state if event not found
        }

        // Sort events within the day by start time after update
        updatedDayEvents.sort(
          (a, b) => a.startTime.getTime() - b.startTime.getTime()
        );

        // Update the state
        newEventsState[year][month][day] = updatedDayEvents;

        return newEventsState;
      });
    },
    [] // No dependencies needed for this version of the handler
  );
  // --- End NEW Handler ---

  return (
    // IMPORTANT: Wrap with GestureHandlerRootView
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />

        {/* Add the Calendar Header */}
        <CalendarHeader
          currentView={currentView}
          onViewChange={setCurrentView} // Pass setter function
        />

        {/* Container for the main Calendar View (Day or Month) */}
        <View style={styles.contentContainer}>
          {currentView === "day" ? (
            <DayView
              date={selectedDate}
              // Retrieve events for the selected day from hierarchical state
              dayEvents={
                allEvents[selectedDate.getFullYear()]?.[
                  selectedDate.getMonth()
                ]?.[selectedDate.getDate()] || []
              } // Use optional chaining and provide empty array as fallback
              onUpdateEventTime={handleUpdateEventTime} // Pass the handler down
            />
          ) : (
            <MonthView onDayPress={handleDayPressFromMonth} /> // Pass handler
          )}

          {/* Add Button - Only visible in Day View */}
          {currentView === "day" && (
            <View style={styles.addButtonContainer}>
              <AddButton onPress={handleAddEventPress} />
            </View>
          )}
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

        {/* Render the Add Event Modal */}
        <AddEventModal
          isVisible={isAddModalVisible}
          onClose={() => setAddModalVisible(false)}
          onAddEvent={handleAddEventConfirm}
          initialDate={selectedDate} // Pass the currently selected date
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// Updated styles
const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    position: "relative", // Needed for absolute positioning of the button
  },
  addButtonContainer: {
    // Renamed from addButton for clarity
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1, // Ensure button is above the view content
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    paddingBottom: 20, // Keep padding for safe area
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabBarButton: {},
  tabBarText: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  // Remove all other styles
});
