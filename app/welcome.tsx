
import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AppLogo from '@/components/AppLogo';
import { logViewLanding } from '@/utils/metaAnalytics';

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

  // Entrance animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(16)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(12)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    logViewLanding();
    // Run branding animation only — do NOT auto-show paywall
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
      Animated.parallel([
        Animated.timing(buttonOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(buttonY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => {
      console.log('[WelcomeScreen] Branding animation complete — waiting for user to tap Get Started');
    });
  }, []);

  // "Get Started" button — navigates to the RevenueCat paywall
  const handleGetStarted = useCallback(() => {
    console.log('[WelcomeScreen] Get Started tapped — navigating to /paywall');
    router.push('/paywall');
  }, [router]);

  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language?.startsWith('es');

  const appName = `${t('welcome.welcomeTo')} Portion Track`;
  const tagline = t('welcome.tagline');
  const subtitle = t('welcome.subtitle');
  const getStartedLabel = t('welcome.getStarted');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <View style={styles.container}>

        {/* Top decorative accent */}
        <View style={[styles.accentBar, { backgroundColor: C.primaryMuted }]} />

        {/* Hero section */}
        <View style={[styles.hero, isSpanish && { gap: 12, paddingBottom: 32 }]}>
          <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
            <View style={[
              styles.logoRing,
              isSpanish && { width: 96, height: 96, borderRadius: 28 },
              { backgroundColor: C.primaryMuted, borderColor: C.border },
            ]}>
              <AppLogo size={isSpanish ? 56 : 72} />
            </View>
          </Animated.View>

          <Animated.Text
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            style={[
              styles.appName,
              isSpanish && { fontSize: 28, lineHeight: 32 },
              { color: C.text, opacity: titleOpacity, transform: [{ translateY: titleY }] },
            ]}
          >
            {appName}
          </Animated.Text>

          <Animated.Text
            numberOfLines={3}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            style={[
              styles.tagline,
              isSpanish && { fontSize: 15, lineHeight: 20 },
              { color: C.primary, opacity: taglineOpacity, transform: [{ translateY: taglineY }] },
            ]}
          >
            {tagline}
          </Animated.Text>

          <Animated.Text
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
            style={[
              styles.subtitle,
              isSpanish && { fontSize: 13, lineHeight: 18 },
              { color: C.textSecondary, opacity: taglineOpacity, transform: [{ translateY: taglineY }] },
            ]}
          >
            {subtitle}
          </Animated.Text>
        </View>

        {/* Get Started button — only way to open the paywall */}
        <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity, transform: [{ translateY: buttonY }] }]}>
          <TouchableOpacity
            style={[styles.getStartedButton, { backgroundColor: C.primary }]}
            onPress={handleGetStarted}
            activeOpacity={0.85}
          >
            <Text style={styles.getStartedText}>{getStartedLabel}</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>

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
    paddingBottom: 24,
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
    maxWidth: width * 0.85,
    paddingHorizontal: 12,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: width * 0.75,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 8,
  },
  getStartedButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
