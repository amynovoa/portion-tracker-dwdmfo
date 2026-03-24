
import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { loadSubscriptionStatus } from '@/utils/storage';
import { markSubscribed } from '@/utils/userStateManager';
import EventEmitter from 'eventemitter3';

// Create a global event emitter for subscription updates
const subscriptionEmitter = new EventEmitter();
export const SUBSCRIPTION_UPDATED_EVENT = 'subscription_updated';

interface SubscriptionContextType {
  isSubscribed: boolean;
  hasAccess: boolean;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // refreshSubscription re-fetches from AsyncStorage (the source of truth written by
  // subscriptionManager after StoreKit confirms a purchase), updates state synchronously
  // before returning, and keeps @subscription_active in sync via markSubscribed.
  const refreshSubscription = useCallback(async () => {
    console.log('[SubscriptionContext] Refreshing subscription status');

    try {
      const subscribed = await loadSubscriptionStatus();
      console.log('[SubscriptionContext] Loaded status from AsyncStorage:', subscribed);

      // Keep @subscription_active in sync with the legacy key
      if (subscribed) {
        await markSubscribed(true);
      }

      setIsSubscribed(subscribed);
      console.log('[SubscriptionContext] State updated — isSubscribed:', subscribed);
    } catch (error) {
      console.error('[SubscriptionContext] Error refreshing subscription:', error);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  // Secondary refresh: re-check whenever app comes to foreground.
  // This is NOT the primary gate — index.tsx / resolveUserState() handles the
  // authoritative check on launch.
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[SubscriptionContext] App foregrounded — secondary subscription refresh');
        refreshSubscription();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [refreshSubscription]);

  // Listen for immediate subscription update events emitted by subscriptionManager
  // after a StoreKit purchase completes (before AsyncStorage write propagates).
  useEffect(() => {
    console.log('[SubscriptionContext] Setting up subscription event listener');

    const listener = async (subscribed: boolean) => {
      console.log('[SubscriptionContext] Received subscription update event — subscribed:', subscribed);
      // Persist the new status so future launches read it correctly (both keys)
      await markSubscribed(subscribed);
      setIsSubscribed(subscribed);
      console.log('[SubscriptionContext] State updated via event — isSubscribed:', subscribed);
    };

    subscriptionEmitter.on(SUBSCRIPTION_UPDATED_EVENT, listener);

    return () => {
      console.log('[SubscriptionContext] Removing subscription event listener');
      subscriptionEmitter.off(SUBSCRIPTION_UPDATED_EVENT, listener);
    };
  }, []);

  // hasAccess is purely derived from isSubscribed — no trial bypass, no __DEV__ override
  const hasAccess = isSubscribed;

  return (
    <SubscriptionContext.Provider value={{
      isSubscribed,
      hasAccess,
      isLoading,
      refreshSubscription,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

// Export the emitter so subscriptionManager can emit events
export { subscriptionEmitter };
