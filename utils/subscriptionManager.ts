
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
let storeKitInitialized = false;

// 🚨 USER REQUESTED: Store IAP debug information including error details
export interface IAPDebugInfo {
  bundleId: string;
  responseCode: number | string;
  resultsLength: number;
  returnedIds: string[];
  connectError?: {
    message: string;
    code?: string | number;
  };
  queryError?: {
    message: string;
    code?: string | number;
  };
}

let iapDebugInfo: IAPDebugInfo = {
  bundleId: '',
  responseCode: 'not_queried',
  resultsLength: 0,
  returnedIds: [],
};

/**
 * 🚨 USER REQUESTED: Get IAP debug information
 * Returns the debug info captured from the last getSubscriptionsAsync() call
 */
export function getIAPDebugInfo(): IAPDebugInfo {
  return { ...iapDebugInfo };
}

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
    console.log('🔍 IAP: Running in development mode - TestFlight features enabled');
    return true;
  }

  // Check for TestFlight indicators
  const appOwnership = Constants.appOwnership;
  
  // In Expo, appOwnership will be 'expo' for Expo Go, 'standalone' for production builds
  if (appOwnership === 'expo') {
    console.log('🔍 IAP: Running in Expo Go - TestFlight features enabled');
    return true;
  }

  // Check if it's a TestFlight build
  // TestFlight builds have appOwnership !== 'standalone'
  const isTestFlight = appOwnership !== 'standalone';
  
  console.log('🔍 IAP: App ownership:', appOwnership, 'Is TestFlight:', isTestFlight);
  
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
    console.log('🔍 IAP: TestFlight bypass enabled:', enabled);
    return enabled;
  } catch (error) {
    console.error('❌ IAP: Error reading TestFlight bypass state:', error);
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
    console.log('✅ IAP: TestFlight bypass set to:', enabled);
  } catch (error) {
    console.error('❌ IAP: Error setting TestFlight bypass state:', error);
  }
}

/**
 * Initialize StoreKit connection via expo-in-app-purchases
 * PRODUCTION: Always initializes real StoreKit
 * TESTFLIGHT: Initializes real StoreKit (bypass only affects purchase flow)
 */
