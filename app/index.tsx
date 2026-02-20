
import { useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { loadProfile, loadSubscriptionStatus } from '@/utils/storage';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';

export default function Index() {
  const router = useRouter();

  const checkAppState = useCallback(async () => {
    try {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔵 INDEX: Checking app state on launch...');
      console.log('═══════════════════════════════════════════════════════');
      
      // Check if profile exists
      const profile = await loadProfile();
      console.log('📊 INDEX: Profile exists:', !!profile);
      
      // Check subscription status
      const isSubscribed = await loadSubscriptionStatus();
      console.log('📊 INDEX: Subscription status:', isSubscribed);
      
      // If profile is complete, go to main app
      if (profile && profile.portionTargets) {
        console.log('✅ INDEX: Profile complete -> Going to main app');
        console.log('═══════════════════════════════════════════════════════');
        router.replace('/(tabs)/(home)');
        return;
      }
      
      // If no profile but user is subscribed, go directly to setup
      // This handles the case where user just purchased but hasn't created profile yet
      if (!profile && isSubscribed) {
        console.log('✅ INDEX: No profile but subscribed -> Going to setup-profile');
        console.log('═══════════════════════════════════════════════════════');
        router.replace('/setup-profile');
        return;
      }
      
      // If no profile and not subscribed, show welcome screen
      console.log('✅ INDEX: No profile and not subscribed -> Going to welcome screen');
      console.log('═══════════════════════════════════════════════════════');
      router.replace('/welcome');
      
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════');
      console.error('❌ INDEX: Error checking app state:', error);
      console.error('═══════════════════════════════════════════════════════');
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
