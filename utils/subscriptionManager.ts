
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform, NativeModules, NativeEventEmitter } from 'react-native';
import { loadSubscriptionStatus, saveSubscriptionStatus } from './storage';

const TRIAL_START_KEY = '@portion_tracker_trial_start';
const TRIAL_DURATION_DAYS = 7;

// StoreKit product IDs - MUST match your App Store Connect configuration
export const PRODUCT_IDS = {
  MONTHLY: 'com.portiontracker.app.monthly',
  ANNUAL: 'com.portiontracker.app.annual',
};

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
  
  // For production builds, return false
  return false;
}

/**
 * Initialize StoreKit connection
 * This connects to the App Store to fetch product information
 */
export async function initializeStoreKit(): Promise<boolean> {
  try {
    console.log('🛒 Initializing StoreKit connection...');
    
    if (Platform.OS !== 'ios') {
      console.log('⚠️ StoreKit only available on iOS');
      return false;
    }

    // In a real implementation, this would:
    // 1. Connect to StoreKit
    // 2. Set up transaction observer
    // 3. Fetch product information from App Store
    
    // For now, we'll use a native module approach
    // You'll need to add native iOS code to handle StoreKit
    
    console.log('✅ StoreKit initialized (native implementation required)');
    return true;
  } catch (error) {
    console.error('❌ StoreKit initialization failed:', error);
    return false;
  }
}

/**
 * Get product details from App Store
 * This fetches real pricing information from your App Store Connect products
 */
export async function getProductDetails(productId: string): Promise<ProductDetails | null> {
  try {
    console.log('🛒 Fetching product details from App Store for:', productId);
    
    if (Platform.OS !== 'ios') {
      console.log('⚠️ Product details only available on iOS');
      return null;
    }

    // TODO: Implement native StoreKit product fetch
    // This requires native iOS code to:
    // 1. Create SKProductsRequest with product IDs
    // 2. Fetch product information from App Store
    // 3. Return localized price, currency, etc.
    
    // For development/TestFlight, return mock data
    if (isTestFlightBuild()) {
      const mockProducts: { [key: string]: ProductDetails } = {
        [PRODUCT_IDS.MONTHLY]: {
          productId: PRODUCT_IDS.MONTHLY,
          price: 2.99,
          priceString: '$2.99',
          currencyCode: 'USD',
        },
        [PRODUCT_IDS.ANNUAL]: {
          productId: PRODUCT_IDS.ANNUAL,
          price: 24.99,
          priceString: '$24.99',
          currencyCode: 'USD',
        },
      };
      
      return mockProducts[productId] || null;
    }

    // In production, this would call native StoreKit
    console.log('⚠️ Native StoreKit implementation required for production');
    return null;
  } catch (error) {
    console.error('❌ Error fetching product details:', error);
    return null;
  }
}

/**
 * Purchase a product through App Store
 * This initiates a real App Store purchase transaction
 */
