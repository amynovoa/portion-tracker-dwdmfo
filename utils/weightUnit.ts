
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadProfile, saveProfile, loadWeightEntries, saveAllWeightEntries } from '@/utils/storage';

export type WeightUnit = 'lbs' | 'kg';

const WEIGHT_UNIT_KEY = '@portion_tracker_weight_unit';

export const LBS_PER_KG = 2.20462;

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / LBS_PER_KG) * 10) / 10;
}

export function kgToLbs(kg: number): number {
  return Math.round((kg * LBS_PER_KG) * 10) / 10;
}

export async function loadWeightUnit(): Promise<WeightUnit> {
  try {
    const data = await AsyncStorage.getItem(WEIGHT_UNIT_KEY);
    if (data === 'kg') return 'kg';
  } catch (error) {
    console.error('[WeightUnit] Error loading weight unit:', error);
  }
  return 'lbs';
}

export async function saveWeightUnit(unit: WeightUnit): Promise<void> {
  try {
    console.log('[WeightUnit] Saving weight unit preference:', unit);
    await AsyncStorage.setItem(WEIGHT_UNIT_KEY, unit);
  } catch (error) {
    console.error('[WeightUnit] Error saving weight unit:', error);
  }
}

export async function convertAllStoredWeights(from: WeightUnit, to: WeightUnit): Promise<void> {
  if (from === to) {
    console.log('[WeightUnit] Units are the same, no conversion needed');
    return;
  }

  console.log(`[WeightUnit] Switching from ${from} to ${to}`);

  const convert = from === 'lbs' ? lbsToKg : kgToLbs;

  // Convert profile weights
  const profile = await loadProfile();
  if (profile) {
    const updatedProfile = {
      ...profile,
      currentWeight: convert(profile.currentWeight),
      goalWeight: convert(profile.goalWeight),
    };
    await saveProfile(updatedProfile);
    console.log(`[WeightUnit] Profile weights converted: currentWeight=${updatedProfile.currentWeight}, goalWeight=${updatedProfile.goalWeight}`);
  }

  // Convert all weight entries
  const entries = await loadWeightEntries();
  const convertedEntries = entries.map(entry => ({
    ...entry,
    weight: convert(entry.weight),
  }));
  await saveAllWeightEntries(convertedEntries);
  console.log(`[WeightUnit] Converted ${convertedEntries.length} weight entries`);
}
