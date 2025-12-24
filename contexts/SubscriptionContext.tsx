
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getSubscriptionStatus,
  startTrial,
  shouldShowPaywall,
  SubscriptionStatus,
} from '@/utils/subscriptionManager';

interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus | null;
  isLoading: boolean;
  refreshSubscriptionStatus: () => Promise<void>;
  shouldShowPaywall: boolean;
  startFreeTrial: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowPaywallState, setShouldShowPaywallState] = useState(false);

  const refreshSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      const status = await getSubscriptionStatus();
      setSubscriptionStatus(status);
      
      const showPaywall = await shouldShowPaywall();
      setShouldShowPaywallState(showPaywall);
      
      console.log('Subscription status updated:', status);
      console.log('Should show paywall:', showPaywall);
    } catch (error) {
      console.error('Error refreshing subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startFreeTrial = async () => {
    try {
      await startTrial();
      await refreshSubscriptionStatus();
    } catch (error) {
      console.error('Error starting free trial:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshSubscriptionStatus();
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionStatus,
        isLoading,
        refreshSubscriptionStatus,
        shouldShowPaywall: shouldShowPaywallState,
        startFreeTrial,
      }}
    >
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
