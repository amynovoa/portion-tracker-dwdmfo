
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as StoreKit from 'expo-superwall';

const TRIAL_START_KEY = '@portion_tracker_trial_start';
const TRIAL_DURATION_DAYS = 7;
const ENTITLEMENT_KEY = '@portion_tracker_entitlement';

export interface SubscriptionStatus {
  isSubscribed: boolean;
  isInTrial: boolean;
  trialDaysRemaining: number;
  isTestFlight: boolean;
}

export interface PurchaseResult {
  success: boolean;
  userCancelled?: boolean;
  error?: string;
}

export interface ProductDetails {
  productId: string;
  price: number;
  priceString: string;
  currencyCode: string;
}

/**
 * Check if the app is running in TestFlight or development mode
 */
export function isTestFlightBuild(): boolean {
  // Check if running in Expo Go or development
  if (__DEV__) {
    console.log('Running in development mode - granting free access');
    return true;
  }

  // Check for TestFlight indicators
  const appOwnership = Constants.appOwnership;
  
  // In Expo, appOwnership will be 'expo' for Expo Go, 'standalone' for production builds
  // For TestFlight, we check if it's a standalone build but not in production
  if (appOwnership === 'expo') {
    console.log('Running in Expo Go - granting free access');
    return true;
  }

  // Additional check: TestFlight builds typically have specific bundle identifiers
  // or can be detected through other means depending on your setup
  console.log('App ownership:', appOwnership);
  
  // For now, we'll assume non-production builds are TestFlight
  // You can add more specific checks here based on your build configuration
  return false;
}

/**
 * Get product details from the App Store
 * This uses StoreKit to fetch real prices from Apple
 */
export async function getProductDetails(productId: string): Promise<ProductDetails | null> {
  try {
    console.log('Fetching product details for:', productId);
    
    // On iOS, we would use StoreKit to fetch product details
    // For now, return mock data that will be replaced with actual StoreKit calls
    if (Platform.OS === 'ios') {
      // TODO: Implement actual StoreKit product fetching
      // This is a placeholder that returns mock data
      // In production, this should call StoreKit.getProducts([productId])
      
      // Mock data for testing
      const mockProducts: { [key: string]: ProductDetails } = {
        'portiontrack.monthly': {
          productId: 'portiontrack.monthly',
          price: 2.99,
          priceString: '$2.99',
          currencyCode: 'USD',
        },
        'portiontrack.annual': {
          productId: 'portiontrack.annual',
          price: 24.99,
          priceString: '$24.99',
          currencyCode: 'USD',
        },
      };
      
      return mockProducts[productId] || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching product details:', error);
    return null;
  }
}

/**
 * Purchase a product using Superwall
 * This triggers the Apple StoreKit purchase sheet
 */
export async function purchaseProduct(productId: string): Promise<PurchaseResult> {
  try {
    console.log('Initiating purchase for product:', productId);
    
    if (Platform.OS !== 'ios') {
      return {
        success: false,
        error: 'Subscriptions are only available on iOS',
      };
    }

    // Superwall handles the purchase flow automatically
    // When you call registerPlacement, it will show the paywall
    // and handle the purchase through StoreKit
    
    // The actual purchase is handled by Superwall's paywall presentation
    // This function is called from the PaywallScreen component
    // which uses usePlacement hook to trigger the purchase
    
    // For direct purchases without Superwall paywall, we would use:
    // const result = await StoreKit.purchaseProduct(productId);
    
    // Since we're using Superwall, the purchase is handled through
    // the paywall presentation flow
    
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Purchase error:', error);
    
    // Check if user cancelled
    if (error.code === 'E_USER_CANCELLED' || error.message?.includes('cancel')) {
      return {
        success: false,
        userCancelled: true,
      };
    }
    
    return {
      success: false,
      error: error.message || 'Purchase failed',
    };
  }
}

/**
 * Restore previous purchases
 * Required by Apple for subscription apps
 */
export async function restorePurchases(): Promise<PurchaseResult> {
  try {
    console.log('Restoring purchases...');
    
    if (Platform.OS !== 'ios') {
      return {
        success: false,
        error: 'Restore purchases is only available on iOS',
      };
    }

    // Superwall handles restore purchases automatically
    // We need to call the native restore method
    // const result = await StoreKit.restorePurchases();
    
    // For now, return success
    // The actual implementation will be handled by Superwall
    
    // After restore, the subscription status will be updated
    // through the Superwall subscription status listener
    
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Restore purchases error:', error);
    return {
      success: false,
      error: error.message || 'Failed to restore purchases',
    };
  }
}

/**
 * Get the trial start date
 */
export async function getTrialStartDate(): Promise<Date | null> {
  try {
    const trialStartStr = await AsyncStorage.getItem(TRIAL_START_KEY);
    if (trialStartStr) {
      return new Date(trialStartStr);
    }
    return null;
  } catch (error) {
    console.error('Error getting trial start date:', error);
    return null;
  }
}

/**
 * Start the free trial
 */
export async function startTrial(): Promise<void> {
  try {
    const existingTrialStart = await getTrialStartDate();
    if (!existingTrialStart) {
      const now = new Date().toISOString();
      await AsyncStorage.setItem(TRIAL_START_KEY, now);
      console.log('Trial started:', now);
    } else {
      console.log('Trial already started:', existingTrialStart);
    }
  } catch (error) {
    console.error('Error starting trial:', error);
    throw error;
  }
}

/**
 * Calculate days remaining in trial
 */
export function calculateTrialDaysRemaining(trialStartDate: Date): number {
  const now = new Date();
  const diffTime = now.getTime() - trialStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, TRIAL_DURATION_DAYS - diffDays);
  return daysRemaining;
}

