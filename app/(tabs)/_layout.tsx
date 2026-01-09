
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  // Define the tabs configuration
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Track',
    },
    {
      name: 'history',
      route: '/(tabs)/history',
      icon: 'history',
      label: 'History',
    },
    {
      name: 'weight',
      route: '/(tabs)/weight',
      icon: 'fitness-center',
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
  ];

  // For Android and Web, use Stack navigation with custom floating tab bar
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none', // Remove fade animation to prevent black screen flash
        }}
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="history" name="history" />
        <Stack.Screen key="weight" name="weight" />
        <Stack.Screen key="faq" name="faq" />
        <Stack.Screen key="profile" name="profile" />
        <Stack.Screen key="settings" name="settings" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
