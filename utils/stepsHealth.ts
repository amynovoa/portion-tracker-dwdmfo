import { Linking, Platform } from 'react-native';

type HealthModule = typeof import('@appeeky/expo-healthkit').default;

export type StepsAvailability = 'ready' | 'unavailable' | 'unsupported';

const HEALTH_CONNECT_PLAY_STORE =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';

let cachedHealth: HealthModule | null | undefined;

/** Reset cache — used by tests only. */
export function __resetStepsHealthCacheForTests(): void {
  cachedHealth = undefined;
}

/**
 * Soft-check whether the ExpoHealthKit native binary is present.
 * Returns:
 *  - true  → native module found
 *  - false → native module missing
 *  - null  → probe API unavailable; caller may try a guarded require
 */
function probeNativeHealthKit(): boolean | null {
  try {
    // Prefer expo-modules-core (same source Expo re-exports).
    let requireOptionalNativeModule: ((name: string) => unknown) | undefined;
    try {
      requireOptionalNativeModule = require('expo-modules-core').requireOptionalNativeModule;
    } catch {
      try {
        requireOptionalNativeModule = require('expo').requireOptionalNativeModule;
      } catch {
        requireOptionalNativeModule = undefined;
      }
    }

    if (typeof requireOptionalNativeModule !== 'function') {
      return null;
    }

    return requireOptionalNativeModule('ExpoHealthKit') != null;
  } catch (error) {
    console.warn('[steps] native probe failed:', error);
    return false;
  }
}

/**
 * Lazily load the Health JS module.
 * Never throws. Missing / broken native code → null (feature shows unavailable).
 */
function loadHealth(): HealthModule | null {
  if (cachedHealth !== undefined) {
    return cachedHealth;
  }

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    cachedHealth = null;
    return null;
  }

  try {
    const probe = probeNativeHealthKit();
    if (probe === false) {
      console.warn('[steps] ExpoHealthKit native module is not in this build');
      cachedHealth = null;
      return null;
    }

    // Only require the JS package after soft probe (or if probe API missing).
    // The package top-level calls requireNativeModule — must stay inside try/catch.
    const mod = require('@appeeky/expo-healthkit');
    const Health = (mod?.default ?? mod) as HealthModule | undefined;
    if (!Health || typeof Health.isAvailable !== 'function') {
      console.warn('[steps] Health module shape unexpected');
      cachedHealth = null;
      return null;
    }

    cachedHealth = Health;
    return cachedHealth;
  } catch (error) {
    console.warn('[steps] Health module not available:', error);
    cachedHealth = null;
    return null;
  }
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getStepsAvailability(): StepsAvailability {
  try {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return 'unsupported';
    }
    const Health = loadHealth();
    if (!Health) return 'unavailable';
    try {
      return Health.isAvailable() ? 'ready' : 'unavailable';
    } catch (error) {
      console.warn('[steps] isAvailable threw:', error);
      return 'unavailable';
    }
  } catch (error) {
    console.warn('[steps] getStepsAvailability failed:', error);
    return 'unavailable';
  }
}

export async function requestStepsAccess(): Promise<boolean> {
  try {
    const Health = loadHealth();
    if (!Health) return false;
    let available = false;
    try {
      available = Health.isAvailable();
    } catch {
      return false;
    }
    if (!available) return false;

    const granted = await Health.requestAuthorization({
      toRead: [Health.QuantityType.stepCount],
    });
    console.log('[steps] requestAuthorization:', granted);

    if (Platform.OS === 'android') {
      const permissions = await Health.getGrantedPermissions();
      const hasSteps = permissions.some(
        (permission) =>
          permission.includes('READ_STEPS') || permission.includes('StepCount')
      );
      console.log('[steps] Android granted permissions:', permissions);
      return hasSteps || granted;
    }

    return true;
  } catch (error) {
    console.error('[steps] requestStepsAccess failed:', error);
    return false;
  }
}

export async function readTodayStepCount(): Promise<number | null> {
  try {
    const Health = loadHealth();
    if (!Health) return null;
    try {
      if (!Health.isAvailable()) return null;
    } catch {
      return null;
    }

    const stats = await Health.queryStatistics({
      type: Health.QuantityType.stepCount,
      unit: Health.Unit.count,
      from: startOfToday(),
      to: new Date(),
      options: Health.StatisticsOption.cumulativeSum,
    });
    const sum = stats.sum;
    if (typeof sum !== 'number' || !Number.isFinite(sum)) return 0;
    return Math.max(0, Math.round(sum));
  } catch (error) {
    console.error('[steps] queryStatistics failed:', error);
    return null;
  }
}

export async function revokeStepsAccess(): Promise<void> {
  try {
    const Health = loadHealth();
    if (!Health) return;
    if (Platform.OS !== 'android') return;
    try {
      if (!Health.isAvailable()) return;
    } catch {
      return;
    }
    await Health.revokeAllPermissions();
    console.log('[steps] Android Health Connect permissions revoked');
  } catch (error) {
    console.warn('[steps] revokeAllPermissions failed:', error);
  }
}

export async function openHealthConnectInstall(): Promise<void> {
  try {
    if (Platform.OS !== 'android') {
      await Linking.openSettings();
      return;
    }
    await Linking.openURL(HEALTH_CONNECT_PLAY_STORE);
  } catch (error) {
    console.warn('[steps] Could not open Health Connect store page:', error);
    try {
      await Linking.openSettings();
    } catch {
      // ignore
    }
  }
}
