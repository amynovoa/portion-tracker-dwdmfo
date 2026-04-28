import { Platform } from 'react-native';
import Constants from 'expo-constants';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export type VersionCheckResult =
  | { forceUpdate: false }
  | { forceUpdate: true; storeUrl: string; currentVersion: string };

function semverCompare(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return -1;
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return 1;
  }
  return 0;
}

export async function checkForceUpdate(): Promise<VersionCheckResult> {
  console.log('[ForceUpdate] Checking for force update...');
  try {
    const res = await fetch(`${BACKEND_URL}/api/app-version`, {
      signal: AbortSignal.timeout(5000),
    });
    console.log('[ForceUpdate] /api/app-version response status:', res.status);
    if (!res.ok) {
      console.log('[ForceUpdate] Non-ok response, skipping force update check');
      return { forceUpdate: false };
    }
    const data = await res.json();
    console.log('[ForceUpdate] Version data received:', data);
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const info = data[platform];
    if (!info) {
      console.log('[ForceUpdate] No platform info for', platform, '— skipping');
      return { forceUpdate: false };
    }
    const installedVersion = Constants.expoConfig?.version ?? '0.0.0';
    console.log('[ForceUpdate] Installed:', installedVersion, '| Minimum required:', info.minimum_version);
    if (semverCompare(installedVersion, info.minimum_version) < 0) {
      console.log('[ForceUpdate] Force update required. Store URL:', info.store_url);
      return { forceUpdate: true, storeUrl: info.store_url, currentVersion: info.current_version };
    }
    console.log('[ForceUpdate] App is up to date');
    return { forceUpdate: false };
  } catch (err) {
    console.log('[ForceUpdate] Check failed (network/timeout), allowing app to proceed:', err);
    return { forceUpdate: false };
  }
}
