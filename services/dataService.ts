import AsyncStorage from '@react-native-async-storage/async-storage';
import { TodoItem } from '@/components/todo';

// Type for calendar events based on the AddEventModal/EditEventModal structure
export type CalendarEvent = {
  id: string;
  title: string;
  location: string;
  isAllDay: boolean;
  startDate: Date;
  endDate: Date;
  description?: string;
  notification?: {
    label: string;
    value: number; // minutes before event
  };
  showAs?: string;
  importance: 'low' | 'medium' | 'high' | 'urgent';
  color?: string;
};

/**
 * Retrieves todos and calendar events from AsyncStorage
 * and formats them as JSON for use with AI services
 */
export async function getTodoAndCalendarData() {
  // Get todos from AsyncStorage
  const todos = await getTodos();
  
  // Get calendar events from app storage
  const events = await getAppCalendarEvents();

  // Format them as a JSON structure
  const data = {
    todos: todos.map(todo => ({
      id: todo.id,
      text: todo.text,
      completed: todo.completed,
      startDate: todo.startDate ? todo.startDate.toISOString() : null,
      endDate: todo.endDate ? todo.endDate.toISOString() : null,
      description: todo.description || null
    })),
    calendarEvents: events.map(event => ({
      id: event.id,
      title: event.title,
      location: event.location,
      isAllDay: event.isAllDay,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      description: event.description || null,
      importance: event.importance,
      // Include other fields as needed
    })),
    userPreferences: {
      // Placeholder for user preferences that could be added later
      workHours: {
        startTime: "09:00",
        endTime: "17:00",
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      },
      bufferTimeMinutes: 15, // Default buffer time between events
    }
  };

  return data;
}

/**
 * Get todos from AsyncStorage
 */
async function getTodos(): Promise<TodoItem[]> {
  try {
    const todosJson = await AsyncStorage.getItem('todos');
    if (todosJson) {
      const todos = JSON.parse(todosJson);
      // Convert string dates back to Date objects
      return todos.map((todo: any) => ({
        ...todo,
        startDate: todo.startDate ? new Date(todo.startDate) : undefined,
        endDate: todo.endDate ? new Date(todo.endDate) : undefined
      }));
    }
    return [];
  } catch (error) {
    console.error("Error loading todos:", error);
    return [];
  }
}

/**
 * Get calendar events from the app's own storage (AsyncStorage)
 */
async function getAppCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const eventsJson = await AsyncStorage.getItem('calendarEvents');
    if (eventsJson) {
      const eventsObj = JSON.parse(eventsJson);
      const allEvents: CalendarEvent[] = [];
      
      // The calendar screen stores events by date in an object
      // We need to flatten this structure to get all events
      Object.keys(eventsObj).forEach(date => {
        if (Array.isArray(eventsObj[date])) {
          eventsObj[date].forEach((event: any) => {
            allEvents.push({
              id: event.id || Math.random().toString(36).substring(2, 11),
              title: event.title,
              location: event.location || '',
              isAllDay: event.isAllDay || false,
              startDate: new Date(event.start),
              endDate: new Date(event.end),
              description: event.description || '',
              importance: event.importance || 'medium',
              color: event.color
            });
          });
        }
      });
      
      return allEvents;
    }
    return [];
  } catch (error) {
    console.error("Error loading calendar events:", error);
    return [];
  }
} 