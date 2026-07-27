/**
 * RevenueCat Subscription Context (Anonymous Mode)
 *
 * Provides subscription management for Expo + React Native apps.
 * Reads API keys from app.json (expo.extra) automatically.
 *
 * Supports:
 * - Native iOS/Android via RevenueCat SDK
 * - Web preview via RevenueCat REST API (read-only pricing display)
 * - Expo Go via test store keys
 *
 * NOTE: Running in anonymous mode - purchases won't sync across devices.
 * To enable cross-device sync:
 * 1. Set up authentication with setup_auth
 * 2. Re-run setup_revenuecat to upgrade this file
 *
 * SETUP:
 * 1. Wrap your app with <SubscriptionProvider>
 * 2. Run: pnpm install react-native-purchases && npx expo prebuild
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Platform } from "react-native";
import Purchases, {
  PurchasesOfferings,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from "react-native-purchases";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

// Read API keys from app.json (expo.extra)
const extra = Constants.expoConfig?.extra || {};
const IOS_API_KEY = extra.revenueCatApiKeyIos || "";
const ANDROID_API_KEY = extra.revenueCatApiKeyAndroid || "";
const TEST_IOS_API_KEY = extra.revenueCatTestApiKeyIos || "";
const TEST_ANDROID_API_KEY = extra.revenueCatTestApiKeyAndroid || "";
const ENTITLEMENT_ID = extra.revenueCatEntitlementId || "pro";

// Check if running on web
const isWeb = Platform.OS === "web";
// Use nativelyProjectId (unique UUID) for scoping; fall back to slug for backward compatibility
const _PROJECT_SCOPE = Constants.expoConfig?.extra?.nativelyProjectId || Constants.expoConfig?.slug || "app";
const MOCK_PURCHASE_KEY = `rc_mock_purchased_${_PROJECT_SCOPE}`;
// Scoped native dev mock key — persists simulated subscription in Expo Go via expo-secure-store
const MOCK_NATIVE_KEY = `rc_dev_native_${_PROJECT_SCOPE}`;
// Scoped native cache key — persists real subscription state for fast restore on bundle reload
const NATIVE_PURCHASE_KEY = `rc_subscribed_${_PROJECT_SCOPE}`;

interface SubscriptionContextType {
  /** Whether the user has an active subscription */
  isSubscribed: boolean;
  /** Alias for isSubscribed — true if user has active entitlement */
  hasAccess: boolean;
  /** All offerings from RevenueCat */
  offerings: PurchasesOfferings | null;
  /** The current/default offering */
  currentOffering: PurchasesOffering | null;
  /** Available packages in the current offering */
  packages: PurchasesPackage[];
  /** Loading state during initialization */
  loading: boolean;
  /** Whether running on web (purchases not available) */
  isWeb: boolean;
  /** Purchase a package - returns true if successful */
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  /** Restore previous purchases - returns true if subscription found */
  restorePurchases: () => Promise<boolean>;
  /** Manually re-check subscription status */
  checkSubscription: () => Promise<void>;
  /** Alias for checkSubscription — re-fetches subscription state from RevenueCat */
  refreshSubscription: () => Promise<void>;
  /** Mock a successful purchase on web (preview only) - sets isSubscribed to true */
  mockWebPurchase: () => void;
  /** Dev-only: simulate a purchase in Expo Go — persists across reloads via expo-secure-store */
  mockNativePurchase: () => Promise<void>;
  /** iOS only: open Apple's native offer code redemption sheet. Returns true if subscription was granted. */
  presentCodeRedemptionSheet: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [currentOffering, setCurrentOffering] =
    useState<PurchasesOffering | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);

    // Fetch offerings via REST API for web platform
  const fetchOfferingsViaRest = async () => {
    try {
      const apiKey = IOS_API_KEY || TEST_IOS_API_KEY;
      if (!apiKey) return;

      const response = await fetch(
        'https://api.revenuecat.com/v1/subscribers/anonymous/offerings',
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-Platform': 'ios',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.warn('[RevenueCat] Web offerings fetch failed:', response.status);
        return;
      }

      const data = await response.json();
      const currentOffering = data.offerings?.find((o: any) => o.identifier === data.current_offering_id);
      if (!currentOffering) return;

      const webPackages = currentOffering.packages.map((pkg: any) => ({
        identifier: pkg.identifier,
        product: {
          title: pkg.platform_product_identifier.includes('annual') ? 'Annual' : 'Monthly',
          priceString: pkg.platform_product_identifier.includes('annual') ? '$39.99/year' : '$4.99/month',
          description: pkg.platform_product_identifier.includes('annual') ? 'Best value — save over 35%' : 'Billed monthly',
          productIdentifier: pkg.platform_product_identifier,
        },
        offeringIdentifier: currentOffering.identifier,
      })) as PurchasesPackage[];

      if (webPackages.length > 0) {
        setPackages(webPackages);
        console.log('[revenuecat] Web preview: loaded', webPackages.length, 'packages from REST API');
      }
    } catch (error) {
      console.warn('[RevenueCat] Web REST fetch error:', error);
    }
  };

  // Initialize RevenueCat on mount
  useEffect(() => {
    let customerInfoListener: { remove: () => void } | null = null;

    const initRevenueCat = async () => {
      try {
        if (isWeb) {
          await fetchOfferingsViaRest();
          // Restore mock purchase state persisted from a previous session
          if (typeof window !== "undefined" && localStorage.getItem(MOCK_PURCHASE_KEY) === "true") {
            setIsSubscribed(true);
          }
          setLoading(false);
          return;
        }

        // Check if the react-native-purchases native module is available.
        // It is NOT available in standard Expo Go — only in custom dev builds and production builds.
        // DO NOT change this check or replace with AsyncStorage-based workarounds.
        if (typeof Purchases?.configure !== "function") {
          console.warn(
            "[RevenueCat] react-native-purchases native module not available. " +
            "Purchases require a custom dev build or production build, not standard Expo Go."
          );
          // In DEV mode, restore any previously simulated subscription state from expo-secure-store.
          // This lets you test subscription-gated features in standard Expo Go across reloads.
          if (__DEV__) {
            const mockState = await SecureStore.getItemAsync(MOCK_NATIVE_KEY).catch(() => null);
            if (mockState === "true") {
              setIsSubscribed(true);
            }
          }
          setLoading(false);
          return;
        }

        // Use DEBUG log level in development, INFO in production
        Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);

        // Get API key based on platform and environment
        // In development (__DEV__), use ANY available test key (test store works for all platforms)
        // This allows Expo Go to work on iOS even without a platform-specific test key
        const testKey = TEST_IOS_API_KEY || TEST_ANDROID_API_KEY;
        const productionKey = Platform.OS === "ios" ? IOS_API_KEY : ANDROID_API_KEY;
        const apiKey = __DEV__ && testKey ? testKey : productionKey;

        if (!apiKey) {
          console.warn(
            "[RevenueCat] API key not provided for this platform. " +
            "Please add revenueCatApiKeyIos/revenueCatApiKeyAndroid to app.json extra."
          );
          setLoading(false);
          return;
        }

        if (__DEV__) {
          console.log("[RevenueCat] Initializing in DEV mode with key:", apiKey.substring(0, 10) + "...");
          // Restore cached subscription state immediately to avoid paywall flash on bundle reload.
          // The customerInfoUpdateListener (fired by configure() below) is the authoritative
          // source and will immediately overwrite this with real RC Keychain data.
          const cached = await SecureStore.getItemAsync(NATIVE_PURCHASE_KEY).catch(() => null);
          if (cached === "true") {
            setIsSubscribed(true);
          }
        }

        await Purchases.configure({ apiKey });

        // Listen for real-time subscription changes (e.g., purchase from another device)
        customerInfoListener = Purchases.addCustomerInfoUpdateListener(
          (customerInfo) => {
            const hasEntitlement =
              typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !==
              "undefined";
            // In __DEV__: don't clear subscription state — RevenueCat test store purchases are
            // in-memory only and won't be known to RC after a configure() call on reload.
            if (hasEntitlement || !__DEV__) {
              setIsSubscribed(hasEntitlement);
            }
          }
        );

        // Fetch available products/packages
        await fetchOfferings();

        // Check initial subscription status
        await checkSubscription();
      } catch (error) {
        console.error("[RevenueCat] Failed to initialize:", error);
      } finally {
        setLoading(false);
      }
    };

    initRevenueCat();

    // Cleanup listener on unmount
    return () => {
      if (customerInfoListener) {
        customerInfoListener.remove();
      }
    };
  }, []);

  const fetchOfferings = async () => {
    if (isWeb) return;
    try {
      const fetchedOfferings = await Purchases.getOfferings();
      setOfferings(fetchedOfferings);

      if (fetchedOfferings.current) {
        setCurrentOffering(fetchedOfferings.current);
        setPackages(fetchedOfferings.current.availablePackages);
      }
    } catch (error) {
      console.error("[RevenueCat] Failed to fetch offerings:", error);
    }
  };

  const checkSubscription = async () => {
    if (isWeb) return;
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const hasEntitlement =
        typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
      // In __DEV__: RC test store purchases don't survive configure(), so only update state
      // positively — mock/test purchase state persists across reloads via SecureStore cache.
      if (hasEntitlement || !__DEV__) {
        setIsSubscribed(hasEntitlement);
      }
      if (hasEntitlement) {
        await SecureStore.setItemAsync(NATIVE_PURCHASE_KEY, "true").catch(() => {});
      } else if (!__DEV__) {
        await SecureStore.setItemAsync(NATIVE_PURCHASE_KEY, "false").catch(() => {});
      }
    } catch (error) {
      console.error("[RevenueCat] Failed to check subscription:", error);
      // Don't reset isSubscribed on error — the customerInfoUpdateListener
      // already set it from local cache after configure(). Overriding with false
      // would incorrectly show the paywall to subscribed users on network errors.
    }
  };

  const purchasePackage = async (pkg: PurchasesPackage): Promise<boolean> => {
    if (isWeb) {
      console.warn("[RevenueCat] Purchases not available on web");
      return false;
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const hasEntitlement =
        typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
      setIsSubscribed(hasEntitlement);
      if (hasEntitlement) {
        await SecureStore.setItemAsync(NATIVE_PURCHASE_KEY, "true").catch(() => {});
      }
      return hasEntitlement;
    } catch (error: any) {
      // Don't treat user cancellation as an error
      if (error.userCancelled) {
        return false;
      }

      // Some StoreKit flows reject this promise even though the user is (or
      // remains) entitled — most notably switching plans while already
      // subscribed, where Apple schedules the change for the next renewal
      // instead of completing an immediate new transaction, and the SDK
      // surfaces that as an error rather than a clean success. Re-check real
      // entitlement before showing the user a scary "purchase failed" alert.
      try {
        const recheckInfo = await Purchases.getCustomerInfo();
        const stillEntitled =
          typeof recheckInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
        if (stillEntitled) {
          console.warn(
            "[RevenueCat] purchasePackage rejected but entitlement is active — treating as success:",
            error
          );
          setIsSubscribed(true);
          await SecureStore.setItemAsync(NATIVE_PURCHASE_KEY, "true").catch(() => {});
          return true;
        }
      } catch (recheckError) {
        console.error("[RevenueCat] Error re-checking entitlement after purchase error:", recheckError);
      }

      console.error("[RevenueCat] Purchase failed:", error);
      throw error;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    if (isWeb) {
      console.warn("[RevenueCat] Restore not available on web");
      return false;
    }
    try {
      const customerInfo = await Purchases.restorePurchases();
      const hasEntitlement =
        typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
      setIsSubscribed(hasEntitlement);
      // In __DEV__: don't clear the cache on restore failure (test store purchases are ephemeral)
      if (hasEntitlement || !__DEV__) {
        await SecureStore.setItemAsync(NATIVE_PURCHASE_KEY, hasEntitlement ? "true" : "false").catch(() => {});
      }
      return hasEntitlement;
    } catch (error) {
      console.error("[RevenueCat] Restore failed:", error);
      throw error;
    }
  };

  const mockWebPurchase = () => {
    if (!isWeb) return;
    if (typeof window !== "undefined") {
      localStorage.setItem(MOCK_PURCHASE_KEY, "true");
    }
    setIsSubscribed(true);
  };

  // Dev-only: simulate a purchase in standard Expo Go for testing subscription-gated features.
  // Persists to expo-secure-store so the state survives Expo Go reloads.
  const mockNativePurchase = async (): Promise<void> => {
    if (!__DEV__ || isWeb) return;
    await SecureStore.setItemAsync(MOCK_NATIVE_KEY, "true").catch(() => {});
    setIsSubscribed(true);
  };

  const presentCodeRedemptionSheet = async (): Promise<boolean> => {
    if (isWeb || Platform.OS !== 'ios') return false;
    try {
      await Purchases.presentCodeRedemptionSheet();
      // After sheet dismisses, get fresh customer info to determine if subscription was granted.
      // The customerInfoUpdateListener also fires automatically.
      const customerInfo = await Purchases.getCustomerInfo();
      const hasEntitlement = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      if (hasEntitlement) {
        setIsSubscribed(true);
        await SecureStore.setItemAsync(NATIVE_PURCHASE_KEY, 'true').catch(() => {});
      }
      return hasEntitlement;
    } catch (error) {
      console.error('[RevenueCat] presentCodeRedemptionSheet error:', error);
      return false;
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        hasAccess: isSubscribed,
        offerings,
        currentOffering,
        packages,
        loading,
        isWeb,
        purchasePackage,
        restorePurchases,
        checkSubscription,
        refreshSubscription: checkSubscription,
        mockWebPurchase,
        mockNativePurchase,
        presentCodeRedemptionSheet,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Hook to access subscription state and methods.
 *
 * @example
 * const { isSubscribed, purchasePackage, packages, isWeb } = useSubscription();
 *
 * if (!isSubscribed) {
 *   return <Button onPress={() => router.push("/paywall")}>Upgrade</Button>;
 * }
 */
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within SubscriptionProvider"
    );
  }
  return context;
}
