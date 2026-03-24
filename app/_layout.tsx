
import 'react-native-reanimated';
import React, { useEffect, useRef } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { initializeNotifications } from '@/utils/notificationManager';
import { createAutomaticBackup } from '@/utils/backupManager';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';

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
        <Stack.Screen name="welcome" />
        <Stack.Screen name="setup-profile" />
        <Stack.Screen name="setup-targets" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="backup-restore" />
      </Stack>
    </GestureHandlerRootView>
  );
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
      <AppContent />
    </SubscriptionProvider>
  );
}
