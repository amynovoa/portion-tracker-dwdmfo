
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import Constants from 'expo-constants';

// Check if we're running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Superwall hooks - will be null if not available
let useUser: any = null;
let superwallAvailable = false;

// Try to load Superwall only if not in Expo Go
if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Superwall = require('expo-superwall');
    useUser = Superwall.useUser;
    superwallAvailable = true;
    console.log('✅ SubscriptionContext: Superwall module loaded successfully');
  } catch (error) {
    console.log('⚠️ SubscriptionContext: Superwall module not available:', error);
    superwallAvailable = false;
  }
}

interface SubscriptionContextType {
  isSubscribed: boolean;
  isExpoGo: boolean;
  subscriptionStatus: any;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(true); // Default to true for development
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(undefined);

  // Always call useUser hook at top level if available - React requirement
  let superwallUser: any = null;
  if (superwallAvailable && useUser) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    superwallUser = useUser();
  }

  // Only use Superwall hooks if available and not in Expo Go
  useEffect(() => {
    if (superwallAvailable && superwallUser) {
      try {
        const superwallStatus = superwallUser.subscriptionStatus;
        
        if (superwallStatus) {
          console.log('📱 Superwall subscription status:', superwallStatus);
          setSubscriptionStatus(superwallStatus);
          
          // Check if user has active subscription
          const hasActiveSubscription = superwallStatus.status === 'ACTIVE';
          setIsSubscribed(hasActiveSubscription);
          
          console.log('📱 User subscription active:', hasActiveSubscription);
        }
      } catch (error) {
        console.error('Error initializing Superwall subscription context:', error);
      }
    } else {
      console.log('📱 Running in Expo Go or Superwall not available - using mock subscription (full access granted)');
    }
  }, [superwallUser]);

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
