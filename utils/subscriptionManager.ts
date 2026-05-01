
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { loadSubscriptionStatus, saveSubscriptionStatus } from './storage';

// Only import InAppPurchases on iOS
let InAppPurchases: any = null;
if (Platform.OS === 'ios') {
  InAppPurchases = require('expo-iap');
}

export const PRODUCT_IDS = {
  MONTHLY: 'portiontrack.monthly',
  ANNUAL: 'portiontrack.annual',
};

// ─── Single persistent session ───────────────────────────────────────────────
// Connect once, never disconnect. Product objects are only valid while the
// same native session is alive — disconnecting invalidates them and causes
// "Must query item from store before calling purchase."
let sessionConnected = false;
let listenerRegistered = false;

// Product objects from the CURRENT session — only valid while sessionConnected is true
const loadedProducts = new Map<string, any>();

// Callbacks for the active purchase — set before purchaseItemAsync, cleared after listener fires
let activePurchaseCallbacks: {
  productId: string;
  onSuccess: () => void;
  onCancelled: () => void;
  onError: (msg: string) => void;
} | null = null;

// ─── Debug info ───────────────────────────────────────────────────────────────
export interface IAPDebugInfo {
  bundleId: string;
  responseCode: number | string;
  resultsLength: number;
  returnedIds: string[];
  connectError?: { message: string; code?: string | number };
  queryError?: { message: string; code?: string | number };
}

let iapDebugInfo: IAPDebugInfo = {
  bundleId: '',
  responseCode: 'not_queried',
  resultsLength: 0,
  returnedIds: [],
};

export function getIAPDebugInfo(): IAPDebugInfo {
  return { ...iapDebugInfo };
}

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function emitSubscriptionUpdate(subscribed: boolean) {
  try {
    const { subscriptionEmitter, SUBSCRIPTION_UPDATED_EVENT } = require('@/contexts/SubscriptionContext');
    console.log('[IAP] Emitting subscription update:', subscribed);
    subscriptionEmitter.emit(SUBSCRIPTION_UPDATED_EVENT, subscribed);
  } catch (error) {
    console.error('[IAP] Failed to emit subscription update:', error);
  }
}

/**
 * Register the purchase listener ONCE after the first successful connectAsync.
 * Never called again — the listener persists for the entire app session.
 */
function registerListener() {
  if (!InAppPurchases || listenerRegistered) return;
  listenerRegistered = true;

  InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }: any) => {
    console.log('[IAP] Purchase listener fired, responseCode:', responseCode, 'results:', results?.length);

    // Handle pending/deferred transactions that arrive before user taps
    if (responseCode === InAppPurchases.IAPResponseCode.OK && results?.length > 0) {
      // Check if any result matches our active purchase
      const activeId = activePurchaseCallbacks?.productId;
      const matchingResults = activeId
        ? results.filter((r: any) => r.productId === activeId)
        : results;
      const nonMatchingResults = activeId
        ? results.filter((r: any) => r.productId !== activeId)
        : [];

      // Silently finish non-matching (stale) transactions without touching callbacks
      for (const purchase of nonMatchingResults) {
        console.log('[IAP] Finishing stale pending transaction:', purchase.productId);
        if (!purchase?.acknowledged) {
          try { await InAppPurchases.finishTransactionAsync(purchase, true); } catch (_) {}
        }
      }

      // If no matching results, this was entirely a stale event — do not clear callbacks
      if (matchingResults.length === 0) {
        console.log('[IAP] No matching results for active purchase — ignoring event');
        return;
      }

      // We have matching results — this is the real purchase response
      const callbacks = activePurchaseCallbacks;
      activePurchaseCallbacks = null;

      let foundValid = false;
      for (const purchase of matchingResults) {
        const isValid =
          purchase?.productId === PRODUCT_IDS.MONTHLY ||
          purchase?.productId === PRODUCT_IDS.ANNUAL;
        if (isValid) {
          foundValid = true;
          console.log('[IAP] Valid subscription purchase:', purchase.productId);
          await saveSubscriptionStatus(true);
          emitSubscriptionUpdate(true);
        }
        if (!purchase?.acknowledged) {
          try { await InAppPurchases.finishTransactionAsync(purchase, true); } catch (_) {}
        }
      }

      if (callbacks) {
        if (foundValid) {
          callbacks.onSuccess();
        } else {
          callbacks.onError('Purchase completed but no valid subscription found.');
        }
      }

    } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
      console.log('[IAP] User cancelled purchase');
      const callbacks = activePurchaseCallbacks;
      activePurchaseCallbacks = null;
      callbacks?.onCancelled();

    } else if (responseCode === InAppPurchases.IAPResponseCode.DEFERRED) {
      // Ask to Buy / parental approval pending — treat as cancel for UI purposes
      console.log('[IAP] Purchase deferred (Ask to Buy)');
      const callbacks = activePurchaseCallbacks;
      activePurchaseCallbacks = null;
      callbacks?.onCancelled();

    } else {
      const msg = `Purchase failed (code: ${responseCode ?? errorCode ?? 'unknown'})`;
      console.error('[IAP] Purchase failed:', msg);
      const callbacks = activePurchaseCallbacks;
      activePurchaseCallbacks = null;
      callbacks?.onError(msg);
    }
  });
}

