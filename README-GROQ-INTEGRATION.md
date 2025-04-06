# Groq AI Integration for Optimal Scheduling

This integration uses Groq's powerful AI models to determine the optimal time to schedule to-do list items as calendar events, based on the user's existing calendar and preferences.

## Setup Instructions

### 1. Install Required Dependencies

```bash
pnpm add groq-sdk
```

Note: You also have the option to use the OpenAI SDK since Groq's API is compatible with the OpenAI API format.

### 2. Get a Groq API Key

1. Create an account at [groq.com](https://console.groq.com/signup)
2. Navigate to the API Keys section in the Groq console
3. Create a new API key

### 3. Configure Environment Variables

Create a `.env` file in your project root (if it doesn't exist already) and add your Groq API key:

```
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key_here
```

Make sure to add `.env` to your `.gitignore` file to avoid committing sensitive information.

### 4. Load Environment Variables in Your App

Ensure your app is set up to load environment variables properly. For Expo projects, you might need to install additional packages:

```bash
pnpm add react-native-dotenv
```

Then update your `babel.config.js` file to include:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [["module:react-native-dotenv"]],
  };
};
```

## How It Works

The integration consists of three main components:

1. **Data Service (`services/dataService.ts`)**: Collects and formats todo and calendar data from your app's storage.

2. **AI Service (`services/aiService.ts`)**: Handles communication with the Groq API, sending the formatted data and receiving scheduling suggestions.

3. **Todo Component Integration**: Adds a "Find optimal time" button to todo items, allowing users to get AI-powered scheduling suggestions.

4. **ScheduleTodo Component (`components/ScheduleTodo.tsx`)**: An example component that shows how to use the enhanced Todo component with the scheduling functionality.

### User Flow

1. User creates a todo item
2. User clicks "Find optimal time" button on a todo
3. The app collects existing todos and calendar events
4. This data is sent to Groq's AI along with the specific todo
5. Groq analyzes the data and suggests an optimal time slot
6. The suggested time is displayed to the user
7. User can click "Schedule" to add it to their calendar

## Using the ScheduleTodo Component

```jsx
import { ScheduleTodo } from "@/components/todo";

// In your component
const handleToggleTodo = (id: string) => {
  // Update todo completion status
};

const handleDeleteTodo = (id: string) => {
  // Delete todo
};

const handleUpdateTodo = (todo: TodoItem) => {
  // Update todo in your app state or storage
};

const handleAddEvent = (event: any) => {
  // Add event to your calendar
};

// Then in your render function
<ScheduleTodo
  todos={yourTodosList}
  onToggleTodo={handleToggleTodo}
  onDeleteTodo={handleDeleteTodo}
  onUpdateTodo={handleUpdateTodo}
  onAddEvent={handleAddEvent}
  colorScheme="light" // or "dark"
/>;
```

## Available AI Models on Groq

This integration is configured to use Llama 3 70B, but Groq offers several other models you can use:

- `llama3-70b-8192` (default, very capable)
- `llama3-8b-8192` (faster, less capable)
- `mixtral-8x7b-32768` (good all-around model)
- `gemma-7b-it` (smaller model, faster responses)

You can change the model in the `aiService.ts` file.

## Customization Options

### Adjust the AI Prompt

You can customize how the AI interprets and evaluates scheduling by editing the prompt in `findOptimalTimeForTodo()` in `services/aiService.ts`.

### Modify User Preferences

Update the `userPreferences` object in `getTodoAndCalendarData()` in `services/dataService.ts` to include specific user preferences like:

- Working hours
- Preferred times for specific task types
- Buffer time between events
- Focus periods

### Change the Model or Parameters

Adjust the model or parameters in the Groq API call in `aiService.ts`:

```javascript
const completion = await groq.chat.completions.create({
  model: "llama3-70b-8192", // Try different models here
  temperature: 0.1, // Adjust for more creative (higher) or consistent (lower) responses
  // other parameters...
});
```

## Troubleshooting

- **"API key not configured" error**: Ensure your `.env` file is properly set up and your app is correctly loading environment variables.

- **Slow responses**: Try using a smaller model like `llama3-8b-8192` or `gemma-7b-it` for faster responses.

- **No suitable time suggestions**: Check that your calendar data is properly formatted and that you have events in your calendar. The AI needs context to make good suggestions.

- **Import errors with openai or groq-sdk**: Make sure the packages are installed correctly using `pnpm add groq-sdk` or `pnpm add openai` as appropriate.

- **Strange or irrelevant suggestions**: You may need to adjust the prompt in `aiService.ts` to better guide the AI.

## Resources

- [Groq Documentation](https://console.groq.com/docs/quickstart)
- [Groq SDK Documentation](https://docs.groq.com/usage/node)
- [Expo Environment Variables Guide](https://docs.expo.dev/guides/environment-variables/)
