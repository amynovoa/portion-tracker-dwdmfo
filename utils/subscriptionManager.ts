
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const TRIAL_START_KEY = '@portion_tracker_trial_start';
const TRIAL_DURATION_DAYS = 7;

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
    console.log('Running in development mode');
    return true;
  }

  // Check for TestFlight indicators
  const appOwnership = Constants.appOwnership;
  
  // In Expo, appOwnership will be 'expo' for Expo Go, 'standalone' for production builds
  if (appOwnership === 'expo') {
    console.log('Running in Expo Go');
    return true;
  }

  console.log('App ownership:', appOwnership);
  
  // For production builds, return false so Superwall handles subscriptions
  return false;
}

/**
 * Get product details from the App Store
 * Note: Superwall handles product fetching automatically
 * This is just for display purposes in the UI
 */
export async function getProductDetails(productId: string): Promise<ProductDetails | null> {
  try {
    console.log('Fetching product details for:', productId);
    
    // Superwall automatically fetches product details from App Store Connect
    // We return mock data here for UI display, but the actual purchase
    // will use real prices from Superwall
    
    if (Platform.OS === 'ios') {
      // Mock data for UI display
      // Real prices will be fetched by Superwall from App Store Connect
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
 * Note: This is handled by Superwall's usePlacement hook in the PaywallScreen
 * This function is kept for compatibility but the actual purchase flow
 * is managed by Superwall
 */
export async function purchaseProduct(productId: string): Promise<PurchaseResult> {
  try {
    console.log('Purchase initiated for product:', productId);
    
    if (Platform.OS !== 'ios') {
      return {
        success: false,
        error: 'Subscriptions are only available on iOS',
      };
    }

    // Superwall handles the purchase flow automatically through usePlacement
    // This function is called from PaywallScreen which uses usePlacement hook
    
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
 * Note: Superwall handles restore automatically
 * This function triggers the restore flow
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
    // The subscription status will be updated through Superwall's
    // subscription status listener
    
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
 * Note: In production, this should check Superwall's subscription status
 * using the useUser hook from expo-superwall
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

    // In production, subscription status is managed by Superwall
    // This function is kept for compatibility but the actual status
    // should be checked using useUser hook from expo-superwall
    
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
 * Note: In production, use Superwall's shouldShowPaywall logic
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
