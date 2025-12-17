
import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { loadProfile } from '@/utils/storage';

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  useEffect(() => {
    async function checkProfile() {
      try {
        console.log('Tabs layout (iOS): Checking for profile...');
        const profile = await loadProfile();
        const profileExists = !!profile;
        console.log('Tabs layout (iOS): Profile exists:', profileExists);

        // Only redirect to profile if no profile exists AND we're on the home screen
        if (!profileExists && segments && segments[1] === '(home)') {
          console.log('Tabs layout (iOS): No profile found, redirecting to profile screen');
          router.replace('/(tabs)/profile');
        }
        
        setIsCheckingProfile(false);
      } catch (error) {
        console.error('Tabs layout (iOS): Error checking profile:', error);
        setIsCheckingProfile(false);
      }
    }

    checkProfile();
  }, [segments]);

  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'checkmark.square',
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
      icon: 'scalemass',
      label: 'Weight',
    },
    {
      name: 'faq',
      route: '/(tabs)/faq',
      icon: 'questionmark.circle',
      label: 'FAQs',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person.fill',
      label: 'Profile',
    },
    {
      name: 'settings',
      route: '/(tabs)/settings',
      icon: 'gearshape',
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
