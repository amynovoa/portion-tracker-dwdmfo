import { Platform } from 'react-native';

// react-native-fbsdk-next requires native code — not available in Expo Go
// Only works in production/EAS development builds
let Settings: any = null;
let AppEventsLogger: any = null;

try {
  const fbsdk = require('react-native-fbsdk-next');
  Settings = fbsdk.Settings;
  AppEventsLogger = fbsdk.AppEventsLogger;
} catch {
  // Expo Go — Meta SDK not available, silently skip
}

const isAvailable = !!AppEventsLogger && Platform.OS !== 'web';

// ─── Initialization ───────────────────────────────────────────────

export async function initMeta() {
  if (!isAvailable) return;
  try {
    await Settings.initializeSDK();
    console.log('[Meta] SDK initialized');
  } catch (e) {
    console.warn('[Meta] SDK init failed:', e);
  }
}

// ─── Standard Meta Events (used for ads optimization) ─────────────

/** Fire when user completes a subscription purchase */
export function logPurchase(amount: number, currency = 'USD') {
  if (!isAvailable) return;
  AppEventsLogger.logPurchase(amount, currency);
  console.log('[Meta] Purchase logged:', amount, currency);
}

/** Fire when user starts free trial */
export function logStartTrial() {
  if (!isAvailable) return;
  AppEventsLogger.logEvent('StartTrial');
  console.log('[Meta] StartTrial logged');
}

/** Fire when user subscribes (after trial or direct) */
export function logSubscribe(amount: number, currency = 'USD') {
  if (!isAvailable) return;
  AppEventsLogger.logEvent('Subscribe', amount, { currency });
  console.log('[Meta] Subscribe logged:', amount);
}

/** Fire when user completes registration/signup */
export function logCompleteRegistration(method = 'email') {
  if (!isAvailable) return;
  AppEventsLogger.logEvent('CompleteRegistration', null, {
    registration_method: method,
  });
  console.log('[Meta] CompleteRegistration logged');
}

/** Fire on every app open */
export function logAppOpen() {
  if (!isAvailable) return;
  AppEventsLogger.logEvent('AppOpen');
}

// ─── Custom Events (for analytics insights) ───────────────────────

/** Fire when user completes profile setup */
export function logOnboardingComplete() {
  if (!isAvailable) return;
  AppEventsLogger.logEvent('OnboardingComplete');
  console.log('[Meta] OnboardingComplete logged');
}

/** Fire when user scans a meal photo */
export function logMealPhotoAnalyzed() {
  if (!isAvailable) return;
  AppEventsLogger.logEvent('MealPhotoAnalyzed');
  console.log('[Meta] MealPhotoAnalyzed logged');
}

/** Fire when user logs daily portions */
export function logPortionsTracked(foodGroup?: string) {
  if (!isAvailable) return;
  AppEventsLogger.logEvent('PortionsTracked', null, {
    food_group: foodGroup ?? 'unknown',
  });
}

/** Fire when user hits daily goal */
export function logDailyGoalCompleted() {
  if (!isAvailable) return;
  AppEventsLogger.logEvent('DailyGoalCompleted');
  console.log('[Meta] DailyGoalCompleted logged');
}

/** Fire when user views paywall */
export function logViewPaywall() {
  if (!isAvailable) return;
  AppEventsLogger.logEvent('ViewContent', null, {
    content_type: 'paywall',
    content_name: 'Subscription Paywall',
  });
}

/** Fire when user taps subscribe button (before purchase) */
export function logInitiateCheckout() {
  if (!isAvailable) return;
  AppEventsLogger.logEvent('InitiateCheckout');
  console.log('[Meta] InitiateCheckout logged');
}

/** Fire when user views the welcome/landing screen */
export function logViewLanding() {
  if (!isAvailable) return;
  AppEventsLogger.logEvent('ViewContent', null, {
    content_type: 'landing',
    content_name: 'Welcome Screen',
  });
}
