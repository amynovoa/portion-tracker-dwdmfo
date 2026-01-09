
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger key="home" name="(home)">
        <Icon sf="checkmark.square.fill" />
        <Label>Track</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="history" name="history">
        <Icon sf="calendar" />
        <Label>History</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="weight" name="weight">
        <Icon sf="chart.line.uptrend.xyaxis" />
        <Label>Weight</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="faq" name="faq">
        <Icon sf="questionmark.circle.fill" />
        <Label>FAQs</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="profile" name="profile">
        <Icon sf="person.fill" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
