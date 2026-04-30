
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



// Store queried Product objects in memory keyed by productId
let queriedProducts: Map<string, any> = new Map();
let storeKitInitialized = false;
// Guard so the persistent listener is only registered once per app session
let listenerRegistered = false;

// Active purchase callbacks — set before purchaseItemAsync, cleared after listener fires
let activePurchaseCallbacks: {
  onSuccess: () => void;
  onCancelled: () => void;
  onError: (msg: string) => void;
} | null = null;

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

    // Connect to App Store. If already connected, treat as success and continue —
    // do NOT disconnect first. Disconnecting tears down the native session and
    // invalidates product objects for purchaseItemAsync.
    console.log('🔄 STOREKIT INIT: Calling connectAsync...');
    try {
      await InAppPurchases.connectAsync();
      console.log('✅ STOREKIT INIT: Connected to App Store successfully');
    } catch (connectError: any) {
      const msg = connectError?.message || String(connectError);
      const code = connectError?.code;
      if (code === 3 || msg.toLowerCase().includes('already')) {
        console.log('✅ STOREKIT INIT: Already connected — continuing with existing session');
      } else {
        throw connectError;
      }
    }

    // Clear any previous connect error
    if (iapDebugInfo.connectError) {
      delete iapDebugInfo.connectError;
    }

    // Set up the persistent background purchase listener — always register on fresh connection
    if (!listenerRegistered) {
      console.log('🔄 STOREKIT INIT: Setting up purchase listener...');
      registerPersistentListener();
      listenerRegistered = true;
      console.log('✅ STOREKIT INIT: Purchase listener registered');
    } else {
      console.log('ℹ️ STOREKIT INIT: Purchase listener already registered — skipping');
    }

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

    // Clear stale products FIRST — before connect — so there is never a window
    // where a stale product object could be used for purchase.
    queriedProducts.clear();
    console.log('🔄 QUERY PRODUCTS: Cleared stale product cache');

    // connectAsync() must happen immediately before getProductsAsync() — no other
    // async work between them. initializeStoreKit() does exactly that.
    console.log('🔄 QUERY PRODUCTS: Calling initializeStoreKit (connectAsync → listener)...');
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
    
    console.log('✅ QUERY PRODUCTS: StoreKit initialized — calling getProductsAsync immediately');

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
 * Returns Apple's live product data only — never substitutes hardcoded prices
 */
export async function getProductDetails(productId: string): Promise<ProductDetails | null> {
  try {
    // On non-iOS, no StoreKit — return null (no prices shown)
    if (Platform.OS !== 'ios') {
      return null;
    }

    if (!InAppPurchases) {
      return null;
    }

    // Return whatever Apple gave us — never substitute hardcoded prices
    if (queriedProducts.has(productId)) {
      const product = queriedProducts.get(productId);
      console.log('✅ GET DETAILS: Using cached product from memory for:', productId);
      return {
        productId: product.productId,
        price: String(product.price ?? ''),
        priceString: product.priceString ?? '',
        currencyCode: product.currencyCode || 'USD',
        title: product.title || '',
        description: product.description || '',
      };
    }

    // Product not yet queried — return null so UI shows '...'
    console.log('ℹ️ GET DETAILS: Product not in memory yet, returning null for:', productId);
    return null;
  } catch (error) {
    console.error('❌ GET DETAILS: Error fetching details:', error);
    return null;
  }
}

/**
 * Register the single persistent purchase listener.
 * This is the ONLY listener ever registered. It checks activePurchaseCallbacks
 * to route events to the active purchase flow, or handles them silently as
 * background/renewal events.
 */
function registerPersistentListener() {
  if (!InAppPurchases) return;

  InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }: any) => {
    console.log('🔵 LISTENER: Purchase event received, responseCode:', responseCode);

    const callbacks = activePurchaseCallbacks;
    activePurchaseCallbacks = null; // clear immediately so re-entrant events are ignored

    if (responseCode === InAppPurchases?.IAPResponseCode?.OK && results && results.length > 0) {
      let foundValidSubscription = false;

      for (const purchase of results) {
        const isValidSubscription =
          purchase?.productId === PRODUCT_IDS.MONTHLY ||
          purchase?.productId === PRODUCT_IDS.ANNUAL;

        if (isValidSubscription) {
          foundValidSubscription = true;
          console.log('✅ LISTENER: Valid subscription — unlocking entitlement');
          await saveSubscriptionStatus(true);
          emitSubscriptionUpdate(true);
        }

        if (!purchase?.acknowledged) {
          try {
            await InAppPurchases.finishTransactionAsync(purchase, true);
            console.log('✅ LISTENER: Transaction acknowledged');
          } catch (finishError) {
            console.error('❌ LISTENER: Error acknowledging transaction:', finishError);
          }
        }
      }

      if (callbacks) {
        if (foundValidSubscription) {
          callbacks.onSuccess();
        } else {
          callbacks.onError('Purchase completed but no valid subscription was found.');
        }
      }
    } else if (responseCode === InAppPurchases?.IAPResponseCode?.USER_CANCELED) {
      console.log('ℹ️ LISTENER: User cancelled purchase');
      if (callbacks) callbacks.onCancelled();
    } else {
      const msg = `Purchase failed (code: ${responseCode ?? errorCode ?? 'unknown'})`;
      console.error('❌ LISTENER: Purchase failed —', msg);
      if (callbacks) callbacks.onError(msg);
    }
  });
}

export function purchaseProduct(
  productId: string,
  onSuccess: () => void,
  onCancelled: () => void,
  onError: (message: string) => void
): void {
  console.log('🔵 PURCHASE REQUEST: Product ID:', productId);

  if (Platform.OS !== 'ios') {
    onError('Subscriptions are only available on iOS');
    return;
  }

  if (!InAppPurchases) {
    onError('InAppPurchases module not available');
    return;
  }

  const product = queriedProducts.get(productId);
  if (!product) {
    console.error('❌ PURCHASE REQUEST: Product not in queriedProducts map');
    onError('Product not available. Please close and reopen the paywall, then try again.');
    return;
  }

  console.log('📦 PURCHASE REQUEST: Using product:', product.productId, 'price:', product.priceString);

  // Set callbacks BEFORE calling purchaseItemAsync so the persistent listener can find them
  activePurchaseCallbacks = { onSuccess, onCancelled, onError };

  console.log('🔄 PURCHASE REQUEST: Calling purchaseItemAsync...');
  InAppPurchases.purchaseItemAsync(product).then(() => {
    console.log('ℹ️ PURCHASE REQUEST: purchaseItemAsync resolved — waiting for listener event...');
  }).catch((purchaseError: any) => {
    const msg = purchaseError?.message || String(purchaseError);
    console.warn('⚠️ PURCHASE REQUEST: purchaseItemAsync threw:', msg, 'code:', purchaseError?.code);
    const isCancelError = msg.toLowerCase().includes('cancel') || purchaseError?.code === 2;
    const isRealError = purchaseError?.code !== undefined && purchaseError?.code !== 2 && !msg.toLowerCase().includes('sandbox');
    if (isCancelError) {
      activePurchaseCallbacks = null;
      onCancelled();
    } else if (isRealError) {
      activePurchaseCallbacks = null;
      onError(msg);
    }
    // Otherwise: sandbox quirk — leave callbacks set, listener will fire
  });
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
