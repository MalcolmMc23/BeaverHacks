import { Groq } from 'groq-sdk';
import { getTodoAndCalendarData } from './dataService';
import { TodoItem } from '@/components/Todo';

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

    // Get the app's calendar and todo data
    const data = await getTodoAndCalendarData();
    
    // Estimate task duration (if not specified, default to 30 minutes)
    const estimatedDuration = 30; // minutes
    
    // Format a prompt for the AI
    const prompt = `
      I need to find the optimal time to schedule this task in my calendar:
      
      TASK: ${JSON.stringify({
        title: todo.text,
        completed: todo.completed,
        description: todo.description || 'No description provided',
        estimatedDuration: estimatedDuration
      })}
      
      Here are my existing calendar events (busy times):
      ${JSON.stringify(data.calendarEvents)}
      
      And here are my preferences:
      ${JSON.stringify(data.userPreferences)}
      
      Please suggest the optimal time to schedule this task in the next 7 days.
      
      Provide your response in this JSON format:
      {
        "suggestedStartTime": "YYYY-MM-DDTHH:MM:SSZ", // ISO 8601 format
        "suggestedEndTime": "YYYY-MM-DDTHH:MM:SSZ",   // ISO 8601 format
        "reasoning": "Brief explanation of why this time is optimal"
      }
      
      If no suitable time is found, set suggestedStartTime and suggestedEndTime to null and explain why.
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