
import { loadResetTime, saveLastResetDate, loadLastResetDate } from './storage';

export async function checkAndPerformDailyReset(): Promise<boolean> {
  const config = await loadResetTime();
  const lastResetDate = await loadLastResetDate();
  
  const now = new Date();
  const todayString = now.toISOString().split('T')[0];
  
  if (config.enabled) {
    // Custom reset time
    const resetTime = new Date();
    resetTime.setHours(config.hour, config.minute, 0, 0);
    
    // Check if we've passed the reset time today and haven't reset yet
    if (now >= resetTime && lastResetDate !== todayString) {
      await saveLastResetDate(todayString);
      return true;
    }
  } else {
    // Default midnight reset
    if (lastResetDate !== todayString) {
      await saveLastResetDate(todayString);
      return true;
    }
  }
  
  return false;
}
