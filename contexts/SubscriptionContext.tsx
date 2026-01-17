
import React, { createContext, useContext, ReactNode, useState } from 'react';

interface SubscriptionContextType {
  isSubscribed: boolean;
  subscriptionStatus: any;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  // Default to true - all users have full access while subscriptions are disabled
  const [isSubscribed] = useState(true);
  const [subscriptionStatus] = useState<any>(undefined);

  console.log('📱 SubscriptionContext: All users have full access (subscriptions temporarily disabled)');

  return (
    <SubscriptionContext.Provider value={{ 
      isSubscribed, 
      subscriptionStatus
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
