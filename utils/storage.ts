
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, DailyPortions, WeightEntry } from '@/types';

const PROFILE_KEY = '@portion_tracker_profile';
const DAILY_PORTIONS_PREFIX = '@portion_tracker_daily_';
const WEIGHT_ENTRIES_KEY = '@portion_tracker_weight_entries';
const RESET_TIME_KEY = '@portion_tracker_reset_time';
const LAST_RESET_DATE_KEY = '@portion_tracker_last_reset_date';
const INFO_HINT_SEEN_KEY = '@portion_tracker_info_hint_seen';
const SUBSCRIPTION_STATUS_KEY = '@portion_tracker_subscription_status';
const NOON_REMINDER_ENABLED_KEY = '@portion_tracker_noon_reminder_enabled';

export interface ResetTimeConfig {
  hour: number;
  minute: number;
  enabled: boolean;
}

// Subscription status functions
export async function saveSubscriptionStatus(isSubscribed: boolean): Promise<void> {
  try {
    console.log('Saving subscription status:', isSubscribed);
    await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, JSON.stringify(isSubscribed));
  } catch (error) {
    console.error('Error saving subscription status:', error);
  }
}

export async function loadSubscriptionStatus(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(SUBSCRIPTION_STATUS_KEY);
    if (data) {
      const isSubscribed = JSON.parse(data);
      console.log('Loaded subscription status:', isSubscribed);
      return isSubscribed;
    }
  } catch (error) {
    console.error('Error loading subscription status:', error);
  }
  return false;
}

// Noon reminder preference functions
export async function saveNoonReminderEnabled(enabled: boolean): Promise<void> {
  try {
    console.log('Saving noon reminder preference:', enabled);
    await AsyncStorage.setItem(NOON_REMINDER_ENABLED_KEY, JSON.stringify(enabled));
  } catch (error) {
    console.error('Error saving noon reminder preference:', error);
  }
}

export async function loadNoonReminderEnabled(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(NOON_REMINDER_ENABLED_KEY);
    if (data !== null) {
      const enabled = JSON.parse(data);
      console.log('Loaded noon reminder preference:', enabled);
      return enabled;
    }
  } catch (error) {
    console.error('Error loading noon reminder preference:', error);
  }
  return false;
}

// Profile functions
export async function saveProfile(profile: UserProfile): Promise<void> {
  try {
    console.log('Saving profile:', profile);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving profile:', error);
  }
}

export async function loadProfile(): Promise<UserProfile | null> {
  try {
    const data = await AsyncStorage.getItem(PROFILE_KEY);
    console.log('Raw profile data from storage:', data);
    if (data) {
      const profile = JSON.parse(data);
      console.log('Parsed profile:', profile);
      return profile;
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
  return null;
}

// Daily portions functions
export async function saveDailyPortions(dailyPortions: DailyPortions): Promise<void> {
  try {
    const key = `${DAILY_PORTIONS_PREFIX}${dailyPortions.date}`;
    console.log('Saving daily portions:', key, dailyPortions);
    await AsyncStorage.setItem(key, JSON.stringify(dailyPortions));
  } catch (error) {
    console.error('Error saving daily portions:', error);
  }
}

export async function loadDailyPortions(date: string): Promise<DailyPortions> {
  try {
    const key = `${DAILY_PORTIONS_PREFIX}${date}`;
    const data = await AsyncStorage.getItem(key);
    console.log('Loading daily portions for', date, ':', data);
    
    if (data) {
      const parsed = JSON.parse(data);
      
      // Ensure all properties exist with fallback to 0 for backward compatibility
      if (parsed && parsed.portions) {
        return {
          date: parsed.date || date,
          portions: {
            wholeGrains: parsed.portions.wholeGrains || 0,
            protein: parsed.portions.protein || 0,
            veggies: parsed.portions.veggies || 0,
            fruits: parsed.portions.fruits || 0,
            water: parsed.portions.water || 0,
            nutsSeeds: parsed.portions.nutsSeeds || 0,
            fats: parsed.portions.fats || 0,
            exercise: parsed.portions.exercise || 0,
            alcohol: parsed.portions.alcohol || 0,
          },
        };
      }
    }
  } catch (error) {
    console.error('Error loading daily portions:', error);
  }
  
  // Return default empty structure if no data found
  console.log('No data found, returning default structure for', date);
  return {
    date,
    portions: {
      wholeGrains: 0,
      protein: 0,
      veggies: 0,
      fruits: 0,
      water: 0,
      nutsSeeds: 0,
      fats: 0,
      exercise: 0,
      alcohol: 0,
    },
  };
}

export async function getAllDailyPortions(): Promise<DailyPortions[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const dailyKeys = keys.filter(key => key.startsWith(DAILY_PORTIONS_PREFIX));
    const items = await AsyncStorage.multiGet(dailyKeys);
    
    return items
      .map(([key, value]) => {
        if (value) {
          try {
            const parsed = JSON.parse(value);
            // Ensure all properties exist with fallback to 0
            if (parsed && parsed.portions) {
              return {
                date: parsed.date,
                portions: {
                  wholeGrains: parsed.portions.wholeGrains || 0,
                  protein: parsed.portions.protein || 0,
                  veggies: parsed.portions.veggies || 0,
                  fruits: parsed.portions.fruits || 0,
                  water: parsed.portions.water || 0,
                  nutsSeeds: parsed.portions.nutsSeeds || 0,
                  fats: parsed.portions.fats || 0,
                  exercise: parsed.portions.exercise || 0,
                  alcohol: parsed.portions.alcohol || 0,
                },
              } as DailyPortions;
            }
          } catch (e) {
            console.error('Error parsing daily portions:', e);
            return null;
          }
        }
        return null;
      })
      .filter((item): item is DailyPortions => item !== null)
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    console.error('Error loading all daily portions:', error);
    return [];
  }
}

// Weight entries functions
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
  } catch (error) {
    console.error('Error saving weight entry:', error);
  }
}

export async function loadWeightEntries(): Promise<WeightEntry[]> {
  try {
    const data = await AsyncStorage.getItem(WEIGHT_ENTRIES_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        console.warn('[storage] Weight entries is not an array, resetting');
        return [];
      }
      const valid = parsed.filter((e: any) =>
        e && typeof e.date === 'string' && typeof e.weight === 'number' &&
        isFinite(e.weight) && typeof e.timestamp === 'number' && isFinite(e.timestamp)
      );
      if (valid.length !== parsed.length) {
        console.warn(`[storage] Filtered ${parsed.length - valid.length} malformed weight entries`);
      }
      return valid;
    }
  } catch (error) {
    console.error('[storage] Error loading weight entries:', error);
  }
  return [];
}

export async function deleteWeightEntry(date: string): Promise<void> {
  try {
    const entries = await loadWeightEntries();
    const filtered = entries.filter(e => e.date !== date);
    await AsyncStorage.setItem(WEIGHT_ENTRIES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting weight entry:', error);
  }
}

export async function saveAllWeightEntries(entries: WeightEntry[]): Promise<void> {
  try {
    console.log('[storage] Saving all weight entries, count:', entries.length);
    await AsyncStorage.setItem(WEIGHT_ENTRIES_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('[storage] Error saving all weight entries:', error);
  }
}

// Reset time functions
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

// Info hint functions
export async function hasSeenInfoHint(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(INFO_HINT_SEEN_KEY);
    return data === 'true';
  } catch (error) {
    console.error('Error checking info hint:', error);
    return false;
  }
}

export async function saveInfoHintSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(INFO_HINT_SEEN_KEY, 'true');
  } catch (error) {
    console.error('Error saving info hint seen:', error);
  }
}
