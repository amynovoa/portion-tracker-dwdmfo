
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

// StoreKit product IDs - MUST match your App Store Connect configuration
export const PRODUCT_IDS = {
  MONTHLY: 'portiontrack.monthly',
  ANNUAL: 'portiontrack.annual',
};

// Fallback prices for display only - NOT used for purchase readiness
const FALLBACK_PRICES = {
  MONTHLY: {
    price: '3.99',
    priceString: '$3.99',
    currencyCode: 'USD',
    title: 'Monthly Subscription',
    description: 'Monthly subscription to Portion Tracker',
  },
  ANNUAL: {
    price: '29.99',
    priceString: '$29.99',
    currencyCode: 'USD',
    title: 'Annual Subscription',
    description: 'Annual subscription to Portion Tracker',
  },
};

// Store queried Product objects in memory keyed by productId
let queriedProducts: Map<string, any> = new Map();
let storeKitInitialized = false;

// Store IAP debug information including error details
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
 * Get IAP debug information
 * Returns the debug info captured from the last getProductsAsync() call
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
 * Emit subscription update event to notify context
 * This allows immediate UI updates without polling AsyncStorage
 */
function emitSubscriptionUpdate(subscribed: boolean) {
  try {
    // Dynamically import to avoid circular dependency
    const { subscriptionEmitter, SUBSCRIPTION_UPDATED_EVENT } = require('@/contexts/SubscriptionContext');
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('📡 EMIT EVENT: Emitting subscription update event');
    console.log('📊 EMIT EVENT: New subscription status:', subscribed);
    console.log('═══════════════════════════════════════════════════════');
    
    subscriptionEmitter.emit(SUBSCRIPTION_UPDATED_EVENT, subscribed);
    
    console.log('✅ EMIT EVENT: Event emitted successfully');
  } catch (error) {
    console.error('❌ EMIT EVENT: Failed to emit subscription update:', error);
  }
}

/**
 * Initialize StoreKit connection via expo-in-app-purchases
 * This MUST be called before getProductsAsync()
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

    // Connect to the App Store BEFORE querying products
    console.log('🔄 STOREKIT INIT: Calling connectAsync...');
    await InAppPurchases.connectAsync();
    console.log('✅ STOREKIT INIT: Connected to App Store successfully');

    // Clear any previous connect error
    if (iapDebugInfo.connectError) {
      delete iapDebugInfo.connectError;
    }

    // Set up the persistent background purchase listener
    console.log('🔄 STOREKIT INIT: Setting up purchase listener...');
    registerPersistentListener();

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
    
    // Store connect error details
    iapDebugInfo.connectError = {
      message: error?.message || String(error),
      code: error?.code,
    };
    
    console.log('🚨🚨🚨 connectAsync() ERROR DETAILS 🚨🚨🚨');
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
 * Fallback prices can display, but purchase must be disabled unless product exists in memory
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
 * Query products using getProductsAsync with subscription IDs
 * Store the returned results objects in memory keyed by productId
 */
