
import AsyncStorage from '@react-native-async-storage/async-storage';

const CELEBRATION_ENABLED_KEY = '@portion_tracker_celebration_enabled';
const CELEBRATION_SHOWN_TODAY_KEY = '@portion_tracker_celebration_shown_';

// Add a lock mechanism to prevent race conditions
let celebrationLock = false;

async function acquireCelebrationLock(): Promise<void> {
  let attempts = 0;
  while (celebrationLock && attempts < 20) {
    await new Promise(resolve => setTimeout(resolve, 50));
    attempts++;
  }
  celebrationLock = true;
}

function releaseCelebrationLock(): void {
  celebrationLock = false;
}

export async function saveCelebrationEnabled(enabled: boolean): Promise<void> {
  await acquireCelebrationLock();
  try {
    await AsyncStorage.setItem(CELEBRATION_ENABLED_KEY, JSON.stringify(enabled));
    console.log('Celebration setting saved:', enabled);
  } catch (error) {
    console.error('Error saving celebration setting:', error);
    throw error;
  } finally {
    releaseCelebrationLock();
  }
}

export async function loadCelebrationEnabled(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(CELEBRATION_ENABLED_KEY);
    if (data !== null) {
      const result = JSON.parse(data);
      console.log('Celebration setting loaded:', result);
      return result;
    }
    // Default to enabled (ON)
    console.log('Celebration setting not found, defaulting to enabled');
    return true;
  } catch (error) {
    console.error('Error loading celebration setting:', error);
    return true;
  }
}

export async function saveCelebrationShownToday(date: string): Promise<void> {
  await acquireCelebrationLock();
  try {
    const key = `${CELEBRATION_SHOWN_TODAY_KEY}${date}`;
    await AsyncStorage.setItem(key, 'true');
    console.log('Celebration shown flag saved for:', date);
  } catch (error) {
    console.error('Error saving celebration shown flag:', error);
    // Don't throw - this is not critical
  } finally {
    releaseCelebrationLock();
  }
}

export async function hasCelebrationBeenShownToday(date: string): Promise<boolean> {
  try {
    const key = `${CELEBRATION_SHOWN_TODAY_KEY}${date}`;
    const data = await AsyncStorage.getItem(key);
    const result = data === 'true';
    console.log('Celebration shown check for', date, ':', result);
    return result;
  } catch (error) {
    console.error('Error loading celebration shown flag:', error);
    return false;
  }
}
