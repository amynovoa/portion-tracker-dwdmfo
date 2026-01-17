
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { loadSubscriptionStatus, saveSubscriptionStatus } from './storage';
import * as InAppPurchases from 'expo-in-app-purchases';

const TRIAL_START_KEY = '@portion_tracker_trial_start';
const TRIAL_DURATION_DAYS = 7;

// StoreKit product IDs - MUST match your App Store Connect configuration
export const PRODUCT_IDS = {
  MONTHLY: 'portiontrack.monthly',
  ANNUAL: 'portiontrack.annual',
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
  price: string;
  priceString: string;
  currencyCode: string;
  title: string;
  description: string;
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
 * Check if TestFlight bypass is enabled via environment variable
 */
export function isTestFlightBypassEnabled(): boolean {
  const bypassEnabled = process.env.EXPO_PUBLIC_STOREKIT_TESTFLIGHT_BYPASS === 'true';
  console.log('TestFlight bypass enabled:', bypassEnabled);
  return bypassEnabled;
}

/**
 * Initialize StoreKit connection via expo-in-app-purchases
 */
export async function initializeStoreKit(): Promise<boolean> {
  try {
    console.log('🛒 Initializing StoreKit connection via expo-in-app-purchases...');
    
    if (Platform.OS !== 'ios') {
      console.log('⚠️ StoreKit only available on iOS');
      return false;
    }

    // Connect to the App Store
    await InAppPurchases.connectAsync();
    console.log('✅ Connected to App Store');

    // Set up purchase listener
    InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }) => {
      console.log('📱 Purchase listener triggered:', { responseCode, errorCode });
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        results?.forEach(async (purchase) => {
          console.log('✅ Purchase successful:', purchase.productId);
          
          // Acknowledge the purchase
          if (!purchase.acknowledged) {
            await InAppPurchases.finishTransactionAsync(purchase, true);
            console.log('✅ Purchase acknowledged');
          }
          
          // Save subscription status
          await saveSubscriptionStatus(true);
          console.log('✅ Subscription status saved');
        });
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        console.log('ℹ️ User cancelled purchase');
      } else {
        console.error('❌ Purchase error:', errorCode);
      }
    });

    console.log('✅ StoreKit initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ StoreKit initialization failed:', error);
    return false;
  }
}

/**
 * Get product details from App Store via expo-in-app-purchases
 */
export async function getProductDetails(productId: string): Promise<ProductDetails | null> {
  try {
    console.log('🛒 Fetching product details from App Store for:', productId);
    
    if (Platform.OS !== 'ios') {
      console.log('⚠️ Product details only available on iOS');
      return null;
    }

    // Initialize if not already done
    await initializeStoreKit();

    // Fetch products from App Store
    const { responseCode, results } = await InAppPurchases.getProductsAsync([productId]);
    
    if (responseCode === InAppPurchases.IAPResponseCode.OK && results && results.length > 0) {
      const product = results[0];
      console.log('✅ Product details fetched:', product);
      
      return {
        productId: product.productId,
        price: product.price || '0',
        priceString: product.priceString || '$0.00',
        currencyCode: product.currencyCode || 'USD',
        title: product.title || '',
        description: product.description || '',
      };
    }

    console.log('⚠️ No product found for ID:', productId);
    return null;
  } catch (error) {
    console.error('❌ Error fetching product details:', error);
    return null;
  }
}

/**
 * Purchase a product through App Store via expo-in-app-purchases
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

    // Check if TestFlight bypass is enabled
    const isTestFlight = isTestFlightBuild();
    const bypassEnabled = isTestFlightBypassEnabled();
    
    if (isTestFlight && bypassEnabled) {
      console.log('✅ TestFlight bypass enabled: Simulating purchase');
      await saveSubscriptionStatus(true);
      return { success: true };
    }

    // Initialize if not already done
    await initializeStoreKit();

    // Initiate purchase
    console.log('🛒 Calling purchaseItemAsync for:', productId);
    const { responseCode, results, errorCode } = await InAppPurchases.purchaseItemAsync(productId);
    
    console.log('📱 Purchase response:', { responseCode, errorCode });

    if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      console.log('✅ Purchase successful');
      
      // Save subscription status
      await saveSubscriptionStatus(true);
      
      return { success: true };
    } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
      console.log('ℹ️ User cancelled purchase');
      return {
        success: false,
        userCancelled: true,
      };
    } else {
      console.error('❌ Purchase failed with error code:', errorCode);
      return {
        success: false,
        error: `Purchase failed (Error code: ${errorCode})`,
      };
    }
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
 * Restore previous purchases from App Store via expo-in-app-purchases
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

    // Check if TestFlight bypass is enabled
    const isTestFlight = isTestFlightBuild();
    const bypassEnabled = isTestFlightBypassEnabled();
    
    if (isTestFlight && bypassEnabled) {
      console.log('✅ TestFlight bypass enabled: Simulating restore');
      await saveSubscriptionStatus(true);
      return { success: true };
    }

    // Initialize if not already done
    await initializeStoreKit();

    // Get purchase history
    console.log('🛒 Fetching purchase history...');
    const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
    
    console.log('📱 Purchase history response:', { responseCode, resultsCount: results?.length });

    if (responseCode === InAppPurchases.IAPResponseCode.OK && results && results.length > 0) {
      console.log('✅ Found', results.length, 'previous purchases');
      
      // Check if any of the purchases are our subscription products
      const hasSubscription = results.some(purchase => 
        purchase.productId === PRODUCT_IDS.MONTHLY || 
        purchase.productId === PRODUCT_IDS.ANNUAL
      );
      
      if (hasSubscription) {
        console.log('✅ Active subscription found');
        await saveSubscriptionStatus(true);
        return { success: true };
      } else {
        console.log('ℹ️ No active subscription found');
        return {
          success: false,
          error: 'No active subscription found',
        };
      }
    } else {
      console.log('ℹ️ No purchase history found');
      return {
        success: false,
        error: 'No purchases to restore',
      };
    }
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
 */
