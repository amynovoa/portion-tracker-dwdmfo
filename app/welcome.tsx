
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, buttonStyles } from '@/styles/commonStyles';
import { useRouter } from 'expo-router';
import AppLogo from '@/components/AppLogo';
import { loadProfile } from '@/utils/storage';

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    // Check if user already has a profile
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    try {
      const profile = await loadProfile();
      if (profile && profile.portionTargets) {
        console.log('Profile found on welcome screen, redirecting to home');
        router.replace('/(tabs)/(home)');
      }
    } catch (error) {
      console.error('Error checking profile on welcome screen:', error);
    }
  };

  const handleGetStarted = () => {
    console.log('User clicked Set Up My Profile');
    router.push('/setup-profile');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <AppLogo size={120} />
          <Text style={styles.title}>Welcome to Portion Tracker</Text>
          <Text style={styles.subtitle}>
            Track your daily portions and build healthy habits
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={buttonStyles.primaryButton}
            onPress={handleGetStarted}
          >
            <Text style={buttonStyles.primaryButtonText}>Set Up My Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  buttonContainer: {
    paddingBottom: 20,
  },
});
