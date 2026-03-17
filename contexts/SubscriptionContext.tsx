
import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { loadSubscriptionStatus } from '@/utils/storage';
import { isWithinTrialPeriod } from '@/utils/trialManager';
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
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSubscription = useCallback(async () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 SUBSCRIPTION CONTEXT: Refreshing subscription status');
    console.log('═══════════════════════════════════════════════════════');
    
    try {
      // 🚀 DEVELOPMENT MODE BYPASS: Auto-grant subscription in preview/dev
      const isDevelopment = __DEV__;
      
      if (isDevelopment) {
        console.log('🚀 DEV MODE: Auto-granting subscription access for preview/testing');
        setIsSubscribed(true);
        setHasAccess(true);
        setIsLoading(false);
        console.log('✅ DEV MODE: Subscription and hasAccess granted automatically');
        console.log('═══════════════════════════════════════════════════════');
        return;
      }
      
      // Load subscription status from local storage
      const localStatus = await loadSubscriptionStatus();
      const subscribed = localStatus || false;

      // Check trial period
      const withinTrial = await isWithinTrialPeriod();

      console.log('📊 SUBSCRIPTION CONTEXT RESULT:');
      console.log('  - Status from AsyncStorage:', localStatus);
      console.log('  - isSubscribed:', subscribed);
      console.log('  - withinTrial:', withinTrial);
      console.log('  - hasAccess:', subscribed || withinTrial);
      
      setIsSubscribed(subscribed);
      setHasAccess(subscribed || withinTrial);
      
      console.log('✅ SUBSCRIPTION CONTEXT: State updated');
      console.log('═══════════════════════════════════════════════════════');
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ SUBSCRIPTION CONTEXT ERROR:', error);
      console.error('═══════════════════════════════════════════════════════');
      setIsSubscribed(false);
      setHasAccess(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  // Re-check access every time the app comes to the foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('📱 SUBSCRIPTION CONTEXT: App foregrounded — re-checking access');
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
    
    const listener = async (subscribed: boolean) => {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔔 SUBSCRIPTION EVENT: Received subscription update event');
      console.log('📊 SUBSCRIPTION EVENT: New status:', subscribed);
      console.log('═══════════════════════════════════════════════════════');
      
      // Recalculate hasAccess with latest trial status
      const withinTrial = await isWithinTrialPeriod();
      setIsSubscribed(subscribed);
      setHasAccess(subscribed || withinTrial);
      
      console.log('✅ SUBSCRIPTION EVENT: State updated, hasAccess =', subscribed || withinTrial);
    };

    subscriptionEmitter.on(SUBSCRIPTION_UPDATED_EVENT, listener);

    return () => {
      console.log('🔔 SUBSCRIPTION CONTEXT: Removing event listener');
      subscriptionEmitter.off(SUBSCRIPTION_UPDATED_EVENT, listener);
    };
  }, []);

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
