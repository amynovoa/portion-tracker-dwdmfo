
import React, { useEffect, useState } from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { colors } from '@/styles/commonStyles';
import { loadProfile } from '@/utils/storage';
import { useRouter, useSegments } from 'expo-router';

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkProfile() {
      try {
        console.log('Checking for profile in tabs layout (iOS)...');
        const profile = await loadProfile();
        const profileExists = !!profile;
        console.log('Profile exists:', profileExists);
        setHasProfile(profileExists);

        // If no profile and not already on profile screen, redirect to profile
        if (!profileExists && segments[1] !== 'profile') {
          console.log('No profile found, redirecting to profile screen');
          router.replace('/(tabs)/profile');
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        setHasProfile(false);
        router.replace('/(tabs)/profile');
      }
    }

    checkProfile();
  }, []);

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
