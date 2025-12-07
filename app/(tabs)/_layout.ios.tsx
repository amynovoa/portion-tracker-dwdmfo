
import React, { useEffect, useState } from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { loadProfile } from '@/utils/storage';
import { View, ActivityIndicator } from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    console.log('Checking for profile...');
    const profile = await loadProfile();
    console.log('Profile exists:', !!profile);
    setHasProfile(!!profile);
    
    if (!profile) {
      console.log('No profile found, navigating to profile tab');
      // Use setTimeout to ensure navigation happens after layout is ready
      setTimeout(() => {
        router.replace('/(tabs)/profile');
      }, 100);
    }
  };

  // Show loading while checking profile
  if (hasProfile === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
