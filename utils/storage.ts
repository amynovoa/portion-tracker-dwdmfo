
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, DailyPortions, DailyPortionsWithServings, WeightEntry, ServingEntry } from '../types';

const PROFILE_KEY = '@portion_tracker_profile';
const DAILY_PORTIONS_KEY = '@portion_tracker_daily_';
const DAILY_SERVINGS_KEY = '@portion_tracker_servings_';
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

// New: Save daily servings with S/M/L tracking
export async function saveDailyServings(daily: DailyPortionsWithServings): Promise<void> {
  try {
    const key = `${DAILY_SERVINGS_KEY}${daily.date}`;
    await AsyncStorage.setItem(key, JSON.stringify(daily));
    console.log('Daily servings saved for', daily.date);
  } catch (error) {
    console.error('Error saving daily servings:', error);
    throw error;
  }
}

// New: Load daily servings with S/M/L tracking
export async function loadDailyServings(date: string): Promise<DailyPortionsWithServings | null> {
  try {
    const key = `${DAILY_SERVINGS_KEY}${date}`;
    const data = await AsyncStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error loading daily servings:', error);
    return null;
  }
}

// New: Get all daily servings records
export async function getAllDailyServings(): Promise<DailyPortionsWithServings[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const servingsKeys = keys.filter(key => key.startsWith(DAILY_SERVINGS_KEY));
    const items = await AsyncStorage.multiGet(servingsKeys);
    
    return items
      .map(([_, value]) => (value ? JSON.parse(value) : null))
      .filter((item): item is DailyPortionsWithServings => item !== null)
      .sort((a, b) => b.date.localeCompare(a.date)); // Sort by date descending
  } catch (error) {
    console.error('Error loading all daily servings:', error);
    return [];
  }
}

// Legacy: Save daily portions (for backward compatibility)
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

// Legacy: Load daily portions (for backward compatibility)
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

// Legacy: Get all daily portions
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
