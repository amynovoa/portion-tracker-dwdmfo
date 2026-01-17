
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Platform } from 'react-native';

interface SubscriptionContextType {
  isSubscribed: boolean;
  subscriptionStatus: any;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Superwall Integration - Check subscription status
    // For now, we'll default to not subscribed
    // When you build natively, this will check actual subscription status
    console.log('📱 SubscriptionContext: Initializing (native build required for Superwall)');
    
    // Simulate loading complete
    setTimeout(() => {
      setIsLoading(false);
      setIsSubscribed(false);
      setSubscriptionStatus({ status: 'INACTIVE' });
    }, 500);
  }, []);

  console.log('📱 SubscriptionContext: Status =', subscriptionStatus?.status, 'Subscribed =', isSubscribed);

  return (
    <SubscriptionContext.Provider value={{ 
      isSubscribed, 
      subscriptionStatus,
      isLoading
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