export async function validateReceipt(receiptData: string): Promise<boolean> {
  try {
    console.log('🛒 Validating receipt with App Store...');
    
    // For TestFlight with bypass enabled
    const isTestFlight = isTestFlightBuild();
    const bypassEnabled = isTestFlightBypassEnabled();
    
    if (isTestFlight && bypassEnabled) {
      console.log('✅ TestFlight bypass enabled: Receipt validation bypassed');
      return true;
    }

    // TODO: Implement server-side receipt validation for production
    // This should send the receipt to your backend server
    // which validates it with Apple's servers
    
    console.log('⚠️ Server-side receipt validation not implemented');
    console.log('📋 For production, implement backend validation at /api/validate-receipt');
    
    return false;
  } catch (error) {
    console.error('❌ Receipt validation error:', error);
    return false;
  }
}

/**
 * Check current subscription status with App Store
 */
export async function checkAppStoreSubscription(): Promise<boolean> {
  try {
    console.log('🛒 Checking subscription status with App Store...');
    
    if (Platform.OS !== 'ios') {
      return false;
    }

    // Check if TestFlight bypass is enabled
    const isTestFlight = isTestFlightBuild();
    const bypassEnabled = isTestFlightBypassEnabled();
    
    if (isTestFlight && bypassEnabled) {
      const localStatus = await loadSubscriptionStatus();
      console.log('✅ TestFlight bypass enabled: Using local subscription status:', localStatus);
      return localStatus;
    }

    // Initialize if not already done
    await initializeStoreKit();

    // Get purchase history to check for active subscriptions
    const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
    
    if (responseCode === InAppPurchases.IAPResponseCode.OK && results && results.length > 0) {
      // Check if any of the purchases are our subscription products
      const hasSubscription = results.some(purchase => 
        purchase.productId === PRODUCT_IDS.MONTHLY || 
        purchase.productId === PRODUCT_IDS.ANNUAL
      );
      
      console.log('✅ Subscription check complete:', hasSubscription);
      
      // Update local storage
      await saveSubscriptionStatus(hasSubscription);
      
      return hasSubscription;
    }

    console.log('ℹ️ No active subscription found');
    return false;
  } catch (error) {
    console.error('❌ Subscription check error:', error);
    
    // Fall back to local storage on error
    const localStatus = await loadSubscriptionStatus();
    return localStatus;
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
    const bypassEnabled = isTestFlightBypassEnabled();
    
    if (isTestFlight && bypassEnabled) {
      // In TestFlight/Dev with bypass enabled, use local storage for testing
      const localStatus = await loadSubscriptionStatus();
      return {
        isSubscribed: localStatus,
        isInTrial: false,
        trialDaysRemaining: 0,
        isTestFlight: true,
      };
    }

    // In production or TestFlight without bypass, check with App Store
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
  
  // Don't show paywall for TestFlight users with bypass enabled and active subscription
  if (status.isTestFlight && status.isSubscribed) {
    return false;
  }

  // Don't show paywall if subscribed or in trial
  if (status.isSubscribed || status.isInTrial) {
    return false;
  }

  return true;
}

/**
 * Disconnect from StoreKit (cleanup)
 */
export async function disconnectStoreKit(): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      await InAppPurchases.disconnectAsync();
      console.log('✅ Disconnected from App Store');
    }
  } catch (error) {
    console.error('❌ Error disconnecting from StoreKit:', error);
  }
}
