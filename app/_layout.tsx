
import 'react-native-reanimated';
import React, { useEffect, useState, useRef } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { loadProfile, loadSubscriptionStatus } from '@/utils/storage';
import { View, ActivityIndicator, AppState, AppStateStatus, Platform } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { initializeNotifications } from '@/utils/notificationManager';
import { createAutomaticBackup } from '@/utils/backupManager';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';

SplashScreen.preventAutoHideAsync();

type InitialRoute = 'welcome' | '(tabs)';

function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<InitialRoute>('welcome');
  const router = useRouter();
  const pathname = usePathname();
  const isReadyRef = useRef(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('🚀 App starting up...');
        console.log('📱 Platform:', Platform.OS);

        // Initialize notifications early (creates channel on Android)
        console.log('Initializing notifications...');
        await initializeNotifications();

        // Check for profile
        console.log('Checking for existing profile...');
        const profile = await loadProfile();
        const hasProfile = !!profile;
        console.log('Profile loaded:', hasProfile ? 'Found' : 'Not found');

        if (!hasProfile) {
          console.log('🔀 ROUTING: No profile → welcome');
          setInitialRoute('welcome');
          setIsReady(true);
          return;
        }

        // Profile exists — check subscription status only
        const subscribed = await loadSubscriptionStatus();
        console.log('🔀 ROUTING: hasProfile =', hasProfile, ', subscribed =', subscribed);

        if (subscribed) {
          // Subscribed (RevenueCat reports Apple free trial as active) — go straight to app
          console.log('🔀 ROUTING: Subscribed → (tabs)');
          setInitialRoute('(tabs)');
        } else {
          // Not subscribed — send to welcome to show paywall
          console.log('🔀 ROUTING: Not subscribed → welcome (paywall will show)');
          setInitialRoute('welcome');
        }

        isReadyRef.current = true;
        setIsReady(true);

        // Do backup in background AFTER the app is ready
        if (profile) {
          setTimeout(async () => {
            try {
              console.log('Background: Creating automatic backup...');
              await createAutomaticBackup();
            } catch (error) {
              console.error('Background tasks error:', error);
            }
          }, 1000);
        }
      } catch (e) {
        console.error('Error during app initialization:', e);
        setInitialRoute('welcome');
        isReadyRef.current = true;
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  // On every foreground event, re-check subscription and redirect if access lost
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Always run backup
        console.log('App came to foreground, creating backup in background...');
        setTimeout(async () => {
          try {
            await createAutomaticBackup();
          } catch (error) {
            console.error('Error creating automatic backup:', error);
          }
        }, 2000);

        // Only enforce access gate once the app is fully initialised
        if (!isReadyRef.current) return;

        console.log('🔒 LAYOUT: App foregrounded — re-checking subscription access');
        const subscribed = await loadSubscriptionStatus();
        console.log('🔒 LAYOUT: foreground access check — subscribed:', subscribed);

        if (!subscribed) {
          // Check we are not already on a safe screen (welcome handles the paywall)
          const safeScreens = ['/welcome', '/setup-profile', '/setup-targets'];
          const onSafeScreen = safeScreens.some((s) => pathname === s || pathname.startsWith(s));
          if (!onSafeScreen) {
            console.log('🔒 LAYOUT: Not subscribed — redirecting to /welcome');
            router.replace('/welcome');
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [pathname, router]);

  useEffect(() => {
    if (isReady) {
      console.log('✅ App ready, hiding splash screen');
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRoute}
      >
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
