
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger key="home" name="(home)">
        <Icon sf="checkmark.circle.fill" />
        <Label>Track</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="history" name="history">
        <Icon sf="clock.fill" />
        <Label>History</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="weight" name="weight">
        <Icon sf="scalemass.fill" />
        <Label>Weight</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="more" name="more">
        <Icon sf="ellipsis.circle.fill" />
        <Label>More</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
