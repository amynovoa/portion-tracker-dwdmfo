
import 'react-native-reanimated';
import React, { useEffect, useRef, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { initializeNotifications } from '@/utils/notificationManager';
import { createAutomaticBackup } from '@/utils/backupManager';
import { SubscriptionProvider, useSubscription } from '@/contexts/SubscriptionContext';
import { initI18n } from '@/utils/i18n';
import { supabase } from '@/utils/supabase';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const initializedRef = useRef(false);

  useEffect(() => {
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
  }, []);

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="paywall" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="setup-profile" />
        <Stack.Screen name="setup-targets" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="backup-restore" />
        <Stack.Screen name="daily-reset" options={{ headerShown: true }} />
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
    if (pathname === '/') return;
    if (pathname === '/paywall') return;
    if (pathname === '/welcome') return;
    if (pathname === '/setup-profile') return;
    if (pathname === '/setup-targets') return;
    if (pathname === '/auth-popup') return;
    if (pathname === '/auth-callback') return;

    if (!isSubscribed) {
      console.log('[SubscriptionRedirect] not subscribed, redirecting to /paywall from', pathname);
      router.replace('/paywall');
    }
  }, [isSubscribed, loading, pathname]);

  return null;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => {
      console.log('[Layout] i18n initialized');
      setI18nReady(true);
    }).catch((err) => {
      console.error('[Layout] i18n init error:', err);
      setI18nReady(true);
    });
  }, []);

  if (!loaded || !i18nReady) {
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
