import Constants from 'expo-constants';

const MINIMUM_VERSION = '2.1.0';
const APP_STORE_URL = 'https://apps.apple.com/app/id6744042838';

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
  const installedVersion = Constants.expoConfig?.version ?? '0.0.0';
  console.log('[ForceUpdate] Installed version:', installedVersion, '| Minimum required:', MINIMUM_VERSION);
  if (semverCompare(installedVersion, MINIMUM_VERSION) < 0) {
    console.log('[ForceUpdate] Force update required. Store URL:', APP_STORE_URL);
    return { forceUpdate: true, storeUrl: APP_STORE_URL, currentVersion: MINIMUM_VERSION };
  }
  console.log('[ForceUpdate] App is up to date');
  return { forceUpdate: false };
}
