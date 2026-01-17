
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { loadSubscriptionStatus, saveSubscriptionStatus } from '@/utils/storage';
import { useUser } from 'expo-superwall';
import { hasValidSuperwallKey } from '@/utils/superwallConfig';
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
  // This will work in both Sandbox (TestFlight) and Production
  const { subscriptionStatus } = useUser();

  const refreshSubscription = async () => {
    console.log('📱 SubscriptionContext: Checking subscription status...');
    
    try {
      const hasValidKey = hasValidSuperwallKey();
      
      if (hasValidKey && subscriptionStatus) {
        // Production mode: Use real Superwall subscription status
        const isActive = subscriptionStatus.status === 'ACTIVE';
        console.log('📱 Superwall subscription status:', subscriptionStatus.status, '-> isActive:', isActive);
        
        // Save to local storage for offline access
        await saveSubscriptionStatus(isActive);
        setIsSubscribed(isActive);
      } else {
        // Development/Testing mode: Use local storage
        // This allows testing without a valid Superwall API key
        console.log('📱 Using local storage for subscription status (dev/test mode)');
        const localStatus = await loadSubscriptionStatus();
        console.log('📱 Local storage status:', localStatus);
        setIsSubscribed(localStatus || false);
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
      // Fallback to local storage on error
      const localStatus = await loadSubscriptionStatus();
      setIsSubscribed(localStatus || false);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh when Superwall subscription status changes
  useEffect(() => {
    console.log('📱 Superwall subscriptionStatus changed:', subscriptionStatus);
    refreshSubscription();
  }, [subscriptionStatus]);

  // Initial load
  useEffect(() => {
    refreshSubscription();
  }, []);

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
