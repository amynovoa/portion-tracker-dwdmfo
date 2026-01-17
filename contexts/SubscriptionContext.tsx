
import React, { createContext, useContext, ReactNode, useState } from 'react';
import Constants from 'expo-constants';

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

interface SubscriptionContextType {
  isSubscribed: boolean;
  isExpoGo: boolean;
  subscriptionStatus: any;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  // Default to true for development - users have full access
  const [isSubscribed] = useState(true);
  const [subscriptionStatus] = useState<any>(undefined);

  console.log('📱 SubscriptionContext: User has full access (development mode)');

  return (
    <SubscriptionContext.Provider value={{ 
      isSubscribed, 
      isExpoGo,
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
