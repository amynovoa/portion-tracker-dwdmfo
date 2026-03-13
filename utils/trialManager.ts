import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_LAUNCH_KEY = 'first_launch_timestamp';
const TRIAL_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function recordFirstLaunch(): Promise<void> {
  const existing = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
  if (!existing) {
    const now = Date.now();
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, now.toString());
    console.log('📅 TRIAL MANAGER: First launch recorded at', new Date(now).toISOString());
  } else {
    console.log('📅 TRIAL MANAGER: First launch already recorded, skipping');
  }
}

export async function getFirstLaunchTimestamp(): Promise<number | null> {
  const val = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
  return val ? parseInt(val, 10) : null;
}

export async function isWithinTrialPeriod(): Promise<boolean> {
  const timestamp = await getFirstLaunchTimestamp();
  if (!timestamp) return false;
  const within = Date.now() - timestamp < TRIAL_DURATION_MS;
  console.log('📅 TRIAL MANAGER: isWithinTrialPeriod =', within);
  return within;
}

export async function hasTrialExpired(): Promise<boolean> {
  const timestamp = await getFirstLaunchTimestamp();
  if (!timestamp) return false;
  const expired = Date.now() - timestamp >= TRIAL_DURATION_MS;
  console.log('📅 TRIAL MANAGER: hasTrialExpired =', expired);
  return expired;
}

export async function isNewUser(): Promise<boolean> {
  const timestamp = await getFirstLaunchTimestamp();
  const newUser = timestamp === null;
  console.log('📅 TRIAL MANAGER: isNewUser =', newUser);
  return newUser;
}
