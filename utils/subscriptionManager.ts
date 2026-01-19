
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { loadSubscriptionStatus, saveSubscriptionStatus } from './storage';

// Only import InAppPurchases on iOS
let InAppPurchases: any = null;
if (Platform.OS === 'ios') {
  InAppPurchases = require('expo-in-app-purchases');
}

const TRIAL_START_KEY = '@portion_tracker_trial_start';
const TRIAL_DURATION_DAYS = 7;
const TESTFLIGHT_BYPASS_KEY = '@testflight_bypass_enabled';

// StoreKit product IDs - MUST match your App Store Connect configuration
export const PRODUCT_IDS = {
  MONTHLY: 'portiontrack.monthly',
  ANNUAL: 'portiontrack.annual',
};

// Fallback prices in case StoreKit fails or returns invalid data
const FALLBACK_PRICES = {
  MONTHLY: {
    price: '2.99',
    priceString: '$2.99',
    currencyCode: 'USD',
    title: 'Monthly Subscription',
    description: 'Monthly subscription to Portion Tracker',
  },
  ANNUAL: {
    price: '24.99',
    priceString: '$24.99',
    currencyCode: 'USD',
    title: 'Annual Subscription',
    description: 'Annual subscription to Portion Tracker',
  },
};

// Store queried Product objects globally so they can be used for purchase
// CRITICAL: We store the full Product object, not just the ID
let queriedProducts: Map<string, any> = new Map();

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
 * PRODUCTION BUILDS: Returns false (bypass disabled)
 * TESTFLIGHT/DEV BUILDS: Returns true (bypass available)
 */
export function isTestFlightBuild(): boolean {
  // Check if running in Expo Go or development
  if (__DEV__) {
    console.log('Running in development mode - TestFlight features enabled');
    return true;
  }

  // Check for TestFlight indicators
  const appOwnership = Constants.appOwnership;
  
  // In Expo, appOwnership will be 'expo' for Expo Go, 'standalone' for production builds
  if (appOwnership === 'expo') {
    console.log('Running in Expo Go - TestFlight features enabled');
    return true;
  }

  // Check if it's a TestFlight build
  // TestFlight builds have appOwnership !== 'standalone'
  const isTestFlight = appOwnership !== 'standalone';
  
  console.log('App ownership:', appOwnership, 'Is TestFlight:', isTestFlight);
  
  return isTestFlight;
}

/**
 * Get the current TestFlight bypass toggle state
 * This is stored in AsyncStorage so testers can toggle it on/off
 * ONLY WORKS IN TESTFLIGHT/DEV - Returns false in production
 */
export async function getTestFlightBypassEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(TESTFLIGHT_BYPASS_KEY);
    // Default to false if not set (use real StoreKit by default)
    const enabled = value === 'true';
    console.log('TestFlight bypass enabled:', enabled);
    return enabled;
  } catch (error) {
    console.error('Error reading TestFlight bypass state:', error);
    return false; // Default to disabled on error
  }
}

/**
 * Set the TestFlight bypass toggle state
 * Only works in TestFlight/dev builds
 * PRODUCTION BUILDS: This function does nothing
 */
export async function setTestFlightBypassEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(TESTFLIGHT_BYPASS_KEY, enabled ? 'true' : 'false');
    console.log('TestFlight bypass set to:', enabled);
  } catch (error) {
    console.error('Error setting TestFlight bypass state:', error);
  }
}

/**
 * Initialize StoreKit connection via expo-in-app-purchases
 * PRODUCTION: Always initializes real StoreKit
 * TESTFLIGHT: Initializes real StoreKit (bypass only affects purchase flow)
 */
