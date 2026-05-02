
import 'react-native-reanimated';
import React, { useEffect, useRef, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack, Redirect, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { initializeNotifications } from '@/utils/notificationManager';
import { createAutomaticBackup } from '@/utils/backupManager';
import { isOnboardingComplete } from "@/utils/onboardingStorage";
import { SubscriptionProvider, useSubscription } from '@/contexts/SubscriptionContext';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const pathname = usePathname();
  const initializedRef = useRef(false);

  useEffect(() => {
    isOnboardingComplete().then((complete) => {
      setOnboardingComplete(complete);
    });
  }, [pathname]);

  useEffect(() => {
    if (onboardingComplete === null) return;
    async function prepare() {
      if (initializedRef.current) return;
      initializedRef.current = true;

      try {
        console.log('[Layout] App starting up — initializing notifications');
        await initializeNotifications();

        console.log('[Layout] Running initial backup in background');
        setTimeout(async () => {
          try {
            await createAutomaticBackup();
          } catch (err) {
            console.error('[Layout] Background backup error:', err);
          }
        }, 1000);
      } catch (e) {
        console.error('[Layout] Error during app initialization:', e);
      } finally {
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [onboardingComplete]);

  // Foreground backup (subscription refresh is handled by SubscriptionContext's AppState listener)
  useEffect(() => {
    const { AppState } = require('react-native');
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active') {
        setTimeout(async () => {
          try {
            await createAutomaticBackup();
          } catch (err) {
            console.error('[Layout] Foreground backup error:', err);
          }
        }, 2000);
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, []);

  if (onboardingComplete === null) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {onboardingComplete === false && pathname !== "/" && pathname !== "/auth" && pathname !== "/paywall" && pathname !== "/welcome" && pathname !== "/setup-profile" && pathname !== "/setup-targets" && pathname !== "/auth-popup" && pathname !== "/auth-callback" && <Redirect href="/onboarding" />}

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />

        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="paywall" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="setup-profile" />
        <Stack.Screen name="setup-targets" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="backup-restore" />
      </Stack>
    </GestureHandlerRootView>
  );
}


function SubscriptionRedirect() {
  const { isSubscribed, loading } = useSubscription();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    const onOnboarding = pathname.startsWith("/onboarding");
    if (onOnboarding) return;

    let cancelled = false;
    isOnboardingComplete().then((done) => {
      if (cancelled) return;
      if (!done) return;
      const onPaywall = pathname === "/paywall";
      if (onPaywall) return;
      if (!isSubscribed) {
        router.replace("/paywall");
      }
    }).catch(() => {
      if (cancelled) return;
      const onPaywall = pathname === "/paywall";
      if (onPaywall) return;
      if (!isSubscribed) {
        router.replace("/paywall");
      }
    });
    return () => { cancelled = true; };
  }, [isSubscribed, loading, pathname]);

  return null;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SubscriptionProvider>
          <SubscriptionRedirect />
      <AppContent />
    </SubscriptionProvider>
  );
}
