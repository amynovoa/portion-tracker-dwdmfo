import Constants from 'expo-constants';
import { Platform } from 'react-native';

const APP_STORE_URL = 'https://apps.apple.com/app/id6744042838';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.amynovoa.portiontracker';
const BACKEND_URL = (Constants.expoConfig?.extra?.backendUrl as string | undefined) ?? '';
const FETCH_TIMEOUT_MS = 5000;

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

// Checks the backend for the current minimum required app version, so updates can be
// enforced on already-installed apps at any time without shipping a new build. Fails
// open (never blocks the user) if the backend is unreachable or returns something
// unexpected — a version check should never be the reason someone can't use the app.
export async function checkForceUpdate(): Promise<VersionCheckResult> {
  const installedVersion = Constants.expoConfig?.version ?? '0.0.0';

  if (!BACKEND_URL) {
    console.warn('[ForceUpdate] Backend URL not configured — skipping remote version check');
    return { forceUpdate: false };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const response = await fetch(`${BACKEND_URL}/app-config`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      console.warn('[ForceUpdate] app-config fetch failed with status', response.status);
      return { forceUpdate: false };
    }

    const data = await response.json();
    const minimumVersion = typeof data?.minimumVersion === 'string' ? data.minimumVersion : null;
    if (!minimumVersion) {
      console.warn('[ForceUpdate] app-config response missing minimumVersion');
      return { forceUpdate: false };
    }

    console.log('[ForceUpdate] Installed version:', installedVersion, '| Minimum required:', minimumVersion);
    if (semverCompare(installedVersion, minimumVersion) < 0) {
      const storeUrl = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
      console.log('[ForceUpdate] Force update required. Store URL:', storeUrl);
      return { forceUpdate: true, storeUrl, currentVersion: minimumVersion };
    }
    console.log('[ForceUpdate] App is up to date');
    return { forceUpdate: false };
  } catch (error) {
    console.warn('[ForceUpdate] Version check failed, not blocking user:', error);
    return { forceUpdate: false };
  }
}
