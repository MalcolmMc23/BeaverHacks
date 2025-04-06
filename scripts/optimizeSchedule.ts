import { exportCalendarEvents } from './exportCalendarEvents';
import { scheduleAllTodos } from './scheduleTodos';

/**
 * Comprehensive script that:
 * 1. Analyzes calendar events and saves patterns to AsyncStorage
 * 2. Schedules all incomplete todos at optimal times
 */
async function optimizeSchedule() {
  try {
    console.log('📅 CALENDAR AI OPTIMIZATION 📅\n');
    console.log('Step 1: Analyzing calendar events...');
    
    // Analyze calendar events and save to AsyncStorage
    await exportCalendarEvents();
    
    console.log('\nStep 2: Scheduling all incomplete todos...');
    
    // Schedule all todos using the analyzed calendar data
    await scheduleAllTodos();
    
    console.log('\n✅ Calendar optimization complete!');
    console.log('Calendar patterns analyzed and saved.');
    console.log('Todos have been scheduled at optimal times.');
    console.log('\nYou can view the schedule in the Calendar tab of the app.');
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error in optimizeSchedule:', error);
    return {
      success: false,
      error
    };
  }
}

// Export for use in other parts of the app
export { optimizeSchedule };

// Auto-run if this script is executed directly
if (require.main === module) {
  optimizeSchedule()
    .then(() => {
      console.log('\nScript execution completed.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Script execution failed:', error);
      process.exit(1);
    });
} 