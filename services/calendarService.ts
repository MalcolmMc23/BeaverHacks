import { CalendarEvent } from "@/components/calendar/DayView";

// This will hold a reference to the createQuickEvent function from the calendar component
let createEventFunction: ((options: {
  title: string;
  start: Date | string;
  end: Date | string;
  location?: string;
  description?: string;
  color?: string;
  isAllDay?: boolean;
  alert?: string;
  showAs?: string;
}) => CalendarEvent | null) | null = null;

/**
 * Register the calendar's createQuickEvent function
 * This should be called from the Calendar component
 */
export function registerCreateEventFunction(fn: typeof createEventFunction) {
  createEventFunction = fn;
}

/**
 * Create a calendar event using the registered function
 * Returns null if the function hasn't been registered yet
 */
export function createCalendarEvent(options: {
  title: string;
  start: Date | string;
  end: Date | string;
  location?: string;
  description?: string;
  color?: string;
  isAllDay?: boolean;
  alert?: string;
  showAs?: string;
}): CalendarEvent | null {
  if (!createEventFunction) {
    console.warn("Calendar event creation function not registered yet");
    return null;
  }
  return createEventFunction(options);
} 