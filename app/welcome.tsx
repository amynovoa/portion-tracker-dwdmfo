
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { loadSubscriptionStatus, loadProfile } from '@/utils/storage';
import PaywallScreen from '@/components/PaywallScreen';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isSubscribed, refreshSubscription } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    // Check subscription status on mount and when context updates
    const checkSubscription = async () => {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔵 WELCOME SCREEN: useEffect triggered');
      console.log('📊 WELCOME SCREEN: isSubscribed from context:', isSubscribed);
      console.log('═══════════════════════════════════════════════════════');
      
      const subscribed = await loadSubscriptionStatus();
      
      console.log('📊 WELCOME SCREEN RESULT:');
      console.log('  - Status from AsyncStorage:', subscribed);
      console.log('  - Status from context:', isSubscribed);
      console.log('  - Will update local state to:', subscribed);
      console.log('═══════════════════════════════════════════════════════');
      
      setHasSubscription(subscribed);
    };
    checkSubscription();
  }, [isSubscribed]);

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
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔵 PAYWALL DISMISS: Paywall dismissed, checking subscription status');
    console.log('═══════════════════════════════════════════════════════');
    
    setShowPaywall(false);
    
    // CRITICAL FIX: Wait longer for AsyncStorage write to complete
    // The purchase listener in subscriptionManager saves subscription status asynchronously
    console.log('⏳ PAYWALL DISMISS: Waiting 800ms for AsyncStorage to settle...');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Refresh subscription status from context
    console.log('🔄 PAYWALL DISMISS: Refreshing subscription context...');
    await refreshSubscription();
    
    // Force another small delay to ensure context state propagates
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Check subscription status directly from AsyncStorage
    console.log('🔄 PAYWALL DISMISS: Loading subscription status from AsyncStorage...');
    const subscribed = await loadSubscriptionStatus();
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 PAYWALL DISMISS RESULT:');
    console.log('  - Subscription status from AsyncStorage:', subscribed);
    console.log('  - Will show Get Started button:', subscribed);
    console.log('═══════════════════════════════════════════════════════');
    
    // CRITICAL: Force update local state immediately
    setHasSubscription(subscribed);
    
    if (subscribed) {
      console.log('✅ PAYWALL DISMISS: User subscribed - updated local state to show Get Started button');
    } else {
      console.log('ℹ️ PAYWALL DISMISS: No subscription found - keeping Start Free Trial button');
    }
  };

  // Show "Get Started" if user has subscription
  const shouldShowGetStarted = hasSubscription;
  
  const buttonText = shouldShowGetStarted 
    ? 'You are all set - Let\'s get started' 
    : 'Start Your Free Trial';

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
          onPress={shouldShowGetStarted ? handleGetStarted : handleStartTrial}
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
