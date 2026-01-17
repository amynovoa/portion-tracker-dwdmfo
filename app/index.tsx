
import { useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { loadProfile, loadSubscriptionStatus } from '@/utils/storage';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { isTestFlightBuild } from '@/utils/subscriptionManager';

export default function Index() {
  const router = useRouter();

  const checkAppState = useCallback(async () => {
    try {
      console.log('Index: Checking app state...');
      
      // Check if we're in development/TestFlight mode
      const isDevOrTestFlight = isTestFlightBuild();
      console.log('Index: Is Dev/TestFlight:', isDevOrTestFlight);
      
      // Check if profile exists
      const profile = await loadProfile();
      console.log('Index: Profile exists:', !!profile);
      
      // In development mode, bypass subscription and go straight to welcome or profile setup
      if (isDevOrTestFlight) {
        if (profile && profile.portionTargets) {
          // Profile setup complete, go to main app
          console.log('Index: Dev mode + Profile complete -> Going to main app');
          router.replace('/(tabs)/(home)');
        } else {
          // Profile not complete, go to welcome screen
          console.log('Index: Dev mode + No profile -> Going to welcome screen');
          router.replace('/welcome');
        }
        return;
      }
      
      // Production mode: Check subscription status
      const isSubscribed = await loadSubscriptionStatus();
      console.log('Index: Subscription status:', isSubscribed);
      
      if (isSubscribed) {
        // User is subscribed
        if (profile && profile.portionTargets) {
          // Profile setup complete, go to main app
          console.log('Index: Subscribed + Profile complete -> Going to main app');
          router.replace('/(tabs)/(home)');
        } else {
          // Profile not complete, go to profile setup
          console.log('Index: Subscribed + No profile -> Going to profile setup');
          router.replace('/setup-profile');
        }
      } else {
        // User is not subscribed, show welcome screen
        console.log('Index: Not subscribed -> Going to welcome screen');
        router.replace('/welcome');
      }
    } catch (error) {
      console.error('Index: Error checking app state:', error);
      // On error, default to welcome screen
      router.replace('/welcome');
    }
  }, [router]);

  useEffect(() => {
    checkAppState();
  }, [checkAppState]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
