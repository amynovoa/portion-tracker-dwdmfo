
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AppLogo from '@/components/AppLogo';

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
  const buttonY = useRef(new Animated.Value(20)).current;

  // Button press scale
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.97, speed: 50, bounciness: 4, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, speed: 50, bounciness: 4, useNativeDriver: true }).start();
  };

  const handleGetStarted = () => {
    console.log('[WelcomeScreen] "Get Started" button pressed — navigating to /setup-profile');
    router.replace('/setup-profile');
  };

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

        {/* Bottom section */}
        <Animated.View
          style={[
            styles.bottom,
            { opacity: buttonOpacity, transform: [{ translateY: buttonY }] },
          ]}
        >
          <Text style={[styles.hint, { color: C.textTertiary }]}>
            Takes less than a minute to set up
          </Text>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              style={[styles.button, { backgroundColor: C.primary }]}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleGetStarted}
              accessibilityRole="button"
              accessibilityLabel="Get started with Portion Tracker"
            >
              <Text style={styles.buttonText}>Get started</Text>
            </Pressable>
          </Animated.View>
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
  bottom: {
    paddingBottom: 16,
    gap: 12,
    alignItems: 'stretch',
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '400',
  },
  button: {
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
});
