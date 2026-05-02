import { Platform } from 'react-native';
import { saveSubscriptionStatus, loadSubscriptionStatus } from './storage';
import { subscriptionEmitter, SUBSCRIPTION_UPDATED_EVENT } from '@/contexts/SubscriptionContext';

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

// Hardcoded fallback prices shown when StoreKit products don't load
const FALLBACK_PRICES: Record<string, string> = {
  [PRODUCT_IDS.MONTHLY]: '$3.99',
  [PRODUCT_IDS.ANNUAL]: '$29.99',
};

function getIAP(): any {
  if (Platform.OS !== 'ios') return null;
  try {
    return require('expo-in-app-purchases');
  } catch {
    return null;
  }
}

/**
 * Purchase a subscription product.
 * Connects fresh each time, registers listener, fires purchase, disconnects after result.
 */
export async function purchaseProduct(
  productId: string,
  onSuccess: () => void | Promise<void>,
  onCancelled: () => void,
  onError: (message: string) => void,
): Promise<void> {
  console.log('[IAP] purchaseProduct called for:', productId);

  if (Platform.OS !== 'ios') {
    onError('Subscriptions are only available on iOS');
    return;
  }

  const IAP = getIAP();
  if (!IAP) {
    onError('In-app purchases not available');
    return;
  }

  let connected = false;

  try {
    // Step 1: Connect
    console.log('[IAP] Connecting...');
    try {
      await IAP.connectAsync();
      connected = true;
      console.log('[IAP] Connected');
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (e?.code === 3 || msg.toLowerCase().includes('already')) {
        connected = true;
        console.log('[IAP] Already connected');
      } else {
        throw e;
      }
    }

    // Step 2: Query products to validate they exist in App Store Connect
    console.log('[IAP] Querying products...');
    const response = await IAP.getProductsAsync([PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL]);
    console.log('[IAP] Products responseCode:', response?.responseCode, 'count:', response?.results?.length);

    // Step 3: Register purchase listener BEFORE calling purchaseItemAsync
    console.log('[IAP] Registering purchase listener');
    IAP.setPurchaseListener(async ({ responseCode, results, errorCode }: any) => {
      console.log('[IAP] Listener fired — responseCode:', responseCode, 'results:', results?.length);

      try {
        if (responseCode === IAP.IAPResponseCode.OK && results?.length > 0) {
          // Finish all transactions
          for (const purchase of results) {
            if (!purchase?.acknowledged) {
              try {
                await IAP.finishTransactionAsync(purchase, true);
                console.log('[IAP] Finished transaction:', purchase?.productId);
              } catch (e) {
                console.warn('[IAP] finishTransactionAsync error:', e);
              }
            }
          }

          // Check if any result is a valid subscription
          const validPurchase = results.find(
            (r: any) => r?.productId === PRODUCT_IDS.MONTHLY || r?.productId === PRODUCT_IDS.ANNUAL
          );

          if (validPurchase) {
            console.log('[IAP] Valid purchase:', validPurchase.productId);
            await saveSubscriptionStatus(true);
            subscriptionEmitter.emit(SUBSCRIPTION_UPDATED_EVENT, true);
            onSuccess();
          } else {
            onError('Purchase completed but subscription not found.');
          }

        } else if (responseCode === IAP.IAPResponseCode.USER_CANCELED) {
          console.log('[IAP] User cancelled');
          onCancelled();

        } else if (responseCode === IAP.IAPResponseCode.DEFERRED) {
          console.log('[IAP] Purchase deferred (Ask to Buy)');
          onCancelled();

        } else {
          const msg = `Purchase failed (code: ${responseCode ?? errorCode ?? 'unknown'})`;
          console.error('[IAP] Error:', msg);
          onError(msg);
        }
      } finally {
        // Disconnect after every listener response
        try {
          await IAP.disconnectAsync();
          console.log('[IAP] Disconnected after purchase');
        } catch (_) {}
      }
    });

    // Step 4: Initiate purchase — do NOT await, result comes via listener
    console.log('[IAP] Calling purchaseItemAsync for:', productId);
    IAP.purchaseItemAsync(productId).catch((e: any) => {
      const msg = e?.message || String(e);
      const isCancelled = msg.toLowerCase().includes('cancel') || e?.code === 2;
      console.warn('[IAP] purchaseItemAsync threw:', msg);
      if (isCancelled) {
        onCancelled();
      } else {
        onError(msg);
      }
      // Disconnect on error
      IAP.disconnectAsync().catch(() => {});
    });

  } catch (e: any) {
    const msg = e?.message || String(e);
    console.error('[IAP] purchaseProduct error:', msg);
    onError(msg);
    if (connected) {
      try { await IAP.disconnectAsync(); } catch (_) {}
    }
  }
}

