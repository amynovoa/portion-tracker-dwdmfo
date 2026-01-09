
import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { loadProfile } from '@/utils/storage';

export default function HomeLayout() {
  const router = useRouter();

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    const profile = await loadProfile();
    if (!profile) {
      router.replace('/welcome');
    }
  };

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
