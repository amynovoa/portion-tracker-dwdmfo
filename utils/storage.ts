
import AsyncStorage from '@react-native-async-storage/async-storage';

const RESET_TIME_KEY = '@portion_tracker_reset_time';
const LAST_RESET_DATE_KEY = '@portion_tracker_last_reset_date';

export interface ResetTimeConfig {
  hour: number;
  minute: number;
  enabled: boolean;
}

export async function saveResetTime(config: ResetTimeConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(RESET_TIME_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving reset time:', error);
  }
}

export async function loadResetTime(): Promise<ResetTimeConfig> {
  try {
    const data = await AsyncStorage.getItem(RESET_TIME_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading reset time:', error);
  }
  // Default: midnight, disabled
  return { hour: 0, minute: 0, enabled: false };
}

export async function saveLastResetDate(date: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_RESET_DATE_KEY, date);
  } catch (error) {
    console.error('Error saving last reset date:', error);
  }
}

export async function loadLastResetDate(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_RESET_DATE_KEY);
  } catch (error) {
    console.error('Error loading last reset date:', error);
    return null;
  }
}
