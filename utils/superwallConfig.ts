
/**
 * Superwall Configuration
 * 
 * This file contains the configuration for Superwall integration
 * including product IDs and placement names.
 */

// Product IDs from App Store Connect
export const PRODUCT_IDS = {
  monthly: 'portiontrack.monthly',
  annual: 'portiontrack.annual',
} as const;

// Superwall placement names
// These should match the placements configured in your Superwall dashboard
export const PLACEMENTS = {
  onboarding: 'onboarding_paywall',
  settings: 'settings_paywall',
  featureGate: 'feature_gate',
} as const;

// Superwall API Key
// Replace this with your actual API key from the Superwall dashboard
export const SUPERWALL_API_KEY = 'pk_d1efbc344a5e3cdb8e5e732a2b1e3e5a9c8e5e732a2b1e3e5a9c8e5e732a2b1e';

/**
 * Product configuration
 * Maps product IDs to their display information
 */
export const PRODUCT_CONFIG = {
  [PRODUCT_IDS.monthly]: {
    name: 'Monthly',
    description: '7-day free trial',
    defaultPrice: '$2.99/month',
  },
  [PRODUCT_IDS.annual]: {
    name: 'Annual',
    description: '7-day free trial',
    defaultPrice: '$24.99/year',
    badge: 'BEST VALUE',
  },
} as const;
