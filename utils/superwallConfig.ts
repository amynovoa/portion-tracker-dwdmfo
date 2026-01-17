
/**
 * Superwall Configuration
 * 
 * This file contains the configuration for Superwall integration
 * including product IDs and placement names.
 * 
 * IMPORTANT: Superwall requires a native build and proper App Store Connect setup.
 * For TestFlight and development builds, the app uses simulated subscriptions.
 */

// Superwall API Key - This will be configured when setting up native builds
// For now, the app works without Superwall in TestFlight/dev mode
export const SUPERWALL_API_KEY = '';

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
