
import { useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { loadProfile, loadSubscriptionStatus } from '@/utils/storage';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';

export default function Index() {
  const router = useRouter();

  const checkAppState = useCallback(async () => {
    try {
      console.log('Index: Checking app state...');
      
      // Check subscription status first
      const isSubscribed = await loadSubscriptionStatus();
      console.log('Index: Subscription status:', isSubscribed);
      
      // Check if profile exists
      const profile = await loadProfile();
      console.log('Index: Profile exists:', !!profile);
      
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
