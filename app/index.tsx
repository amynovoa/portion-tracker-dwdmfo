
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function Index() {
  const router = useRouter();
  const { isSubscribed, isLoading } = useSubscription();

  useEffect(() => {
    if (isLoading) return;

    console.log('[Index] Subscription check complete — isSubscribed:', isSubscribed);

    if (isSubscribed) {
      console.log('[Index] Subscribed → navigating to /(tabs)');
      router.replace('/(tabs)');
    } else {
      console.log('[Index] Not subscribed → navigating to /welcome');
      router.replace('/welcome');
    }
  }, [isSubscribed, isLoading, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
