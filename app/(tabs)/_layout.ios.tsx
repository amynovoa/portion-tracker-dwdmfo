
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger key="home" name="(home)">
        <Icon sf="fork.knife" />
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
      <NativeTabs.Trigger key="faqs" name="faqs">
        <Icon sf="questionmark.circle.fill" />
        <Label>FAQs</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="profile" name="profile">
        <Icon sf="person.fill" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="settings" name="settings">
        <Icon sf="gearshape.fill" />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
