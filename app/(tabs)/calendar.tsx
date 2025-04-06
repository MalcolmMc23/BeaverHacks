import {
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  Dimensions,
} from "react-native";
import React from "react";
import { Text, View, SafeAreaView } from "react-native";
import { Colors } from "@/constants/Colors";
import { StatusBar } from "expo-status-bar";
import { Calendar, DateData } from "react-native-calendars";
import { useState, useRef } from "react";
import { IconSymbol } from "@/components/ui/IconSymbol";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AddEventModal } from "@/components/AddEventModal";
import { EditEventModal } from "@/components/EditEventModal";

// Move these constants to top level
const burntCopper = "#A0430A"; // Primary accent color from constants
const seaMist = "#DFE8E6"; // Secondary color from constants

// Define types for our events
interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  color?: string;
  isAllDay?: boolean;
  alert?: string;
  showAs?: string;
}

interface EventsState {
  [date: string]: CalendarEvent[];
}

interface MarkedDatesState {
  [date: string]: {
    selected?: boolean;
    selectedColor?: string;
    marked?: boolean;
    dots?: Array<{ color: string }>;
  };
}

// Update the EVENT_COLORS with brown tones
const EVENT_COLORS = [
  burntCopper,
  "#5856D6",
  "#8B4513", // Another brown tone
  "#654321", // Darker brown
  "#6B4226", // Medium brown
  "#AF52DE",
];

// Array of all hours for day view
const HOURS = [
  "12",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "Noon",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12", // Add 12 AM for the next day
];

const getRandomColor = () =>
  EVENT_COLORS[Math.floor(Math.random() * EVENT_COLORS.length)];

type ViewMode = "day" | "month";

