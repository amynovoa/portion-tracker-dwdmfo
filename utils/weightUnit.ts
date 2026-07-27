
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadProfile, saveProfile, loadWeightEntries, saveAllWeightEntries, loadWaistEntries, saveAllWaistEntries } from '@/utils/storage';

export type WeightUnit = 'lbs' | 'kg';

const WEIGHT_UNIT_KEY = '@portion_tracker_weight_unit';

export const LBS_PER_KG = 2.20462;
export const INCHES_PER_CM = 0.393701;

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / LBS_PER_KG) * 10) / 10;
}

export function kgToLbs(kg: number): number {
  return Math.round((kg * LBS_PER_KG) * 10) / 10;
}

export function inchesToCm(inches: number): number {
  return Math.round((inches / INCHES_PER_CM) * 10) / 10;
}

export function cmToInches(cm: number): number {
  return Math.round((cm * INCHES_PER_CM) * 10) / 10;
}

export async function loadWeightUnit(): Promise<WeightUnit> {
  try {
    const data = await AsyncStorage.getItem(WEIGHT_UNIT_KEY);
    if (data === 'kg') return 'kg';
    if (data === 'lbs') return 'lbs';
  } catch (error) {
    console.error('[WeightUnit] Error loading weight unit:', error);
  }
  // No stored preference — pick a sensible default based on system locale.
  try {
    const Localization = require('expo-localization');
    const systemLocale = Localization.getLocales?.()[0]?.languageCode;
    if (systemLocale === 'es') {
      console.log('[WeightUnit] No stored preference; system locale is Spanish — defaulting to kg');
      return 'kg';
    }
  } catch (error) {
    console.error('[WeightUnit] Error detecting system locale:', error);
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
  const convertLength = from === 'lbs' ? inchesToCm : cmToInches;

  // Convert profile weights and height
  const profile = await loadProfile();
  if (profile) {
    const updatedProfile = {
      ...profile,
      currentWeight: convert(profile.currentWeight),
      goalWeight: convert(profile.goalWeight),
      height: profile.height !== undefined ? convertLength(profile.height) : undefined,
    };
    await saveProfile(updatedProfile);
    console.log(`[WeightUnit] Profile weights converted: currentWeight=${updatedProfile.currentWeight}, goalWeight=${updatedProfile.goalWeight}, height=${updatedProfile.height}`);
  }

  // Convert all weight entries
  const entries = await loadWeightEntries();
  const convertedEntries = entries.map(entry => ({
    ...entry,
    weight: convert(entry.weight),
  }));
  await saveAllWeightEntries(convertedEntries);
  console.log(`[WeightUnit] Converted ${convertedEntries.length} weight entries`);

  // Convert all waist entries
  const waistEntries = await loadWaistEntries();
  const convertedWaistEntries = waistEntries.map(entry => ({
    ...entry,
    waist: convertLength(entry.waist),
  }));
  await saveAllWaistEntries(convertedWaistEntries);
  console.log(`[WeightUnit] Converted ${convertedWaistEntries.length} waist entries`);
}