export async function initializeStoreKit(): Promise<boolean> {
  try {
    console.log('🛒 Initializing StoreKit connection via expo-in-app-purchases...');
    
    if (Platform.OS !== 'ios') {
      console.log('⚠️ StoreKit only available on iOS');
      return false;
    }

    if (!InAppPurchases) {
      console.error('❌ InAppPurchases module not available');
      return false;
    }

    // Connect to the App Store
    await InAppPurchases.connectAsync();
    console.log('✅ Connected to App Store');

    // Set up purchase listener
    InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }: any) => {
      console.log('📱 Purchase listener triggered:', { responseCode, errorCode });
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        results?.forEach(async (purchase: any) => {
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
 * Helper function to check if price data is valid
 */
function isPriceValid(price: any, priceString: any): boolean {
  // Check if price is a valid number greater than 0
  const priceNum = parseFloat(price);
  const isValidPrice = !isNaN(priceNum) && priceNum > 0;
  
  // Check if priceString is a non-empty string
  const isValidPriceString = typeof priceString === 'string' && priceString.trim().length > 0 && priceString !== '$0.00' && priceString !== '0';
  
  console.log('🔍 Price validation:', { price, priceString, isValidPrice, isValidPriceString });
  
  return isValidPrice && isValidPriceString;
}

/**
 * Get fallback product details for a given product ID
 */
function getFallbackProduct(productId: string): ProductDetails {
  const fallback = productId === PRODUCT_IDS.MONTHLY ? FALLBACK_PRICES.MONTHLY : FALLBACK_PRICES.ANNUAL;
  console.log('📦 Using fallback product details for:', productId, fallback);
  return {
    productId,
    ...fallback,
  };
}

/**
 * Query and store Product objects from StoreKit
 * CRITICAL: This stores the full Product objects returned by StoreKit
 * These Product objects MUST be used when calling purchaseItemAsync
 * Returns array of product IDs that were successfully queried
 */
export async function queryProducts(productIds: string[]): Promise<string[]> {
  try {
    console.log('🛒 Querying products from StoreKit:', productIds);
    
    if (Platform.OS !== 'ios') {
      console.log('⚠️ Product query only available on iOS');
      return [];
    }

    if (!InAppPurchases) {
      console.error('❌ InAppPurchases module not available');
      return [];
    }

    // Initialize if not already done
    await initializeStoreKit();

    // Fetch products from App Store
    const { responseCode, results } = await InAppPurchases.getProductsAsync(productIds);
    
    console.log('🛒 Product query response:', { responseCode, resultsCount: results?.length });
    
    if (responseCode === InAppPurchases.IAPResponseCode.OK && results && results.length > 0) {
      // CRITICAL: Store the full Product objects (not just IDs)
      // These objects contain the productId and all metadata needed for purchase
      results.forEach((product: any) => {
        queriedProducts.set(product.productId, product);
        console.log('✅ Stored Product object for purchase:', {
          productId: product.productId,
          price: product.price,
          priceString: product.priceString,
        });
      });
      
      const queriedIds = results.map((p: any) => p.productId);
      console.log('✅ Successfully queried and stored products:', queriedIds);
      return queriedIds;
    }

    console.log('⚠️ No products returned from StoreKit');
    return [];
  } catch (error) {
    console.error('❌ Error querying products:', error);
    return [];
  }
}

/**
 * Check if a product has been queried and is ready for purchase
 * Returns true if the Product object is stored in memory
 */
export function isProductReady(productId: string): boolean {
  const ready = queriedProducts.has(productId);
  console.log('🔍 Product ready check:', productId, ready);
  return ready;
}

/**
 * Get product details from App Store via expo-in-app-purchases
 * This also stores the Product object for later purchase
 * PRODUCTION: Fetches real product details from App Store
 * TESTFLIGHT: Fetches real product details from App Store (sandbox)
 */
export async function getProductDetails(productId: string): Promise<ProductDetails | null> {
  try {
    console.log('🛒 Fetching product details from App Store for:', productId);
    
    if (Platform.OS !== 'ios') {
      console.log('⚠️ Product details only available on iOS - returning fallback');
      return getFallbackProduct(productId);
    }

    if (!InAppPurchases) {
      console.error('❌ InAppPurchases module not available - returning fallback');
      return getFallbackProduct(productId);
    }

    // Initialize if not already done
    await initializeStoreKit();

    // Fetch products from App Store
    const { responseCode, results } = await InAppPurchases.getProductsAsync([productId]);
    
    console.log('🛒 Product fetch response:', { responseCode, resultsCount: results?.length });
    
    if (responseCode === InAppPurchases.IAPResponseCode.OK && results && results.length > 0) {
      const product = results[0];
      
      // CRITICAL: Store the full Product object for later purchase
      queriedProducts.set(product.productId, product);
      console.log('✅ Stored Product object for purchase:', product.productId);
      
      console.log('✅ Product details fetched from StoreKit:', {
        productId: product.productId,
        price: product.price,
        priceString: product.priceString,
        currencyCode: product.currencyCode,
      });
      
      // CRITICAL FIX: Validate that the price data is actually valid
      // If StoreKit returns 0, null, undefined, or empty string, use fallback
      if (isPriceValid(product.price, product.priceString)) {
        console.log('✅ Price data is valid, using StoreKit data');
        return {
          productId: product.productId,
          price: product.price,
          priceString: product.priceString,
          currencyCode: product.currencyCode || 'USD',
          title: product.title || '',
          description: product.description || '',
        };
      } else {
        console.warn('⚠️ StoreKit returned invalid price data (0 or empty), using fallback');
        return getFallbackProduct(productId);
      }
    }

    console.log('⚠️ No product found for ID:', productId, '- returning fallback');
    return getFallbackProduct(productId);
  } catch (error) {
    console.error('❌ Error fetching product details:', error);
    return getFallbackProduct(productId);
  }
}

/**
 * Purchase a product through App Store via expo-in-app-purchases
 * CRITICAL: This function uses the Product object stored by queryProducts()
 * If the product is not in memory, it will re-query before attempting purchase
 * PRODUCTION: Always processes real App Store purchases
 * TESTFLIGHT WITH BYPASS ON: Simulates purchase (no real charge)
 * TESTFLIGHT WITH BYPASS OFF: Processes real sandbox purchases
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

    if (!InAppPurchases) {
      return {
        success: false,
        error: 'InAppPurchases module not available',
      };
    }

    // Check if TestFlight bypass is enabled
    const bypassEnabled = await getTestFlightBypassEnabled();
    
    if (bypassEnabled) {
      console.log('✅ TestFlight bypass enabled: Simulating purchase (no real charge)');
      await saveSubscriptionStatus(true);
      return { success: true };
    }

    // CRITICAL FIX: Check if product has been queried and stored
    if (!queriedProducts.has(productId)) {
      console.warn('⚠️ Product not in memory, re-querying from StoreKit:', productId);
      
      // Re-query the product before attempting purchase
      const queriedIds = await queryProducts([productId]);
      
      if (!queriedIds.includes(productId)) {
        console.error('❌ Product still not available after re-query:', productId);
        return {
          success: false,
          error: 'Product not available. Please check your internet connection and try again.',
        };
      }
      
      console.log('✅ Product re-queried successfully:', productId);
    }

    // Get the stored Product object
    const product = queriedProducts.get(productId);
    
    if (!product) {
      console.error('❌ Product object not found in memory:', productId);
      return {
        success: false,
        error: 'Product not ready. Please try again.',
      };
    }

    console.log('✅ Using stored Product object for purchase:', {
      productId: product.productId,
      price: product.price,
      priceString: product.priceString,
    });

    // Initialize if not already done
    await initializeStoreKit();

    // CRITICAL: Call purchaseItemAsync with the productId from the stored Product object
    // This ensures we're using the exact product that was returned from StoreKit
    console.log('🛒 Calling purchaseItemAsync with productId:', product.productId);
    const { responseCode, errorCode } = await InAppPurchases.purchaseItemAsync(product.productId);
    
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
    
    // CRITICAL FIX: iOS doesn't return responseCode like Android
    // Use error.code and error.message with optional chaining
    const errorCode = error?.code;
    const errorMessage = error?.message || 'Purchase failed';
    
    console.log('🔍 Error details:', { errorCode, errorMessage });
    
    // Check if user cancelled
    if (errorCode === 'E_USER_CANCELLED' || errorMessage?.includes('cancel')) {
      return {
        success: false,
        userCancelled: true,
      };
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Restore previous purchases from App Store via expo-in-app-purchases
 * PRODUCTION: Always restores real App Store purchases
 * TESTFLIGHT WITH BYPASS ON: Simulates restore
 * TESTFLIGHT WITH BYPASS OFF: Restores real sandbox purchases
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

    if (!InAppPurchases) {
      return {
        success: false,
        error: 'InAppPurchases module not available',
      };
    }

    // Check if TestFlight bypass is enabled
    const bypassEnabled = await getTestFlightBypassEnabled();
    
    if (bypassEnabled) {
      console.log('✅ TestFlight bypass enabled: Simulating restore');
      await saveSubscriptionStatus(true);
      return { success: true };
    }

    // Initialize if not already done
    await initializeStoreKit();

    // Get purchase history (real App Store in production, sandbox in TestFlight)
    console.log('🛒 Fetching purchase history...');
    const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
    
    console.log('📱 Purchase history response:', { responseCode, resultsCount: results?.length });

    if (responseCode === InAppPurchases.IAPResponseCode.OK && results && results.length > 0) {
      console.log('✅ Found', results.length, 'previous purchases');
      
      // Check if any of the purchases are our subscription products
      const hasSubscription = results.some((purchase: any) => 
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
    
    // CRITICAL FIX: iOS doesn't return responseCode like Android
    // Use error.code and error.message with optional chaining
    const errorCode = error?.code;
    const errorMessage = error?.message || 'Failed to restore purchases';
    
    console.log('🔍 Error details:', { errorCode, errorMessage });
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Validate receipt with App Store
 * TODO: Implement server-side receipt validation for production
 */
export async function validateReceipt(receiptData: string): Promise<boolean> {
  try {
    console.log('🛒 Validating receipt with App Store...');
    
    // For TestFlight with bypass enabled
    const bypassEnabled = await getTestFlightBypassEnabled();
    
    if (bypassEnabled) {
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
 * PRODUCTION: Always checks real App Store subscription status
 * TESTFLIGHT WITH BYPASS ON: Uses local storage
 * TESTFLIGHT WITH BYPASS OFF: Checks real sandbox subscription status
 */
export async function checkAppStoreSubscription(): Promise<boolean> {
  try {
    console.log('🛒 Checking subscription status with App Store...');
    
    if (Platform.OS !== 'ios') {
      return false;
    }

    if (!InAppPurchases) {
      console.log('⚠️ InAppPurchases module not available');
      return false;
    }

    // Check if TestFlight bypass is enabled
    const bypassEnabled = await getTestFlightBypassEnabled();
    
    if (bypassEnabled) {
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
      const hasSubscription = results.some((purchase: any) => 
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
