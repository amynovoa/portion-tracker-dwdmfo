
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import i18n from '@/utils/i18n';

export default function TabLayout() {
  console.log('iOS Tab Layout: Rendering with FloatingTabBar to avoid native More tab');
  
  // Define all tabs that appear in the tab bar
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'check-circle',
      label: i18n.t('tabs.track'),
    },
    {
      name: 'history',
      route: '/(tabs)/history',
      icon: 'history',
      label: i18n.t('tabs.history'),
    },
    {
      name: 'weight',
      route: '/(tabs)/weight',
      icon: 'monitor-weight',
      label: i18n.t('tabs.weight'),
    },
    {
      name: 'faqs',
      route: '/(tabs)/faqs',
      icon: 'help',
      label: i18n.t('tabs.faqs'),
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      label: i18n.t('tabs.profile'),
    },
    {
      name: 'settings',
      route: '/(tabs)/settings',
      icon: 'settings',
      label: i18n.t('tabs.settings'),
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
        <Stack.Screen name="(home)" />
        <Stack.Screen name="history" />
        <Stack.Screen name="weight" />
        <Stack.Screen name="faqs" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
      </Stack>
      <FloatingTabBar tabs={tabs} useFullWidth={true} />
    </>
  );
}
