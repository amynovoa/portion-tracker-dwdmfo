
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  return (
    <NativeTabs
      tintColor={colors.primary}
      iconColor={colors.textSecondary}
      backgroundColor={colors.card}
    >
      <NativeTabs.Trigger name="(home)/index">
        <Label>Home</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <Label>History</Label>
        <Icon sf="calendar" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="weight">
        <Label>Weight</Label>
        <Icon sf="scalemass.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf="person.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Label>Settings</Label>
        <Icon sf="gearshape.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
