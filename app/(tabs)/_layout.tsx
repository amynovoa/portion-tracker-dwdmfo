
import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { loadProfile } from '@/utils/storage';

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkProfile() {
      try {
        console.log('Checking for profile in tabs layout...');
        const profile = await loadProfile();
        const profileExists = !!profile;
        console.log('Profile exists:', profileExists);
        setHasProfile(profileExists);

        // If no profile and not already on profile screen, redirect to profile
        if (!profileExists && segments[1] !== 'profile') {
          console.log('No profile found, redirecting to profile screen');
          router.replace('/(tabs)/profile');
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        setHasProfile(false);
        router.replace('/(tabs)/profile');
      }
    }

    checkProfile();
  }, []);

  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: 'history',
      route: '/(tabs)/history',
      icon: 'calendar',
      label: 'History',
    },
    {
      name: 'weight',
      route: '/(tabs)/weight',
      icon: 'scale',
      label: 'Weight',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      label: 'Profile',
    },
    {
      name: 'settings',
      route: '/(tabs)/settings',
      icon: 'settings',
      label: 'Settings',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="(home)/index" options={{ headerShown: false }} />
        <Stack.Screen name="history" options={{ headerShown: false }} />
        <Stack.Screen name="weight" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
