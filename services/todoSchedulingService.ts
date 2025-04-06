import AsyncStorage from '@react-native-async-storage/async-storage';
import { TodoItem } from '@/components/todo';
import { findOptimalTimeForTodo } from './aiService';

type CalendarEvent = {
  title: string;
  location: string;
  isAllDay: boolean;
  startDate: Date;
  endDate: Date;
  description?: string;
  alert?: string;
  showAs?: string;
  importance?: string;
};

/**
 * Creates a calendar event from a todo item with the given time slot
 */
export async function scheduleTodoAsCalendarEvent(
  todo: TodoItem,
  startTime: string,
  endTime: string
): Promise<boolean> {
  try {
    // Get current date/time
    const startDate = new Date(startTime);
    const now = new Date();
    
    // Create today boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    // Validate that the start time is today
    if (startDate < today || startDate > endOfToday) {
      console.error(`[TodoScheduler] ❌ Rejected non-today date scheduling: "${todo.text}" at ${startDate.toLocaleString()}`);
      return false;
    }
    
    // Validate that the start time hasn't already passed
    if (startDate < now) {
      console.error(`[TodoScheduler] ❌ Rejected past time scheduling for today: "${todo.text}" at ${startDate.toLocaleString()}`);
      return false;
    }
    
    // Create the event object - use exactly the same format as in calendar.tsx handleAddEvent
    const newEvent = {
      id: Math.random().toString(36).substring(2, 11),
      title: todo.text,
      location: '',
      isAllDay: false,
      start: new Date(startTime),  // changed from startDate to start
      end: new Date(endTime),      // changed from endDate to end
      description: todo.description || '',
      alert: 'None',
      showAs: 'Busy',
      color: getRandomColor(),
    };

    // Get selected date in YYYY-MM-DD format for the events object key
    const eventDate = new Date(startTime).toISOString().split('T')[0];

    // Get existing calendar events
    const eventsJson = await AsyncStorage.getItem('calendarEvents');
    let eventsObj = eventsJson ? JSON.parse(eventsJson) : {};

    // Add the new event
    if (!eventsObj[eventDate]) {
      eventsObj[eventDate] = [];
    }
    
    // Add the event directly without transformation
    eventsObj[eventDate].push(newEvent);

    // Save updated events
    await AsyncStorage.setItem('calendarEvents', JSON.stringify(eventsObj));

    // Enhanced logging with emoji and more details
    console.log(`[TodoScheduler] ✅ Scheduled todo: "${todo.text}"`);
    console.log(`[TodoScheduler] 📆 Time slot: ${formatDate(new Date(startTime))} to ${formatDate(new Date(endTime))}`);
    console.log(`[TodoScheduler] 📝 Description: ${todo.description || "No description"}`);
    
    return true;
  } catch (error) {
    console.error('[TodoScheduler] ❌ Error scheduling todo as calendar event:', error);
    return false;
  }
}

/**
 * Format date for display in logs
 */
function formatDate(date: Date): string {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get a random color for the event (copied from calendar.tsx)
 */
function getRandomColor(): string {
  const colors = [
    "#A0430A", // burntCopper
    "#5856D6",
    "#8B4513", // Another brown tone
    "#654321", // Darker brown
    "#6B4226", // Medium brown
    "#AF52DE",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Batch process multiple todos and schedule them all as calendar events.
 * This function will find optimal times for each todo and schedule them.
 * 
 * @param todos List of todos to schedule
 * @returns An object containing results of the batch operation
 */
export async function batchScheduleTodos(todos: TodoItem[]): Promise<{
  total: number;
  scheduled: number;
  failed: number;
  scheduledTodos: { todo: TodoItem; startTime: string; endTime: string }[];
}> {
  // Filter out completed todos
  const incompleteTodos = todos.filter(todo => !todo.completed);
  
  const results = {
    total: incompleteTodos.length,
    scheduled: 0,
    failed: 0,
    scheduledTodos: [] as { todo: TodoItem; startTime: string; endTime: string }[],
  };

  console.log(`[TodoScheduler] 🚀 Starting batch scheduling for ${incompleteTodos.length} todos...`);

  for (const todo of incompleteTodos) {
    try {
      // Find optimal time using AI
      console.log(`[TodoScheduler] 🔍 Finding optimal time for "${todo.text}"...`);
      const result = await findOptimalTimeForTodo(todo);
      
      if (result.success && result.suggestedStartTime && result.suggestedEndTime) {
        // Schedule the todo
        const scheduled = await scheduleTodoAsCalendarEvent(
          todo,
          result.suggestedStartTime,
          result.suggestedEndTime
        );
        
        if (scheduled) {
          results.scheduled++;
          results.scheduledTodos.push({
            todo,
            startTime: result.suggestedStartTime,
            endTime: result.suggestedEndTime,
          });
          
          console.log(`[TodoScheduler] ✅ Successfully scheduled "${todo.text}" from ${new Date(result.suggestedStartTime).toLocaleString()} to ${new Date(result.suggestedEndTime).toLocaleString()}`);
          
          // Update todo with the scheduled times
          await updateTodoWithScheduledTime(
            todo, 
            result.suggestedStartTime, 
            result.suggestedEndTime
          );
        } else {
          results.failed++;
          console.error(`[TodoScheduler] ❌ Failed to schedule todo: "${todo.text}"`);
        }
      } else {
        results.failed++;
        console.error(`[TodoScheduler] ❌ No suitable time found for todo: "${todo.text}". Reason: ${result.error || "Unknown"}`);
      }
    } catch (error) {
      results.failed++;
      console.error(`[TodoScheduler] ❌ Error scheduling todo "${todo.text}":`, error);
    }
  }

  // Log summary with emojis
  console.log(`[TodoScheduler] 📊 Batch scheduling completed:`);
  console.log(`  📋 Total todos: ${results.total}`);
  console.log(`  ✅ Scheduled todos: ${results.scheduled}`);
  console.log(`  ❌ Failed todos: ${results.failed}`);

  return results;
}

/**
 * Update a todo item with scheduled start and end times
 */
async function updateTodoWithScheduledTime(
  todo: TodoItem,
  startTime: string,
  endTime: string
): Promise<boolean> {
  try {
    // Get all todos
    const todosJson = await AsyncStorage.getItem('todos');
    if (!todosJson) return false;
    
    const todos = JSON.parse(todosJson);
    
    // Find and update the todo
    const index = todos.findIndex((t: TodoItem) => t.id === todo.id);
    if (index === -1) return false;
    
    todos[index] = {
      ...todos[index],
      startDate: new Date(startTime),
      endDate: new Date(endTime),
    };
    
    // Save updated todos
    await AsyncStorage.setItem('todos', JSON.stringify(todos));
    console.log(`[TodoScheduler] 🔄 Updated todo "${todo.text}" with scheduled times`);
    return true;
  } catch (error) {
    console.error('[TodoScheduler] ❌ Error updating todo with scheduled time:', error);
    return false;
  }
}
