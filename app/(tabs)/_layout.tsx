
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  // Define all 6 tabs configuration
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'check-circle',
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
      icon: 'monitor-weight',
      label: 'Weight',
    },
    {
      name: 'faqs',
      route: '/(tabs)/faqs',
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
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="history" name="history" />
        <Stack.Screen key="weight" name="weight" />
        <Stack.Screen key="faqs" name="faqs" />
        <Stack.Screen key="profile" name="profile" />
        <Stack.Screen key="settings" name="settings" />
      </Stack>
      <FloatingTabBar tabs={tabs} useFullWidth={true} />
    </>
  );
}
