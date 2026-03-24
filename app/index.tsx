
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { resolveUserState } from '@/utils/userStateManager';

export default function Index() {
  const router = useRouter();
  const didRoute = useRef(false);

  useEffect(() => {
    if (didRoute.current) return;

    async function route() {
      console.log('[Index] App opened — resolving user state...');

      const state = await resolveUserState();

      console.log('[Index] User state resolved:', state);

      if (didRoute.current) return;
      didRoute.current = true;

      if (state === 'not_subscribed') {
        console.log('[Index] not_subscribed → navigating to /welcome');
        router.replace('/welcome');
      } else if (state === 'subscribed_needs_onboarding') {
        console.log('[Index] subscribed_needs_onboarding → navigating to /setup-profile');
        router.replace('/setup-profile');
      } else {
        console.log('[Index] subscribed_complete → navigating to /(tabs)');
        router.replace('/(tabs)');
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
