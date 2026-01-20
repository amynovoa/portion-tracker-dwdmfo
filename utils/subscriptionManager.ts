
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

// 🚨 USER REQUESTED: Store queried Product objects in memory keyed by productId
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
 * 🚨 USER REQUESTED: Initialize StoreKit connection via expo-in-app-purchases
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

    // 🚨 USER REQUESTED: Connect to the App Store BEFORE querying products
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
      
      // 🚨 USER REQUESTED: Guard all fields with optional chaining
      if (responseCode === InAppPurchases?.IAPResponseCode?.OK) {
        if (results && results.length > 0) {
          for (const purchase of results) {
            console.log('✅ TRANSACTION CALLBACK: Purchase successful');
            console.log('  - Product ID:', purchase?.productId);
            console.log('  - Acknowledged:', purchase?.acknowledged);
            
            // 🚨 USER REQUESTED: Unlock entitlement on successful purchase
            console.log('🔄 TRANSACTION CALLBACK: Unlocking entitlement...');
            await saveSubscriptionStatus(true);
            console.log('✅ TRANSACTION CALLBACK: Entitlement unlocked');
            
            // 🚨 USER REQUESTED: Finish/acknowledge the transaction
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
 * 🚨 USER REQUESTED: Fallback prices can display, but purchase must be disabled unless product exists in memory
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
 * 🚨 USER REQUESTED: Query products using getProductsAsync with subscription IDs
 * Store the returned results objects in memory keyed by productId
 * 
 * CRITICAL CHANGE: Now uses getProductsAsync() instead of getSubscriptionsAsync()
 * Reason: getSubscriptionsAsync() is undefined in the runtime
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

    // 🚨 USER REQUESTED: Ensure connectAsync() happens immediately before getProductsAsync()
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

    // 🚨 USER REQUESTED: Use getProductsAsync() instead of getSubscriptionsAsync()
    console.log('🔄 QUERY PRODUCTS: Calling getProductsAsync() for subscriptions...');
    const response = await InAppPurchases.getProductsAsync(productIds);
    
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
      // 🚨 USER REQUESTED: Store the full Product objects in memory keyed by productId
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
        
        // 🚨 USER REQUESTED: Store the full Product object keyed by productId
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
    
    console.log('🚨🚨🚨 USER REQUESTED: getProductsAsync() ERROR DETAILS 🚨🚨🚨');
    console.log('  - Error message:', queryError.message);
    console.log('  - Error code:', queryError.code);
    console.log('🚨🚨🚨 END ERROR DETAILS 🚨🚨🚨');
    
    return [];
  }
}

/**
 * 🚨 USER REQUESTED: Check if a product has been queried and is ready for purchase
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
 * 🚨 USER REQUESTED: Fallback prices can display, but purchase must be disabled unless product exists in memory
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
 * 🚨 USER REQUESTED: Purchase a product through App Store
 * Call purchaseItemAsync(productId) without reading or returning any response fields
 * Do not access .responseCode anywhere in this function
 * The purchase listener handles success/cancel/failure
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

    // 🚨 USER REQUESTED: Verify productId exists in the fetched results list (exact match)
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

    // 🚨 USER REQUESTED: Call purchaseItemAsync without reading or returning any response fields
    // Do not access .responseCode - the purchase listener handles everything
    console.log('🔄 PURCHASE REQUEST: Calling purchaseItemAsync...');
    console.log('🔄 PURCHASE REQUEST: Using productId:', product.productId);
    console.log('🔄 PURCHASE REQUEST: Purchase listener will handle the result');
    
    await InAppPurchases.purchaseItemAsync(product.productId);
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ PURCHASE REQUEST: purchaseItemAsync called');
    console.log('ℹ️ PURCHASE REQUEST: Waiting for purchase listener callback...');
    console.log('ℹ️ PURCHASE REQUEST: The listener will handle success/cancel/failure');
    console.log('═══════════════════════════════════════════════════════');

    // Return success - the actual result is handled by the purchase listener
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
 * 🚨 USER REQUESTED: Restore previous purchases from App Store
 * Remove any reliance on .responseCode; handle results defensively
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
    const response = await InAppPurchases.getPurchaseHistoryAsync();
    
    // 🚨 USER REQUESTED: Handle results defensively with optional chaining
    const responseCode = response?.responseCode;
    const results = response?.results;
    
    console.log('📊 RESTORE RESPONSE:');
    console.log('  - Response code:', responseCode);
    console.log('  - Results count:', results?.length || 0);

    // 🚨 USER REQUESTED: Guard all fields with optional chaining
    if (responseCode === InAppPurchases?.IAPResponseCode?.OK && results && results.length > 0) {
      console.log('✅ RESTORE: Found', results.length, 'previous purchases');
      
      // 🚨 USER REQUESTED: Finish/acknowledge all restored transactions
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
      
      // Check if any of the purchases are our subscription products
      const hasSubscription = results.some((purchase: any) => 
        purchase?.productId === PRODUCT_IDS.MONTHLY || 
        purchase?.productId === PRODUCT_IDS.ANNUAL
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
    const response = await InAppPurchases.getPurchaseHistoryAsync();
    
    // 🚨 USER REQUESTED: Handle results defensively with optional chaining
    const responseCode = response?.responseCode;
    const results = response?.results;
    
    if (responseCode === InAppPurchases?.IAPResponseCode?.OK && results && results.length > 0) {
      // Check if any of the purchases are our subscription products
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