export async function queryProducts(productIds: string[]): Promise<string[]> {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 QUERY PRODUCTS: Starting product query');
    console.log('📊 QUERY PRODUCTS: Product IDs to query:', productIds);
    console.log('🚨 QUERY PRODUCTS: Using getProductsAsync() for subscriptions');
    console.log('═══════════════════════════════════════════════════════');
    
    if (Platform.OS !== 'ios') {
      console.log('⚠️ QUERY PRODUCTS: Platform is not iOS, skipping');
      
      // Store debug info for non-iOS platforms
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
      
      // Store debug info when module unavailable
      iapDebugInfo = {
        bundleId: Constants.expoConfig?.ios?.bundleIdentifier || 'unknown',
        responseCode: 'module_not_available',
        resultsLength: 0,
        returnedIds: [],
      };
      
      return [];
    }

    // Ensure connectAsync() happens immediately before getProductsAsync()
    console.log('🔄 QUERY PRODUCTS: Ensuring StoreKit is initialized...');
    const initialized = await initializeStoreKit();
    
    if (!initialized) {
      console.error('❌ QUERY PRODUCTS: StoreKit initialization failed');
      
      // Store debug info when init fails
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

    // Use getProductsAsync() instead of getSubscriptionsAsync()
    console.log('🔄 QUERY PRODUCTS: Calling getProductsAsync() for subscriptions...');
    const response = await InAppPurchases.getProductsAsync(productIds);
    
    // Store debug information from the response
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
    console.log('🚨🚨🚨 IAP DEBUG OUTPUT 🚨🚨🚨');
    console.log('📊 IAP Debug Info:');
    console.log('  - bundleId:', bundleId);
    console.log('  - responseCode:', responseCode);
    console.log('  - resultsLength:', resultsLength);
    console.log('  - returnedIds:', returnedIds);
    console.log('🚨🚨🚨 END DEBUG OUTPUT 🚨🚨🚨');
    console.log('═══════════════════════════════════════════════════════');
    
    const { results } = response;
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 QUERY PRODUCTS RESPONSE:');
    console.log('  - Response code:', responseCode);
    console.log('  - Results count:', resultsLength);
    console.log('═══════════════════════════════════════════════════════');
    
    if (responseCode === InAppPurchases.IAPResponseCode.OK && results && results.length > 0) {
      // Store the full Product objects in memory keyed by productId
      const queriedIds: string[] = [];
      
      console.log('🔄 QUERY PRODUCTS: Processing returned products...');
      
      for (const product of results) {
        console.log('───────────────────────────────────────────────────────');
        console.log('📦 PRODUCT:', product.productId);
        
        // Validate that the product has required fields
        if (!product.productId) {
          console.warn('⚠️ PRODUCT: Missing productId, skipping');
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
          console.warn('⚠️ PRODUCT: Invalid price data, but storing anyway');
        }
        
        // Store the full Product object keyed by productId
        queriedProducts.set(product.productId, product);
        queriedIds.push(product.productId);
        
        console.log('✅ PRODUCT: Stored in memory for purchase');
        console.log('───────────────────────────────────────────────────────');
      }
      
      console.log('═══════════════════════════════════════════════════════');
      console.log('✅ QUERY PRODUCTS SUCCESS:');
      console.log('  - Total products stored:', queriedIds.length);
      console.log('  - Product IDs:', queriedIds);
      console.log('═══════════════════════════════════════════════════════');
      
      return queriedIds;
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('⚠️ QUERY PRODUCTS FAIL: No products returned');
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
    
    // Store query error details
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
    
    console.log('🚨🚨🚨 getProductsAsync() ERROR DETAILS 🚨🚨🚨');
    console.log('  - Error message:', queryError.message);
    console.log('  - Error code:', queryError.code);
    console.log('🚨🚨🚨 END ERROR DETAILS 🚨🚨🚨');
    
    return [];
  }
}

/**
 * Check if a product has been queried and is ready for purchase
 * Returns true ONLY if the Product object exists in memory from StoreKit
 * Fallback prices do NOT make a product ready
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
 * Get product details for display
 * Fallback prices can display, but purchase must be disabled unless product exists in memory
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
        console.warn('⚠️ GET DETAILS: Cached product has invalid price, using fallback for display');
        return getFallbackProduct(productId);
      }
    }

    // If not in memory, return fallback for display
    console.warn('⚠️ GET DETAILS: Product not in memory, returning fallback for display');
    console.warn('⚠️ GET DETAILS: queryProducts() should be called before getProductDetails()');
    
    return getFallbackProduct(productId);
  } catch (error) {
    console.error('❌ GET DETAILS: Error fetching details:', error);
    return getFallbackProduct(productId);
  }
}

// Holds the resolve function for the in-flight one-shot purchase promise.
// Only one purchase can be in flight at a time.
let pendingPurchaseResolve: ((result: PurchaseResult) => void) | null = null;

/**
 * Re-register the persistent background listener.
 * Called after a one-shot purchase promise resolves so that background
 * transaction events (e.g. deferred purchases, renewals) are still handled.
 */
function registerPersistentListener() {
  if (!InAppPurchases) return;

  InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }: any) => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 PERSISTENT LISTENER: Purchase event received');
    console.log('📊 PERSISTENT LISTENER: Response code:', responseCode);
    console.log('📊 PERSISTENT LISTENER: Error code:', errorCode);
    console.log('📊 PERSISTENT LISTENER: Results count:', results?.length || 0);
    console.log('═══════════════════════════════════════════════════════');

    if (responseCode === InAppPurchases?.IAPResponseCode?.OK && results && results.length > 0) {
      for (const purchase of results) {
        const isValidSubscription =
          purchase?.productId === PRODUCT_IDS.MONTHLY ||
          purchase?.productId === PRODUCT_IDS.ANNUAL;

        if (isValidSubscription) {
          console.log('🔄 PERSISTENT LISTENER: Valid subscription - Unlocking entitlement...');
          await saveSubscriptionStatus(true);
          emitSubscriptionUpdate(true);
          console.log('✅ PERSISTENT LISTENER: Entitlement unlocked');
        }

        if (!purchase?.acknowledged) {
          try {
            await InAppPurchases.finishTransactionAsync(purchase, true);
            console.log('✅ PERSISTENT LISTENER: Transaction acknowledged');
          } catch (finishError) {
            console.error('❌ PERSISTENT LISTENER: Error acknowledging transaction:', finishError);
          }
        }
      }
    }
  });
}

