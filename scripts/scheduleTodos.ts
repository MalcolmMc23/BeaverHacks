import AsyncStorage from '@react-native-async-storage/async-storage';
import { TodoItem } from '@/components/todo';
import { batchScheduleTodos } from '@/services/todoSchedulingService';

/**
 * Script to schedule all incomplete todos using AI
 * This can be run from the terminal or called from the app
 */
async function scheduleAllTodos() {
  try {
    console.log('Starting AI todo scheduling...');
    
    // Get all todos
    const todosJson = await AsyncStorage.getItem('todos');
    if (!todosJson) {
      console.log('No todos found.');
      return;
    }
    
    const todos: TodoItem[] = JSON.parse(todosJson);
    console.log(`Found ${todos.length} todos in total.`);
    
    // Filter for incomplete todos only
    const incompleteTodos = todos.filter(todo => !todo.completed);
    console.log(`Found ${incompleteTodos.length} incomplete todos to schedule.`);
    
    if (incompleteTodos.length === 0) {
      console.log('No incomplete todos to schedule.');
      return;
    }
    
    // Schedule all incomplete todos
    const results = await batchScheduleTodos(incompleteTodos);
    
    // Print results
    console.log('\n======== SCHEDULING RESULTS ========');
    console.log(`Total todos processed: ${results.total}`);
    console.log(`Successfully scheduled: ${results.scheduled}`);
    console.log(`Failed to schedule: ${results.failed}`);
    
    if (results.scheduledTodos.length > 0) {
      console.log('\nSuccessfully scheduled todos:');
      results.scheduledTodos.forEach((item, index) => {
        const startDate = new Date(item.startTime);
        const endDate = new Date(item.endTime);
        console.log(`${index + 1}. "${item.todo.text}" - ${startDate.toLocaleString()} to ${endDate.toLocaleString()}`);
      });
    }
    
    console.log('\nScheduling completed.');
  } catch (error) {
    console.error('Error in scheduleAllTodos:', error);
  }
}

// Export for use in other parts of the app
export { scheduleAllTodos };

// Auto-run if this script is executed directly
if (require.main === module) {
  scheduleAllTodos()
    .then(() => {
      console.log('Script execution completed.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Script execution failed:', error);
      process.exit(1);
    });
}