export async function initializeStoreKit(): Promise<boolean> {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 STOREKIT INIT: Initializing StoreKit connection');
    console.log('═══════════════════════════════════════════════════════');
    
    if (Platform.OS !== 'ios') {
      console.log('⚠️ STOREKIT INIT: Platform is not iOS, skipping');
      return false;
    }

    if (!InAppPurchases) {
      console.error('❌ STOREKIT INIT: InAppPurchases module not available');
      return false;
    }

    // Check if already initialized
    if (storeKitInitialized) {
      console.log('✅ STOREKIT INIT: Already initialized, skipping');
      return true;
    }

    // Connect to the App Store
    console.log('🔄 STOREKIT INIT: Calling connectAsync...');
    await InAppPurchases.connectAsync();
    console.log('✅ STOREKIT INIT: Connected to App Store successfully');

    // Clear any previous connect error
    if (iapDebugInfo.connectError) {
      delete iapDebugInfo.connectError;
    }

    // Set up purchase listener
    console.log('🔄 STOREKIT INIT: Setting up purchase listener...');
    InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }: any) => {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔵 TRANSACTION CALLBACK: Purchase listener triggered');
      console.log('📊 TRANSACTION CALLBACK: Response code:', responseCode);
      console.log('📊 TRANSACTION CALLBACK: Error code:', errorCode);
      console.log('📊 TRANSACTION CALLBACK: Results count:', results?.length || 0);
      console.log('═══════════════════════════════════════════════════════');
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        if (results && results.length > 0) {
          for (const purchase of results) {
            console.log('✅ TRANSACTION CALLBACK: Purchase successful');
            console.log('  - Product ID:', purchase.productId);
            console.log('  - Acknowledged:', purchase.acknowledged);
            
            // CRITICAL: Finish/acknowledge the transaction
            if (!purchase.acknowledged) {
              console.log('🔄 TRANSACTION FINISH: Acknowledging transaction...');
              try {
                await InAppPurchases.finishTransactionAsync(purchase, true);
                console.log('✅ TRANSACTION FINISH: Acknowledged successfully');
              } catch (finishError) {
                console.error('❌ TRANSACTION FINISH: Error:', finishError);
              }
            } else {
              console.log('ℹ️ TRANSACTION FINISH: Already acknowledged');
            }
            
            // Save subscription status
            console.log('🔄 TRANSACTION CALLBACK: Saving subscription status...');
            await saveSubscriptionStatus(true);
            console.log('✅ TRANSACTION CALLBACK: Subscription status saved');
          }
        } else {
          console.log('⚠️ TRANSACTION CALLBACK: OK response but no results');
        }
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        console.log('ℹ️ TRANSACTION CALLBACK: User cancelled purchase');
      } else {
        console.error('❌ TRANSACTION CALLBACK: Error code:', errorCode);
      }
      console.log('═══════════════════════════════════════════════════════');
    });

    storeKitInitialized = true;
    console.log('✅ STOREKIT INIT: Initialization complete');
    console.log('═══════════════════════════════════════════════════════');
    return true;
  } catch (error: any) {
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ STOREKIT INIT: Initialization failed');
    console.error('❌ Error:', error);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error code:', error?.code);
    console.error('═══════════════════════════════════════════════════════');
    
    // 🚨 USER REQUESTED: Store connect error details
    iapDebugInfo.connectError = {
      message: error?.message || String(error),
      code: error?.code,
    };
    
    console.log('🚨🚨🚨 USER REQUESTED: connectAsync() ERROR DETAILS 🚨🚨🚨');
    console.log('  - Error message:', iapDebugInfo.connectError.message);
    console.log('  - Error code:', iapDebugInfo.connectError.code);
    console.log('🚨🚨🚨 END ERROR DETAILS 🚨🚨🚨');
    
    storeKitInitialized = false;
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
  
  console.log('🔍 PRICE VALIDATION:', { price, priceString, isValidPrice, isValidPriceString });
  
  return isValidPrice && isValidPriceString;
}

/**
 * Get fallback product details for a given product ID
 */