/**
 * Purchase a product through App Store.
 *
 * Returns a Promise that resolves ONLY after the StoreKit purchase listener
 * fires — not immediately after purchaseItemAsync() returns. This prevents
 * the "cancel = fake success" bug where the UI showed "Success!" before
 * StoreKit had confirmed (or denied) the purchase.
 *
 * Flow:
 *   purchaseItemAsync() → Apple payment sheet → listener fires →
 *     OK + valid productId  → { success: true }  (entitlement unlocked)
 *     USER_CANCELED         → { success: false, userCancelled: true }
 *     any other code        → { success: false, error: ... }
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

    // Verify product exists in memory
    const productInMemory = queriedProducts.has(productId);
    console.log('🔍 PURCHASE REQUEST: Product in memory:', productInMemory);

    if (!productInMemory) {
      console.error('❌ PURCHASE REQUEST: Product NOT in memory — cannot purchase');
      return {
        success: false,
        error: 'Product not available. Please check your internet connection and try again.',
      };
    }

    const product = queriedProducts.get(productId);
    if (!product) {
      console.error('❌ PURCHASE REQUEST: Product object not found (should not happen)');
      return { success: false, error: 'Product not ready. Please try again.' };
    }

    console.log('✅ PURCHASE REQUEST: Using stored Product object');
    console.log('  - Product ID:', product.productId);
    console.log('  - Price String:', product.priceString);

    // Initialize if not already done
    const initialized = await initializeStoreKit();
    if (!initialized) {
      console.error('❌ PURCHASE REQUEST: StoreKit initialization failed');
      return { success: false, error: 'Failed to connect to App Store. Please try again.' };
    }

    // Build a Promise that resolves from the one-shot listener callback.
    // expo-in-app-purchases only supports ONE active listener at a time, so we
    // replace the persistent listener here and restore it after resolution.
    const purchasePromise = new Promise<PurchaseResult>((resolve) => {
      pendingPurchaseResolve = resolve;

      InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }: any) => {
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔵 ONE-SHOT LISTENER: Purchase event received');
        console.log('📊 ONE-SHOT LISTENER: Response code:', responseCode);
        console.log('📊 ONE-SHOT LISTENER: Error code:', errorCode);
        console.log('📊 ONE-SHOT LISTENER: Results count:', results?.length || 0);
        console.log('═══════════════════════════════════════════════════════');

        // Capture and clear the pending resolver so it fires exactly once.
        const resolveOnce = pendingPurchaseResolve;
        pendingPurchaseResolve = null;

        if (responseCode === InAppPurchases?.IAPResponseCode?.OK) {
          if (results && results.length > 0) {
            for (const purchase of results) {
              const isValidSubscription =
                purchase?.productId === PRODUCT_IDS.MONTHLY ||
                purchase?.productId === PRODUCT_IDS.ANNUAL;

              if (isValidSubscription) {
                console.log('🔄 ONE-SHOT LISTENER: Valid subscription — unlocking entitlement');
                await saveSubscriptionStatus(true);
                emitSubscriptionUpdate(true);
                console.log('✅ ONE-SHOT LISTENER: Entitlement unlocked');
              } else {
                console.warn('⚠️ ONE-SHOT LISTENER: Unexpected product ID, skipping unlock:', purchase?.productId);
              }

              if (!purchase?.acknowledged) {
                try {
                  await InAppPurchases.finishTransactionAsync(purchase, true);
                  console.log('✅ ONE-SHOT LISTENER: Transaction acknowledged');
                } catch (finishError) {
                  console.error('❌ ONE-SHOT LISTENER: Error acknowledging transaction:', finishError);
                }
              }
            }

            // Re-register the persistent listener before resolving
            registerPersistentListener();
            console.log('✅ ONE-SHOT LISTENER: Resolving with success: true');
            resolveOnce?.({ success: true });
          } else {
            console.warn('⚠️ ONE-SHOT LISTENER: OK response but no results');
            registerPersistentListener();
            resolveOnce?.({ success: false, error: 'Purchase completed but no transaction data received.' });
          }
        } else if (responseCode === InAppPurchases?.IAPResponseCode?.USER_CANCELED) {
          console.log('ℹ️ ONE-SHOT LISTENER: User cancelled purchase');
          registerPersistentListener();
          resolveOnce?.({ success: false, userCancelled: true });
        } else {
          console.error('❌ ONE-SHOT LISTENER: Purchase failed — response code:', responseCode, 'error code:', errorCode);
          registerPersistentListener();
          resolveOnce?.({ success: false, error: `Purchase failed (code: ${responseCode ?? errorCode ?? 'unknown'})` });
        }
      });
    });

    // Present the Apple payment sheet
    console.log('🔄 PURCHASE REQUEST: Calling purchaseItemAsync for:', product.productId);
    await InAppPurchases.purchaseItemAsync(product.productId);
    console.log('ℹ️ PURCHASE REQUEST: purchaseItemAsync returned — waiting for listener...');

    // Wait for the listener to resolve the promise
    const result = await purchasePromise;
    console.log('📊 PURCHASE REQUEST: Final result:', result);
    return result;
  } catch (error: any) {
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ PURCHASE ERROR: Exception during purchase');
    console.error('❌ Error:', error);
    console.error('❌ Error code:', error?.code);
    console.error('❌ Error message:', error?.message);
    console.error('═══════════════════════════════════════════════════════');

    // Clear any pending resolver so it doesn't fire later
    pendingPurchaseResolve = null;
    // Restore the persistent listener
    registerPersistentListener();

    const errorCode = error?.code;
    const errorMessage = error?.message || 'Purchase failed';

    if (errorCode === 'E_USER_CANCELLED' || errorMessage?.includes('cancel')) {
      console.log('ℹ️ PURCHASE ERROR: User cancelled (from thrown error)');
      return { success: false, userCancelled: true };
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Restore previous purchases from App Store
 * Only grants Full Access if portiontrack.monthly or portiontrack.annual found
 * Otherwise shows "No active subscription found"
 * Handles results defensively with optional chaining
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
    const response = await InAppPurchases.getPurchaseHistoryAsync();
    
    // Handle results defensively with optional chaining
    const responseCode = response?.responseCode;
    const results = response?.results;
    
    console.log('📊 RESTORE RESPONSE:');
    console.log('  - Response code:', responseCode);
    console.log('  - Results count:', results?.length || 0);

    // Guard all fields with optional chaining
    if (responseCode === InAppPurchases?.IAPResponseCode?.OK && results && results.length > 0) {
      console.log('✅ RESTORE: Found', results.length, 'previous purchases');
      
      // Finish/acknowledge all restored transactions
      for (const purchase of results) {
        console.log('🔄 RESTORE FINISH: Processing:', purchase?.productId);
        console.log('🔄 RESTORE FINISH: Acknowledged:', purchase?.acknowledged);
        
        if (!purchase?.acknowledged) {
          console.log('🔄 RESTORE FINISH: Acknowledging...');
          try {
            await InAppPurchases.finishTransactionAsync(purchase, true);
            console.log('✅ RESTORE FINISH: Acknowledged');
          } catch (finishError) {
            console.error('❌ RESTORE FINISH: Error:', finishError);
          }
        }
      }
      
      // Only grant Full Access if portiontrack.monthly or portiontrack.annual found
      const hasSubscription = results.some((purchase: any) => 
        purchase?.productId === PRODUCT_IDS.MONTHLY || 
        purchase?.productId === PRODUCT_IDS.ANNUAL
      );
      
      console.log('📊 RESTORE: Has valid subscription:', hasSubscription);
      
      if (hasSubscription) {
        console.log('✅ RESTORE: Valid subscription found - granting Full Access');
        
        // CRITICAL FIX: Save to AsyncStorage AND emit event immediately
        await saveSubscriptionStatus(true);
        console.log('✅ RESTORE: Saved to AsyncStorage');
        
        // Emit event to immediately update UI
        emitSubscriptionUpdate(true);
        console.log('✅ RESTORE: Emitted subscription update event');
        
        console.log('═══════════════════════════════════════════════════════');
        return { success: true };
      } else {
        console.log('ℹ️ RESTORE: No valid subscription found (portiontrack.monthly or portiontrack.annual)');
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
 * Always checks real App Store subscription status
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

    // Initialize if not already done
    const initialized = await initializeStoreKit();
    if (!initialized) {
      console.error('❌ IAP: Failed to initialize StoreKit');
      const localStatus = await loadSubscriptionStatus();
      return localStatus;
    }

    // Get purchase history to check for active subscriptions
    const response = await InAppPurchases.getPurchaseHistoryAsync();
    
    // Handle results defensively with optional chaining
    const responseCode = response?.responseCode;
    const results = response?.results;
    
    if (responseCode === InAppPurchases?.IAPResponseCode?.OK && results && results.length > 0) {
      // Only check for portiontrack.monthly or portiontrack.annual
      const hasSubscription = results.some((purchase: any) => 
        purchase?.productId === PRODUCT_IDS.MONTHLY || 
        purchase?.productId === PRODUCT_IDS.ANNUAL
      );
      
      console.log('✅ IAP: Subscription check complete:', hasSubscription);
      
      // Update local storage
      await saveSubscriptionStatus(hasSubscription);
      
      // Emit event to update UI
      emitSubscriptionUpdate(hasSubscription);
      
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
