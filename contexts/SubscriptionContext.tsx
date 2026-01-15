
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
  let subscriptionStatus = mockSubscriptionStatus;
  let isSubscribed = true; // Default to subscribed in dev/Expo Go
  
  // Only try to use Superwall hooks if not in Expo Go AND on iOS
  if (!isExpoGo && Platform.OS === 'ios') {
    try {
      // Dynamic import to avoid errors in Expo Go
      const { useUser } = require('expo-superwall');
      const userData = useUser();
      
      if (userData && userData.subscriptionStatus) {
        subscriptionStatus = userData.subscriptionStatus;
        isSubscribed = userData.subscriptionStatus.status === 'ACTIVE';
      }
    } catch (error) {
      console.warn('⚠️ Superwall not available (this is normal in Expo Go or development)');
      console.warn('To test Superwall, run: npx expo run:ios');
      // Keep default mock values
    }
  } else if (isExpoGo) {
    console.log('📱 Running in Expo Go - using mock subscription (full access granted)');
  }

  return (
    <SubscriptionContext.Provider value={{ subscriptionStatus, isSubscribed, isExpoGo }}>
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
