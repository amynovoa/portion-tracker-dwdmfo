
import "react-native-reanimated";
import React, { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Alert } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { loadProfile } from "@/utils/storage";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "welcome",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const networkState = useNetworkState();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    async function checkProfile() {
      try {
        console.log('Checking profile...');
        const profile = await loadProfile();
        console.log('Profile loaded:', profile ? 'Profile exists' : 'No profile found');
        
        if (loaded && !hasNavigated) {
          await SplashScreen.hideAsync();
          setHasNavigated(true);
          
          // Small delay to ensure navigation is ready
          setTimeout(() => {
            if (profile && profile.portionTargets) {
              // User has completed setup, go to main app
              console.log('Navigating to main app (tabs)');
              router.replace('/(tabs)/(home)');
            } else {
              // No profile, show welcome screen
              console.log('Navigating to welcome screen');
              router.replace('/welcome');
            }
            setIsCheckingProfile(false);
          }, 100);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        if (loaded && !hasNavigated) {
          await SplashScreen.hideAsync();
          setHasNavigated(true);
          setTimeout(() => {
            router.replace('/welcome');
            setIsCheckingProfile(false);
          }, 100);
        }
      }
    }

    checkProfile();
  }, [loaded, hasNavigated]);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "🔌 You are offline",
        "You can keep using the app! Your changes will be saved locally and synced when you are back online."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  if (!loaded || isCheckingProfile) {
    return null;
  }

  const CustomDefaultTheme: Theme = {
    ...DefaultTheme,
    dark: false,
    colors: {
      primary: "rgb(0, 122, 255)",
      background: "rgb(242, 242, 247)",
      card: "rgb(255, 255, 255)",
      text: "rgb(0, 0, 0)",
      border: "rgb(216, 216, 220)",
      notification: "rgb(255, 59, 48)",
    },
  };

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "rgb(10, 132, 255)",
      background: "rgb(1, 1, 1)",
      card: "rgb(28, 28, 30)",
      text: "rgb(255, 255, 255)",
      border: "rgb(44, 44, 46)",
      notification: "rgb(255, 69, 58)",
    },
  };
  
  return (
    <>
      <StatusBar style="auto" animated />
        <ThemeProvider
          value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
        >
          <SubscriptionProvider>
            <WidgetProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="welcome" options={{ headerShown: false }} />
                <Stack.Screen name="setup-profile" options={{ headerShown: false }} />
                <Stack.Screen name="setup-targets" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
              <SystemBars style={"auto"} />
              </GestureHandlerRootView>
            </WidgetProvider>
          </SubscriptionProvider>
        </ThemeProvider>
    </>
  );
}