/**
 * Ensure we have a live StoreKit session.
 * Connects once and NEVER disconnects. Safe to call multiple times.
 */
async function ensureConnected(): Promise<boolean> {
  if (!InAppPurchases || Platform.OS !== 'ios') return false;
  if (sessionConnected) return true;

  try {
    console.log('[IAP] Calling connectAsync...');
    await InAppPurchases.connectAsync();
    sessionConnected = true;
    registerListener();
    console.log('[IAP] Connected to App Store');
    return true;
  } catch (e: any) {
    const msg = e?.message || String(e);
    // Error code 3 or "already connected" means we ARE connected — treat as success
    if (e?.code === 3 || msg.toLowerCase().includes('already')) {
      sessionConnected = true;
      registerListener();
      console.log('[IAP] Already connected — session reused');
      return true;
    }
    console.error('[IAP] connectAsync failed:', msg, 'code:', e?.code);
    iapDebugInfo.connectError = { message: msg, code: e?.code };
    return false;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Query StoreKit products. Connects if needed, then fetches products.
 * Returns array of loaded product IDs.
 * NEVER calls disconnectAsync — that would invalidate the product objects.
 */
export async function queryProducts(productIds: string[]): Promise<string[]> {
  console.log('[IAP] queryProducts called — current map size:', loadedProducts.size);
  iapDebugInfo = {
    bundleId: Constants.expoConfig?.ios?.bundleIdentifier || 'unknown',
    responseCode: 'not_queried',
    resultsLength: 0,
    returnedIds: [],
  };

  if (Platform.OS !== 'ios') {
    iapDebugInfo.responseCode = 'platform_not_ios';
    return [];
  }

  if (!InAppPurchases) {
    iapDebugInfo.responseCode = 'module_not_available';
    return [];
  }

  const connected = await ensureConnected();
  if (!connected) {
    iapDebugInfo.responseCode = 'connect_failed';
    return [];
  }

  try {
    console.log('[IAP] Calling getProductsAsync for:', productIds);
    const response = await InAppPurchases.getProductsAsync(productIds);
    const results = response?.results || [];
    const responseCode = response?.responseCode;

    iapDebugInfo = {
      bundleId: Constants.expoConfig?.ios?.bundleIdentifier || 'unknown',
      responseCode,
      resultsLength: results.length,
      returnedIds: results.map((r: any) => r.productId),
    };

    console.log('[IAP] getProductsAsync responseCode:', responseCode, 'count:', results.length);

    if (responseCode === InAppPurchases.IAPResponseCode.OK && results.length > 0) {
      console.log('[IAP] loadedProducts cleared — about to store fresh results');
      loadedProducts.clear();
      for (const product of results) {
        if (product?.productId) {
          loadedProducts.set(product.productId, product);
          console.log('[IAP] Stored product:', product.productId, product.priceString);
        }
      }
      return Array.from(loadedProducts.keys());
    }

    console.warn('[IAP] No products returned, responseCode:', responseCode);
    return [];
  } catch (e: any) {
    console.error('[IAP] getProductsAsync error:', e?.message, 'code:', e?.code);
    iapDebugInfo.queryError = { message: e?.message || String(e), code: e?.code };
    return [];
  }
}

export function isProductReady(productId: string): boolean {
  return loadedProducts.has(productId);
}

export function getLoadedProductCount(): number {
  return loadedProducts.size;
}

export async function getProductDetails(productId: string): Promise<ProductDetails | null> {
  if (Platform.OS !== 'ios' || !InAppPurchases) return null;
  const product = loadedProducts.get(productId);
  if (!product) return null;
  return {
    productId: product.productId,
    price: String(product.price ?? ''),
    priceString: product.priceString ?? '',
    currencyCode: product.currencyCode || 'USD',
    title: product.title || '',
    description: product.description || '',
  };
}

/**
 * Purchase a product. The product MUST already be in loadedProducts (from queryProducts).
 * NEVER calls connectAsync here — session must already be live from queryProducts.
 */
export function purchaseProduct(
  productId: string,
  onSuccess: () => void,
  onCancelled: () => void,
  onError: (message: string) => void
): void {
  console.log('[IAP] purchaseProduct called for:', productId);

  if (Platform.OS !== 'ios') {
    onError('Subscriptions are only available on iOS');
    return;
  }

  if (!InAppPurchases) {
    onError('InAppPurchases module not available');
    return;
  }

  if (!sessionConnected) {
    onError('Not connected to App Store. Please close and reopen the paywall.');
    return;
  }

  const product = loadedProducts.get(productId);
  if (!product) {
    console.error('[IAP] Product not in loadedProducts:', productId);
    onError('Product not loaded. Please tap Retry on the paywall.');
    return;
  }

  console.log('[IAP] purchaseItemAsync for:', product.productId, product.priceString);

  // Set callbacks BEFORE calling purchaseItemAsync so the persistent listener can find them
  activePurchaseCallbacks = { productId, onSuccess, onCancelled, onError };

  InAppPurchases.purchaseItemAsync(product)
    .then(() => {
      console.log('[IAP] purchaseItemAsync resolved — waiting for listener...');
    })
    .catch((e: any) => {
      const msg = e?.message || String(e);
      const isCancelled = msg.toLowerCase().includes('cancel') || e?.code === 2;
      console.warn('[IAP] purchaseItemAsync threw:', msg, 'code:', e?.code);
      // Always clear callbacks on throw — listener will NOT fire after a throw
      const callbacks = activePurchaseCallbacks;
      activePurchaseCallbacks = null;
      if (isCancelled) {
        callbacks?.onCancelled();
      } else {
        callbacks?.onError(msg);
      }
    });
}

export async function restorePurchases(): Promise<PurchaseResult> {
  console.log('[IAP] restorePurchases called');

  if (Platform.OS !== 'ios') {
    return { success: false, error: 'Restore purchases is only available on iOS' };
  }

  if (!InAppPurchases) {
    return { success: false, error: 'InAppPurchases module not available' };
  }

  const connected = await ensureConnected();
  if (!connected) {
    return { success: false, error: 'Failed to connect to App Store. Please try again.' };
  }

  try {
    console.log('[IAP] Calling getPurchaseHistoryAsync...');
    const response = await InAppPurchases.getPurchaseHistoryAsync();
    const results = response?.results;
    const responseCode = response?.responseCode;

    console.log('[IAP] Restore responseCode:', responseCode, 'count:', results?.length ?? 0);

    if (responseCode === InAppPurchases.IAPResponseCode.OK && results?.length > 0) {
      for (const purchase of results) {
        if (!purchase?.acknowledged) {
          try {
            await InAppPurchases.finishTransactionAsync(purchase, true);
          } catch (_) {}
        }
      }

      const hasSubscription = results.some(
        (p: any) => p?.productId === PRODUCT_IDS.MONTHLY || p?.productId === PRODUCT_IDS.ANNUAL
      );

      console.log('[IAP] Restore hasSubscription:', hasSubscription);

      if (hasSubscription) {
        await saveSubscriptionStatus(true);
        emitSubscriptionUpdate(true);
        return { success: true };
      }

      return { success: false, error: 'No active subscription found' };
    }

    return { success: false, error: 'No purchases to restore' };
  } catch (e: any) {
    console.error('[IAP] restorePurchases error:', e?.message);
    return { success: false, error: e?.message || 'Failed to restore purchases' };
  }
}

export async function checkAppStoreSubscription(): Promise<boolean> {
  console.log('[IAP] checkAppStoreSubscription called');

  if (Platform.OS !== 'ios' || !InAppPurchases) {
    return loadSubscriptionStatus();
  }

  const connected = await ensureConnected();
  if (!connected) {
    return loadSubscriptionStatus();
  }

  try {
    const response = await InAppPurchases.getPurchaseHistoryAsync();
    const results = response?.results;
    const responseCode = response?.responseCode;

    if (responseCode === InAppPurchases.IAPResponseCode.OK && results?.length > 0) {
      const hasSubscription = results.some(
        (p: any) => p?.productId === PRODUCT_IDS.MONTHLY || p?.productId === PRODUCT_IDS.ANNUAL
      );
      console.log('[IAP] checkAppStoreSubscription result:', hasSubscription);
      await saveSubscriptionStatus(hasSubscription);
      emitSubscriptionUpdate(hasSubscription);
      return hasSubscription;
    }

    return false;
  } catch (_) {
    return loadSubscriptionStatus();
  }
}

export async function validateReceipt(_receiptData: string): Promise<boolean> {
  return false;
}
