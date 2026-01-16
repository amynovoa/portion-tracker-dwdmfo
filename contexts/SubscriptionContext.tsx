
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { useUser } from 'expo-superwall';

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

interface SubscriptionContextType {
  isSubscribed: boolean;
  isExpoGo: boolean;
  subscriptionStatus: any;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(true); // Default to true for development
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(undefined);

  // Only use Superwall hooks if not in Expo Go
  if (!isExpoGo) {
    try {
      // Use Superwall's useUser hook to get subscription status
      const { subscriptionStatus: superwallStatus } = useUser();
      
      useEffect(() => {
        if (superwallStatus) {
          console.log('📱 Superwall subscription status:', superwallStatus);
          setSubscriptionStatus(superwallStatus);
          
          // Check if user has active subscription
          const hasActiveSubscription = superwallStatus.status === 'ACTIVE';
          setIsSubscribed(hasActiveSubscription);
          
          console.log('📱 User subscription active:', hasActiveSubscription);
        }
      }, [superwallStatus]);
    } catch (error) {
      console.error('Error initializing Superwall subscription context:', error);
    }
  } else {
    console.log('📱 Running in Expo Go - using mock subscription (full access granted)');
  }

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
