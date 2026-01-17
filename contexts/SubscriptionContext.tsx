
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { loadSubscriptionStatus, saveSubscriptionStatus } from '@/utils/storage';
import { useUser } from 'expo-superwall';
import Constants from 'expo-constants';

interface SubscriptionContextType {
  isSubscribed: boolean;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use Superwall's useUser hook to get real subscription status
  const { subscriptionStatus, user } = useUser();

  const refreshSubscription = async () => {
    console.log('📱 SubscriptionContext: Checking subscription status...');
    try {
      // Check if running in TestFlight or development
      const isTestFlightOrDev = __DEV__ || Constants.appOwnership === 'expo';
      
      if (isTestFlightOrDev) {
        // In TestFlight/dev, use local storage
        console.log('📱 TestFlight/Dev mode: Using local storage for subscription status');
        const localStatus = await loadSubscriptionStatus();
        console.log('📱 Local storage status:', localStatus);
        setIsSubscribed(localStatus || false);
      } else {
        // In production, use Superwall's subscription status
        console.log('📱 Production mode: Using Superwall subscription status');
        console.log('📱 Superwall subscription status:', subscriptionStatus);
        const isActive = subscriptionStatus?.status === 'ACTIVE';
        setIsSubscribed(isActive);
        // Also save to local storage for consistency
        await saveSubscriptionStatus(isActive);
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, [subscriptionStatus]);

  console.log('📱 SubscriptionContext: Final status - Subscribed =', isSubscribed, 'Loading =', isLoading);

  return (
    <SubscriptionContext.Provider value={{ 
      isSubscribed, 
      isLoading,
      refreshSubscription
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
