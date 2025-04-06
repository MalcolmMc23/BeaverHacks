import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text } from "react-native";

interface CurrentTimeIndicatorProps {
  colorScheme: "light" | "dark";
  isToday: boolean;
}

const CurrentTimeIndicator: React.FC<CurrentTimeIndicatorProps> = ({
  colorScheme,
  isToday,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    if (!isToday) return; // Don't bother with interval if not today

    // Set initial time
    setCurrentTime(new Date());

    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [isToday]);

  // If not today's view, don't render
  if (!isToday) return null;

  // Calculate position based on current time
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const timePosition = hours * 60 + minutes;

  // Format time for display
  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={[styles.container, { top: timePosition }]}>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formattedTime}</Text>
      </View>
      <View style={[styles.line, { backgroundColor: "#FF3B30" }]} />
      <View style={[styles.dot, { backgroundColor: "#FF3B30" }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 20,
    zIndex: 1000,
    flexDirection: "row",
    alignItems: "center",
    marginTop: -10, // Center the line on the current time
  },
  timeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    marginLeft: 8,
    marginRight: 4,
  },
  timeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: "#FF3B30",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    marginRight: 8,
    marginLeft: 4,
  },
});

export default CurrentTimeIndicator;
