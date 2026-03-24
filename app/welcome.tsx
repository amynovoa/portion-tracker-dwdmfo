
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AppLogo from '@/components/AppLogo';
import PaywallScreen from '@/components/PaywallScreen';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { loadProfile } from '@/utils/storage';

const { width } = Dimensions.get('window');

const LIGHT = {
  background: '#FDF6F5',
  surface: '#FFFFFF',
  text: '#1A0F0E',
  textSecondary: '#7A5C59',
  textTertiary: '#B09490',
  primary: '#C94A3D',
  primaryMuted: '#FAE8E6',
  accent: '#C8D647',
  border: 'rgba(201,74,61,0.10)',
};

const DARK = {
  background: '#1A0F0E',
  surface: '#2A1A18',
  text: '#F5EDEC',
  textSecondary: '#B09490',
  textTertiary: '#7A5C59',
  primary: '#E05A4D',
  primaryMuted: 'rgba(224,90,77,0.15)',
  accent: '#C8D647',
  border: 'rgba(224,90,77,0.12)',
};

export default function WelcomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const { refreshSubscription } = useSubscription();

  // Paywall is shown immediately on mount — inescapable
  const [paywallVisible, setPaywallVisible] = useState(false);

  // Entrance animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(16)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    // Run branding animation, then show paywall immediately after
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, speed: 14, bounciness: 6, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(taglineY, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]),
    ]).start(() => {
      console.log('[WelcomeScreen] Branding animation complete — showing paywall immediately');
      setPaywallVisible(true);
    });
  }, []);

  // Paywall dismissed without subscribing — re-show immediately (inescapable)
  const handlePaywallDismiss = useCallback(() => {
    console.log('[WelcomeScreen] Paywall dismissed without subscribing — re-showing paywall');
    setPaywallVisible(false);
    setTimeout(() => {
      setPaywallVisible(true);
    }, 300);
  }, []);

  // Successful purchase — refresh context, verify, then route
  const handleSubscribeSuccess = useCallback(async () => {
    console.log('[WelcomeScreen] Purchase confirmed — refreshing subscription context');
    await refreshSubscription();

    const profile = await loadProfile();
    const onboardingComplete = !!(profile && profile.portionTargets);
    console.log('[WelcomeScreen] Post-purchase onboarding check — complete:', onboardingComplete);

    setPaywallVisible(false);

    if (onboardingComplete) {
      console.log('[WelcomeScreen] Onboarding done → navigating to /(tabs)');
      router.replace('/(tabs)');
    } else {
      console.log('[WelcomeScreen] Onboarding not done → navigating to /setup-profile');
      router.replace('/setup-profile');
    }
  }, [refreshSubscription, router]);

  const appName = 'Welcome to Portion Track';
  const tagline = 'Simple Portions. Balanced Eating.';
  const subtitle = 'A simple way to eat well and build healthy habits for life.';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <View style={styles.container}>

        {/* Top decorative accent */}
        <View style={[styles.accentBar, { backgroundColor: C.primaryMuted }]} />

        {/* Hero section */}
        <View style={styles.hero}>
          <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
            <View style={[styles.logoRing, { backgroundColor: C.primaryMuted, borderColor: C.border }]}>
              <AppLogo size={72} />
            </View>
          </Animated.View>

          <Animated.Text
            style={[
              styles.appName,
              { color: C.text, opacity: titleOpacity, transform: [{ translateY: titleY }] },
            ]}
          >
            {appName}
          </Animated.Text>

          <Animated.Text
            style={[
              styles.tagline,
              { color: C.primary, opacity: taglineOpacity, transform: [{ translateY: taglineY }] },
            ]}
          >
            {tagline}
          </Animated.Text>

          <Animated.Text
            style={[
              styles.subtitle,
              { color: C.textSecondary, opacity: taglineOpacity, transform: [{ translateY: taglineY }] },
            ]}
          >
            {subtitle}
          </Animated.Text>
        </View>

      </View>

      {/* Inescapable paywall — shown immediately on mount, dismissing re-shows it */}
      <PaywallScreen
        visible={paywallVisible}
        canDismiss={true}
        onDismiss={handlePaywallDismiss}
        onSubscribeSuccess={handleSubscribeSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  accentBar: {
    height: 4,
    width: 40,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 0,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logoRing: {
    width: 120,
    height: 120,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.7,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: width * 0.75,
  },
});
