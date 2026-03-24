
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { Platform } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { loadSubscriptionStatus } from '@/utils/storage';
import { loadProfile } from '@/utils/storage';

// Determine subscription status directly from the source of truth (AsyncStorage),
// without relying on context state that may not have resolved yet.
async function checkSubscribed(): Promise<boolean> {
  try {
    // On iOS, also check App Store purchase history as a secondary signal
    if (Platform.OS === 'ios') {
      const { checkAppStoreSubscription } = await import('@/utils/subscriptionManager');
      const appStoreResult = await checkAppStoreSubscription();
      console.log('[Index] App Store subscription check result:', appStoreResult);
      return appStoreResult;
    }
  } catch (err) {
    console.warn('[Index] App Store check failed, falling back to AsyncStorage:', err);
  }
  // Fallback: read cached status from AsyncStorage
  const cached = await loadSubscriptionStatus();
  console.log('[Index] AsyncStorage subscription status:', cached);
  return cached;
}

async function checkOnboardingComplete(): Promise<boolean> {
  const profile = await loadProfile();
  const complete = !!(profile && profile.portionTargets);
  console.log('[Index] Onboarding complete:', complete, '| profile:', !!profile, '| portionTargets:', !!(profile?.portionTargets));
  return complete;
}

export default function Index() {
  const router = useRouter();
  const didRoute = useRef(false);

  useEffect(() => {
    if (didRoute.current) return;

    async function route() {
      console.log('[Index] App opened — checking subscription status...');

      const [isSubscribed, onboardingComplete] = await Promise.all([
        checkSubscribed(),
        checkOnboardingComplete(),
      ]);

      console.log('[Index] Subscription check complete — isSubscribed:', isSubscribed, '| onboardingComplete:', onboardingComplete);

      if (didRoute.current) return;
      didRoute.current = true;

      if (isSubscribed) {
        if (onboardingComplete) {
          console.log('[Index] Subscribed + onboarding done → navigating to /(tabs)');
          router.replace('/(tabs)');
        } else {
          console.log('[Index] Subscribed + onboarding NOT done → navigating to /setup-profile');
          router.replace('/setup-profile');
        }
      } else {
        console.log('[Index] Not subscribed → navigating to /welcome');
        router.replace('/welcome');
      }
    }

    route();
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
