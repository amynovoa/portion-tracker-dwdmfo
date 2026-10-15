import { Linking, Platform } from 'react-native';
import { formatDate, getTodayString, parseDate } from '@/utils/dateUtils';

export type StepsAvailability = 'ready' | 'unavailable' | 'missing_module' | 'unsupported';

export type DailyStepCount = {
  date: string;
  steps: number;
};

const HEALTH_CONNECT_PLAY_STORE =
  'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';

const STEP_COUNT = 'HKQuantityTypeIdentifierStepCount';
const UNIT_COUNT = 'count';
const CUMULATIVE_SUM = 8;

type NativeStatistics = {
  sum?: number | null;
  startDate?: string | Date;
  endDate?: string | Date;
};

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
  }) => Promise<NativeStatistics>;
  queryStatisticsCollection?: (options: {
    type: string;
    unit: string;
    from?: string;
    to?: string;
    options?: number;
    year?: number;
    month?: number;
    day?: number;
    hour?: number;
    minute?: number;
    second?: number;
  }) => Promise<NativeStatistics[]>;
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

function dayBoundsIso(dateString: string): { from: string; to: string } {
  const start = parseDate(dateString);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const today = getTodayString();
  if (dateString === today) {
    return { from: start.toISOString(), to: new Date().toISOString() };
  }

  return { from: start.toISOString(), to: end.toISOString() };
}

function roundSteps(sum: unknown): number {
  if (typeof sum !== 'number' || !Number.isFinite(sum)) return 0;
  return Math.max(0, Math.round(sum));
}

function dateKeyFromNative(value: string | Date | undefined, fallback: string): string {
  if (!value) return fallback;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return fallback;
  return formatDate(date);
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

export async function readStepCountForDate(dateString: string): Promise<number | null> {
  try {
    const native = getNativeHealth();
    if (!native?.queryStatistics) return null;

    const { from, to } = dayBoundsIso(dateString);
    const stats = await native.queryStatistics({
      type: STEP_COUNT,
      unit: UNIT_COUNT,
      from,
      to,
      options: CUMULATIVE_SUM,
    });
    return roundSteps(stats?.sum);
  } catch (error) {
    console.error('[steps] queryStatistics failed for', dateString, error);
    return null;
  }
}

export async function readTodayStepCount(): Promise<number | null> {
  return readStepCountForDate(getTodayString());
}

/**
 * Recent daily step totals from Apple Health / Health Connect (newest first).
 * Uses statistics collection when available; falls back to per-day queries.
 */
export async function readRecentDailySteps(dayCount = 14): Promise<DailyStepCount[]> {
  const days = Math.max(1, Math.min(90, Math.floor(dayCount)));
  const dates: string[] = [];
  const today = parseDate(getTodayString());
  for (let i = 0; i < days; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(formatDate(d));
  }

  try {
    const native = getNativeHealth();
    if (!native) return [];

    const oldest = dates[dates.length - 1];
    const { from } = dayBoundsIso(oldest);
    const to = new Date().toISOString();

    if (typeof native.queryStatisticsCollection === 'function') {
      try {
        const buckets = await native.queryStatisticsCollection({
          type: STEP_COUNT,
          unit: UNIT_COUNT,
          from,
          to,
          options: CUMULATIVE_SUM,
          year: 0,
          month: 0,
          day: 1,
          hour: 0,
          minute: 0,
          second: 0,
        });

        const byDate = new Map<string, number>();
        for (const bucket of buckets ?? []) {
          const key = dateKeyFromNative(bucket.startDate, '');
          if (!key) continue;
          byDate.set(key, roundSteps(bucket.sum));
        }

        return dates.map((date) => ({
          date,
          steps: byDate.get(date) ?? 0,
        }));
      } catch (error) {
        console.warn('[steps] queryStatisticsCollection failed; falling back per day:', error);
      }
    }

    const results: DailyStepCount[] = [];
    for (const date of dates) {
      const steps = await readStepCountForDate(date);
      results.push({ date, steps: steps ?? 0 });
    }
    return results;
  } catch (error) {
    console.error('[steps] readRecentDailySteps failed:', error);
    return [];
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
