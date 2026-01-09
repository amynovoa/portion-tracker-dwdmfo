
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { clearAllData } from '@/utils/storage';
import AppLogo from '@/components/AppLogo';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  button: {
    ...buttonStyles.secondary,
    marginBottom: 12,
  },
  buttonText: {
    ...buttonStyles.secondaryText,
  },
  dangerButton: {
    ...buttonStyles.secondary,
    borderColor: colors.error,
  },
  dangerButtonText: {
    ...buttonStyles.secondaryText,
    color: colors.error,
  },
  linkButton: {
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 16,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});

export default function SettingsScreen() {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetApp = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your data including profile, daily portions, and weight entries. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            await clearAllData();
            setIsResetting(false);
            router.replace('/(tabs)/profile');
          },
        },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://www.portiontracker.app/privacy');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <AppLogo />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity style={styles.linkButton} onPress={handlePrivacyPolicy}>
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleResetApp}
            disabled={isResetting}
          >
            <Text style={[styles.buttonText, styles.dangerButtonText]}>
              {isResetting ? 'Resetting...' : 'Reset All Data'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
