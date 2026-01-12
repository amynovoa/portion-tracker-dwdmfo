
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { loadCelebrationEnabled, saveCelebrationEnabled } from '@/utils/celebrationStorage';
import { colors } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  headerDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  settingCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
});

export default function CelebrationSettingsScreen() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const celebrationEnabled = await loadCelebrationEnabled();
    setEnabled(celebrationEnabled);
  };

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    await saveCelebrationEnabled(value);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Celebration',
          headerBackTitle: 'Settings',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }}
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🎉 Celebration</Text>
          <Text style={styles.headerDescription}>
            Get a fun celebration animation when you complete all your daily portion targets. Turn this on or off based on your preference.
          </Text>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Celebrations</Text>
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.textSecondary, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <Text style={styles.settingDescription}>
            {enabled 
              ? 'You will see a celebration when you complete all your portion targets for the day.'
              : 'Celebrations are turned off. You will not see any animations when completing your targets.'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
