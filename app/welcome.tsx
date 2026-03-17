
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { loadProfile, loadSubscriptionStatus } from '@/utils/storage';
import PaywallScreen from '@/components/PaywallScreen';
import { useSubscription } from '@/contexts/SubscriptionContext';
import AppLogo from '@/components/AppLogo';
import { isNewUser, hasTrialExpired, recordFirstLaunch } from '@/utils/trialManager';

type WelcomeMode = 'loading' | 'new_user' | 'trial_expired';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isSubscribed, refreshSubscription } = useSubscription();
  const [mode, setMode] = useState<WelcomeMode>('loading');
  const [showPaywall, setShowPaywall] = useState(false);

  // Determine which mode to show on mount
  useEffect(() => {
    async function determineMode() {
      console.log('🔵 WELCOME SCREEN: Determining mode...');

      const newUser = await isNewUser();
      console.log('📅 WELCOME SCREEN: isNewUser =', newUser);

      if (newUser) {
        console.log('✅ WELCOME SCREEN: New user — showing Get Started mode');
        setMode('new_user');
        return;
      }

      const expired = await hasTrialExpired();
      console.log('📅 WELCOME SCREEN: hasTrialExpired =', expired);

      if (expired && !isSubscribed) {
        console.log('⏰ WELCOME SCREEN: Trial expired and not subscribed — showing paywall immediately');
        setMode('trial_expired');
        setShowPaywall(true);
        return;
      }

      // Trial still active or subscribed — the _layout routing logic handles redirect,
      // but as a safety net redirect here too
      console.log('✅ WELCOME SCREEN: Trial active or subscribed — redirecting to app');
      loadProfile().then((profile) => {
        const hasCompleteProfile = profile && profile.portionTargets;
        if (hasCompleteProfile) {
          router.replace('/(tabs)/(home)');
        } else {
          router.replace('/setup-profile');
        }
      });
    }

    determineMode();
  }, []);

  // If user becomes subscribed while on this screen, redirect them
  useEffect(() => {
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

  const handleGetStarted = async () => {
    console.log('🟢 WELCOME SCREEN: Get Started button tapped — recording first launch');
    await recordFirstLaunch();
    router.replace('/setup-profile');
  };

  const handlePaywallDismiss = async () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 PAYWALL DISMISS: Paywall dismissed, mode =', mode);
    console.log('═══════════════════════════════════════════════════════');

    setShowPaywall(false);

    // Refresh subscription status — if purchased, the isSubscribed useEffect handles navigation
    await refreshSubscription();

    // Read fresh status directly from storage — do NOT use the `isSubscribed` closure value
    // here because React state hasn't re-rendered yet after refreshSubscription().
    const freshSubscribed = await loadSubscriptionStatus();
    console.log('ℹ️ PAYWALL DISMISS: Subscription status refreshed, freshSubscribed =', freshSubscribed);

    // For trial_expired users: if they dismissed without subscribing, re-show the paywall
    // immediately — they must not be able to escape it
    if (mode === 'trial_expired' && !freshSubscribed) {
      console.log('⚠️ PAYWALL DISMISS: Trial expired and not subscribed — re-showing paywall');
      setShowPaywall(true);
    } else {
      console.log('ℹ️ PAYWALL DISMISS: Purchase confirmed or non-expired mode — navigation handled by useEffect');
    }
  };

  const titleText = 'Welcome to Portion Track';
  const subtitleText = 'Simple Portions. Balanced Eating.';
  const descriptionText = 'A simple way to eat well and build healthy habits for life.';
  const buttonText = 'Get Started';

  const canDismissPaywall = mode !== 'trial_expired';

  console.log('🔵 WELCOME SCREEN RENDER:', { isSubscribed, mode, showPaywall });

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

        {mode === 'new_user' && (
          <TouchableOpacity
            style={[buttonStyles.primary, styles.button]}
            onPress={handleGetStarted}
          >
            <Text style={buttonStyles.primaryText}>{buttonText}</Text>
          </TouchableOpacity>
        )}
      </View>

      <PaywallScreen
        visible={showPaywall}
        onDismiss={handlePaywallDismiss}
        canDismiss={canDismissPaywall}
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
  button: {
    marginBottom: 20,
  },
});
