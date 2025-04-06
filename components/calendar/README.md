# Calendar Components

This directory contains reusable calendar-related components.

## Components

### DayView

A day-view calendar component that displays a vertical timeline of events for a specific day.

#### Props

- `selectedDate` (string): The date to display in ISO format (YYYY-MM-DD)
- `events` (CalendarEvent[]): Array of events to display for the selected date
- `colorScheme` ("light" | "dark"): The color scheme to use
- `isDark` (boolean, optional): Whether to use dark mode styles (defaults to false)
- `onEventPress` (function): Callback when an event is pressed, receives event and index
- `onTimeSlotPress` (function): Callback when a time slot is pressed, receives hour and optional minutes
- `onInitiateEventCreation` (function, optional): Callback when event creation is initiated via long press, receives an object with startDate, endDate, and color

#### Features

- Displays hourly time slots from 12 AM to 11 PM
- Shows events in their appropriate time slots
- Displays a current time indicator for the current day
- Supports long-press and drag gesture to create new events
- Responsive to light/dark mode

#### Usage

```tsx
import DayView, { CalendarEvent } from "@/components/calendar/DayView";

// Example usage
<DayView
  selectedDate="2023-05-15"
  events={eventsForSelectedDate}
  colorScheme="light"
  isDark={false}
  onEventPress={(event, index) => {
    // Handle event press
  }}
  onTimeSlotPress={(hour, minutes) => {
    // Handle time slot press
  }}
  onInitiateEventCreation={(data) => {
    // Handle event creation initiated by long press
    // data contains startDate, endDate, and color
  }}
/>;
```
