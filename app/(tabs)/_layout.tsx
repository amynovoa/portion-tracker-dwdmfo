
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  useSubscriptionGuard();
  const { t } = useTranslation();

  // Define all tabs that appear in the tab bar
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'check-circle',
      label: t('tabs.track'),
    },
    {
      name: 'history',
      route: '/(tabs)/history',
      icon: 'history',
      label: t('tabs.history'),
    },
    {
      name: 'weight',
      route: '/(tabs)/weight',
      icon: 'monitor-weight',
      label: t('tabs.weight'),
    },
    {
      name: 'faqs',
      route: '/(tabs)/faqs',
      icon: 'help',
      label: t('tabs.faqs'),
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      label: t('tabs.profile'),
    },
    {
      name: 'settings',
      route: '/(tabs)/settings',
      icon: 'settings',
      label: t('tabs.settings'),
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
