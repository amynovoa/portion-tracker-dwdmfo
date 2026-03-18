
import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { loadSubscriptionStatus } from '@/utils/storage';
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

  const refreshSubscription = useCallback(async () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 SUBSCRIPTION CONTEXT: Refreshing subscription status');
    console.log('═══════════════════════════════════════════════════════');

    try {
      const localStatus = await loadSubscriptionStatus();
      const subscribed = localStatus || false;

      console.log('📊 SUBSCRIPTION CONTEXT RESULT:');
      console.log('  - Status from AsyncStorage:', localStatus);
      console.log('  - isSubscribed:', subscribed);

      setIsSubscribed(subscribed);

      console.log('✅ SUBSCRIPTION CONTEXT: State updated');
      console.log('═══════════════════════════════════════════════════════');
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ SUBSCRIPTION CONTEXT ERROR:', error);
      console.error('═══════════════════════════════════════════════════════');
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  // Re-check subscription every time the app comes to the foreground
  // This ensures Apple's subscription status (including Apple free trial) is always fresh
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('📱 SUBSCRIPTION CONTEXT: App foregrounded — re-checking subscription');
        refreshSubscription();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [refreshSubscription]);

  // Listen for subscription update events from the purchase listener
  useEffect(() => {
    console.log('🔔 SUBSCRIPTION CONTEXT: Setting up event listener for subscription updates');

    const listener = (subscribed: boolean) => {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔔 SUBSCRIPTION EVENT: Received subscription update event');
      console.log('📊 SUBSCRIPTION EVENT: New status:', subscribed);
      console.log('═══════════════════════════════════════════════════════');

      setIsSubscribed(subscribed);

      console.log('✅ SUBSCRIPTION EVENT: State updated, isSubscribed =', subscribed);
    };

    subscriptionEmitter.on(SUBSCRIPTION_UPDATED_EVENT, listener);

    return () => {
      console.log('🔔 SUBSCRIPTION CONTEXT: Removing event listener');
      subscriptionEmitter.off(SUBSCRIPTION_UPDATED_EVENT, listener);
    };
  }, []);

  // hasAccess is purely derived from isSubscribed — RevenueCat reports Apple free trials as active
  const hasAccess = isSubscribed;

  console.log('📱 SubscriptionContext: isSubscribed =', isSubscribed, ', hasAccess =', hasAccess, ', isLoading =', isLoading);

  return (
    <SubscriptionContext.Provider value={{
      isSubscribed,
      hasAccess,
      isLoading,
      refreshSubscription
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
