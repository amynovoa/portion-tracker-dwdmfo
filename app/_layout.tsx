
import 'react-native-reanimated';
import React, { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { loadProfile } from '@/utils/storage';
import { View, ActivityIndicator, AppState, AppStateStatus, Platform } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { requestNotificationPermissions, scheduleNoonReminder } from '@/utils/notificationManager';
import { createAutomaticBackup } from '@/utils/backupManager';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('🚀 App starting up...');
        console.log('📱 Platform:', Platform.OS);
        
        // CRITICAL: Only check for profile - do everything else in background
        console.log('Checking for existing profile...');
        const profile = await loadProfile();
        console.log('Profile loaded:', profile ? 'Found' : 'Not found');
        setHasProfile(!!profile);

        // Mark app as ready immediately after profile check
        setIsReady(true);

        // Do everything else in the background AFTER the app is ready
        if (profile) {
          // Run these in background without blocking app launch
          setTimeout(async () => {
            try {
              console.log('Background: Requesting notification permissions...');
              const hasPermission = await requestNotificationPermissions();
              if (hasPermission) {
                console.log('Background: Scheduling noon reminder...');
                await scheduleNoonReminder();
              }

              console.log('Background: Creating automatic backup...');
              await createAutomaticBackup();
            } catch (error) {
              console.error('Background tasks error:', error);
            }
          }, 1000); // Wait 1 second after app loads to run background tasks
        }
      } catch (e) {
        console.error('Error loading profile:', e);
        setHasProfile(false);
        setIsReady(true); // Still mark as ready even if there's an error
      }
    }

    prepare();
  }, []);

  // Create backup when app comes to foreground (in background)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('App came to foreground, creating backup in background...');
        // Run in background without blocking
        setTimeout(async () => {
          try {
            await createAutomaticBackup();
          } catch (error) {
            console.error('Error creating automatic backup:', error);
          }
        }, 2000); // Wait 2 seconds after coming to foreground
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

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
        initialRouteName={hasProfile ? '(tabs)' : 'welcome'}
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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const [loaded] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Removed all Superwall integration - it was causing the 60-90 second delay
  console.log('✅ App initialized without Superwall (removed to fix launch delay)');
  
  return <AppContent />;
}
