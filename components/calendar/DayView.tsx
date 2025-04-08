import React, { useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { EventBlock } from "./EventBlock";
import { Event } from "./AddEventModal";

interface DayViewProps {
  date: Date;
  dayEvents: Event[];
}

interface DayViewStyles {
  container: ViewStyle;
  scrollViewContent: ViewStyle;
  hourContainer: ViewStyle;
  hourText: TextStyle;
  line: ViewStyle;
}

const HOUR_HEIGHT = 60;
const MINUTES_IN_HOUR = 60;

const calculateEventPosition = (event: Event) => {
  const startHour = event.startTime.getHours();
  const startMinute = event.startTime.getMinutes();
  const endHour = event.endTime.getHours();
  const endMinute = event.endTime.getMinutes();

  const top = (startHour + startMinute / MINUTES_IN_HOUR) * HOUR_HEIGHT;
  const durationMinutes =
    endHour * MINUTES_IN_HOUR +
    endMinute -
    (startHour * MINUTES_IN_HOUR + startMinute);
  const height = (durationMinutes / MINUTES_IN_HOUR) * HOUR_HEIGHT;

  const minHeight = 20;
  const calculatedHeight = Math.max(height, minHeight);

  return { top, height: calculatedHeight };
};

export const DayView: React.FC<DayViewProps> = ({ date, dayEvents }) => {
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = colorScheme === "dark" ? Colors.dark : Colors.light;

  const handleEventPress = (event: Event) => {
    console.log("Event pressed:", event.id, event.title);
  };

  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 === 0 ? 12 : i % 12;
    const ampm = i < 12 || i === 24 ? "AM" : "PM";
    if (i === 0) return "12 AM";
    if (i === 12) return "12 PM";
    return `${hour} ${ampm}`;
  });

  const styles = StyleSheet.create<DayViewStyles>({
    container: {
      flex: 1,
      flexDirection: "row",
    },
    scrollViewContent: {
      paddingTop: 10,
      paddingBottom: 10,
      position: "relative",
      minHeight: 24 * HOUR_HEIGHT + 20,
    },
    hourContainer: {
      height: HOUR_HEIGHT,
      flexDirection: "row",
      alignItems: "flex-start",
    },
    hourText: {
      fontSize: 12,
      color: themeColors.icon,
      width: 50,
      textAlign: "right",
      marginRight: 10,
      position: "relative",
      top: -6,
    },
    line: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: themeColors.border,
    },
  });

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {hours.map((hourLabel, index) => (
          <View key={index} style={styles.hourContainer}>
            <Text style={styles.hourText}>{hourLabel}</Text>
            <View style={styles.line} />
          </View>
        ))}
        <View style={[styles.hourContainer, { height: 0 }]}>
          <Text style={[styles.hourText, { opacity: 0 }]}></Text>
          <View style={styles.line} />
        </View>

        <View style={StyleSheet.absoluteFill}>
          {dayEvents.map((event) => {
            const { top, height } = calculateEventPosition(event);
            return (
              <EventBlock
                key={event.id}
                event={event}
                onPress={handleEventPress}
                style={{
                  position: "absolute",
                  top:
                    top +
                    (typeof styles.scrollViewContent.paddingTop === "number"
                      ? styles.scrollViewContent.paddingTop
                      : 0),
                  height: height,
                  left: 60,
                  right: 10,
                }}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};
