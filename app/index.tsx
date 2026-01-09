
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { loadProfile } from '@/utils/storage';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/styles/commonStyles';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    async function checkProfile() {
      try {
        console.log('Index: Checking for profile...');
        const profile = await loadProfile();
        
        if (profile && profile.portionTargets) {
          console.log('Index: Profile found, navigating to tabs');
          router.replace('/(tabs)/(home)');
        } else {
          console.log('Index: No profile found, navigating to welcome');
          router.replace('/welcome');
        }
      } catch (error) {
        console.error('Index: Error checking profile:', error);
        router.replace('/welcome');
      }
    }

    checkProfile();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