/**
 * Restore previous purchases.
 */
export async function restorePurchases(): Promise<PurchaseResult> {
  console.log('[IAP] restorePurchases called');

  if (Platform.OS !== 'ios') {
    return { success: false, error: 'Restore is only available on iOS' };
  }

  const IAP = getIAP();
  if (!IAP) {
    return { success: false, error: 'In-app purchases not available' };
  }

  try {
    try {
      await IAP.connectAsync();
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (!msg.toLowerCase().includes('already') && e?.code !== 3) throw e;
    }

    const response = await IAP.getPurchaseHistoryAsync();
    const results = response?.results || [];
    const responseCode = response?.responseCode;

    console.log('[IAP] Restore responseCode:', responseCode, 'count:', results.length);

    if (responseCode === IAP.IAPResponseCode.OK && results.length > 0) {
      for (const purchase of results) {
        if (!purchase?.acknowledged) {
          try { await IAP.finishTransactionAsync(purchase, true); } catch (_) {}
        }
      }

      const hasSubscription = results.some(
        (p: any) => p?.productId === PRODUCT_IDS.MONTHLY || p?.productId === PRODUCT_IDS.ANNUAL
      );

      if (hasSubscription) {
        await saveSubscriptionStatus(true);
        subscriptionEmitter.emit(SUBSCRIPTION_UPDATED_EVENT, true);
        return { success: true };
      }

      return { success: false, error: 'No active subscription found' };
    }

    return { success: false, error: 'No purchases to restore' };
  } catch (e: any) {
    console.error('[IAP] restorePurchases error:', e?.message);
    return { success: false, error: e?.message || 'Failed to restore purchases' };
  } finally {
    try { await IAP.disconnectAsync(); } catch (_) {}
  }
}

/**
 * Check App Store for active subscription. Used on app launch.
 */
export async function checkAppStoreSubscription(): Promise<boolean> {
  console.log('[IAP] checkAppStoreSubscription called');

  if (Platform.OS !== 'ios') {
    return loadSubscriptionStatus();
  }

  const IAP = getIAP();
  if (!IAP) {
    return loadSubscriptionStatus();
  }

  try {
    try {
      await IAP.connectAsync();
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (!msg.toLowerCase().includes('already') && e?.code !== 3) {
        return loadSubscriptionStatus();
      }
    }

    const response = await IAP.getPurchaseHistoryAsync();
    const results = response?.results || [];
    const responseCode = response?.responseCode;

    if (responseCode === IAP.IAPResponseCode.OK && results.length > 0) {
      const hasSubscription = results.some(
        (p: any) => p?.productId === PRODUCT_IDS.MONTHLY || p?.productId === PRODUCT_IDS.ANNUAL
      );
      console.log('[IAP] checkAppStoreSubscription result:', hasSubscription);
      await saveSubscriptionStatus(hasSubscription);
      return hasSubscription;
    }

    return false;
  } catch (e) {
    console.warn('[IAP] checkAppStoreSubscription error:', e);
    return loadSubscriptionStatus();
  } finally {
    try { await IAP.disconnectAsync(); } catch (_) {}
  }
}

// Legacy exports used by PaywallScreen — kept for compatibility
export function isProductReady(_productId: string): boolean {
  return true; // Always allow purchase attempt — prices are hardcoded
}

export function getLoadedProductCount(): number {
  return 2;
}

export async function queryProducts(_productIds: string[]): Promise<string[]> {
  return [PRODUCT_IDS.MONTHLY, PRODUCT_IDS.ANNUAL];
}

export async function getProductDetails(productId: string): Promise<ProductDetails | null> {
  return {
    productId,
    price: FALLBACK_PRICES[productId] ?? '',
    priceString: FALLBACK_PRICES[productId] ?? '',
    currencyCode: 'USD',
    title: productId === PRODUCT_IDS.MONTHLY ? 'Monthly' : 'Annual',
    description: '',
  };
}

export async function validateReceipt(_receiptData: string): Promise<boolean> {
  return false;
}

// IAPDebugInfo kept for any remaining imports
export interface IAPDebugInfo {
  bundleId: string;
  responseCode: number | string;
  resultsLength: number;
  returnedIds: string[];
}

export function getIAPDebugInfo(): IAPDebugInfo {
  return { bundleId: '', responseCode: 'n/a', resultsLength: 0, returnedIds: [] };
}
