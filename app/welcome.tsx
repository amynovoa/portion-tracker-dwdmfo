
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { loadSubscriptionStatus, loadProfile } from '@/utils/storage';
import PaywallScreen from '@/components/PaywallScreen';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { isTestFlightBuild } from '@/utils/subscriptionManager';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isSubscribed, refreshSubscription } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    // Check if we're in development/TestFlight mode
    const checkDevMode = async () => {
      const devMode = isTestFlightBuild();
      console.log('Welcome: Dev/TestFlight mode:', devMode);
      setIsDevMode(devMode);
    };
    checkDevMode();
  }, []);

  useEffect(() => {
    // Check subscription status on mount and when context updates
    const checkSubscription = async () => {
      const subscribed = await loadSubscriptionStatus();
      console.log('Welcome: Subscription status:', subscribed);
      setHasSubscription(subscribed || isDevMode);
    };
    checkSubscription();
  }, [isSubscribed, isDevMode]);

  const handleStartTrial = () => {
    console.log('User tapped Start Your Free Trial button');
    setShowPaywall(true);
  };

  const handleGetStarted = async () => {
    console.log('User tapped Get Started button');
    
    // Check if profile already exists
    const profile = await loadProfile();
    console.log('Welcome: Profile exists:', !!profile);
    
    if (profile && profile.portionTargets) {
      // Profile already exists, go directly to main app
      console.log('Welcome: Profile exists -> Going to main app');
      router.replace('/(tabs)/(home)');
    } else {
      // No profile, go to setup
      console.log('Welcome: No profile -> Going to setup-profile');
      router.replace('/setup-profile');
    }
  };

  const handlePaywallDismiss = async () => {
    console.log('Paywall dismissed');
    setShowPaywall(false);
    
    // Refresh subscription status from context
    await refreshSubscription();
    
    // Check if user just subscribed
    const subscribed = await loadSubscriptionStatus();
    console.log('Paywall dismissed - Subscription status:', subscribed);
    
    if (subscribed) {
      // User subscribed - update state to show "Get Started" button
      setHasSubscription(true);
      console.log('Paywall: User subscribed - showing Get Started button');
    }
  };

  // Show "Get Started" if user has subscription OR is in dev mode
  const shouldShowGetStarted = hasSubscription || isDevMode;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Portion Track</Text>
          <Text style={styles.subtitle}>Simple Portions. Real-life Flexibility.</Text>
          <Text style={styles.description}>
            Track what you eat using portions instead of calories - and adjust them to fit your goals with ease.
          </Text>
        </View>

        {shouldShowGetStarted ? (
          <TouchableOpacity
            style={[buttonStyles.primary, styles.button]}
            onPress={handleGetStarted}
          >
            <Text style={buttonStyles.primaryText}>Get Started</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[buttonStyles.primary, styles.button]}
            onPress={handleStartTrial}
          >
            <Text style={buttonStyles.primaryText}>Start Your Free Trial</Text>
          </TouchableOpacity>
        )}
      </View>

      <PaywallScreen
        visible={showPaywall}
        onDismiss={handlePaywallDismiss}
        canDismiss={true}
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
