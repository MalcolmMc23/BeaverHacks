import {
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  ViewStyle,
  TextStyle,
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
import * as Haptics from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import DayView, { CalendarEvent } from "@/components/calendar/DayView";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import CurrentTimeIndicator from "@/components/calendar/CurrentTimeIndicator";

// Move these constants to top level
const burntCopper = "#A0430A"; // Primary accent color from constants
const seaMist = "#DFE8E6"; // Secondary color from constants

// Define types for our events using the imported CalendarEvent
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

const getRandomColor = () =>
  EVENT_COLORS[Math.floor(Math.random() * EVENT_COLORS.length)];

type ViewMode = "day" | "month";

interface Styles {
  container: ViewStyle;
  header: ViewStyle;
  headerLeft: ViewStyle;
  headerButton: ViewStyle;
  headerButtonText: TextStyle;
  headerTitle: TextStyle;
  headerRight: ViewStyle;
  headerIconButton: ViewStyle;
  monthViewContainer: ViewStyle;
  weekDays: ViewStyle;
  weekDayText: TextStyle;
  monthViewEvents: ViewStyle;
  monthViewEventsList: ViewStyle;
  monthViewEventItem: ViewStyle;
  monthViewEventsTitle: TextStyle;
  eventTitle: TextStyle;
  eventTime: TextStyle;
  noEvents: TextStyle;
  tabBar: ViewStyle;
  tabBarButton: ViewStyle;
  tabBarText: TextStyle;
  modalContainer: ViewStyle;
  modalContent: ViewStyle;
  modalTitle: TextStyle;
  input: TextStyle;
  timeLabel: TextStyle;
  modalButtons: ViewStyle;
  button: ViewStyle;
  cancelButton: ViewStyle;
  submitButton: ViewStyle;
  buttonText: TextStyle;
}

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
  const [initialEventData, setInitialEventData] = useState<any>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [previewEvent, setPreviewEvent] = useState<{
    visible: boolean;
    top: number;
    duration: number;
    color: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragEvent, setDragEvent] = useState<{
    visible: boolean;
    startY: number;
    color: string;
  }>({
    visible: false,
    startY: 0,
    color: getRandomColor(),
  });
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const LONG_PRESS_DURATION = 1200; // 1.2 seconds to trigger event creation modal

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
      color: dragEvent.visible ? dragEvent.color : getRandomColor(),
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

    // Reset any drag event state if it exists
    if (dragEvent.visible) {
      setDragEvent({
        visible: false,
        startY: 0,
        color: getRandomColor(),
      });
      setIsDragging(false);
    }

    setModalVisible(false);
    setInitialEventData(null);
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

  // Get time from Y position in the timeline
  const getTimeFromPosition = (yPosition: number) => {
    // Calculate hour and minute from y position
    const hour = Math.floor(yPosition / 60);
    const minute = Math.round((yPosition % 60) / 15) * 15; // Round to nearest 15 min

    // Create date object at the selected date with the calculated time
    const date = new Date(selectedDate);
    date.setHours(hour);
    date.setMinutes(minute);

    return date;
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

  // Handle navigation to today or previous month
  const handleNavigatePress = () => {
    const today = new Date().toISOString().split("T")[0];

    if (new Date().getMonth() === new Date(selectedDate).getMonth()) {
      // If already in current month, select today's date
      setSelectedDate(today);

      // Always make sure we're in day view to see the time indicator
      if (viewMode === "month") {
        setViewMode("day");
      }

      // Force reload by setting events state
      const currentEvents = events[today] || [];
      setEvents({ ...events, [today]: [...currentEvents] });

      // Mark the date
      setMarkedDates({
        [today]: {
          selected: true,
          selectedColor: "#FF3B30",
        },
      });

      // Scroll to current time if today is selected
      setTimeout(() => {
        if (scrollViewRef.current) {
          const currentHour = new Date().getHours();
          // Scroll to 1 hour before current time for better context
          const scrollPosition = Math.max(0, (currentHour - 1) * 60);
          scrollViewRef.current.scrollTo({
            y: scrollPosition,
            animated: false,
          });
        }
      }, 200); // Give a bit more time
    } else {
      // Otherwise navigate to previous month
      const prevMonth = new Date(selectedDate);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      const prevMonthStr = prevMonth.toISOString().split("T")[0];
      setSelectedDate(prevMonthStr);
      setMarkedDates({
        [prevMonthStr]: {
          selected: true,
          selectedColor: "#FF3B30",
        },
      });
    }
  };

  // Handle scroll events to track scroll position
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollOffset(event.nativeEvent.contentOffset.y);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) < 5 && Math.abs(dy) < 5;
      },
      onPanResponderGrant: (event: GestureResponderEvent) => {
        const { locationY } = event.nativeEvent;
        const yPosition = locationY + scrollOffset;

        const timer = setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

          setDragEvent({
            visible: true,
            startY: yPosition,
            color: getRandomColor(),
          });

          setIsDragging(true);

          const modalTimer = setTimeout(() => {
            const startTime = getTimeFromPosition(dragEvent.startY);

            const endTime = new Date(startTime);
            endTime.setHours(endTime.getHours() + 1);

            setInitialEventData({
              startDate: startTime,
              endDate: endTime,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            setModalVisible(true);

            setLongPressTimer(null);
          }, LONG_PRESS_DURATION);

          setLongPressTimer(modalTimer);
        }, 200);

        setLongPressTimer(timer);
      },
      onPanResponderMove: (event: GestureResponderEvent, gestureState) => {
        if (!dragEvent.visible) return;

        // If significant vertical movement is detected and a drag hasn't been initiated,
        // this is likely a scroll attempt - terminate the pending event creation
        if (Math.abs(gestureState.dy) > 15 && !isDragging) {
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
          }
          return;
        }

        // Update event position as user drags
        const { locationY } = event.nativeEvent;
        const yPosition = locationY + scrollOffset;

        // Snap to 5-minute increments
        const snappedY = Math.round(yPosition / 5) * 5;

        setDragEvent((prev) => ({
          ...prev,
          startY: snappedY,
        }));
      },
      onPanResponderRelease: () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          setLongPressTimer(null);
        }

        if (!modalVisible) {
          setDragEvent({
            visible: false,
            startY: 0,
            color: getRandomColor(),
          });
          setIsDragging(false);
        }
      },
      onPanResponderTerminate: () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          setLongPressTimer(null);
        }

        setDragEvent({
          visible: false,
          startY: 0,
          color: getRandomColor(),
        });
        setIsDragging(false);
      },
    })
  ).current;

  const handleTimeSlotPress = (hour: number, minutes: number = 0) => {
    const startDate = new Date(selectedDate);
    startDate.setHours(hour, minutes, 0);

    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1); // Default 1-hour duration

    const initialData = {
      title: "No title",
      location: "",
      isAllDay: false,
      startDate,
      endDate,
      description: "",
      alert: "None",
      showAs: "Busy",
    };

    setInitialEventData(initialData);
    setModalVisible(true);
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme].background },
      ]}
    >
      <StatusBar style="dark" />

      <CalendarHeader
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        viewMode={viewMode}
        colorScheme={colorScheme}
        onToggleViewMode={toggleViewMode}
        onAddEventPress={() => setModalVisible(true)}
        onNavigatePress={handleNavigatePress}
      />

      {viewMode === "month" ? (
        // Month View
        <View style={styles.monthViewContainer}>
          <View style={styles.weekDays}>
            <Text
              style={[styles.weekDayText, { color: Colors[colorScheme].text }]}
            >
              S
            </Text>
            <Text
              style={[styles.weekDayText, { color: Colors[colorScheme].text }]}
            >
              M
            </Text>
            <Text
              style={[styles.weekDayText, { color: Colors[colorScheme].text }]}
            >
              T
            </Text>
            <Text
              style={[styles.weekDayText, { color: Colors[colorScheme].text }]}
            >
              W
            </Text>
            <Text
              style={[styles.weekDayText, { color: Colors[colorScheme].text }]}
            >
              T
            </Text>
            <Text
              style={[styles.weekDayText, { color: Colors[colorScheme].text }]}
            >
              F
            </Text>
            <Text
              style={[styles.weekDayText, { color: Colors[colorScheme].text }]}
            >
              S
            </Text>
          </View>

          <Calendar
            theme={{
              calendarBackground: Colors[colorScheme].background,
              textSectionTitleColor: Colors[colorScheme].text,
              selectedDayBackgroundColor: Colors[colorScheme].tint,
              todayTextColor: Colors[colorScheme].tint,
              arrowColor: Colors[colorScheme].tint,
              selectedDayTextColor: "#ffffff",
              dayTextColor: Colors[colorScheme].text,
              textDisabledColor: Colors[colorScheme].icon,
              monthTextColor: Colors[colorScheme].text,
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
                { color: Colors[colorScheme].text },
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
                  style={[styles.noEvents, { color: Colors[colorScheme].icon }]}
                >
                  No events for this day
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      ) : (
        // Day View
        <View style={{ flex: 1, position: "relative" }}>
          <DayView
            selectedDate={selectedDate}
            events={events[selectedDate] || []}
            colorScheme={colorScheme}
            isDark={isDark}
            onEventPress={handleEventPress}
            onTimeSlotPress={handleTimeSlotPress}
            onInitiateEventCreation={(data) => {
              setInitialEventData(data);
              setModalVisible(true);
            }}
          />
          {/* Add current time indicator */}
          <CurrentTimeIndicator
            colorScheme={colorScheme}
            isToday={selectedDate === new Date().toISOString().split("T")[0]}
          />
        </View>
      )}

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabBarButton}>
          <Text
            style={[styles.tabBarText, { color: Colors[colorScheme].tint }]}
          >
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarButton}>
          <Text
            style={[styles.tabBarText, { color: Colors[colorScheme].text }]}
          >
            Calendars
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBarButton}>
          <Text
            style={[styles.tabBarText, { color: Colors[colorScheme].text }]}
          >
            Inbox (0)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Event Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setInitialEventData(null);
        }}
      >
        <AddEventModal
          onCancel={() => {
            setModalVisible(false);
            setInitialEventData(null);
          }}
          onAdd={handleAddEvent}
          initialData={initialEventData}
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

const styles = StyleSheet.create<Styles>({
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
  timeSlot: {
    height: 60,
    width: "100%",
  },
  timeSlotContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  timeText: {
    width: 80,
    fontSize: 14,
    color: "#666",
  },
  timeSlotDivider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
    marginLeft: 8,
  },
  timeSlotsContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
