
import AsyncStorage from '@react-native-async-storage/async-storage';

const CELEBRATION_ENABLED_KEY = '@portion_tracker_celebration_enabled';
const CELEBRATION_SHOWN_TODAY_KEY = '@portion_tracker_celebration_shown_';

export async function saveCelebrationEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(CELEBRATION_ENABLED_KEY, JSON.stringify(enabled));
    console.log('Celebration setting saved:', enabled);
  } catch (error) {
    console.error('Error saving celebration setting:', error);
    throw error;
  }
}

export async function loadCelebrationEnabled(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(CELEBRATION_ENABLED_KEY);
    if (data !== null) {
      return JSON.parse(data);
    }
    // Default to enabled (ON)
    return true;
  } catch (error) {
    console.error('Error loading celebration setting:', error);
    return true;
  }
}

export async function saveCelebrationShownToday(date: string): Promise<void> {
  try {
    const key = `${CELEBRATION_SHOWN_TODAY_KEY}${date}`;
    await AsyncStorage.setItem(key, 'true');
    console.log('Celebration shown flag saved for:', date);
  } catch (error) {
    console.error('Error saving celebration shown flag:', error);
    throw error;
  }
}

export async function hasCelebrationBeenShownToday(date: string): Promise<boolean> {
  try {
    const key = `${CELEBRATION_SHOWN_TODAY_KEY}${date}`;
    const data = await AsyncStorage.getItem(key);
    return data === 'true';
  } catch (error) {
    console.error('Error loading celebration shown flag:', error);
    return false;
  }
}
