
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from 'expo-superwall';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ENTITLEMENT_KEY = '@portion_tracker_entitlement';

interface SubscriptionContextType {
  isSubscribed: boolean;
  isLoading: boolean;
  showPaywall: () => void;
  hidePaywall: () => void;
  paywallVisible: boolean;
  subscriptionStatus: 'UNKNOWN' | 'INACTIVE' | 'ACTIVE';
  refreshSubscriptionStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'UNKNOWN' | 'INACTIVE' | 'ACTIVE'>('UNKNOWN');
  
  // Use Superwall's useUser hook to get subscription status
  const { subscriptionStatus: superwallStatus, refresh } = useUser();

  // Check subscription status from Superwall and persist locally
  useEffect(() => {
    checkSubscriptionStatus();
  }, [superwallStatus]);

  const checkSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      console.log('Checking subscription status from Superwall...');
      console.log('Superwall subscription status:', superwallStatus);

      // Check Superwall subscription status
      const hasActiveSubscription = superwallStatus?.status === 'ACTIVE';
      
      // Persist entitlement locally for offline access
      if (hasActiveSubscription) {
        await AsyncStorage.setItem(ENTITLEMENT_KEY, JSON.stringify({
          isSubscribed: true,
          lastChecked: new Date().toISOString(),
          entitlements: superwallStatus?.entitlements || [],
        }));
      }

      setIsSubscribed(hasActiveSubscription);
      setSubscriptionStatus(superwallStatus?.status || 'UNKNOWN');
      
      console.log('Subscription status updated:', {
        isSubscribed: hasActiveSubscription,
        status: superwallStatus?.status || 'UNKNOWN',
      });
    } catch (error) {
      console.error('Error checking subscription status:', error);
      
      // Fallback to locally stored entitlement if Superwall check fails
      try {
        const storedEntitlement = await AsyncStorage.getItem(ENTITLEMENT_KEY);
        if (storedEntitlement) {
          const parsed = JSON.parse(storedEntitlement);
          setIsSubscribed(parsed.isSubscribed);
          setSubscriptionStatus(parsed.isSubscribed ? 'ACTIVE' : 'INACTIVE');
          console.log('Using cached entitlement:', parsed);
        } else {
          setSubscriptionStatus('UNKNOWN');
        }
      } catch (storageError) {
        console.error('Error reading cached entitlement:', storageError);
        setSubscriptionStatus('UNKNOWN');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubscriptionStatus = async () => {
    console.log('Manually refreshing subscription status...');
    try {
      // Refresh from Superwall servers
      await refresh();
      await checkSubscriptionStatus();
    } catch (error) {
      console.error('Error refreshing subscription status:', error);
    }
  };

  const showPaywall = () => {
    console.log('Showing paywall...');
    setPaywallVisible(true);
  };

  const hidePaywall = () => {
    console.log('Hiding paywall...');
    setPaywallVisible(false);
    // Recheck subscription status after paywall is dismissed
    refreshSubscriptionStatus();
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        isLoading,
        showPaywall,
        hidePaywall,
        paywallVisible,
        subscriptionStatus,
        refreshSubscriptionStatus,
      }}
    >
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