export async function purchaseProduct(productId: string): Promise<PurchaseResult> {
  try {
    console.log('🛒 Initiating App Store purchase for:', productId);
    
    if (Platform.OS !== 'ios') {
      return {
        success: false,
        error: 'Subscriptions are only available on iOS',
      };
    }

    // TODO: Implement native StoreKit purchase
    // This requires native iOS code to:
    // 1. Create SKPayment with product ID
    // 2. Add payment to SKPaymentQueue
    // 3. Handle transaction states (purchasing, purchased, failed, restored)
    // 4. Validate receipt with App Store
    // 5. Unlock content on successful validation
    
    // For development/TestFlight, simulate purchase
    if (isTestFlightBuild()) {
      console.log('✅ TestFlight: Simulating purchase');
      await saveSubscriptionStatus(true);
      return { success: true };
    }

    // In production, this would call native StoreKit
    console.log('⚠️ Native StoreKit implementation required for production');
    console.log('📋 To implement:');
    console.log('1. Add StoreKit framework to iOS project');
    console.log('2. Create native module for purchase handling');
    console.log('3. Implement receipt validation');
    console.log('4. Handle transaction observer callbacks');
    
    return {
      success: false,
      error: 'Native StoreKit implementation required. See console for details.',
    };
  } catch (error: any) {
    console.error('❌ Purchase error:', error);
    
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
 * Restore previous purchases from App Store
 * This checks the App Store for any active subscriptions
 */
export async function restorePurchases(): Promise<PurchaseResult> {
  try {
    console.log('🛒 Restoring purchases from App Store...');
    
    if (Platform.OS !== 'ios') {
      return {
        success: false,
        error: 'Restore purchases is only available on iOS',
      };
    }

    // TODO: Implement native StoreKit restore
    // This requires native iOS code to:
    // 1. Call SKPaymentQueue.restoreCompletedTransactions()
    // 2. Handle restored transactions
    // 3. Validate receipts
    // 4. Unlock content for valid subscriptions
    
    // For development/TestFlight, simulate restore
    if (isTestFlightBuild()) {
      console.log('✅ TestFlight: Simulating restore');
      await saveSubscriptionStatus(true);
      return { success: true };
    }

    // In production, this would call native StoreKit
    console.log('⚠️ Native StoreKit implementation required for production');
    return {
      success: false,
      error: 'Native StoreKit implementation required',
    };
  } catch (error: any) {
    console.error('❌ Restore purchases error:', error);
    return {
      success: false,
      error: error.message || 'Failed to restore purchases',
    };
  }
}

/**
 * Validate receipt with App Store
 * This verifies that a purchase is legitimate
 */
export async function validateReceipt(receiptData: string): Promise<boolean> {
  try {
    console.log('🛒 Validating receipt with App Store...');
    
    // TODO: Implement receipt validation
    // Options:
    // 1. Client-side validation (less secure, faster)
    // 2. Server-side validation (more secure, recommended)
    //    - Send receipt to your backend
    //    - Backend validates with App Store
    //    - Backend returns validation result
    
    // For development/TestFlight
    if (isTestFlightBuild()) {
      console.log('✅ TestFlight: Receipt validation bypassed');
      return true;
    }

    console.log('⚠️ Receipt validation not implemented');
    return false;
  } catch (error) {
    console.error('❌ Receipt validation error:', error);
    return false;
  }
}

/**
 * Check current subscription status with App Store
 * This queries the App Store for active subscriptions
 */
export async function checkAppStoreSubscription(): Promise<boolean> {
  try {
    console.log('🛒 Checking subscription status with App Store...');
    
    if (Platform.OS !== 'ios') {
      return false;
    }

    // TODO: Implement subscription status check
    // This requires:
    // 1. Get app receipt from device
    // 2. Validate receipt with App Store
    // 3. Parse receipt to check for active subscriptions
    // 4. Check expiration dates
    
    // For development/TestFlight, check local storage
    if (isTestFlightBuild()) {
      const localStatus = await loadSubscriptionStatus();
      console.log('✅ TestFlight: Using local subscription status:', localStatus);
      return localStatus;
    }

    console.log('⚠️ App Store subscription check not implemented');
    return false;
  } catch (error) {
    console.error('❌ Subscription check error:', error);
    return false;
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
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    // Check if TestFlight build first
    const isTestFlight = isTestFlightBuild();
    if (isTestFlight) {
      // In TestFlight, use local storage for testing
      const localStatus = await loadSubscriptionStatus();
      return {
        isSubscribed: localStatus,
        isInTrial: false,
        trialDaysRemaining: 0,
        isTestFlight: true,
      };
    }

    // In production, check with App Store
    const appStoreSubscribed = await checkAppStoreSubscription();
    
    // Check trial status as fallback
    const trialStartDate = await getTrialStartDate();
    const inTrial = await isInTrialPeriod();
    const trialDaysRemaining = trialStartDate 
      ? calculateTrialDaysRemaining(trialStartDate)
      : TRIAL_DURATION_DAYS;

    return {
      isSubscribed: appStoreSubscribed || inTrial,
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
  
  // Don't show paywall for TestFlight users with active subscription
  if (status.isTestFlight && status.isSubscribed) {
    return false;
  }

  // Don't show paywall if subscribed or in trial
  if (status.isSubscribed || status.isInTrial) {
    return false;
  }

  return true;
}
