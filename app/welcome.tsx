
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { loadProfile } from '@/utils/storage';
import PaywallScreen from '@/components/PaywallScreen';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isSubscribed, refreshSubscription } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);

  // If user becomes subscribed while on this screen, redirect them
  useEffect(() => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 WELCOME SCREEN: Subscription status changed');
    console.log('📊 WELCOME SCREEN: isSubscribed from context:', isSubscribed);
    console.log('═══════════════════════════════════════════════════════');
    
    if (isSubscribed) {
      console.log('✅ WELCOME SCREEN: User is subscribed, checking profile...');
      
      // Check if profile exists and redirect accordingly
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

  const handleStartTrial = () => {
    console.log('User tapped Start Your Free Trial button');
    setShowPaywall(true);
  };

  const handlePaywallDismiss = async () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 PAYWALL DISMISS: Paywall dismissed');
    console.log('═══════════════════════════════════════════════════════');
    
    setShowPaywall(false);
    
    // Refresh subscription status to ensure we have the latest state
    await refreshSubscription();
    
    console.log('ℹ️ PAYWALL DISMISS: Subscription status refreshed');
    console.log('ℹ️ PAYWALL DISMISS: If purchase completed, useEffect will handle navigation');
  };

  const buttonText = 'Start Your Free Trial';

  console.log('🔵 WELCOME SCREEN RENDER:', {
    isSubscribed,
    buttonText,
  });

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

        <TouchableOpacity
          style={[buttonStyles.primary, styles.button]}
          onPress={handleStartTrial}
        >
          <Text style={buttonStyles.primaryText}>{buttonText}</Text>
        </TouchableOpacity>
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
