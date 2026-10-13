import { Linking, Platform } from 'react-native';

export type StepsAvailability = 'ready' | 'unavailable' | 'unsupported';

const HEALTH_CONNECT_PLAY_STORE =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';

/** HealthKit / Health Connect step count identifier (Apple string; Android maps it). */
const STEP_COUNT = 'HKQuantityTypeIdentifierStepCount';
const UNIT_COUNT = 'count';
/** HKStatisticsOptionCumulativeSum */
const CUMULATIVE_SUM = 8;

type NativeHealth = {
  isHealthDataAvailable?: () => boolean;
  requestAuthorization?: (options: {
    toRead: string[];
    toShare: string[];
    includeBackgroundRead?: boolean;
  }) => Promise<boolean>;
  getGrantedPermissions?: (candidates: string[]) => Promise<string[]>;
  queryStatistics?: (options: {
    type: string;
    unit: string;
    from?: string;
    to?: string;
    options?: number;
  }) => Promise<{ sum?: number | null }>;
  revokeAllPermissions?: () => Promise<void>;
};

let cachedNative: NativeHealth | null | undefined;

/** Reset cache — tests only. */
export function __resetStepsHealthCacheForTests(): void {
  cachedNative = undefined;
}

function getOptionalNativeLoader(): ((name: string) => NativeHealth | null) | null {
  try {
    const fromCore = require('expo-modules-core')?.requireOptionalNativeModule;
    if (typeof fromCore === 'function') return fromCore;
  } catch {
    // continue
  }
  try {
    const fromExpo = require('expo')?.requireOptionalNativeModule;
    if (typeof fromExpo === 'function') return fromExpo;
  } catch {
    // continue
  }
  return null;
}

/**
 * Get ExpoHealthKit ONLY through requireOptionalNativeModule.
 * Never `require('@appeeky/expo-healthkit')` — that package calls
 * requireNativeModule at import time and has crashed TestFlight.
 */
function getNativeHealth(): NativeHealth | null {
  if (cachedNative !== undefined) {
    return cachedNative;
  }

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    cachedNative = null;
    return null;
  }

  try {
    const load = getOptionalNativeLoader();
    if (!load) {
      console.warn('[steps] requireOptionalNativeModule unavailable');
      cachedNative = null;
      return null;
    }
    const native = load('ExpoHealthKit');
    if (!native || typeof native.isHealthDataAvailable !== 'function') {
      console.warn('[steps] ExpoHealthKit native module missing or incomplete');
      cachedNative = null;
      return null;
    }
    cachedNative = native;
    console.log('[steps] ExpoHealthKit native module ready');
    return cachedNative;
  } catch (error) {
    console.warn('[steps] Failed to access ExpoHealthKit:', error);
    cachedNative = null;
    return null;
  }
}

function startOfTodayIso(): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export function getStepsAvailability(): StepsAvailability {
  try {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return 'unsupported';
    }
    const native = getNativeHealth();
    if (!native) return 'unavailable';
    try {
      return native.isHealthDataAvailable?.() ? 'ready' : 'unavailable';
    } catch (error) {
      console.warn('[steps] isHealthDataAvailable threw:', error);
      return 'unavailable';
    }
  } catch (error) {
    console.warn('[steps] getStepsAvailability failed:', error);
    return 'unavailable';
  }
}

export async function requestStepsAccess(): Promise<boolean> {
  try {
    const native = getNativeHealth();
    if (!native?.requestAuthorization) return false;
    try {
      if (!native.isHealthDataAvailable?.()) return false;
    } catch {
      return false;
    }

    const granted = await native.requestAuthorization({
      toRead: [STEP_COUNT],
      toShare: [],
      includeBackgroundRead: false,
    });
    console.log('[steps] requestAuthorization:', granted);

    if (Platform.OS === 'android' && native.getGrantedPermissions) {
      const permissions = await native.getGrantedPermissions([STEP_COUNT]);
      const hasSteps = permissions.some(
        (permission) =>
          permission.includes('READ_STEPS') ||
          permission.includes('StepCount') ||
          permission.includes(STEP_COUNT)
      );
      console.log('[steps] Android granted permissions:', permissions);
      return hasSteps || !!granted;
    }

    return true;
  } catch (error) {
    console.error('[steps] requestStepsAccess failed:', error);
    return false;
  }
}

export async function readTodayStepCount(): Promise<number | null> {
  try {
    const native = getNativeHealth();
    if (!native?.queryStatistics) return null;
    try {
      if (!native.isHealthDataAvailable?.()) return null;
    } catch {
      return null;
    }

    const stats = await native.queryStatistics({
      type: STEP_COUNT,
      unit: UNIT_COUNT,
      from: startOfTodayIso(),
      to: new Date().toISOString(),
      options: CUMULATIVE_SUM,
    });
    const sum = stats?.sum;
    if (typeof sum !== 'number' || !Number.isFinite(sum)) return 0;
    return Math.max(0, Math.round(sum));
  } catch (error) {
    console.error('[steps] queryStatistics failed:', error);
    return null;
  }
}

export async function revokeStepsAccess(): Promise<void> {
  try {
    if (Platform.OS !== 'android') return;
    const native = getNativeHealth();
    if (!native?.revokeAllPermissions) return;
    await native.revokeAllPermissions();
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
