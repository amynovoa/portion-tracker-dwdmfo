
import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, buttonStyles } from '@/styles/commonStyles';
import { toggleNoonReminder, isNoonReminderEnabled, checkNotificationPermissions, updateReminderTime } from '@/utils/notificationManager';
import { loadReminderTime } from '@/utils/storage';
import { useTranslation } from 'react-i18next';

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
  timeButton: {
    ...buttonStyles.secondary,
    paddingVertical: 16,
    marginTop: 8,
    backgroundColor: colors.primary,
  },
  timeButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  timeButtonSubtext: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default function DailyReminderScreen() {
  const { t, i18n } = useTranslation();
  const [noonReminderEnabled, setNoonReminderEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [reminderTime, setReminderTime] = useState(() => {
    const defaultTime = new Date();
    defaultTime.setHours(12, 0, 0, 0);
    return defaultTime;
  });
  const [showPicker, setShowPicker] = useState(false);

  // Load reminder status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Daily reminder screen focused - loading reminder status');
      loadReminderStatus();
    }, [])
  );

  const loadReminderStatus = async () => {
    try {
      console.log('Loading reminder status...');
      const enabled = await isNoonReminderEnabled();
      const permission = await checkNotificationPermissions();
      const timeConfig = await loadReminderTime();
      console.log('Reminder enabled:', enabled, 'Permission granted:', permission, 'Time:', timeConfig);
      setNoonReminderEnabled(enabled);
      setHasPermission(permission);
      const time = new Date();
      time.setHours(timeConfig.hour, timeConfig.minute, 0, 0);
      setReminderTime(time);
    } catch (error) {
      console.error('Error loading reminder status:', error);
      setNoonReminderEnabled(false);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';
    return date.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleTimeButtonPress = () => {
    console.log('Reminder time button pressed, showing time picker');
    setShowPicker(true);
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    // On Android, the picker is a modal dialog, so we always hide it after interaction
    setShowPicker(false);

    if (selectedDate) {
      console.log('New reminder time selected:', selectedDate.toLocaleTimeString());
      setReminderTime(selectedDate);
      await updateReminderTime({
        hour: selectedDate.getHours(),
        minute: selectedDate.getMinutes(),
      });
      console.log('Reminder time saved and rescheduled if enabled');
    }
  };

  const handleToggleNoonReminder = async (value: boolean) => {
    console.log('User toggled noon reminder to:', value);
    
    // Disable the switch while processing
    setIsLoading(true);
    
    try {
      // Attempt to toggle the reminder
      await toggleNoonReminder(value);
      console.log('Noon reminder toggled successfully to:', value);
      
      // Update UI on success
      setNoonReminderEnabled(value);
      
      // Reload permission status
      const permission = await checkNotificationPermissions();
      setHasPermission(permission);
    } catch (error: any) {
      console.error('Error toggling noon reminder:', error);
      
      // Revert switch to previous state
      setNoonReminderEnabled(!value);
      
      // Handle specific error types
      if (error?.message === 'PERMISSION_DENIED' || error?.name === 'PERMISSION_DENIED') {
        console.log('Permission denied - showing settings alert');
        Alert.alert(
          t('dailyReminder.permissionRequiredTitle'),
          t('dailyReminder.permissionRequiredMessage'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { 
              text: t('dailyReminder.openSettings'), 
              onPress: () => {
                console.log('Opening device settings...');
                Linking.openSettings();
              }
            }
          ]
        );
      } else {
        // Generic error - something went wrong with scheduling
        console.log('Showing generic error alert');
        Alert.alert(
          t('dailyReminder.unableToSetTitle'),
          t('dailyReminder.unableToSetMessage'),
          [{ text: t('common.ok') }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('dailyReminder.title'),
          headerBackTitle: t('settings.title'),
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dailyReminder.notificationSettings')}</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('dailyReminder.enableLabel')}</Text>
            <Switch
              value={noonReminderEnabled}
              onValueChange={handleToggleNoonReminder}
              trackColor={{ false: '#4a4a4a', true: colors.primary }}
              thumbColor="#fff"
              disabled={isLoading}
            />
          </View>

          <Text style={styles.description}>
            {t('dailyReminder.description', { time: formatTime(reminderTime) })}
          </Text>

          {noonReminderEnabled && (
            <>
              <Text style={styles.settingLabel}>{t('dailyReminder.reminderTime')}</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={handleTimeButtonPress}
              >
                <Text style={styles.timeButtonText}>{formatTime(reminderTime)}</Text>
                <Text style={styles.timeButtonSubtext}>{t('dailyReminder.tapToChange')}</Text>
              </TouchableOpacity>
            </>
          )}

          {showPicker && (
            <DateTimePicker
              value={reminderTime}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}

          {!hasPermission && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                {t('dailyReminder.warningText')}
              </Text>
            </View>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {t('dailyReminder.infoText')}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dailyReminder.aboutTitle')}</Text>
          <Text style={styles.description}>
            {t('dailyReminder.aboutText')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
