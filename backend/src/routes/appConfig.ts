import type { App } from '../index.js';

// Bump this to force any installed app version below it into the mandatory update
// screen. Just edit this value and redeploy the backend — no new app build required
// for the enforcement to take effect on devices that already have the app installed.
const MINIMUM_APP_VERSION = '1.0.0';

export function registerAppConfigRoute(app: App) {
  app.get('/app-config', async (request, reply) => {
    return { minimumVersion: MINIMUM_APP_VERSION };
  });
}