export default function CalendarScreen() {
  // Always use light mode
  const colorScheme = "light";
  const isDark = false;
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [events, setEvents] = useState<EventsState>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [selectedEventIndex, setSelectedEventIndex] = useState<number>(-1);
  const [markedDates, setMarkedDates] = useState<MarkedDatesState>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("day"); // Default to day view like in the screenshot

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    // Update marked dates to highlight the selected date
    setMarkedDates({
      [day.dateString]: {
        selected: true,
        selectedColor: "#FF3B30", // Always use light mode color
      },
    });

    // If in month view, switch to day view on day press
    if (viewMode === "month") {
      setViewMode("day");
    }

    // Scroll to 8 AM when selecting a day
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 8 * 60, animated: false });
      }
    }, 100);
  };

  const handleAddEvent = (eventData: {
    title: string;
    location: string;
    isAllDay: boolean;
    startDate: Date;
    endDate: Date;
    description?: string;
    alert?: string;
    showAs?: string;
    importance?: string;
  }) => {
    const newEvent: CalendarEvent = {
      title: eventData.title,
      start: eventData.startDate,
      end: eventData.endDate,
      location: eventData.location,
      description: eventData.description,
      color: getRandomColor(),
      isAllDay: eventData.isAllDay,
      alert: eventData.alert,
      showAs: eventData.showAs,
    };

    // Add new event to the events state
    setEvents((prevEvents) => ({
      ...prevEvents,
      [selectedDate]: [...(prevEvents[selectedDate] || []), newEvent],
    }));

    // Also mark the date with a dot
    setMarkedDates((prevMarkedDates) => ({
      ...prevMarkedDates,
      [selectedDate]: {
        ...prevMarkedDates[selectedDate],
        marked: true,
        dots: [{ color: "#FF3B30" }], // Always use light mode color
      },
    }));

    setModalVisible(false);
  };

  const handleEditEvent = (eventData: {
    title: string;
    location: string;
    isAllDay: boolean;
    startDate: Date;
    endDate: Date;
    description?: string;
    notification?: { label: string; value: number };
    showAs?: string;
    importance: string;
    color?: string;
  }) => {
    if (selectedEventIndex === -1 || !selectedEvent) return;

    const updatedEvent: CalendarEvent = {
      title: eventData.title,
      start: eventData.startDate,
      end: eventData.endDate,
      location: eventData.location,
      description: eventData.description,
      color: eventData.color || selectedEvent.color,
      isAllDay: eventData.isAllDay,
      alert: eventData.notification?.label,
      showAs: eventData.showAs,
    };

    // Update the event in the events state
    setEvents((prevEvents) => {
      const dateEvents = [...(prevEvents[selectedDate] || [])];
      dateEvents[selectedEventIndex] = updatedEvent;
      return {
        ...prevEvents,
        [selectedDate]: dateEvents,
      };
    });

    setEditModalVisible(false);
    setSelectedEvent(null);
    setSelectedEventIndex(-1);
  };

  const handleDeleteEvent = () => {
    if (selectedEventIndex === -1) return;

    // Remove the event from the events state
    setEvents((prevEvents) => {
      const dateEvents = [...(prevEvents[selectedDate] || [])];
      dateEvents.splice(selectedEventIndex, 1);

      // If there are no more events on this date, remove the date marker
      if (dateEvents.length === 0) {
        setMarkedDates((prevMarkedDates) => {
          const newMarkedDates = { ...prevMarkedDates };
          if (newMarkedDates[selectedDate]) {
            newMarkedDates[selectedDate] = {
              ...newMarkedDates[selectedDate],
              marked: false,
              dots: undefined,
            };
          }
          return newMarkedDates;
        });
      }

      return {
        ...prevEvents,
        [selectedDate]: dateEvents,
      };
    });

    setEditModalVisible(false);
    setSelectedEvent(null);
    setSelectedEventIndex(-1);
  };

  const handleEventPress = (event: CalendarEvent, index: number) => {
    setSelectedEvent(event);
    setSelectedEventIndex(index);
    setEditModalVisible(true);
  };

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatAMPM = (hour: number) => {
    if (hour === 24) return "AM"; // For the 12 AM of next day
    return hour < 12 ? "AM" : "PM";
  };

  // Position events on the time grid
  const positionEvent = (event: CalendarEvent) => {
    const startHour = event.start.getHours();
    const startMinute = event.start.getMinutes();
    const endHour = event.end.getHours();
    const endMinute = event.end.getMinutes();

    // Calculate position and height
    const startPosition = startHour * 60 + startMinute;
    const endPosition = endHour * 60 + endMinute;
    const duration = endPosition - startPosition;

    return {
      top: startPosition,
      height: Math.max(duration, 30), // Minimum height for visibility
    };
  };

  const currentMonth = new Date(selectedDate).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const selectedDayName = new Date(selectedDate).toLocaleString("default", {
    weekday: "long",
  });

  const selectedDayFormatted = new Date(selectedDate).toLocaleString(
    "default",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  const toggleViewMode = () => {
    setViewMode(viewMode === "day" ? "month" : "day");
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: Colors["light"].background },
      ]}
    >
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.headerButton}>
            <IconSymbol
              name="chevron.left"
              size={24}
              color={Colors["light"].tint}
            />
            <Text
              style={[styles.headerButtonText, { color: Colors["light"].tint }]}
            >
              {new Date().getMonth() === new Date(selectedDate).getMonth()
                ? "Today"
                : "Previous"}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.headerTitle, { color: Colors["light"].tint }]}>
          {currentMonth.split(" ")[0]} {/* Just show month name */}
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={toggleViewMode}
          >
            <IconSymbol
              name={viewMode === "day" ? "calendar" : "clock"}
              size={22}
              color={Colors["light"].tint}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <IconSymbol
              name="magnifyingglass"
              size={22}
              color={Colors["light"].tint}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setModalVisible(true)}
          >
            <IconSymbol name="plus" size={22} color={Colors["light"].tint} />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === "month" ? (
        // Month View
        <View style={styles.monthViewContainer}>
          <View style={styles.weekDays}>
            <Text style={[styles.weekDayText, { color: Colors["light"].text }]}>
              S
            </Text>
            <Text style={[styles.weekDayText, { color: Colors["light"].text }]}>
              M
            </Text>
            <Text style={[styles.weekDayText, { color: Colors["light"].text }]}>
              T
            </Text>
            <Text style={[styles.weekDayText, { color: Colors["light"].text }]}>
              W
            </Text>
            <Text style={[styles.weekDayText, { color: Colors["light"].text }]}>
              T
            </Text>
            <Text style={[styles.weekDayText, { color: Colors["light"].text }]}>
              F
            </Text>
            <Text style={[styles.weekDayText, { color: Colors["light"].text }]}>
              S
            </Text>
          </View>

          <Calendar
            theme={{
              calendarBackground: Colors["light"].background,
              textSectionTitleColor: Colors["light"].text,
              selectedDayBackgroundColor: Colors["light"].tint,
              todayTextColor: Colors["light"].tint,
              arrowColor: Colors["light"].tint,
              selectedDayTextColor: "#ffffff",
              dayTextColor: Colors["light"].text,
              textDisabledColor: Colors["light"].icon,
              monthTextColor: Colors["light"].text,
              "stylesheet.calendar.header": {
                header: {
                  height: 0,
                  opacity: 0, // Hide the default header
                },
              },
            }}
            onDayPress={onDayPress}
            markedDates={markedDates}
            enableSwipeMonths={true}
            hideExtraDays={false}
            hideArrows={true}
          />

          {/* Events list for the selected date in month view */}
          <View style={styles.monthViewEvents}>
            <Text
              style={[
                styles.monthViewEventsTitle,
                { color: Colors["light"].text },
              ]}
            >
              Events for {new Date(selectedDate).toLocaleDateString()}
            </Text>
            <ScrollView style={styles.monthViewEventsList}>
              {events[selectedDate]?.length > 0 ? (
                events[selectedDate].map((event, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.monthViewEventItem,
                      {
                        backgroundColor: event.color,
                      },
                    ]}
                    onPress={() => handleEventPress(event, index)}
                  >
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {event.title}
                    </Text>
                    <Text style={styles.eventTime} numberOfLines={1}>
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text
                  style={[styles.noEvents, { color: Colors["light"].icon }]}
                >
                  No events for this day
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      ) : (
        // Day View
        <>
          <View
            style={[
              styles.dayHeader,
              { borderColor: isDark ? `${burntCopper}80` : `${burntCopper}40` },
            ]}
          >
            <Text
              style={[styles.dayHeaderText, { color: Colors["light"].text }]}
            >
              {selectedDayName} — {selectedDayFormatted}
            </Text>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.timelineContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.timelineContent}>
              {/* Hour grid background - this will make all lines more visible */}
              <View style={styles.gridBackground}>
                {Array.from({ length: 24 }).map((_, index) => (
                  <View
                    key={`grid-${index}`}
                    style={[
                      styles.gridLine,
                      {
                        borderBottomColor: isDark
                          ? `${burntCopper}30`
                          : `${burntCopper}20`,
                      },
                    ]}
                  />
                ))}
              </View>

              {/* Current time indicator - visible red line */}
              {selectedDate === new Date().toISOString().split("T")[0] && (
                <View
                  style={[
                    styles.currentTimeIndicator,
                    {
                      top: new Date().getHours() * 60 + new Date().getMinutes(),
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.currentTimeDot,
                      { backgroundColor: Colors["light"].tint },
                    ]}
                  />
                  <View
                    style={[
                      styles.currentTimeLine,
                      { backgroundColor: Colors["light"].tint },
                    ]}
                  />
                </View>
              )}

              {/* Time slots */}
              {HOURS.map((hour, index) => (
                <View key={index} style={styles.hourRow}>
                  <View style={styles.hourLabelContainer}>
                    <Text
                      style={[
                        styles.hourLabel,
                        { color: Colors["light"].icon },
                      ]}
                    >
                      {hour}
                    </Text>
                    <Text
                      style={[styles.ampm, { color: Colors["light"].icon }]}
                    >
                      {hour !== "Noon" ? formatAMPM(index) : ""}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.hourSlot,
                      {
                        borderBottomColor: isDark
                          ? `${burntCopper}30`
                          : `${burntCopper}20`,
                      },
                    ]}
                  >
                    {/* Half-hour line */}
                    <View
                      style={[
                        styles.halfHourLine,
                        {
                          borderTopColor: isDark
                            ? `${burntCopper}20`
                            : `${burntCopper}15`,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}

              {/* Events */}
              {events[selectedDate]?.map((event, index) => {
                const { top, height } = positionEvent(event);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.eventItem,
                      {
                        top: top,
                        height: height,
                        backgroundColor: event.color,
                      },
                    ]}
                    onPress={() => handleEventPress(event, index)}
                  >
                    <Text style={styles.eventTitle} numberOfLines={1}>
                      {event.title}
                    </Text>
                    <Text style={styles.eventTime} numberOfLines={1}>
                      {formatTime(event.start)} - {formatTime(event.end)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </>
      )}

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabBarButton}>
          <Text style={[styles.tabBarText, { color: Colors["light"].tint }]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarButton}>
          <Text style={[styles.tabBarText, { color: Colors["light"].text }]}>
            Calendars
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarButton}>
          <Text style={[styles.tabBarText, { color: Colors["light"].text }]}>
            Inbox (0)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Event Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <AddEventModal
          onCancel={() => setModalVisible(false)}
          onAdd={handleAddEvent}
        />
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => {
          setEditModalVisible(false);
          setSelectedEvent(null);
          setSelectedEventIndex(-1);
        }}
      >
        {selectedEvent && (
          <EditEventModal
            event={{
              title: selectedEvent.title,
              location: selectedEvent.location || "",
              isAllDay: selectedEvent.isAllDay || false,
              startDate: selectedEvent.start,
              endDate: selectedEvent.end,
              description: selectedEvent.description,
              notification: selectedEvent.alert
                ? { label: selectedEvent.alert, value: 0 }
                : undefined,
              showAs: selectedEvent.showAs,
              color: selectedEvent.color,
            }}
            onCancel={() => {
              setEditModalVisible(false);
              setSelectedEvent(null);
              setSelectedEventIndex(-1);
            }}
            onSave={handleEditEvent}
            onDelete={handleDeleteEvent}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButtonText: {
    fontSize: 17,
    fontWeight: "400",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
  },
  headerIconButton: {
    padding: 5,
  },
  weekDays: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  weekDayText: {
    fontSize: 15,
    width: 40,
    textAlign: "center",
  },
  dayHeader: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  dayHeaderText: {
    fontSize: 16,
    fontWeight: "500",
  },
  timelineContainer: {
    flex: 1,
  },
  timelineContent: {
    position: "relative",
    paddingBottom: 20, // Add some padding at the bottom
  },
  gridBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  gridLine: {
    height: 60,
    borderBottomWidth: 0.5,
    width: "100%",
  },
  hourRow: {
    flexDirection: "row",
    height: 60,
    position: "relative",
    zIndex: 10,
  },
  hourLabelContainer: {
    width: 50,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 8,
  },
  hourLabel: {
    fontSize: 15,
    fontWeight: "400",
  },
  ampm: {
    fontSize: 11,
    marginTop: -2,
  },
  hourSlot: {
    flex: 1,
    borderBottomWidth: 0.5,
    minHeight: 1,
    position: "relative",
  },
  eventItem: {
    position: "absolute",
    left: 60,
    right: 10,
    borderRadius: 6,
    padding: 8,
    overflow: "hidden",
    zIndex: 50,
  },
  eventTitle: {
    color: "white",
    fontWeight: "500",
    fontSize: 14,
  },
  eventTime: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  tabBarButton: {
    paddingHorizontal: 16,
  },
  tabBarText: {
    fontSize: 16,
    fontWeight: "500",
  },
  monthViewContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  monthViewEvents: {
    flex: 1,
    padding: 16,
  },
  monthViewEventsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  monthViewEventsList: {
    flex: 1,
  },
  monthViewEventItem: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
  },
  noEvents: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "85%",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  timeLabel: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: "500",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#ff3b30",
  },
  submitButton: {
    backgroundColor: "#34c759",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  currentTimeIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 120,
    flexDirection: "row",
    alignItems: "center",
  },
  currentTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 46,
    marginRight: -4,
  },
  currentTimeLine: {
    flex: 1,
    height: 1,
    marginRight: 10,
  },
  halfHourLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 30,
    borderTopWidth: 0.5,
  },
});
