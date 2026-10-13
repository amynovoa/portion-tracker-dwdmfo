import { Linking, Platform } from 'react-native';

export type StepsAvailability = 'ready' | 'unavailable' | 'missing_module' | 'unsupported';

const HEALTH_CONNECT_PLAY_STORE =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';

const STEP_COUNT = 'HKQuantityTypeIdentifierStepCount';
const UNIT_COUNT = 'count';
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
 * Resolve ExpoHealthKit without importing @appeeky/expo-healthkit
 * (that package calls requireNativeModule at import time and crashed TestFlight).
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
    if (!native) {
      console.warn('[steps] ExpoHealthKit is not linked in this native binary');
      cachedNative = null;
      return null;
    }
    cachedNative = native;
    console.log('[steps] ExpoHealthKit native module linked');
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
    if (!native) return 'missing_module';

    // Sync helpers may be missing on some proxies — if linked, treat iOS as ready
    // and let requestAuthorization / queryStatistics fail softly later.
    if (typeof native.isHealthDataAvailable !== 'function') {
      console.warn('[steps] isHealthDataAvailable missing on proxy; assuming ready');
      return 'ready';
    }

    try {
      return native.isHealthDataAvailable() ? 'ready' : 'unavailable';
    } catch (error) {
      console.warn('[steps] isHealthDataAvailable threw; assuming ready because module is linked:', error);
      return 'ready';
    }
  } catch (error) {
    console.warn('[steps] getStepsAvailability failed:', error);
    return 'missing_module';
  }
}

export async function requestStepsAccess(): Promise<boolean> {
  try {
    const native = getNativeHealth();
    if (!native?.requestAuthorization) return false;

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
