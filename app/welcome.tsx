
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { loadSubscriptionStatus } from '@/utils/storage';
import PaywallScreen from '@/components/PaywallScreen';

export default function WelcomeScreen() {
  const router = useRouter();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    console.log('Welcome: Checking subscription status...');
    const subscribed = await loadSubscriptionStatus();
    console.log('Welcome: Subscription status:', subscribed);
    setIsSubscribed(subscribed);
    setIsLoading(false);
  };

  const handleStartTrial = () => {
    console.log('User tapped Start 7-Day Free Trial button');
    setShowPaywall(true);
  };

  const handleGetStarted = () => {
    console.log('User tapped Get Started button');
    router.push('/setup-profile');
  };

  const handlePaywallDismiss = () => {
    console.log('Paywall dismissed');
    setShowPaywall(false);
    // Re-check subscription status in case user subscribed
    checkSubscriptionStatus();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

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

        {isSubscribed ? (
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
            <Text style={buttonStyles.primaryText}>Start 7-Day Free Trial</Text>
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
