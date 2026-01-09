
import React from 'react';
import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Track',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol 
              ios_icon_name="checkmark.square.fill" 
              android_material_icon_name="check-box" 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol 
              ios_icon_name="calendar" 
              android_material_icon_name="calendar-today" 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="weight"
        options={{
          title: 'Weight',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol 
              ios_icon_name="scalemass.fill" 
              android_material_icon_name="monitor-weight" 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="faq"
        options={{
          title: 'FAQs',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol 
              ios_icon_name="questionmark.circle.fill" 
              android_material_icon_name="help" 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol 
              ios_icon_name="person.fill" 
              android_material_icon_name="person" 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <IconSymbol 
              ios_icon_name="gearshape.fill" 
              android_material_icon_name="settings" 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
