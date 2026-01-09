
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SubscriptionContextType {
  isSubscribed: boolean;
  isLoading: boolean;
  showPaywall: () => void;
  hidePaywall: () => void;
  paywallVisible: boolean;
  subscriptionStatus: 'UNKNOWN' | 'INACTIVE' | 'ACTIVE';
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'UNKNOWN' | 'INACTIVE' | 'ACTIVE'>('UNKNOWN');

  // TODO: Backend Integration - Check subscription status on mount
  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      // TODO: Backend Integration - Call API to check subscription status
      // This should verify with Apple's servers if the user has an active subscription
      console.log('Checking subscription status...');
      
      // Placeholder logic - replace with actual API call
      const hasActiveSubscription = false; // Replace with actual check
      setIsSubscribed(hasActiveSubscription);
      setSubscriptionStatus(hasActiveSubscription ? 'ACTIVE' : 'INACTIVE');
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setSubscriptionStatus('UNKNOWN');
    } finally {
      setIsLoading(false);
    }
  };

  const showPaywall = () => {
    setPaywallVisible(true);
  };

  const hidePaywall = () => {
    setPaywallVisible(false);
    // Recheck subscription status after paywall is dismissed
    checkSubscriptionStatus();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        isLoading,
        showPaywall,
        hidePaywall,
        paywallVisible,
        subscriptionStatus,
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
