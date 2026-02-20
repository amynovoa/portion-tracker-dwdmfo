
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
      
      // Check if profile exists
      const profile = await loadProfile();
      console.log('Index: Profile exists:', !!profile);
      
      // Check subscription status
      const isSubscribed = await loadSubscriptionStatus();
      console.log('Index: Subscription status:', isSubscribed);
      
      // If profile is complete, go to main app
      if (profile && profile.portionTargets) {
        console.log('Index: Profile complete -> Going to main app');
        router.replace('/(tabs)/(home)');
        return;
      }
      
      // If no profile, always show welcome screen first
      // Welcome screen will handle showing "Start Trial" or "Get Started" based on subscription
      console.log('Index: No profile -> Going to welcome screen');
      router.replace('/welcome');
      
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
