
/**
 * Subscription Configuration
 * 
 * This file contains the configuration for subscription management.
 * Currently using simulated subscriptions for testing.
 * 
 * FOR PRODUCTION WITH REAL PAYMENTS:
 * 
 * 1. SET UP IN-APP PURCHASES IN APP STORE CONNECT:
 *    - Go to App Store Connect > Your App > Subscriptions
 *    - Create subscription group
 *    - Create two subscription products:
 *      * Product ID: com.portiontracker.app.monthly (Monthly subscription)
 *      * Product ID: com.portiontracker.app.annual (Annual subscription)
 *    - Set pricing: $2.99/month and $24.99/year
 *    - Configure 7-day free trial
 *    - Add localized descriptions
 * 
 * 2. CHOOSE A SUBSCRIPTION INTEGRATION:
 * 
 *    OPTION A: Native StoreKit (More control, more work)
 *    - Install: expo install expo-in-app-purchases
 *    - Implement purchase flow in PaywallScreen
 *    - Handle receipt validation on backend
 *    - Manage subscription status
 * 
 *    OPTION B: RevenueCat (Easier, recommended)
 *    - Create account at https://www.revenuecat.com
 *    - Install: npm install react-native-purchases
 *    - Configure products in RevenueCat dashboard
 *    - Update PaywallScreen to use RevenueCat SDK
 *    - RevenueCat handles receipt validation automatically
 * 
 * 3. UPDATE PaywallScreen.tsx:
 *    - Replace simulated subscription logic with real purchase calls
 *    - Handle purchase success/failure
 *    - Implement restore purchases
 * 
 * 4. TEST IN TESTFLIGHT:
 *    - Build with: eas build --platform ios --profile production
 *    - Upload to TestFlight
 *    - Create sandbox test accounts in App Store Connect
 *    - Test purchase flow with sandbox accounts
 * 
 * 5. SUBMIT TO APP STORE:
 *    - Ensure all subscription metadata is complete
 *    - Add screenshots showing subscription benefits
 *    - Submit for review
 */

// Product IDs for App Store Connect
// Update these to match your actual product IDs
export const PRODUCT_IDS = {
  MONTHLY: 'com.portiontracker.app.monthly',
  ANNUAL: 'com.portiontracker.app.annual',
} as const;

/**
 * Product configuration
 */
export const PRODUCT_CONFIG = {
  TRIAL_DAYS: 7,
  MONTHLY: {
    name: 'Monthly',
    description: '7-day free trial',
    price: '$2.99/month',
  },
  ANNUAL: {
    name: 'Annual',
    description: '7-day free trial',
    price: '$24.99/year',
    badge: 'BEST VALUE',
  },
} as const;

/**
 * Check if using simulated subscriptions (always true for now)
 * Set to false when real StoreKit/RevenueCat is integrated
 */
export const isUsingSimulatedSubscriptions = () => {
  return true; // Change to false when real subscriptions are integrated
};
