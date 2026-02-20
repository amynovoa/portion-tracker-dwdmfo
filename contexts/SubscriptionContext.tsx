
import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { loadSubscriptionStatus } from '@/utils/storage';
import { EventEmitter } from 'react-native';

// Create a global event emitter for subscription updates
const subscriptionEmitter = new EventEmitter();
export const SUBSCRIPTION_UPDATED_EVENT = 'subscription_updated';

interface SubscriptionContextType {
  isSubscribed: boolean;
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
      // Load subscription status from local storage
      // This works in all environments: development, TestFlight, and production
      const localStatus = await loadSubscriptionStatus();
      
      console.log('📊 SUBSCRIPTION CONTEXT RESULT:');
      console.log('  - Status from AsyncStorage:', localStatus);
      console.log('  - Previous isSubscribed state:', isSubscribed);
      console.log('  - Will update to:', localStatus || false);
      
      setIsSubscribed(localStatus || false);
      
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

  // Listen for subscription update events from the purchase listener
  useEffect(() => {
    console.log('🔔 SUBSCRIPTION CONTEXT: Setting up event listener for subscription updates');
    
    const listener = subscriptionEmitter.addListener(SUBSCRIPTION_UPDATED_EVENT, (subscribed: boolean) => {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔔 SUBSCRIPTION EVENT: Received subscription update event');
      console.log('📊 SUBSCRIPTION EVENT: New status:', subscribed);
      console.log('═══════════════════════════════════════════════════════');
      
      // Immediately update state without polling AsyncStorage
      setIsSubscribed(subscribed);
      
      console.log('✅ SUBSCRIPTION EVENT: State updated immediately');
    });

    return () => {
      console.log('🔔 SUBSCRIPTION CONTEXT: Removing event listener');
      listener.remove();
    };
  }, []);

  console.log('📱 SubscriptionContext: isSubscribed =', isSubscribed, ', isLoading =', isLoading);

  return (
    <SubscriptionContext.Provider value={{ 
      isSubscribed, 
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
