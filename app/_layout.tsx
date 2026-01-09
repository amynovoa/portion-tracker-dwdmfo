
import 'react-native-reanimated';
import React, { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { loadProfile } from '@/utils/storage';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';

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
      </Stack>
    </GestureHandlerRootView>
  );
}
