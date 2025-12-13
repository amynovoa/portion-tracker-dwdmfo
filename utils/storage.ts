
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
      const profile = JSON.parse(data);
      
      // Migration: Handle old profile structure
      if (profile.targets) {
        // If old structure exists, migrate to new structure
        if (typeof profile.targets.wholeGrains !== 'undefined') {
          console.log('Migrating old profile structure to new structure');
          // Map old fields to new fields
          profile.targets.healthyCarbs = profile.targets.wholeGrains || 0;
          profile.targets.nuts = profile.targets.nutsSeeds || 0;
          
          // Remove old fields
          delete profile.targets.wholeGrains;
          delete profile.targets.nutsSeeds;
          delete profile.targets.dairy;
          delete profile.targets.water;
          
          // Set default values for new fields if missing
          if (typeof profile.includeAlcohol === 'undefined') {
            profile.includeAlcohol = false;
          }
          if (typeof profile.alcoholServings === 'undefined') {
            profile.alcoholServings = 0;
          }
          if (typeof profile.sizeCategory === 'undefined') {
            profile.sizeCategory = 'medium';
          }
          
          // Save migrated profile
          await saveProfile(profile);
        }
        
        // Migration: Add goalWeight if missing (set to currentWeight as default)
        if (typeof profile.goalWeight === 'undefined') {
          console.log('Adding goalWeight field to existing profile');
          profile.goalWeight = profile.currentWeight || 150; // Default to current weight or 150
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
          
          // Save migrated data
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

// Clear all app data - comprehensive version
export async function clearAllData(): Promise<void> {
  try {
    console.log('🧹 Starting comprehensive data clear...');
    
    // Get all keys from AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('📋 Total keys in AsyncStorage:', allKeys.length);
    
    // Filter only our app's keys (those starting with @portion_tracker)
    const appKeys = allKeys.filter(key => key.startsWith('@portion_tracker'));
    console.log('🎯 App keys found:', appKeys.length);
    console.log('🔑 Keys to clear:', appKeys);
    
    // Remove all app keys in one go
    if (appKeys.length > 0) {
      await AsyncStorage.multiRemove(appKeys);
      console.log('✅ Successfully removed all app keys');
    }
    
    // Verify the clear was successful
    const remainingKeys = await AsyncStorage.getAllKeys();
    const remainingAppKeys = remainingKeys.filter(key => key.startsWith('@portion_tracker'));
    
    if (remainingAppKeys.length > 0) {
      console.warn('⚠️ Warning: Some app keys remain:', remainingAppKeys);
      // Try removing them individually
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
    
    // Final verification
    const finalKeys = await AsyncStorage.getAllKeys();
    const finalAppKeys = finalKeys.filter(key => key.startsWith('@portion_tracker'));
    console.log('📊 Final verification - remaining app keys:', finalAppKeys.length);
    
  } catch (error) {
    console.error('❌ Error clearing all data:', error);
    throw error;
  }
}
