
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, buttonStyles } from '@/styles/commonStyles';
import { loadProfile, loadSubscriptionStatus } from '@/utils/storage';
import PaywallScreen from '@/components/PaywallScreen';
import { useSubscription } from '@/contexts/SubscriptionContext';
import AppLogo from '@/components/AppLogo';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isSubscribed, refreshSubscription } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(true);

  // If user becomes subscribed while on this screen, redirect them
  React.useEffect(() => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 WELCOME SCREEN: Subscription status changed');
    console.log('📊 WELCOME SCREEN: isSubscribed from context:', isSubscribed);
    console.log('═══════════════════════════════════════════════════════');

    if (isSubscribed) {
      console.log('✅ WELCOME SCREEN: User is subscribed, checking profile...');

      loadProfile().then((profile) => {
        const hasCompleteProfile = profile && profile.portionTargets;

        if (hasCompleteProfile) {
          console.log('✅ WELCOME SCREEN: Profile exists -> Redirecting to main app');
          router.replace('/(tabs)/(home)');
        } else {
          console.log('✅ WELCOME SCREEN: No profile -> Redirecting to setup-profile');
          router.replace('/setup-profile');
        }
      });
    }
  }, [isSubscribed, router]);

  // Paywall is non-dismissable — re-check subscription on dismiss;
  // if still not subscribed, keep showing paywall
  const handlePaywallDismiss = useCallback(async () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 PAYWALL DISMISS: Paywall dismissed');
    console.log('═══════════════════════════════════════════════════════');

    const freshSubscribed = await loadSubscriptionStatus();
    console.log('ℹ️ PAYWALL DISMISS: freshSubscribed =', freshSubscribed);

    if (!freshSubscribed) {
      // Not subscribed — keep paywall visible, no escape
      console.log('⚠️ PAYWALL DISMISS: Not subscribed — keeping paywall visible');
      setShowPaywall(true);
      return;
    }

    // Subscribed — refresh context so the isSubscribed effect fires and navigates
    console.log('✅ PAYWALL DISMISS: Subscribed — refreshing context for navigation');
    await refreshSubscription();
  }, [refreshSubscription]);

  const titleText = 'Welcome to Portion Track';
  const subtitleText = 'Simple Portions. Balanced Eating.';
  const descriptionText = 'A simple way to eat well and build healthy habits for life.';

  console.log('🔵 WELCOME SCREEN RENDER:', { isSubscribed, showPaywall });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <AppLogo size={80} />
          </View>
          <Text style={styles.title}>{titleText}</Text>
          <Text style={styles.subtitle}>{subtitleText}</Text>
          <Text style={styles.description}>
            {descriptionText}
          </Text>
        </View>
      </View>

      <PaywallScreen
        visible={showPaywall}
        onDismiss={handlePaywallDismiss}
        canDismiss={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});
