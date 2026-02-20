
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
      
      // Check subscription status first
      const isSubscribed = await loadSubscriptionStatus();
      console.log('📊 INDEX: Subscription status:', isSubscribed);
      
      // Check if profile exists
      const profile = await loadProfile();
      const hasCompleteProfile = profile && profile.portionTargets;
      console.log('📊 INDEX: Profile exists:', !!profile);
      console.log('📊 INDEX: Profile complete (has targets):', hasCompleteProfile);
      
      // ROUTING LOGIC:
      // 1. If profile is complete -> go to main app
      // 2. If subscribed but no profile -> go to setup-profile
      // 3. If not subscribed -> go to welcome screen
      
      if (hasCompleteProfile) {
        console.log('✅ INDEX: Profile complete -> Going to main app');
        console.log('═══════════════════════════════════════════════════════');
        router.replace('/(tabs)/(home)');
        return;
      }
      
      if (isSubscribed && !hasCompleteProfile) {
        console.log('✅ INDEX: Subscribed but no profile -> Going to setup-profile');
        console.log('═══════════════════════════════════════════════════════');
        router.replace('/setup-profile');
        return;
      }
      
      // Not subscribed and no profile -> show welcome screen
      console.log('✅ INDEX: Not subscribed -> Going to welcome screen');
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
