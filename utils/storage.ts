
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, DailyPortions, WeightEntry } from '../types';

const PROFILE_KEY = '@portion_tracker_profile';
const DAILY_PORTIONS_KEY = '@portion_tracker_daily_';
const REMINDER_KEY = '@portion_tracker_reminder';
const WEIGHT_ENTRIES_KEY = '@portion_tracker_weight_entries';
const INFO_HINT_SEEN_KEY = '@portion_tracker_info_hint_seen';
const RESET_TIME_KEY = '@portion_tracker_reset_time';
const LAST_RESET_DATE_KEY = '@portion_tracker_last_reset_date';

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
      const profile = JSON.parse(data);
      
      // Migration: Handle old profile structure
      if (profile.targets) {
        // If old structure exists, migrate to new structure
        if (typeof profile.targets.wholeGrains !== 'undefined') {
          console.log('Migrating old profile structure to new structure');
          profile.targets.healthyCarbs = profile.targets.wholeGrains || 0;
          profile.targets.nuts = profile.targets.nutsSeeds || 0;
          
          delete profile.targets.wholeGrains;
          delete profile.targets.nutsSeeds;
          delete profile.targets.dairy;
          delete profile.targets.water;
          
          if (typeof profile.includeAlcohol === 'undefined') {
            profile.includeAlcohol = false;
          }
          if (typeof profile.alcoholServings === 'undefined') {
            profile.alcoholServings = 0;
          }
          if (typeof profile.sizeCategory === 'undefined') {
            profile.sizeCategory = 'medium';
          }
          
          await saveProfile(profile);
        }
        
        // Migration: Add goalWeight if missing
        if (typeof profile.goalWeight === 'undefined') {
          console.log('Adding goalWeight field to existing profile');
          profile.goalWeight = profile.currentWeight || 150;
          await saveProfile(profile);
        }
        
        // Migration: Add activityLevel if missing (default to sedentary)
        if (typeof profile.activityLevel === 'undefined') {
          console.log('Adding activityLevel field to existing profile');
          profile.activityLevel = 'sedentary';
          await saveProfile(profile);
        }
      }
      
      return profile;
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
      const dailyData = JSON.parse(data);
      
      // Migration: Handle old daily portions structure
      if (dailyData.portions) {
        if (typeof dailyData.portions.wholeGrains !== 'undefined') {
          console.log('Migrating old daily portions structure');
          dailyData.portions.healthyCarbs = dailyData.portions.wholeGrains || 0;
          dailyData.portions.nuts = dailyData.portions.nutsSeeds || 0;
          
          delete dailyData.portions.wholeGrains;
          delete dailyData.portions.nutsSeeds;
          delete dailyData.portions.dairy;
          delete dailyData.portions.water;
          
          await saveDailyPortions(dailyData);
        }
      }
      
      return dailyData;
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
      .map(([_, value]) => {
        if (!value) return null;
        
        const dailyData = JSON.parse(value);
        
        // Migration: Handle old daily portions structure
        if (dailyData.portions) {
          if (typeof dailyData.portions.wholeGrains !== 'undefined') {
            dailyData.portions.healthyCarbs = dailyData.portions.wholeGrains || 0;
            dailyData.portions.nuts = dailyData.portions.nutsSeeds || 0;
            
            delete dailyData.portions.wholeGrains;
            delete dailyData.portions.nutsSeeds;
            delete dailyData.portions.dairy;
            delete dailyData.portions.water;
          }
        }
        
        return dailyData;
      })
      .filter((item): item is DailyPortions => item !== null)
      .sort((a, b) => b.date.localeCompare(a.date));
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
    const existingIndex = entries.findIndex(e => e.date === entry.date);
    
    if (existingIndex >= 0) {
      entries[existingIndex] = entry;
    } else {
      entries.push(entry);
    }
    
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

// Info hint functions
export async function saveInfoHintSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(INFO_HINT_SEEN_KEY, 'true');
    console.log('Info hint marked as seen');
  } catch (error) {
    console.error('Error saving info hint seen:', error);
    throw error;
  }
}

export async function hasSeenInfoHint(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(INFO_HINT_SEEN_KEY);
    return data === 'true';
  } catch (error) {
    console.error('Error loading info hint seen:', error);
    return false;
  }
}

// Daily reset time functions
export interface ResetTimeConfig {
  hour: number;
  minute: number;
  enabled: boolean;
}

export async function saveResetTime(config: ResetTimeConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(RESET_TIME_KEY, JSON.stringify(config));
    console.log('Reset time saved:', config);
  } catch (error) {
    console.error('Error saving reset time:', error);
    throw error;
  }
}

export async function loadResetTime(): Promise<ResetTimeConfig | null> {
  try {
    const data = await AsyncStorage.getItem(RESET_TIME_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error loading reset time:', error);
    return null;
  }
}

export async function saveLastResetDate(date: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_RESET_DATE_KEY, date);
    console.log('Last reset date saved:', date);
  } catch (error) {
    console.error('Error saving last reset date:', error);
    throw error;
  }
}

export async function loadLastResetDate(): Promise<string | null> {
  try {
    const data = await AsyncStorage.getItem(LAST_RESET_DATE_KEY);
    return data;
  } catch (error) {
    console.error('Error loading last reset date:', error);
    return null;
  }
}

// Clear all app data - comprehensive version
export async function clearAllData(): Promise<void> {
  try {
    console.log('🧹 Starting comprehensive data clear...');
    
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('📋 Total keys in AsyncStorage:', allKeys.length);
    
    const appKeys = allKeys.filter(key => key.startsWith('@portion_tracker'));
    console.log('🎯 App keys found:', appKeys.length);
    console.log('🔑 Keys to clear:', appKeys);
    
    if (appKeys.length > 0) {
      await AsyncStorage.multiRemove(appKeys);
      console.log('✅ Successfully removed all app keys');
    }
    
    const remainingKeys = await AsyncStorage.getAllKeys();
    const remainingAppKeys = remainingKeys.filter(key => key.startsWith('@portion_tracker'));
    
    if (remainingAppKeys.length > 0) {
      console.warn('⚠️ Warning: Some app keys remain:', remainingAppKeys);
      for (const key of remainingAppKeys) {
        try {
          await AsyncStorage.removeItem(key);
          console.log(`🔄 Force removed: ${key}`);
        } catch (error) {
          console.error(`❌ Error force removing ${key}:`, error);
        }
      }
    } else {
      console.log('✅ All app data cleared successfully!');
    }
    
    const finalKeys = await AsyncStorage.getAllKeys();
    const finalAppKeys = finalKeys.filter(key => key.startsWith('@portion_tracker'));
    console.log('📊 Final verification - remaining app keys:', finalAppKeys.length);
    
  } catch (error) {
    console.error('❌ Error clearing all data:', error);
    throw error;
  }
}
