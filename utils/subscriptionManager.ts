
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
 * Check if the app is running in TestFlight or development mode
 * PRODUCTION BUILDS: Returns false
 * TESTFLIGHT/DEV BUILDS: Returns true
 */
export function isTestFlightBuild(): boolean {
  // Check if running in Expo Go or development
  if (__DEV__) {
    console.log('🔍 IAP: Running in development mode');
    return true;
  }

  // Check for TestFlight indicators
  const appOwnership = Constants.appOwnership;
  
  // In Expo, appOwnership will be 'expo' for Expo Go, 'standalone' for production builds
  if (appOwnership === 'expo') {
    console.log('🔍 IAP: Running in Expo Go');
    return true;
  }

  // Check if it's a TestFlight build
  // TestFlight builds have appOwnership !== 'standalone'
  const isTestFlight = appOwnership !== 'standalone';
  
  console.log('🔍 IAP: App ownership:', appOwnership, 'Is TestFlight:', isTestFlight);
  
  return isTestFlight;
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

    // Set up purchase listener
    console.log('🔄 STOREKIT INIT: Setting up purchase listener...');
    InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }: any) => {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔵 TRANSACTION CALLBACK: Purchase listener triggered');
      console.log('📊 TRANSACTION CALLBACK: Response code:', responseCode);
      console.log('📊 TRANSACTION CALLBACK: Error code:', errorCode);
      console.log('📊 TRANSACTION CALLBACK: Results count:', results?.length || 0);
      console.log('═══════════════════════════════════════════════════════');
      
      // Guard all fields with optional chaining
      if (responseCode === InAppPurchases?.IAPResponseCode?.OK) {
        if (results && results.length > 0) {
          for (const purchase of results) {
            console.log('✅ TRANSACTION CALLBACK: Purchase successful');
            console.log('  - Product ID:', purchase?.productId);
            console.log('  - Acknowledged:', purchase?.acknowledged);
            
            // Only unlock entitlement if the purchase is for our subscription products
            const isValidSubscription = 
              purchase?.productId === PRODUCT_IDS.MONTHLY || 
              purchase?.productId === PRODUCT_IDS.ANNUAL;
            
            if (isValidSubscription) {
              console.log('🔄 TRANSACTION CALLBACK: Valid subscription - Unlocking entitlement...');
              await saveSubscriptionStatus(true);
              console.log('✅ TRANSACTION CALLBACK: Entitlement unlocked');
            } else {
              console.log('⚠️ TRANSACTION CALLBACK: Not a valid subscription product, skipping unlock');
            }
            
            // Finish/acknowledge the transaction
            if (!purchase?.acknowledged) {
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
          }
        } else {
          console.log('⚠️ TRANSACTION CALLBACK: OK response but no results');
        }
      } else if (responseCode === InAppPurchases?.IAPResponseCode?.USER_CANCELED) {
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

/**
 * Purchase a product through App Store
 * Calls purchaseItemAsync(productId) without reading responseCode
 * Purchase listener handles success/cancel/failure
 * Only unlocks entitlement when StoreKit confirms valid purchase
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
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ PURCHASE REQUEST: Product NOT in memory');
      console.error('❌ Cannot purchase - product not queried from StoreKit');
      console.error('❌ Product ID:', productId);
      console.error('═══════════════════════════════════════════════════════');
      return {
        success: false,
        error: 'Product not available. Please check your internet connection and try again.',
      };
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

    // Call purchaseItemAsync without reading responseCode
    // The purchase listener handles all success/cancel/failure scenarios
    console.log('🔄 PURCHASE REQUEST: Calling purchaseItemAsync...');
    console.log('🔄 PURCHASE REQUEST: Using productId:', product.productId);
    console.log('🔄 PURCHASE REQUEST: Purchase listener will handle the result');
    
    await InAppPurchases.purchaseItemAsync(product.productId);
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ PURCHASE REQUEST: purchaseItemAsync called');
    console.log('ℹ️ PURCHASE REQUEST: Waiting for purchase listener callback...');
    console.log('ℹ️ PURCHASE REQUEST: The listener will handle success/cancel/failure');
    console.log('═══════════════════════════════════════════════════════');

    // Return success - the purchase listener will unlock entitlement if StoreKit confirms purchase
    return { success: true };
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
        await saveSubscriptionStatus(true);
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
</write file>

<write file="components/PaywallScreen.tsx">
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { 
  purchaseProduct, 
  restorePurchases, 
  PRODUCT_IDS, 
  getProductDetails,
  queryProducts,
  isProductReady,
  ProductDetails
} from '@/utils/subscriptionManager';

interface PaywallScreenProps {
  visible: boolean;
  onDismiss?: () => void;
  canDismiss?: boolean;
}

type SubscriptionPlan = 'monthly' | 'annual';

export default function PaywallScreen({ visible, onDismiss, canDismiss = true }: PaywallScreenProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('annual');
  const [loading, setLoading] = useState(false);
  const [monthlyProduct, setMonthlyProduct] = useState<ProductDetails | null>(null);
  const [annualProduct, setAnnualProduct] = useState<ProductDetails | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsFailed, setProductsFailed] = useState(false);

  useEffect(() => {
    if (visible) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔵 PAYWALL MOUNT: Paywall screen opened');
      console.log('═══════════════════════════════════════════════════════');
      loadProducts();
    }
  }, [visible]);

  const loadProducts = async () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 PRODUCT FETCH START: Initializing StoreKit and fetching products');
    console.log('📊 PRODUCT FETCH: Platform:', Platform.OS);
    console.log('═══════════════════════════════════════════════════════');
    
    setLoadingProducts(true);
    setProductsFailed(false);

    // On non-iOS platforms (web, Android), use fallback products
    // expo-in-app-purchases only works on iOS
    if (Platform.OS !== 'ios') {
      console.log('⚠️ PRODUCT FETCH: Not iOS platform, using fallback products');
      console.log('⚠️ PRODUCT FETCH: In-app purchases only work on iOS devices');
      
      // Get fallback product details
      const [monthly, annual] = await Promise.all([
        getProductDetails(PRODUCT_IDS.MONTHLY),
        getProductDetails(PRODUCT_IDS.ANNUAL),
      ]);
      
      setMonthlyProduct(monthly);
      setAnnualProduct(annual);
      setLoadingProducts(false);
      
      console.log('✅ PRODUCT FETCH: Fallback products loaded');
      console.log('═══════════════════════════════════════════════════════');
      return;
    }

    try {
      // Query products using getProductsAsync with subscription IDs
      console.log('📦 PRODUCT FETCH: Querying products from StoreKit...');
      console.log('📦 PRODUCT FETCH: SKUs to query:', [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL]);
      
      const queriedIds = await queryProducts([PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL]);
      
      console.log('═══════════════════════════════════════════════════════');
      console.log('📊 PRODUCT FETCH RESULT:');
      console.log('  - Total products queried:', queriedIds.length);
      console.log('  - Product IDs returned:', queriedIds);
      console.log('  - Monthly SKU ready:', queriedIds.includes(PRODUCT_IDS.MONTHLY));
      console.log('  - Annual SKU ready:', queriedIds.includes(PRODUCT_IDS.ANNUAL));
      console.log('═══════════════════════════════════════════════════════');

      // If results are empty or response not OK, show "Unable to load plans" + Retry
      if (queriedIds.length === 0) {
        console.error('❌ PRODUCT FETCH FAIL: No products returned from StoreKit');
        console.error('❌ PRODUCT FETCH FAIL: This means StoreKit query failed or returned empty');
        setProductsFailed(true);
        setLoadingProducts(false);
        return;
      }

      // Get display details for each product
      console.log('🔄 PRODUCT DETAILS: Fetching display details for products...');
      
      const [monthly, annual] = await Promise.all([
        getProductDetails(PRODUCT_IDS.MONTHLY),
        getProductDetails(PRODUCT_IDS.ANNUAL),
      ]);

      console.log('═══════════════════════════════════════════════════════');
      console.log('📊 PRODUCT DETAILS RESULT:');
      console.log('  Monthly Product:');
      console.log('    - Product ID:', monthly?.productId);
      console.log('    - Price:', monthly?.price);
      console.log('    - Price String:', monthly?.priceString);
      console.log('    - Currency:', monthly?.currencyCode);
      console.log('  Annual Product:');
      console.log('    - Product ID:', annual?.productId);
      console.log('    - Price:', annual?.price);
      console.log('    - Price String:', annual?.priceString);
      console.log('    - Currency:', annual?.currencyCode);
      console.log('═══════════════════════════════════════════════════════');

      setMonthlyProduct(monthly);
      setAnnualProduct(annual);
      
      console.log('✅ PRODUCT FETCH COMPLETE: Products loaded and ready for purchase');
      console.log('═══════════════════════════════════════════════════════');
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ PRODUCT FETCH ERROR: Failed to load products');
      console.error('❌ Error details:', error);
      console.error('═══════════════════════════════════════════════════════');
      
      // Show "Unable to load plans" + Retry on error
      setProductsFailed(true);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSubscribe = async () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 PURCHASE TAP: User tapped Subscribe button');
    console.log('═══════════════════════════════════════════════════════');
    
    const productId = selectedPlan === 'monthly' ? PRODUCT_IDS.MONTHLY : PRODUCT_IDS.ANNUAL;
    
    console.log('📊 PURCHASE TAP INFO:');
    console.log('  - Selected plan:', selectedPlan);
    console.log('  - Product ID:', productId);
    
    // Verify productId exists in the fetched results list (exact match)
    const productExists = isProductReady(productId);
    console.log('  - Product object exists in memory:', productExists);
    
    if (!productExists) {
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ PURCHASE BLOCKED: Product object not in memory');
      console.error('❌ Cannot purchase - product not queried from StoreKit');
      console.error('❌ Product ID:', productId);
      console.error('═══════════════════════════════════════════════════════');
      
      Alert.alert(
        'Product Not Available',
        'Unable to load product information. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('✅ PURCHASE VALIDATION PASSED: Proceeding with purchase');
    console.log('═══════════════════════════════════════════════════════');

    setLoading(true);

    try {
      console.log('🔄 PURCHASE REQUEST: Initiating purchase for:', productId);

      const result = await purchaseProduct(productId);
      
      console.log('═══════════════════════════════════════════════════════');
      console.log('📊 PURCHASE RESULT:');
      console.log('  - Success:', result.success);
      console.log('  - User cancelled:', result.userCancelled);
      console.log('  - Error:', result.error);
      console.log('═══════════════════════════════════════════════════════');

      if (result.success) {
        Alert.alert(
          'Success!',
          'Your subscription is now active. Enjoy unlimited access!',
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('✅ PURCHASE SUCCESS: User acknowledged subscription success');
                if (onDismiss) {
                  onDismiss();
                }
              },
            },
          ]
        );
      } else if (result.userCancelled) {
        console.log('ℹ️ PURCHASE CANCELLED: User cancelled purchase');
      } else {
        console.error('❌ PURCHASE FAILED:', result.error);
        Alert.alert(
          'Purchase Failed',
          result.error || 'Unable to complete purchase. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ PURCHASE ERROR: Unexpected error during purchase');
      console.error('❌ Error:', error);
      console.error('❌ Error message:', error?.message);
      console.error('❌ Error code:', error?.code);
      console.error('═══════════════════════════════════════════════════════');
      
      const errorMessage = error?.message || 'An unexpected error occurred. Please try again.';
      
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 RESTORE TAP: User tapped Restore Purchases button');
    console.log('═══════════════════════════════════════════════════════');

    setLoading(true);

    try {
      const result = await restorePurchases();
      
      console.log('📊 RESTORE RESULT:');
      console.log('  - Success:', result.success);
      console.log('  - Error:', result.error);
      console.log('═══════════════════════════════════════════════════════');

      if (result.success) {
        Alert.alert(
          'Success!',
          'Your subscription has been restored.',
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('✅ RESTORE SUCCESS: User acknowledged restore success');
                if (onDismiss) {
                  onDismiss();
                }
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'No Active Subscription Found',
          result.error || 'No previous purchases found to restore.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ RESTORE ERROR:', error);
      
      const errorMessage = error?.message || 'Unable to restore purchases. Please try again.';
      
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const openPrivacyPolicy = () => {
    console.log('🔗 Opening privacy policy...');
    Linking.openURL('https://www.portiontrack.com/privacy-policy');
  };

  const openTermsOfService = () => {
    console.log('🔗 Opening terms of service...');
    Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
  };

  const getMonthlyPrice = () => {
    if (loadingProducts) {
      return '...';
    }
    return monthlyProduct?.priceString || '$2.99';
  };

  const getAnnualPrice = () => {
    if (loadingProducts) {
      return '...';
    }
    return annualProduct?.priceString || '$24.99';
  };

  const getAnnualMonthlyPrice = () => {
    if (loadingProducts) {
      return '...';
    }
    if (annualProduct) {
      const annualPrice = parseFloat(annualProduct.price);
      const monthlyEquivalent = (annualPrice / 12).toFixed(2);
      return `${annualProduct.currencyCode === 'USD' ? '$' : ''}${monthlyEquivalent}`;
    }
    return '$2.08';
  };

  // Purchase must be disabled unless the product object exists in memory from StoreKit
  const isSelectedProductReady = () => {
    const productId = selectedPlan === 'monthly' ? PRODUCT_IDS.MONTHLY : PRODUCT_IDS.ANNUAL;
    const ready = isProductReady(productId);
    
    console.log('🔍 PRODUCT READY CHECK:', {
      productId,
      ready
    });
    
    return ready;
  };

  // Show "Unable to load plans" + Retry if products failed
  if (productsFailed) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (canDismiss && onDismiss) {
            console.log('User dismissed paywall (products failed)');
            onDismiss();
          }
        }}
      >
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          {canDismiss && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                console.log('User tapped close button (products failed)');
                if (onDismiss) {
                  onDismiss();
                }
              }}
            >
              <MaterialIcons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          )}

          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={64} color={colors.error} />
            <Text style={styles.errorTitle}>Unable to Load Plans</Text>
            <Text style={styles.errorMessage}>
              We couldn't load subscription plans from the App Store. Please check your internet connection and try again.
            </Text>
            
            <TouchableOpacity
              style={[buttonStyles.primary, styles.retryButton]}
              onPress={() => {
                console.log('User tapped Retry button');
                loadProducts();
              }}
            >
              <Text style={buttonStyles.primaryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (canDismiss && onDismiss) {
          console.log('User dismissed paywall');
          onDismiss();
        }
      }}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {canDismiss && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              console.log('User tapped close button');
              if (onDismiss) {
                onDismiss();
              }
            }}
          >
            <MaterialIcons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>7-day free trial.{'\n'}Cancel anytime.</Text>
            <Text style={styles.subtitle}>
              Payment will be charged to your Apple ID at confirmation of purchase or at the end of the trial. Subscription automatically renews unless canceled at least 24 hours before the end of the period.
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Subscription includes:</Text>
            <FeatureItem text="Unlimited portion tracking" />
            <FeatureItem text="Custom portion targets" />
            <FeatureItem text="Weight tracking & charts" />
            <FeatureItem text="Adherence history & trends" />
            <FeatureItem text="Daily reminders" />
          </View>

          <View style={styles.plansContainer}>
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'annual' && styles.planCardSelected,
              ]}
              onPress={() => {
                console.log('User selected annual plan');
                setSelectedPlan('annual');
              }}
            >
              {selectedPlan === 'annual' && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Best Value</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Annual</Text>
                <View style={styles.radioButton}>
                  {selectedPlan === 'annual' && <View style={styles.radioButtonInner} />}
                </View>
              </View>
              <Text style={styles.planPrice}>{getAnnualPrice()}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
              ]}
              onPress={() => {
                console.log('User selected monthly plan');
                setSelectedPlan('monthly');
              }}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Monthly</Text>
                <View style={styles.radioButton}>
                  {selectedPlan === 'monthly' && <View style={styles.radioButtonInner} />}
                </View>
              </View>
              <Text style={styles.planPrice}>{getMonthlyPrice()}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By clicking I agree to the{' '}
              <Text style={styles.footerLink} onPress={openTermsOfService}>
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text style={styles.footerLink} onPress={openPrivacyPolicy}>
                Privacy Policy
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[
              buttonStyles.primary, 
              styles.subscribeButton,
              !isSelectedProductReady() && styles.subscribeButtonDisabled
            ]}
            onPress={handleSubscribe}
            disabled={loading || loadingProducts || !isSelectedProductReady()}
          >
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={buttonStyles.primaryText}>
                {loadingProducts
                  ? 'Loading products...'
                  : !isSelectedProductReady()
                  ? 'Product not available'
                  : `7 day free trial then ${selectedPlan === 'monthly' ? getMonthlyPrice() : getAnnualPrice()}${selectedPlan === 'monthly' ? '/month' : '/year'}`}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={loading}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <MaterialIcons name="check-circle" size={20} color={colors.primary} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  plansContainer: {
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  planCardSelected: {
    borderColor: colors.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.surface,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  subscribeButton: {
    marginBottom: 16,
  },
  subscribeButtonDisabled: {
    opacity: 0.5,
  },
  restoreButton: {
    padding: 16,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    minWidth: 200,
  },
});
