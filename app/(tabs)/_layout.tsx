
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
      icon: 'calendar-today',
      label: 'History',
    },
    {
      name: 'weight',
      route: '/(tabs)/weight',
      icon: 'monitor-weight',
      label: 'Weight',
    },
    {
      name: 'faqs',
      route: '/(tabs)/faqs',
      icon: 'help-outline',
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
        <Stack.Screen key="faqs" name="faqs" />
        <Stack.Screen key="profile" name="profile" />
        <Stack.Screen key="settings" name="settings" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
