
import React, { useEffect, useState } from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { colors } from '@/styles/commonStyles';
import { loadProfile } from '@/utils/storage';
import { useRouter, useSegments } from 'expo-router';

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  useEffect(() => {
    async function checkProfile() {
      try {
        console.log('Tabs layout (iOS): Checking for profile...');
        const profile = await loadProfile();
        const profileExists = !!profile;
        console.log('Tabs layout (iOS): Profile exists:', profileExists);

        // Only redirect to profile if no profile exists AND we're on the home screen
        if (!profileExists && segments[1] === '(home)') {
          console.log('Tabs layout (iOS): No profile found, redirecting to profile screen');
          router.replace('/(tabs)/profile');
        }
        
        setIsCheckingProfile(false);
      } catch (error) {
        console.error('Tabs layout (iOS): Error checking profile:', error);
        setIsCheckingProfile(false);
      }
    }

    checkProfile();
  }, [segments]);

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
