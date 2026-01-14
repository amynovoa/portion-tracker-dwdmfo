
import 'react-native-reanimated';
import React, { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { loadProfile } from '@/utils/storage';
import { View, ActivityIndicator, AppState, AppStateStatus } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { requestNotificationPermissions, scheduleNoonReminder } from '@/utils/notificationManager';
import { createAutomaticBackup } from '@/utils/backupManager';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        console.log('Checking for existing profile...');
        const profile = await loadProfile();
        console.log('Profile loaded:', profile ? 'Found' : 'Not found');
        setHasProfile(!!profile);

        // Request notification permissions and schedule noon reminder if profile exists
        if (profile) {
          console.log('Requesting notification permissions...');
          const hasPermission = await requestNotificationPermissions();
          if (hasPermission) {
            console.log('Scheduling noon reminder...');
            await scheduleNoonReminder();
          }

          // Create automatic backup on app launch
          console.log('Creating automatic backup on app launch...');
          await createAutomaticBackup();
        }
      } catch (e) {
        console.error('Error loading profile:', e);
        setHasProfile(false);
      } finally {
        setIsReady(true);
      }
    }

    if (loaded) {
      prepare();
    }
  }, [loaded]);

  // Create backup when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('App came to foreground, creating backup...');
        try {
          await createAutomaticBackup();
        } catch (error) {
          console.error('Error creating automatic backup:', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (loaded && isReady) {
      console.log('App ready, hiding splash screen');
      SplashScreen.hideAsync();
    }
  }, [loaded, isReady]);

  if (!loaded || !isReady) {
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
