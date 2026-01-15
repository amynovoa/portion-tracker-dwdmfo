
import React, { createContext, useContext, ReactNode } from 'react';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Mock subscription status for Expo Go
const mockSubscriptionStatus = {
  status: 'ACTIVE' as const,
  entitlements: [{ id: 'premium', type: 'SUBSCRIPTION' as const }]
};

interface SubscriptionContextType {
  subscriptionStatus: typeof mockSubscriptionStatus | undefined;
  isSubscribed: boolean;
  isExpoGo: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  // For now, always use mock subscription data
  // Superwall integration can be added later when needed
  const subscriptionStatus = mockSubscriptionStatus;
  const isSubscribed = true;

  if (isExpoGo) {
    console.log('📱 Running in Expo Go - using mock subscription (full access granted)');
  } else {
    console.log('📱 Using mock subscription (full access granted)');
  }

  return (
    <SubscriptionContext.Provider value={{ 
      subscriptionStatus, 
      isSubscribed, 
      isExpoGo 
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
