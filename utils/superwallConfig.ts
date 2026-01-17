
/**
 * Superwall Configuration
 * 
 * This file contains the configuration for Superwall integration
 * including product IDs and placement names.
 * 
 * CURRENT STATUS: Paywall is ready for production with simulated subscriptions.
 * The app uses local storage to manage subscription status, which works in all environments.
 * 
 * TO INTEGRATE REAL SUBSCRIPTIONS WITH SUPERWALL:
 * 
 * 1. CREATE SUPERWALL ACCOUNT:
 *    - Go to https://superwall.com and create an account
 *    - Create a new app in the Superwall dashboard
 * 
 * 2. GET YOUR API KEY:
 *    - In Superwall dashboard, go to Settings > API Keys
 *    - Copy your iOS API key
 *    - Add it to your .env file: EXPO_PUBLIC_SUPERWALL_API_KEY=your_key_here
 *    - Or set it as an environment variable in EAS Build secrets
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
 * 6. ENABLE SUPERWALL IN CODE:
 *    - Add "expo-superwall" back to the plugins array in app.json
 *    - Uncomment the Superwall hooks in PaywallScreen.tsx and SubscriptionContext.tsx
 *    - Build with: eas build --platform ios --profile production
 * 
 * 7. BUILD AND TEST:
 *    - Build your app with EAS Build: eas build --platform ios --profile production
 *    - Test in TestFlight with real subscriptions
 *    - Submit to App Store
 * 
 * DEVELOPER INFO:
 * - Apple Team ID: 9978T8842P (already configured in app.json and eas.json)
 * - Bundle ID: com.portiontracker.app
 */

// Superwall API Key - Get this from your Superwall dashboard
// For development/TestFlight, the app will work without a valid key (uses simulated subscriptions)
// For production, you MUST set a valid Superwall API key
export const SUPERWALL_API_KEY = process.env.EXPO_PUBLIC_SUPERWALL_API_KEY || '';

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
