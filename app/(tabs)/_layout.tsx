
import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { loadProfile } from '@/utils/storage';

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [hasCheckedInitially, setHasCheckedInitially] = useState(false);

  useEffect(() => {
    async function checkProfile() {
      try {
        console.log('Tabs layout: Checking for profile...');
        const profile = await loadProfile();
        const profileExists = !!profile;
        console.log('Tabs layout: Profile exists:', profileExists);

        // Only redirect to profile if:
        // 1. No profile exists
        // 2. We haven't checked initially yet (to avoid redirecting on every navigation)
        // 3. We're on the home screen
        if (!profileExists && !hasCheckedInitially && segments && segments[1] === '(home)') {
          console.log('Tabs layout: No profile found, but letting home screen show welcome message');
          // Don't redirect - let the home screen show the welcome message
          // The user will click "Set Up My Profile" button to navigate to profile
        }
        
        setHasCheckedInitially(true);
        setIsCheckingProfile(false);
      } catch (error) {
        console.error('Tabs layout: Error checking profile:', error);
        setIsCheckingProfile(false);
      }
    }

    checkProfile();
  }, [segments]);

  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'assignment',
      label: 'Track',
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
      name: 'faq',
      route: '/(tabs)/faq',
      icon: 'help',
      label: 'FAQs',
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
        <Stack.Screen name="faq" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>
      <FloatingTabBar tabs={tabs} useFullWidth={true} />
    </>
  );
}
