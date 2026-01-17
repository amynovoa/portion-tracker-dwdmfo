
import React, { createContext, useContext, ReactNode } from 'react';
import { useUser } from 'expo-superwall';

interface SubscriptionContextType {
  isSubscribed: boolean;
  subscriptionStatus: any;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { subscriptionStatus, user } = useUser();
  
  const isSubscribed = subscriptionStatus?.status === 'ACTIVE';
  const isLoading = !user && !subscriptionStatus;

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