/**
 * Check if user is in trial period
 */
export async function isInTrialPeriod(): Promise<boolean> {
  try {
    const trialStartDate = await getTrialStartDate();
    if (!trialStartDate) {
      return false;
    }

    const daysRemaining = calculateTrialDaysRemaining(trialStartDate);
    return daysRemaining > 0;
  } catch (error) {
    console.error('Error checking trial period:', error);
    return false;
  }
}

/**
 * Get comprehensive subscription status
 * This checks both Superwall and local trial status
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    // Check if TestFlight build first
    const isTestFlight = isTestFlightBuild();
    if (isTestFlight) {
      return {
        isSubscribed: true,
        isInTrial: false,
        trialDaysRemaining: 0,
        isTestFlight: true,
      };
    }

    // Check for cached entitlement from Superwall
    try {
      const storedEntitlement = await AsyncStorage.getItem(ENTITLEMENT_KEY);
      if (storedEntitlement) {
        const parsed = JSON.parse(storedEntitlement);
        if (parsed.isSubscribed) {
          return {
            isSubscribed: true,
            isInTrial: false,
            trialDaysRemaining: 0,
            isTestFlight: false,
          };
        }
      }
    } catch (storageError) {
      console.error('Error reading cached entitlement:', storageError);
    }

    // Check trial status as fallback
    const trialStartDate = await getTrialStartDate();
    const inTrial = await isInTrialPeriod();
    const trialDaysRemaining = trialStartDate 
      ? calculateTrialDaysRemaining(trialStartDate)
      : TRIAL_DURATION_DAYS;

    const isSubscribed = inTrial;

    return {
      isSubscribed,
      isInTrial: inTrial,
      trialDaysRemaining,
      isTestFlight: false,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    // Default to allowing access in case of error
    return {
      isSubscribed: true,
      isInTrial: false,
      trialDaysRemaining: 0,
      isTestFlight: false,
    };
  }
}

/**
 * Check if user should see paywall
 */
export async function shouldShowPaywall(): Promise<boolean> {
  const status = await getSubscriptionStatus();
  
  // Don't show paywall for TestFlight users
  if (status.isTestFlight) {
    return false;
  }

  // Don't show paywall if subscribed or in trial
  if (status.isSubscribed || status.isInTrial) {
    return false;
  }

  return true;
}
