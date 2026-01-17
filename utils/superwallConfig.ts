
/**
 * Superwall Configuration
 * 
 * This file contains the configuration for Superwall integration
 * including product IDs and placement names.
 * 
 * PRODUCTION-READY SETUP:
 * This integration is configured to work in both Sandbox (TestFlight) and Production.
 * 
 * SETUP STEPS:
 * 
 * 1. CREATE SUPERWALL ACCOUNT:
 *    - Go to https://superwall.com and create an account
 *    - Create a new app in the Superwall dashboard
 * 
 * 2. GET YOUR API KEY:
 *    - In Superwall dashboard, go to Settings > API Keys
 *    - Copy your iOS API key
 *    - Add it to .env file: EXPO_PUBLIC_SUPERWALL_API_KEY=your_key_here
 *    - For EAS Build, add it as a secret in Expo dashboard
 * 
 * 3. CONFIGURE PRODUCTS IN APP STORE CONNECT:
 *    - Go to App Store Connect > Your App > Subscriptions
 *    - Create two subscription products:
 *      * Product ID: portiontrack.monthly (Monthly subscription)
 *      * Product ID: portiontrack.annual (Annual subscription)
 *    - Set up pricing and trial periods (7-day free trial)
 * 
 * 4. CONFIGURE PRODUCTS IN SUPERWALL:
 *    - In Superwall dashboard, go to Products
 *    - Add your App Store Connect products:
 *      * portiontrack.monthly
 *      * portiontrack.annual
 * 
 * 5. CREATE PLACEMENT IN SUPERWALL:
 *    - In Superwall dashboard, go to Placements
 *    - Create a placement named: "onboarding_paywall"
 *    - Design your paywall UI in the Superwall editor
 *    - Add your products to the paywall
 * 
 * 6. BUILD AND TEST:
 *    - Build with: eas build --platform ios --profile production
 *    - Test in TestFlight with Sandbox subscriptions
 *    - Submit to App Store for production
 * 
 * DEVELOPER INFO:
 * - Apple Team ID: 9978T8842P (configured in app.json and eas.json)
 * - Bundle ID: com.portiontracker.app
 */

// Superwall API Key - Get this from your Superwall dashboard
// The app will work without a valid key (uses simulated subscriptions)
// but you need a real key for production builds
export const SUPERWALL_API_KEY = process.env.EXPO_PUBLIC_SUPERWALL_API_KEY || 'pk_test_placeholder_key_replace_with_real_key';

// Check if we have a valid API key (not the placeholder)
export const hasValidSuperwallKey = () => {
  const key = SUPERWALL_API_KEY;
  return key && 
         key.length > 10 && 
         !key.includes('placeholder') && 
         !key.includes('your_') &&
         !key.includes('replace');
};

// Product IDs from App Store Connect
// These must match the product IDs you created in App Store Connect
export const PRODUCT_IDS = {
  MONTHLY: 'portiontrack.monthly',
  ANNUAL: 'portiontrack.annual',
} as const;

// Superwall placement names
// These should match the placements configured in your Superwall dashboard
export const PLACEMENTS = {
  onboarding: 'onboarding_paywall',
  settings: 'settings_paywall',
  featureGate: 'feature_gate',
} as const;

/**
 * Product configuration
 * Maps product IDs to their display information
 */
export const PRODUCT_CONFIG = {
  TRIAL_DAYS: 7,
  MONTHLY: {
    name: 'Monthly',
    description: '7-day free trial',
    defaultPrice: '$2.99/month',
  },
  ANNUAL: {
    name: 'Annual',
    description: '7-day free trial',
    defaultPrice: '$24.99/year',
    badge: 'BEST VALUE',
  },
} as const;