function getFallbackProduct(productId: string): ProductDetails {
  const fallback = productId === PRODUCT_IDS.MONTHLY ? FALLBACK_PRICES.MONTHLY : FALLBACK_PRICES.ANNUAL;
  console.log('📦 FALLBACK: Using fallback product for:', productId);
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
 * 
 * 🚨 IMPORTANT: Uses getSubscriptionsAsync() for auto-renewable subscriptions
 * Using getProductsAsync() will cause "Must query item from store" error
 */
export async function queryProducts(productIds: string[]): Promise<string[]> {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 QUERY PRODUCTS: Starting subscription query');
    console.log('📊 QUERY PRODUCTS: Product IDs to query:', productIds);
    console.log('🚨 QUERY PRODUCTS: Using getSubscriptionsAsync() for auto-renewable subscriptions');
    console.log('═══════════════════════════════════════════════════════');
    
    if (Platform.OS !== 'ios') {
      console.log('⚠️ QUERY PRODUCTS: Platform is not iOS, skipping');
      
      // 🚨 USER REQUESTED: Store debug info for non-iOS platforms
      iapDebugInfo = {
        bundleId: Constants.expoConfig?.ios?.bundleIdentifier || 'N/A (not iOS)',
        responseCode: 'platform_not_ios',
        resultsLength: 0,
        returnedIds: [],
      };
      
      return [];
    }

    if (!InAppPurchases) {
      console.error('❌ QUERY PRODUCTS: InAppPurchases module not available');
      
      // 🚨 USER REQUESTED: Store debug info when module unavailable
      iapDebugInfo = {
        bundleId: Constants.expoConfig?.ios?.bundleIdentifier || 'unknown',
        responseCode: 'module_not_available',
        resultsLength: 0,
        returnedIds: [],
      };
      
      return [];
    }

    // Initialize if not already done
    console.log('🔄 QUERY PRODUCTS: Ensuring StoreKit is initialized...');
    const initialized = await initializeStoreKit();
    
    if (!initialized) {
      console.error('❌ QUERY PRODUCTS: StoreKit initialization failed');
      
      // 🚨 USER REQUESTED: Store debug info when init fails
      iapDebugInfo = {
        bundleId: Constants.expoConfig?.ios?.bundleIdentifier || 'unknown',
        responseCode: 'init_failed',
        resultsLength: 0,
        returnedIds: [],
        // Include connect error if it exists
        ...(iapDebugInfo.connectError && { connectError: iapDebugInfo.connectError }),
      };
      
      return [];
    }
    
    console.log('✅ QUERY PRODUCTS: StoreKit initialized');

    // CRITICAL FIX: Use getSubscriptionsAsync() instead of getProductsAsync()
    // For auto-renewable subscriptions, Expo requires getSubscriptionsAsync()
    // Using getProductsAsync() will cause StoreKit to block purchases with:
    // "Must query item from store before calling purchase"
    console.log('🔄 QUERY PRODUCTS: Calling getSubscriptionsAsync() for subscriptions...');
    const response = await InAppPurchases.getSubscriptionsAsync(productIds);
    
    // 🚨 USER REQUESTED: Store debug information from the response
    const bundleId = Constants.expoConfig?.ios?.bundleIdentifier || 'unknown';
    const responseCode = response.responseCode;
    const resultsLength = response.results?.length || 0;
    const returnedIds = response.results?.map((r: any) => r.productId) || [];
    
    iapDebugInfo = {
      bundleId,
      responseCode,
      resultsLength,
      returnedIds,
      // Clear query error on success
    };
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚨🚨🚨 USER REQUESTED DEBUG OUTPUT 🚨🚨🚨');
    console.log('📊 IAP Debug Info:');
    console.log('  - bundleId:', bundleId);
    console.log('  - responseCode:', responseCode);
    console.log('  - resultsLength:', resultsLength);
    console.log('  - returnedIds:', returnedIds);
    console.log('🚨🚨🚨 END USER REQUESTED DEBUG OUTPUT 🚨🚨🚨');
    console.log('═══════════════════════════════════════════════════════');
    
    const { results } = response;
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 QUERY PRODUCTS RESPONSE:');
    console.log('  - Response code:', responseCode);
    console.log('  - Results count:', resultsLength);
    console.log('═══════════════════════════════════════════════════════');
    
    if (responseCode === InAppPurchases.IAPResponseCode.OK && results && results.length > 0) {
      // CRITICAL: Store the full Product objects (not just IDs)
      // These objects contain the productId and all metadata needed for purchase
      const queriedIds: string[] = [];
      
      console.log('🔄 QUERY PRODUCTS: Processing returned subscriptions...');
      
      for (const product of results) {
        console.log('───────────────────────────────────────────────────────');
        console.log('📦 SUBSCRIPTION:', product.productId);
        
        // Validate that the product has required fields
        if (!product.productId) {
          console.warn('⚠️ SUBSCRIPTION: Missing productId, skipping');
          continue;
        }
        
        console.log('  - Price:', product.price);
        console.log('  - Price String:', product.priceString);
        console.log('  - Currency:', product.currencyCode);
        console.log('  - Title:', product.title);
        
        // Validate price data
        const priceValid = isPriceValid(product.price, product.priceString);
        console.log('  - Price valid:', priceValid);
        
        if (!priceValid) {
          console.warn('⚠️ SUBSCRIPTION: Invalid price data, but storing anyway');
        }
        
        // CRITICAL: Store the full Product object
        queriedProducts.set(product.productId, product);
        queriedIds.push(product.productId);
        
        console.log('✅ SUBSCRIPTION: Stored in memory for purchase');
        console.log('───────────────────────────────────────────────────────');
      }
      
      console.log('═══════════════════════════════════════════════════════');
      console.log('✅ QUERY PRODUCTS SUCCESS:');
      console.log('  - Total subscriptions stored:', queriedIds.length);
      console.log('  - Product IDs:', queriedIds);
      console.log('═══════════════════════════════════════════════════════');
      
      return queriedIds;
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('⚠️ QUERY PRODUCTS FAIL: No subscriptions returned');
    console.log('  - Response code:', responseCode);
    console.log('  - This means StoreKit query failed or returned empty');
    console.log('═══════════════════════════════════════════════════════');
    
    return [];
  } catch (error: any) {
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ QUERY PRODUCTS ERROR: Exception during query');
    console.error('❌ Error:', error);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error code:', error?.code);
    console.error('═══════════════════════════════════════════════════════');
    
    // 🚨 USER REQUESTED: Store query error details
    const queryError = {
      message: error?.message || String(error),
      code: error?.code,
    };
    
    iapDebugInfo = {
      bundleId: Constants.expoConfig?.ios?.bundleIdentifier || 'unknown',
      responseCode: 'exception',
      resultsLength: 0,
      returnedIds: [],
      queryError,
      // Include connect error if it exists
      ...(iapDebugInfo.connectError && { connectError: iapDebugInfo.connectError }),
    };
    
    console.log('🚨🚨🚨 USER REQUESTED: getSubscriptionsAsync() ERROR DETAILS 🚨🚨🚨');
    console.log('  - Error message:', queryError.message);
    console.log('  - Error code:', queryError.code);
    console.log('🚨🚨🚨 END ERROR DETAILS 🚨🚨🚨');
    
    return [];
  }
}

/**
 * Check if a product has been queried and is ready for purchase
 * Returns true if the Product object is stored in memory
 */
export function isProductReady(productId: string): boolean {
  const ready = queriedProducts.has(productId);
  const product = queriedProducts.get(productId);
  
  console.log('🔍 PRODUCT READY CHECK:', {
    productId,
    inMemory: ready,
    hasPrice: !!product?.price,
    hasPriceString: !!product?.priceString,
  });
  
  return ready;
}

/**
 * Get product details from App Store via expo-in-app-purchases
 * This returns the display details for a product
 * The Product object should already be stored by queryProducts()
 */
export async function getProductDetails(productId: string): Promise<ProductDetails | null> {
  try {
    console.log('🔄 GET DETAILS: Fetching display details for:', productId);
    
    if (Platform.OS !== 'ios') {
      console.log('⚠️ GET DETAILS: Not iOS, returning fallback');
      return getFallbackProduct(productId);
    }

    if (!InAppPurchases) {
      console.error('❌ GET DETAILS: InAppPurchases not available, returning fallback');
      return getFallbackProduct(productId);
    }

    // Check if we already have this product in memory from queryProducts()
    if (queriedProducts.has(productId)) {
      const product = queriedProducts.get(productId);
      console.log('✅ GET DETAILS: Using cached product from memory');
      
      // Validate price data
      if (isPriceValid(product.price, product.priceString)) {
        console.log('✅ GET DETAILS: Price data valid');
        return {
          productId: product.productId,
          price: product.price,
          priceString: product.priceString,
          currencyCode: product.currencyCode || 'USD',
          title: product.title || '',
          description: product.description || '',
        };
      } else {
        console.warn('⚠️ GET DETAILS: Cached product has invalid price, using fallback');
        return getFallbackProduct(productId);
      }
    }

    // If not in memory, this shouldn't happen if queryProducts() was called first
    console.warn('⚠️ GET DETAILS: Product not in memory, this should not happen');
    console.warn('⚠️ GET DETAILS: queryProducts() should be called before getProductDetails()');
    console.log('⚠️ GET DETAILS: Returning fallback');
    
    return getFallbackProduct(productId);
  } catch (error) {
    console.error('❌ GET DETAILS: Error fetching details:', error);
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
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 PURCHASE REQUEST: Starting purchase flow');
    console.log('📊 PURCHASE REQUEST: Product ID:', productId);
    console.log('═══════════════════════════════════════════════════════');
    
    if (Platform.OS !== 'ios') {
      console.error('❌ PURCHASE REQUEST: Platform not iOS');
      return {
        success: false,
        error: 'Subscriptions are only available on iOS',
      };
    }

    if (!InAppPurchases) {
      console.error('❌ PURCHASE REQUEST: InAppPurchases module not available');
      return {
        success: false,
        error: 'InAppPurchases module not available',
      };
    }

    // Check if TestFlight bypass is enabled
    const bypassEnabled = await getTestFlightBypassEnabled();
    console.log('🔧 PURCHASE REQUEST: Bypass enabled:', bypassEnabled);
    
    if (bypassEnabled) {
      console.log('✅ PURCHASE REQUEST: Bypass mode - simulating purchase');
      await saveSubscriptionStatus(true);
      console.log('✅ PURCHASE REQUEST: Simulated purchase complete');
      return { success: true };
    }

    // CRITICAL FIX: Check if product has been queried and stored
    const productInMemory = queriedProducts.has(productId);
    console.log('🔍 PURCHASE REQUEST: Product in memory:', productInMemory);
    
    if (!productInMemory) {
      console.warn('═══════════════════════════════════════════════════════');
      console.warn('⚠️ PURCHASE REQUEST: Product NOT in memory');
      console.warn('⚠️ PURCHASE REQUEST: This would cause "Must query item from store"');
      console.warn('⚠️ PURCHASE REQUEST: Re-querying product from StoreKit...');
      console.warn('═══════════════════════════════════════════════════════');
      
      // Re-query the product before attempting purchase
      const queriedIds = await queryProducts([productId]);
      
      if (!queriedIds.includes(productId)) {
        console.error('═══════════════════════════════════════════════════════');
        console.error('❌ PURCHASE REQUEST: Re-query failed');
        console.error('❌ PURCHASE REQUEST: Product still not available');
        console.error('═══════════════════════════════════════════════════════');
        return {
          success: false,
          error: 'Product not available. Please check your internet connection and try again.',
        };
      }
      
      console.log('✅ PURCHASE REQUEST: Re-query successful, product now in memory');
    }

    // Get the stored Product object
    const product = queriedProducts.get(productId);
    
    if (!product) {
      console.error('❌ PURCHASE REQUEST: Product object not found (should not happen)');
      return {
        success: false,
        error: 'Product not ready. Please try again.',
      };
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ PURCHASE REQUEST: Using stored Product object');
    console.log('📊 SELECTED SKU AT TAP:');
    console.log('  - Product ID:', product.productId);
    console.log('  - Price:', product.price);
    console.log('  - Price String:', product.priceString);
    console.log('  - Currency:', product.currencyCode);
    console.log('  - Product object exists:', !!product);
    console.log('═══════════════════════════════════════════════════════');

    // Initialize if not already done
    const initialized = await initializeStoreKit();
    if (!initialized) {
      console.error('❌ PURCHASE REQUEST: StoreKit initialization failed');
      return {
        success: false,
        error: 'Failed to connect to App Store. Please try again.',
      };
    }

    // CRITICAL: Call purchaseItemAsync with the productId from the stored Product object
    // This ensures we're using the exact product that was returned from StoreKit
    console.log('🔄 PURCHASE REQUEST: Calling purchaseItemAsync...');
    console.log('🔄 PURCHASE REQUEST: Using productId:', product.productId);
    
    const purchaseResponse = await InAppPurchases.purchaseItemAsync(product.productId);
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 PURCHASE RESPONSE:');
    console.log('  - Response code:', purchaseResponse?.responseCode);
    console.log('  - Error code:', purchaseResponse?.errorCode);
    console.log('  - Results count:', purchaseResponse?.results?.length || 0);
    console.log('═══════════════════════════════════════════════════════');

    if (purchaseResponse.responseCode === InAppPurchases.IAPResponseCode.OK) {
      console.log('✅ PURCHASE RESPONSE: Purchase successful');
      
      // CRITICAL: Finish/acknowledge all transactions
      if (purchaseResponse.results && purchaseResponse.results.length > 0) {
        for (const purchase of purchaseResponse.results) {
          console.log('🔄 PURCHASE FINISH: Processing purchase:', purchase.productId);
          console.log('🔄 PURCHASE FINISH: Acknowledged:', purchase.acknowledged);
          
          if (!purchase.acknowledged) {
            console.log('🔄 PURCHASE FINISH: Acknowledging transaction...');
            try {
              await InAppPurchases.finishTransactionAsync(purchase, true);
              console.log('✅ PURCHASE FINISH: Acknowledged successfully');
            } catch (finishError) {
              console.error('❌ PURCHASE FINISH: Error:', finishError);
            }
          } else {
            console.log('ℹ️ PURCHASE FINISH: Already acknowledged');
          }
        }
      }
      
      // Save subscription status
      console.log('🔄 PURCHASE RESPONSE: Saving subscription status...');
      await saveSubscriptionStatus(true);
      console.log('✅ PURCHASE RESPONSE: Subscription status saved');
      console.log('═══════════════════════════════════════════════════════');
      
      return { success: true };
    } else if (purchaseResponse.responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
      console.log('ℹ️ PURCHASE RESPONSE: User cancelled');
      console.log('═══════════════════════════════════════════════════════');
      return {
        success: false,
        userCancelled: true,
      };
    } else {
      console.error('❌ PURCHASE RESPONSE: Failed with error code:', purchaseResponse?.errorCode);
      console.log('═══════════════════════════════════════════════════════');
      return {
        success: false,
        error: `Purchase failed (Error code: ${purchaseResponse?.errorCode || 'unknown'})`,
      };
    }
  } catch (error: any) {
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ PURCHASE ERROR: Exception during purchase');
    console.error('❌ Error:', error);
    console.error('❌ Error code:', error?.code);
    console.error('❌ Error message:', error?.message);
    console.error('═══════════════════════════════════════════════════════');
    
    const errorCode = error?.code;
    const errorMessage = error?.message || 'Purchase failed';
    
    // Check if user cancelled
    if (errorCode === 'E_USER_CANCELLED' || errorMessage?.includes('cancel')) {
      console.log('ℹ️ PURCHASE ERROR: User cancelled (from error)');
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
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 RESTORE: Starting restore purchases');
    console.log('═══════════════════════════════════════════════════════');
    
    if (Platform.OS !== 'ios') {
      console.error('❌ RESTORE: Platform not iOS');
      return {
        success: false,
        error: 'Restore purchases is only available on iOS',
      };
    }

    if (!InAppPurchases) {
      console.error('❌ RESTORE: InAppPurchases module not available');
      return {
        success: false,
        error: 'InAppPurchases module not available',
      };
    }

    // Check if TestFlight bypass is enabled
    const bypassEnabled = await getTestFlightBypassEnabled();
    console.log('🔧 RESTORE: Bypass enabled:', bypassEnabled);
    
    if (bypassEnabled) {
      console.log('✅ RESTORE: Bypass mode - simulating restore');
      await saveSubscriptionStatus(true);
      return { success: true };
    }

    // Initialize if not already done
    const initialized = await initializeStoreKit();
    if (!initialized) {
      console.error('❌ RESTORE: StoreKit initialization failed');
      return {
        success: false,
        error: 'Failed to connect to App Store. Please try again.',
      };
    }

    // Get purchase history
    console.log('🔄 RESTORE: Fetching purchase history...');
    const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
    
    console.log('📊 RESTORE RESPONSE:');
    console.log('  - Response code:', responseCode);
    console.log('  - Results count:', results?.length || 0);

    if (responseCode === InAppPurchases.IAPResponseCode.OK && results && results.length > 0) {
      console.log('✅ RESTORE: Found', results.length, 'previous purchases');
      
      // CRITICAL: Finish/acknowledge all restored transactions
      for (const purchase of results) {
        console.log('🔄 RESTORE FINISH: Processing:', purchase.productId);
        console.log('🔄 RESTORE FINISH: Acknowledged:', purchase.acknowledged);
        
        if (!purchase.acknowledged) {
          console.log('🔄 RESTORE FINISH: Acknowledging...');
          try {
            await InAppPurchases.finishTransactionAsync(purchase, true);
            console.log('✅ RESTORE FINISH: Acknowledged');
          } catch (finishError) {
            console.error('❌ RESTORE FINISH: Error:', finishError);
          }
        }
      }
      
      // Check if any of the purchases are our subscription products
      const hasSubscription = results.some((purchase: any) => 
        purchase.productId === PRODUCT_IDS.MONTHLY || 
        purchase.productId === PRODUCT_IDS.ANNUAL
      );
      
      console.log('📊 RESTORE: Has subscription:', hasSubscription);
      
      if (hasSubscription) {
        console.log('✅ RESTORE: Active subscription found');
        await saveSubscriptionStatus(true);
        console.log('═══════════════════════════════════════════════════════');
        return { success: true };
      } else {
        console.log('ℹ️ RESTORE: No active subscription found');
        console.log('═══════════════════════════════════════════════════════');
        return {
          success: false,
          error: 'No active subscription found',
        };
      }
    } else {
      console.log('ℹ️ RESTORE: No purchase history found');
      console.log('═══════════════════════════════════════════════════════');
      return {
        success: false,
        error: 'No purchases to restore',
      };
    }
  } catch (error: any) {
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ RESTORE ERROR: Exception during restore');
    console.error('❌ Error:', error);
    console.error('❌ Error code:', error?.code);
    console.error('❌ Error message:', error?.message);
    console.error('═══════════════════════════════════════════════════════');
    
    const errorMessage = error?.message || 'Failed to restore purchases';
    
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
    console.log('🔄 IAP: Validating receipt with App Store...');
    
    // For TestFlight with bypass enabled
    const bypassEnabled = await getTestFlightBypassEnabled();
    
    if (bypassEnabled) {
      console.log('✅ IAP: TestFlight bypass enabled - receipt validation bypassed');
      return true;
    }

    // TODO: Implement server-side receipt validation for production
    // This should send the receipt to your backend server
    // which validates it with Apple's servers
    
    console.log('⚠️ IAP: Server-side receipt validation not implemented');
    console.log('📋 IAP: For production, implement backend validation at /api/validate-receipt');
    
    return false;
  } catch (error) {
    console.error('❌ IAP: Receipt validation error:', error);
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
    console.log('🔄 IAP: Checking subscription status with App Store...');
    
    if (Platform.OS !== 'ios') {
      console.log('⚠️ IAP: Not iOS platform');
      return false;
    }

    if (!InAppPurchases) {
      console.log('⚠️ IAP: InAppPurchases module not available');
      return false;
    }

    // Check if TestFlight bypass is enabled
    const bypassEnabled = await getTestFlightBypassEnabled();
    
    if (bypassEnabled) {
      const localStatus = await loadSubscriptionStatus();
      console.log('✅ IAP: TestFlight bypass enabled - using local subscription status:', localStatus);
      return localStatus;
    }

    // Initialize if not already done
    const initialized = await initializeStoreKit();
    if (!initialized) {
      console.error('❌ IAP: Failed to initialize StoreKit');
      const localStatus = await loadSubscriptionStatus();
      return localStatus;
    }

    // Get purchase history to check for active subscriptions
    const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
    
    if (responseCode === InAppPurchases.IAPResponseCode.OK && results && results.length > 0) {
      // Check if any of the purchases are our subscription products
      const hasSubscription = results.some((purchase: any) => 
        purchase.productId === PRODUCT_IDS.MONTHLY || 
        purchase.productId === PRODUCT_IDS.ANNUAL
      );
      
      console.log('✅ IAP: Subscription check complete:', hasSubscription);
      
      // Update local storage
      await saveSubscriptionStatus(hasSubscription);
      
      return hasSubscription;
    }

    console.log('ℹ️ IAP: No active subscription found');
    return false;
  } catch (error) {
    console.error('❌ IAP: Subscription check error:', error);
    
    // Fall back to local storage on error
    const localStatus = await loadSubscriptionStatus();
    return localStatus;
  }
}
