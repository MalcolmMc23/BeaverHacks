import { CalendarEvent } from '@/services/dataService';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Exports all calendar events and analyzes patterns for AI scheduling optimization
 * This saves the analysis to AsyncStorage for use by the AI
 */
export async function exportCalendarEvents() {
  try {
    console.log('Starting calendar event analysis...');
    
    // Get all calendar events
    const events = await getAppCalendarEvents();
    console.log(`Found ${events.length} calendar events.`);
    
    // Format events for easier AI analysis
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      location: event.location,
      isAllDay: event.isAllDay,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      description: event.description || '',
      importance: event.importance,
      dayOfWeek: event.startDate.toLocaleDateString('en-US', { weekday: 'long' }),
      // Calculate duration in minutes
      durationMinutes: Math.round((event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60)),
    }));
    
    // Add weekly pattern analysis to help AI identify routine events
    // Group events by day of week and time
    const weekdayPatterns = analyzeWeekdayPatterns(events);
    
    // Create the output structure
    const output = {
      events: formattedEvents,
      metadata: {
        totalEvents: events.length,
        exportTimestamp: new Date().toISOString(),
        weekdayPatterns,
      },
      scheduling: {
        workHours: {
          startTime: "09:00",
          endTime: "17:00",
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        },
        bufferTimeMinutes: 15,
        preferredMeetingDurations: [30, 60], // Default preferred meeting durations in minutes
      }
    };
    
    // Save to AsyncStorage
    await AsyncStorage.setItem('calendar-analysis-data', JSON.stringify(output));
    
    console.log('Calendar events analyzed and saved to AsyncStorage');
    return output;
  } catch (error) {
    console.error('Error analyzing calendar events:', error);
    throw error;
  }
}

/**
 * Get calendar events from the app's own storage (AsyncStorage)
 * This is copied from dataService.ts because the function is not exported
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

/**
 * Analyze calendar events to find weekly patterns
 */
function analyzeWeekdayPatterns(events: CalendarEvent[]) {
  // Count events by day of week
  const dayCount: Record<string, number> = {
    'Monday': 0,
    'Tuesday': 0,
    'Wednesday': 0,
    'Thursday': 0,
    'Friday': 0,
    'Saturday': 0,
    'Sunday': 0,
  };
  
  // Track busy time blocks by day and hour
  const dayHourMap: Record<string, Record<number, number>> = {
    'Monday': {},
    'Tuesday': {},
    'Wednesday': {},
    'Thursday': {},
    'Friday': {},
    'Saturday': {},
    'Sunday': {},
  };
  
  // Analyze each event
  events.forEach(event => {
    const day = event.startDate.toLocaleDateString('en-US', { weekday: 'long' });
    dayCount[day]++;
    
    // Track which hours of the day are busy
    const startHour = event.startDate.getHours();
    const endHour = event.endDate.getHours() + (event.endDate.getMinutes() > 0 ? 1 : 0);
    
    for (let hour = startHour; hour < endHour; hour++) {
      if (!dayHourMap[day][hour]) {
        dayHourMap[day][hour] = 0;
      }
      dayHourMap[day][hour]++;
    }
  });
  
  // Find the busiest and quietest days
  const days = Object.keys(dayCount);
  const busiestDay = days.reduce((a, b) => dayCount[a] > dayCount[b] ? a : b);
  const quietestDay = days.reduce((a, b) => dayCount[a] < dayCount[b] ? a : b);
  
  // Calculate busy hours for each day
  const busyHoursByDay: Record<string, number[]> = {};
  Object.keys(dayHourMap).forEach(day => {
    busyHoursByDay[day] = Object.keys(dayHourMap[day])
      .map(hour => parseInt(hour))
      .filter(hour => dayHourMap[day][hour] > 0)
      .sort((a, b) => a - b);
  });
  
  return {
    eventCountByDay: dayCount,
    busiestDay,
    quietestDay,
    busyHoursByDay,
  };
}

// Auto-run if this script is executed directly
if (require.main === module) {
  exportCalendarEvents()
    .then((output) => {
      console.log('Script completed. Events saved to AsyncStorage');
      process.exit(0);
    })
    .catch(error => {
      console.error('Script execution failed:', error);
      process.exit(1);
    });
} 