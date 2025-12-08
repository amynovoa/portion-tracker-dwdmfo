
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, DailyPortions, WeightEntry } from '../types';

const PROFILE_KEY = '@portion_tracker_profile';
const DAILY_PORTIONS_KEY = '@portion_tracker_daily_';
const REMINDER_KEY = '@portion_tracker_reminder';
const WEIGHT_ENTRIES_KEY = '@portion_tracker_weight_entries';

export async function saveProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    console.log('Profile saved successfully');
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
}

export async function loadProfile(): Promise<UserProfile | null> {
  try {
    const data = await AsyncStorage.getItem(PROFILE_KEY);
    if (data) {
      console.log('Profile loaded successfully');
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error loading profile:', error);
    return null;
  }
}

export async function saveDailyPortions(daily: DailyPortions): Promise<void> {
  try {
    const key = `${DAILY_PORTIONS_KEY}${daily.date}`;
    await AsyncStorage.setItem(key, JSON.stringify(daily));
    console.log('Daily portions saved for', daily.date);
  } catch (error) {
    console.error('Error saving daily portions:', error);
    throw error;
  }
}

export async function loadDailyPortions(date: string): Promise<DailyPortions | null> {
  try {
    const key = `${DAILY_PORTIONS_KEY}${date}`;
    const data = await AsyncStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error loading daily portions:', error);
    return null;
  }
}

export async function getAllDailyPortions(): Promise<DailyPortions[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const dailyKeys = keys.filter(key => key.startsWith(DAILY_PORTIONS_KEY));
    const items = await AsyncStorage.multiGet(dailyKeys);
    
    return items
      .map(([_, value]) => (value ? JSON.parse(value) : null))
      .filter((item): item is DailyPortions => item !== null)
      .sort((a, b) => b.date.localeCompare(a.date)); // Sort by date descending
  } catch (error) {
    console.error('Error loading all daily portions:', error);
    return [];
  }
}

export async function saveReminderEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(enabled));
    console.log('Reminder setting saved:', enabled);
  } catch (error) {
    console.error('Error saving reminder setting:', error);
    throw error;
  }
}

export async function loadReminderEnabled(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(REMINDER_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return false;
  } catch (error) {
    console.error('Error loading reminder setting:', error);
    return false;
  }
}

// Weight tracking functions
export async function saveWeightEntry(entry: WeightEntry): Promise<void> {
  try {
    const entries = await loadWeightEntries();
    // Check if entry for this date already exists
    const existingIndex = entries.findIndex(e => e.date === entry.date);
    
    if (existingIndex >= 0) {
      // Update existing entry
      entries[existingIndex] = entry;
    } else {
      // Add new entry
      entries.push(entry);
    }
    
    // Sort by date descending
    entries.sort((a, b) => b.timestamp - a.timestamp);
    
    await AsyncStorage.setItem(WEIGHT_ENTRIES_KEY, JSON.stringify(entries));
    console.log('Weight entry saved successfully');
  } catch (error) {
    console.error('Error saving weight entry:', error);
    throw error;
  }
}

export async function loadWeightEntries(): Promise<WeightEntry[]> {
  try {
    const data = await AsyncStorage.getItem(WEIGHT_ENTRIES_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading weight entries:', error);
    return [];
  }
}

export async function deleteWeightEntry(date: string): Promise<void> {
  try {
    const entries = await loadWeightEntries();
    const filtered = entries.filter(e => e.date !== date);
    await AsyncStorage.setItem(WEIGHT_ENTRIES_KEY, JSON.stringify(filtered));
    console.log('Weight entry deleted successfully');
  } catch (error) {
    console.error('Error deleting weight entry:', error);
    throw error;
  }
}

// Clear all app data
export async function clearAllData(): Promise<void> {
  try {
    console.log('Starting clearAllData...');
    
    // Get all keys from AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('Total keys in AsyncStorage:', allKeys.length);
    console.log('All keys:', allKeys);
    
    // Filter only our app's keys (those starting with @portion_tracker)
    const appKeys = allKeys.filter(key => key.startsWith('@portion_tracker'));
    console.log('App keys found:', appKeys.length);
    console.log('App keys to clear:', appKeys);
    
    // Remove all app keys
    if (appKeys.length > 0) {
      await AsyncStorage.multiRemove(appKeys);
      console.log('Successfully removed all app keys');
      
      // Verify deletion
      const remainingKeys = await AsyncStorage.getAllKeys();
      const remainingAppKeys = remainingKeys.filter(key => key.startsWith('@portion_tracker'));
      console.log('Remaining app keys after deletion:', remainingAppKeys.length);
      
      if (remainingAppKeys.length > 0) {
        console.warn('Warning: Some app keys were not deleted:', remainingAppKeys);
      } else {
        console.log('All app data cleared successfully');
      }
    } else {
      console.log('No app data found to clear');
    }
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
}
