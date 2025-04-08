import { Groq } from 'groq-sdk';
import { getTodoAndCalendarData } from './dataService';
import { TodoItem } from '@/components/todo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createCalendarEvent } from './calendarService';

// IMPORTANT: In production, use environment variables or a secure storage system
// DO NOT hardcode your API key like this
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

// Initialize the Groq client
const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

type OptimalTimeResult = {
  success: boolean;
  suggestedStartTime: string | null;
  suggestedEndTime: string | null;
  reasoning: string | null;
  error?: string;
};

/**
 * Try to load the calendar events data from AsyncStorage
 * Returns null if the data doesn't exist or can't be parsed
 */
async function loadCalendarAnalysisData() {
  try {
    const analysisData = await AsyncStorage.getItem('calendar-analysis-data');
    if (analysisData) {
      return JSON.parse(analysisData);
    }
  } catch (error) {
    console.error('Error loading calendar analysis data:', error);
  }
  return null;
}

/**
 * Finds the optimal time to schedule a todo task based on current calendar and preferences
 * 
 * @param todo The todo item to schedule
 * @returns Promise with the optimal time result
 */
export async function findOptimalTimeForTodo(todo: TodoItem): Promise<OptimalTimeResult> {
  try {
    if (!GROQ_API_KEY) {
      return {
        success: false, 
        suggestedStartTime: null,
        suggestedEndTime: null,
        reasoning: null,
        error: 'GROQ_API_KEY is not configured. Please set your API key in environment variables.'
      };
    }

    // First try to load calendar analysis data from AsyncStorage
    const calendarAnalysis = await loadCalendarAnalysisData();
    
    // If the analysis exists, use it. Otherwise, get data from AsyncStorage
    const data = await getTodoAndCalendarData();
    
    // Estimate task duration (if not specified, default to 30 minutes)
    const estimatedDuration = 30; // minutes
    
    // Get today's date at the start of the day for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the end of today for comparison
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    // Format a prompt for the AI
    const prompt = `
      I need to find the optimal time to schedule this task in my calendar:
      
      TASK: ${JSON.stringify({
        title: todo.text,
        completed: todo.completed,
        description: todo.description || 'No description provided',
        estimatedDuration: estimatedDuration
      })}
      
      ${calendarAnalysis ? `
      Here is detailed information about my calendar patterns:
      - Busiest day: ${calendarAnalysis.metadata.weekdayPatterns.busiestDay}
      - Quietest day: ${calendarAnalysis.metadata.weekdayPatterns.quietestDay}
      - Event counts by day: ${JSON.stringify(calendarAnalysis.metadata.weekdayPatterns.eventCountByDay)}
      - Busy hours by day: ${JSON.stringify(calendarAnalysis.metadata.weekdayPatterns.busyHoursByDay)}
      
      My scheduling preferences:
      - Working hours: ${calendarAnalysis.scheduling.workHours.startTime} to ${calendarAnalysis.scheduling.workHours.endTime} on ${calendarAnalysis.scheduling.workHours.days.join(', ')}
      - Buffer time between meetings: ${calendarAnalysis.scheduling.bufferTimeMinutes} minutes
      - Preferred meeting durations: ${calendarAnalysis.scheduling.preferredMeetingDurations.join(', ')} minutes
      ` : `
      Here are my existing calendar events (busy times):
      ${JSON.stringify(data.calendarEvents)}
      
      And here are my preferences:
      ${JSON.stringify(data.userPreferences)}
      `}
      
      IMPORTANT: Please suggest a time ONLY for today's date (${today.toISOString().split('T')[0]}). Do not suggest any time on other days, only today.
      
      Please suggest the optimal time to schedule this task TODAY.
      
      Provide your response in this JSON format:
      {
        "suggestedStartTime": "YYYY-MM-DDTHH:MM:SSZ", // ISO 8601 format
        "suggestedEndTime": "YYYY-MM-DDTHH:MM:SSZ",   // ISO 8601 format
        "reasoning": "Brief explanation of why this time is optimal"
      }
      
      If no suitable time is found for today, set suggestedStartTime and suggestedEndTime to null and provide a detailed explanation in the reasoning field about why scheduling is not possible. Include specific details like:
      - Is the calendar too full?
      - Are there conflicts with existing events?
      - Is it too late in the day?
      - Any other relevant factors
      
      Example when no time is available:
      {
        "suggestedStartTime": null,
        "suggestedEndTime": null,
        "reasoning": "I couldn't find a suitable time today because your calendar shows back-to-back meetings until 5 PM, and you prefer not to schedule tasks after your working hours (9 AM - 5 PM)."
      }
    `;

    // Call the Groq API using the native SDK
    const completion = await groq.chat.completions.create({
      model: 'llama3-70b-8192', // Use Llama 3 70B model
      messages: [
        {
          role: 'system',
          content: 'You are an intelligent scheduling assistant that analyzes calendar data and suggests optimal times for tasks.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1, // Low temperature for more deterministic responses
    });

    // Get the response content
    const responseContent = completion.choices[0]?.message?.content || '';
    
    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
      
      // Validate that the suggested time is today
      if (parsedResponse.suggestedStartTime) {
        const suggestedDate = new Date(parsedResponse.suggestedStartTime);
        const now = new Date();
        
        // Check if the suggested date is today
        if (suggestedDate < today || suggestedDate > endOfToday) {
          console.warn(`[AI Service] Rejected non-today date suggestion: ${parsedResponse.suggestedStartTime}`);
          return {
            success: false,
            suggestedStartTime: null,
            suggestedEndTime: null,
            reasoning: parsedResponse.reasoning,
            error: 'AI suggested a date not on today. Please try again.'
          };
        }
        
        // Check if the suggested time is in the past (earlier today)
        if (suggestedDate < now) {
          console.warn(`[AI Service] Rejected past time suggestion for today: ${parsedResponse.suggestedStartTime}`);
          return {
            success: false,
            suggestedStartTime: null,
            suggestedEndTime: null,
            reasoning: parsedResponse.reasoning,
            error: 'AI suggested a time that has already passed today. Please try again.'
          };
        }
      }
      
      // If the AI couldn't find a suitable time (null start/end time)
      if (!parsedResponse.suggestedStartTime || !parsedResponse.suggestedEndTime) {
        return {
          success: false,
          suggestedStartTime: null,
          suggestedEndTime: null,
          reasoning: parsedResponse.reasoning,
          error: 'No suitable time found for today.'
        };
      }
      
      return {
        success: true,
        suggestedStartTime: parsedResponse.suggestedStartTime,
        suggestedEndTime: parsedResponse.suggestedEndTime,
        reasoning: parsedResponse.reasoning
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return {
        success: false,
        suggestedStartTime: null,
        suggestedEndTime: null,
        reasoning: null,
        error: 'Failed to parse AI response'
      };
    }
  } catch (error: any) {
    console.error('Error calling Groq API:', error);
    return {
      success: false,
      suggestedStartTime: null,
      suggestedEndTime: null,
      reasoning: null,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Example usage in a component:
 * 
 * import { findOptimalTimeForTodo } from './services/aiService';
 * 
 * // In your component:
 * const handleFindOptimalTime = async (todo) => {
 *   setIsLoading(true);
 *   const result = await findOptimalTimeForTodo(todo);
 *   
 *   if (result.success && result.suggestedStartTime) {
 *     // Maybe show this to the user or auto-populate a new event form
 *     console.log(`Suggested time: ${result.suggestedStartTime}`);
 *     console.log(`Reasoning: ${result.reasoning}`);
 *   } else {
 *     // Handle error or no suitable time found
 *     console.error(result.error || "No suitable time found");
 *   }
 *   setIsLoading(false);
 * };
 */

/**
 * Creates a calendar event at a random time slot during the current day
 * 
 * @param eventTitle The title for the event
 * @param durationMinutes Duration of the event in minutes (default: 30)
 * @param options Additional event options like location, description, etc.
 * @returns Promise with the result of the event creation
 */
export async function createRandomEventToday(
  eventTitle: string, 
  durationMinutes: number = 30,
  options?: {
    location?: string;
    description?: string;
    color?: string;
    isAllDay?: boolean;
    alert?: string;
    showAs?: string;
  }
): Promise<any> {
  // Get current date
  const today = new Date();
  
  // Set minimum time to current time (don't schedule in the past)
  const minHour = today.getHours();
  const minMinute = today.getMinutes();
  
  // Set maximum time to 10pm (22:00) to avoid scheduling too late
  const maxHour = 22;
  
  // Generate random hour between min and max
  let startHour = Math.floor(Math.random() * (maxHour - minHour)) + minHour;
  
  // Generate random minute (0, 15, 30, or 45 for nice time slots)
  let startMinute = Math.floor(Math.random() * 4) * 15;
  
  // If we're using the current hour, make sure the minute is after current minute
  if (startHour === minHour && startMinute < minMinute) {
    // Round up to the next 15-minute slot
    startMinute = Math.ceil(minMinute / 15) * 15;
    
    // If we're past 45 minutes, move to the next hour
    if (startMinute >= 60) {
      startHour += 1;
      startMinute = 0;
      
      // Check if we've gone past our max hour
      if (startHour > maxHour) {
        // If no time available today, fail gracefully
        console.warn("No available time slots left today");
        return {
          success: false,
          error: "No available time slots remaining today"
        };
      }
    }
  }
  
  // Create start date
  const startDate = new Date(today);
  startDate.setHours(startHour, startMinute, 0, 0);
  
  // Create end date based on duration
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + durationMinutes);
  
  // If end time is past midnight, adjust to end at midnight
  if (endDate.getDate() !== today.getDate()) {
    endDate.setHours(23, 59, 0, 0);
  }
  
  try {
    // Create the event data
    const eventData = {
      title: eventTitle,
      start: startDate,
      end: endDate,
      location: options?.location || '',
      description: options?.description || 'Automatically scheduled event',
      color: options?.color,
      isAllDay: options?.isAllDay || false,
      alert: options?.alert || '15 minutes before',
      showAs: options?.showAs || 'Busy',
    };
    
    // Call the calendar service to create the event
    const newEvent = createCalendarEvent(eventData);
    
    if (newEvent) {
      return {
        success: true,
        event: newEvent,
        message: `Event "${eventTitle}" created from ${startDate.toLocaleTimeString()} to ${endDate.toLocaleTimeString()}`
      };
    } else {
      // The calendar service wasn't ready yet
      return {
        success: false,
        error: "Calendar not initialized yet. Please try navigating to the Calendar tab first and then back to Settings.",
        eventData: eventData
      };
    }
  } catch (error: any) {
    console.error('Error creating random event:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred during event creation'
    };
  }
} 