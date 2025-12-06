
import React from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useRouter } from 'expo-router';
import AppLogo from '@/components/AppLogo';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <AppLogo size={60} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your preferences</Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[buttonStyles.outline, styles.button]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={commonStyles.buttonTextOutline}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Portion Tracker</Text>
          <Text style={styles.infoText}>
            Portion Tracker helps you maintain healthy eating habits by tracking daily portions from key food groups.
          </Text>
          <Text style={styles.infoText}>
            Your data is stored locally on your device and is never shared.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 48,
    paddingBottom: 120,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  button: {
    marginVertical: 8,
  },
  infoSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  bottomPadding: {
    height: 20,
  },
});
