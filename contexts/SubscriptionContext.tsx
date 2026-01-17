
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { loadSubscriptionStatus } from '@/utils/storage';

interface SubscriptionContextType {
  isSubscribed: boolean;
  isLoading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSubscription = async () => {
    console.log('📱 SubscriptionContext: Checking subscription status...');
    try {
      const localStatus = await loadSubscriptionStatus();
      console.log('📱 Local storage status:', localStatus);
      setIsSubscribed(localStatus || false);
    } catch (error) {
      console.error('Error loading subscription status:', error);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  };

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
