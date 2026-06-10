
import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { toggleNoonReminder, isNoonReminderEnabled, checkNotificationPermissions } from '@/utils/notificationManager';
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
});

export default function DailyReminderScreen() {
  const { t } = useTranslation();
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
      setIsLoading(false);
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
            {t('dailyReminder.description')}
          </Text>

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
