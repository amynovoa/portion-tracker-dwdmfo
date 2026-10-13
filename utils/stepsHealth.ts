import { Linking, Platform } from 'react-native';

type HealthModule = typeof import('@appeeky/expo-healthkit').default;

export type StepsAvailability = 'ready' | 'unavailable' | 'unsupported';

const HEALTH_CONNECT_PLAY_STORE =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';

let cachedHealth: HealthModule | null | undefined;

/**
 * Lazily load the Health module. Probes the native module first so a missing
 * native binary does not crash the JS thread via requireNativeModule.
 */
function loadHealth(): HealthModule | null {
  if (cachedHealth !== undefined) return cachedHealth;

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    cachedHealth = null;
    return null;
  }

  try {
    // Soft probe — returns null instead of throwing when native code is absent.
    const { requireOptionalNativeModule } = require('expo-modules-core') as {
      requireOptionalNativeModule: (name: string) => unknown;
    };
    const native = requireOptionalNativeModule('ExpoHealthKit');
    if (!native) {
      console.warn('[steps] ExpoHealthKit native module is not in this build');
      cachedHealth = null;
      return null;
    }

    const mod = require('@appeeky/expo-healthkit');
    cachedHealth = (mod.default ?? mod) as HealthModule;
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
    return Health.isAvailable() ? 'ready' : 'unavailable';
  } catch (error) {
    console.warn('[steps] isAvailable failed:', error);
    return 'unavailable';
  }
}

export async function requestStepsAccess(): Promise<boolean> {
  try {
    const Health = loadHealth();
    if (!Health || !Health.isAvailable()) return false;

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

    // iOS does not disclose read grants — a completed prompt is the best we get.
    return true;
  } catch (error) {
    console.error('[steps] requestStepsAccess failed:', error);
    return false;
  }
}

export async function readTodayStepCount(): Promise<number | null> {
  try {
    const Health = loadHealth();
    if (!Health || !Health.isAvailable()) return null;

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
    if (!Health || !Health.isAvailable()) return;
    if (Platform.OS !== 'android') return;
    await Health.revokeAllPermissions();
    console.log('[steps] Android Health Connect permissions revoked');
  } catch (error) {
    console.warn('[steps] revokeAllPermissions failed:', error);
  }
}

/** Open Health Connect in Play Store when the service is missing on Android. */
export async function openHealthConnectInstall(): Promise<void> {
  if (Platform.OS !== 'android') {
    await Linking.openSettings();
    return;
  }
  try {
    await Linking.openURL(HEALTH_CONNECT_PLAY_STORE);
  } catch (error) {
    console.warn('[steps] Could not open Health Connect store page:', error);
    await Linking.openSettings();
  }
}
