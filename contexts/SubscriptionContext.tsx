
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser, usePlacement } from 'expo-superwall';

interface SubscriptionContextType {
  isSubscribed: boolean;
  isLoading: boolean;
  showPaywall: (placement?: string) => Promise<void>;
  subscriptionStatus: 'UNKNOWN' | 'INACTIVE' | 'ACTIVE';
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { subscriptionStatus, user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  
  const { registerPlacement } = usePlacement({
    onPresent: (info) => {
      console.log('Paywall presented:', info);
    },
    onDismiss: (info, result) => {
      console.log('Paywall dismissed:', info, 'Result:', result);
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Paywall error:', error);
      setIsLoading(false);
    },
  });

  const isSubscribed = subscriptionStatus?.status === 'ACTIVE';

  const showPaywall = async (placement: string = 'settings_paywall') => {
    try {
      setIsLoading(true);
      await registerPlacement({
        placement,
        feature: () => {
          console.log('User has access to feature');
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error('Error showing paywall:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('Subscription status:', subscriptionStatus?.status);
    console.log('User:', user);
  }, [subscriptionStatus, user]);

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        isLoading,
        showPaywall,
        subscriptionStatus: subscriptionStatus?.status || 'UNKNOWN',
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
