
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
  const { subscriptionStatus } = useUser();

  const refreshSubscription = async () => {
    console.log('📱 SubscriptionContext: Checking subscription status...');
    try {
      // Check Superwall subscription status first (production-ready)
      if (subscriptionStatus) {
        const isActive = subscriptionStatus.status === 'ACTIVE';
        console.log('📱 Superwall subscription status:', subscriptionStatus.status, '-> isActive:', isActive);
        
        // Save to local storage for offline access
        await saveSubscriptionStatus(isActive);
        setIsSubscribed(isActive);
      } else {
        // Fallback to local storage if Superwall not available (dev mode)
        console.log('📱 Superwall status not available, checking local storage...');
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
