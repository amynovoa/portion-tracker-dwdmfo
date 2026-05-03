
import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { toggleNoonReminder, isNoonReminderEnabled, checkNotificationPermissions } from '@/utils/notificationManager';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 10,
  },
  infoBox: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 15,
    marginTop: 15,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});

export default function DailyReminderScreen() {
  const [noonReminderEnabled, setNoonReminderEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  // Load reminder status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Daily reminder screen focused - loading reminder status');
      loadReminderStatus();
    }, [])
  );

  const loadReminderStatus = async () => {
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    try {
      console.log('Loading reminder status...');
      const enabled = await isNoonReminderEnabled();
      const permission = await checkNotificationPermissions();
      console.log('Reminder enabled:', enabled, 'Permission granted:', permission);
      setNoonReminderEnabled(enabled);
      setHasPermission(permission);
    } catch (error) {
      console.error('Error loading reminder status:', error);
      setNoonReminderEnabled(false);
      setHasPermission(false);
    } finally {
      clearTimeout(safetyTimer);
      setIsLoading(false);
    }
  };

  const handleToggleNoonReminder = async (value: boolean) => {
    console.log('User toggled noon reminder to:', value);
    setIsLoading(true);

    // Safety timeout — always unblock the UI within 10 seconds
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 10000);

    try {
      await toggleNoonReminder(value);
      console.log('Noon reminder toggled successfully to:', value);
      setNoonReminderEnabled(value);
      const permission = await checkNotificationPermissions();
      setHasPermission(permission);
    } catch (error: any) {
      console.error('Error toggling noon reminder:', error);
      setNoonReminderEnabled(!value);
      if (error?.message === 'PERMISSION_DENIED' || error?.name === 'PERMISSION_DENIED') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to use daily reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      } else {
        Alert.alert(
          'Unable to Set Reminder',
          'There was a problem setting up the reminder. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      clearTimeout(safetyTimer);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Daily Reminder',
          headerBackTitle: 'Settings',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notification Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Daily Reminder</Text>
            <Switch
              value={noonReminderEnabled}
              onValueChange={handleToggleNoonReminder}
              trackColor={{ false: '#4a4a4a', true: colors.primary }}
              thumbColor="#fff"
              disabled={isLoading}
            />
          </View>

          <Text style={styles.description}>
            Get reminded at 12:00 PM (noon) each day if you haven&apos;t logged any portions yet.
          </Text>

          {!hasPermission && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Notifications are not enabled for this app. To receive reminders, please enable notifications in your device settings.
              </Text>
            </View>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 This reminder helps you stay on track with your daily portion tracking. 
              You&apos;ll only receive the notification if you haven&apos;t logged anything by noon.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About Reminders</Text>
          <Text style={styles.description}>
            - Reminders are sent at 12:00 PM daily{'\n'}
            - You must enable notifications in your device settings{'\n'}
            - Reminders only appear if you haven&apos;t tracked any portions yet{'\n'}
            - You can turn reminders on or off at any time
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
