
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, Switch, TouchableOpacity, Alert, Platform } from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { saveReminderEnabled, loadReminderEnabled } from '@/utils/storage';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    loadSettings();
    checkPermissions();
  }, []);

  const loadSettings = async () => {
    const enabled = await loadReminderEnabled();
    setReminderEnabled(enabled);
  };

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionGranted(status === 'granted');
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionGranted(status === 'granted');
    return status === 'granted';
  };

  const scheduleReminder = async () => {
    try {
      // Cancel all existing notifications first
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule daily reminder at 9 AM
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Portion Tracker',
          body: 'Don&apos;t forget to track your portions today!',
        },
        trigger: {
          hour: 9,
          minute: 0,
          repeats: true,
        },
      });

      console.log('Daily reminder scheduled');
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      Alert.alert('Error', 'Failed to schedule reminder');
    }
  };

  const cancelReminder = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Reminders cancelled');
    } catch (error) {
      console.error('Error cancelling reminders:', error);
    }
  };

  const handleToggleReminder = async (value: boolean) => {
    if (value) {
      // Enabling reminder
      if (!permissionGranted) {
        const granted = await requestPermissions();
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to use reminders.'
          );
          return;
        }
      }

      await scheduleReminder();
      setReminderEnabled(true);
      await saveReminderEnabled(true);
      Alert.alert('Success', 'Daily reminder enabled at 9:00 AM');
    } else {
      // Disabling reminder
      await cancelReminder();
      setReminderEnabled(false);
      await saveReminderEnabled(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your preferences</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Daily Reminder</Text>
              <Text style={styles.settingDescription}>
                Get reminded to track your portions at 9:00 AM
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    elevation: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
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
