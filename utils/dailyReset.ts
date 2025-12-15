
import { getTodayString } from './dateUtils';
import { loadResetTime, saveLastResetDate, loadLastResetDate, loadDailyPortions, saveDailyPortions } from './storage';
import { PortionTargets } from '../types';

/**
 * Check if we need to perform a daily reset based on the configured reset time.
 * This should be called when the app opens or comes to foreground.
 * 
 * @returns true if a reset was performed, false otherwise
 */
export async function checkAndPerformDailyReset(): Promise<boolean> {
  try {
    console.log('🔄 Checking if daily reset is needed...');
    
    // Load reset time configuration
    const resetConfig = await loadResetTime();
    
    // If reset is not enabled, skip
    if (!resetConfig || !resetConfig.enabled) {
      console.log('⏭️ Daily reset is not enabled, skipping');
      return false;
    }
    
    console.log(`⏰ Reset time configured: ${resetConfig.hour}:${resetConfig.minute.toString().padStart(2, '0')}`);
    
    // Get current date and time
    const now = new Date();
    const currentDate = getTodayString();
    
    // Get last reset date
    const lastResetDate = await loadLastResetDate();
    console.log('📅 Last reset date:', lastResetDate);
    console.log('📅 Current date:', currentDate);
    
    // If we've already reset today, skip
    if (lastResetDate === currentDate) {
      console.log('✅ Already reset today, skipping');
      return false;
    }
    
    // Calculate the reset time for today
    const resetTime = new Date();
    resetTime.setHours(resetConfig.hour, resetConfig.minute, 0, 0);
    
    console.log('🕐 Current time:', now.toLocaleTimeString());
    console.log('🕐 Reset time:', resetTime.toLocaleTimeString());
    
    // Determine if we should reset
    let shouldReset = false;
    
    if (!lastResetDate) {
      // First time running with reset enabled
      // Only reset if current time is past the reset time
      if (now >= resetTime) {
        console.log('🆕 First time with reset enabled and past reset time');
        shouldReset = true;
      }
    } else {
      // We have a last reset date
      const lastResetDateObj = new Date(lastResetDate);
      const currentDateObj = new Date(currentDate);
      
      // If it's a new day
      if (currentDateObj > lastResetDateObj) {
        // Check if we've passed the reset time today
        if (now >= resetTime) {
          console.log('📆 New day and past reset time');
          shouldReset = true;
        } else {
          console.log('📆 New day but before reset time, waiting...');
        }
      }
    }
    
    if (shouldReset) {
      console.log('🔄 Performing daily reset...');
      await performReset(currentDate);
      return true;
    }
    
    console.log('⏳ No reset needed at this time');
    return false;
    
  } catch (error) {
    console.error('❌ Error checking daily reset:', error);
    return false;
  }
}

/**
 * Perform the actual reset - clear today's portions while preserving history
 */
async function performReset(currentDate: string): Promise<void> {
  try {
    console.log('🧹 Starting reset process...');
    
    // Load today's data (which is actually yesterday's data that needs to be preserved)
    const todayData = await loadDailyPortions(currentDate);
    
    if (todayData) {
      console.log('💾 Today\'s data exists and is already in history');
      // Data is already saved with today's date, so it's in history
    }
    
    // Create empty portions for the new day
    const emptyPortions: PortionTargets = {
      protein: 0,
      veggies: 0,
      fruit: 0,
      healthyCarbs: 0,
      fats: 0,
      nuts: 0,
      alcohol: 0,
    };
    
    // Save empty portions for today (this will overwrite any existing data)
    await saveDailyPortions({
      date: currentDate,
      portions: emptyPortions,
      exercise: false,
    });
    
    console.log('✅ Daily portions reset to zero');
    
    // Update last reset date
    await saveLastResetDate(currentDate);
    console.log('✅ Last reset date updated');
    
    console.log('🎉 Daily reset completed successfully!');
    
  } catch (error) {
    console.error('❌ Error performing reset:', error);
    throw error;
  }
}

/**
 * Format time for display (e.g., "6:00 AM")
 */
export function formatResetTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}
