
import "react-native-reanimated";
import React, { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, View, Text, StyleSheet } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { loadProfile } from "@/utils/storage";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error("ErrorBoundary caught error:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            {this.state.error?.message || "An unexpected error occurred"}
          </Text>
          <Text style={errorStyles.hint}>
            Please restart the app. If the problem persists, try reinstalling.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000",
  },
  message: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
    color: "#666",
  },
  hint: {
    fontSize: 14,
    textAlign: "center",
    color: "#999",
  },
});

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    async function prepare() {
      try {
        console.log('Preparing app...');
        
        // Wait for fonts to load
        if (!loaded && !error) {
          console.log('Waiting for fonts...');
          return;
        }

        if (error) {
          console.error("Font loading error:", error);
        }

        // Check for profile
        console.log('Checking for profile...');
        const profile = await loadProfile();
        console.log('Profile exists:', !!profile);

        // Navigate to appropriate screen
        if (!profile) {
          console.log('No profile found, navigating to profile setup');
          // Use replace to avoid back navigation to blank screen
          router.replace('/(tabs)/profile');
        } else {
          console.log('Profile found, navigating to home');
          // Navigate to home if we're not already in the tabs
          const inTabs = segments[0] === '(tabs)';
          if (!inTabs) {
            router.replace('/(tabs)/(home)/');
          }
        }

        // Mark as ready
        setIsReady(true);
        
        // Hide splash screen
        console.log('Hiding splash screen');
        await SplashScreen.hideAsync();
      } catch (e) {
        console.error('Error during app preparation:', e);
        // Still hide splash screen even if there's an error
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [loaded, error]);

  // Don't render anything until we're ready
  if (!isReady) {
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
    <ThemeProvider
      value={colorScheme === "dark" ? CustomDarkTheme : CustomDefaultTheme}
    >
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="setup-targets"
          options={{
            presentation: "modal",
            title: "Set Portion Targets",
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            title: "Standard Modal",
          }}
        />
        <Stack.Screen
          name="formsheet"
          options={{
            presentation: "formSheet",
            title: "Form Sheet Modal",
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.5, 0.8, 1.0],
            sheetCornerRadius: 20,
          }}
        />
        <Stack.Screen
          name="transparent-modal"
          options={{
            presentation: "transparentModal",
            headerShown: false,
          }}
        />
      </Stack>
      <SystemBars style={"auto"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <StatusBar style="auto" animated />
      <WidgetProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </WidgetProvider>
    </ErrorBoundary>
  );
}
