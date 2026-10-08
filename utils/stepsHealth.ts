import { Linking, Platform } from 'react-native';

type HealthModule = typeof import('@appeeky/expo-healthkit').default;

export type StepsAvailability = 'ready' | 'unavailable' | 'unsupported';

const HEALTH_CONNECT_PLAY_STORE =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';

function loadHealth(): HealthModule | null {
  try {
    const mod = require('@appeeky/expo-healthkit');
    return (mod.default ?? mod) as HealthModule;
  } catch (error) {
    console.warn('[steps] Health module not available:', error);
    return null;
  }
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getStepsAvailability(): StepsAvailability {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return 'unsupported';
  }
  const Health = loadHealth();
  if (!Health) return 'unavailable';
  try {
    return Health.isAvailable() ? 'ready' : 'unavailable';
  } catch (error) {
    console.warn('[steps] isAvailable failed:', error);
    return 'unavailable';
  }
}

export async function requestStepsAccess(): Promise<boolean> {
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
}

export async function readTodayStepCount(): Promise<number | null> {
  const Health = loadHealth();
  if (!Health || !Health.isAvailable()) return null;

  try {
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
  const Health = loadHealth();
  if (!Health || !Health.isAvailable()) return;
  if (Platform.OS !== 'android') return;
  try {
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
