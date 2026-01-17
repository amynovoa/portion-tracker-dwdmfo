
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useUser, useSuperwall } from 'expo-superwall';
import { saveSubscriptionStatus, loadSubscriptionStatus } from '@/utils/storage';

interface SubscriptionContextType {
  isSubscribed: boolean;
  subscriptionStatus: any;
  isLoading: boolean;
  user: any;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use Superwall hooks for native builds
  const { subscriptionStatus, user } = useUser();
  const { isConfigured } = useSuperwall();

  useEffect(() => {
    async function checkSubscription() {
      console.log('📱 SubscriptionContext: Checking subscription status...');
      console.log('📱 Superwall configured:', isConfigured);
      console.log('📱 Superwall subscription status:', subscriptionStatus?.status);

      if (isConfigured && subscriptionStatus) {
        // Use Superwall's subscription status for native builds
        const subscribed = subscriptionStatus.status === 'ACTIVE';
        console.log('📱 Using Superwall status: ACTIVE =', subscribed);
        setIsSubscribed(subscribed);
        
        // Save to local storage for offline access
        await saveSubscriptionStatus(subscribed);
      } else {
        // Fallback to local storage (for dev/TestFlight or when Superwall isn't configured)
        console.log('📱 Superwall not configured, using local storage');
        const localStatus = await loadSubscriptionStatus();
        console.log('📱 Local storage status:', localStatus);
        setIsSubscribed(localStatus);
      }

      setIsLoading(false);
    }

    checkSubscription();
  }, [isConfigured, subscriptionStatus]);

  console.log('📱 SubscriptionContext: Final status - Subscribed =', isSubscribed, 'Loading =', isLoading);

  return (
    <SubscriptionContext.Provider value={{ 
      isSubscribed, 
      subscriptionStatus,
      isLoading,
      user
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
