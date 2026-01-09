
import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import FloatingTabBar from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
      tabBar={(props) => (
        <FloatingTabBar
          tabs={[
            {
              name: '(home)',
              title: 'Track',
              icon: 'check-circle',
              route: '/(tabs)/(home)',
            },
            {
              name: 'history',
              title: 'History',
              icon: 'history',
              route: '/(tabs)/history',
            },
            {
              name: 'weight',
              title: 'Weight',
              icon: 'monitor-weight',
              route: '/(tabs)/weight',
            },
            {
              name: 'faq',
              title: 'FAQs',
              icon: 'help',
              route: '/(tabs)/faq',
            },
            {
              name: 'profile',
              title: 'Profile',
              icon: 'person',
              route: '/(tabs)/profile',
            },
            {
              name: 'settings',
              title: 'Settings',
              icon: 'settings',
              route: '/(tabs)/settings',
            },
          ]}
          useFullWidth={true}
        />
      )}
    >
      <Tabs.Screen name="(home)" options={{ title: 'Track' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="weight" options={{ title: 'Weight' }} />
      <Tabs.Screen name="faq" options={{ title: 'FAQs' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
