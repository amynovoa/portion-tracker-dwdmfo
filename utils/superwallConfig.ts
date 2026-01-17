
/**
 * Superwall Configuration
 * 
 * This file contains the configuration for Superwall integration
 * including product IDs and placement names.
 * 
 * IMPORTANT: Replace SUPERWALL_API_KEY with your actual API key from Superwall dashboard
 */

// Superwall API Key - Get this from your Superwall dashboard
// For iOS: https://superwall.com/dashboard
export const SUPERWALL_API_KEY = 'pk_d1efbc344a5e3cdb8e5e732a2b1e3e5a9c8e5e732a2b1e3e5a9c8e5e732a2b1e';

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
