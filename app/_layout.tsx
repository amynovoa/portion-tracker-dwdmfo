
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
import { SuperwallProvider, SuperwallLoading, SuperwallLoaded } from 'expo-superwall';
import Constants from 'expo-constants';

SplashScreen.preventAutoHideAsync();

// Superwall API Key - Replace with your actual key from Superwall dashboard
const SUPERWALL_API_KEY = 'pk_d1efbc344a5e3cdb8e5e732a2b1e3e5a9c8e5e732a2b1e3e5a9c8e5e732a2b1e';

// Check if we're running in Expo Go (which doesn't support native modules like Superwall)
const isExpoGo = Constants.appOwnership === 'expo';

function AppContent() {
  const [isReady, setIsReady] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('🚀 App starting up...');
        console.log('📱 Platform:', Platform.OS);
        console.log('🔧 Environment:', isExpoGo ? 'Expo Go' : 'Development Build');
        
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

    prepare();
  }, []);

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
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // If running in Expo Go, skip Superwall integration
  if (isExpoGo) {
    console.log('⚠️ Running in Expo Go - Superwall disabled');
    console.log('💡 To test subscriptions, create a development build:');
    console.log('   npx expo prebuild && npx expo run:ios');
    return <AppContent />;
  }

  // For development builds, TestFlight, and production - use Superwall
  console.log('✅ Initializing Superwall SDK');
  console.log('🔑 API Key:', SUPERWALL_API_KEY.substring(0, 20) + '...');

  return (
    <SuperwallProvider 
      apiKeys={{ ios: SUPERWALL_API_KEY }}
      onConfigurationError={(error) => {
        console.error('❌ Superwall configuration error:', error);
      }}
    >
      <SuperwallLoading>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SuperwallLoading>
      <SuperwallLoaded>
        <AppContent />
      </SuperwallLoaded>
    </SuperwallProvider>
  );
}
