
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Linking, Alert, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { clearAllData, loadResetTime, saveResetTime, ResetTimeConfig } from '@/utils/storage';
import { loadCelebrationEnabled, saveCelebrationEnabled } from '@/utils/celebrationStorage';
import { useSubscription } from '@/contexts/SubscriptionContext';
import PaywallScreen from '@/components/PaywallScreen';
import AppLogo from '@/components/AppLogo';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ActivityLevel, ACTIVITY_LEVEL_INFO } from '@/types';
import { loadProfile, saveProfile } from '@/utils/storage';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  rowValue: {
    fontSize: 16,
    color: colors.textSecondary,
    marginRight: 8,
  },
  button: {
    ...buttonStyles.secondary,
    marginBottom: 12,
  },
  buttonText: {
    ...buttonStyles.secondaryText,
  },
  primaryButton: {
    ...buttonStyles.primary,
    marginBottom: 12,
  },
  primaryButtonText: {
    ...buttonStyles.primaryText,
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
  subscriptionStatus: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  activityLevelButton: {
    ...buttonStyles.secondary,
    marginBottom: 8,
  },
  activityLevelText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
});

export default function SettingsScreen() {
  const router = useRouter();
  const { subscriptionStatus, isLoading, shouldShowPaywall, refreshSubscriptionStatus } = useSubscription();
  
  const [isResetting, setIsResetting] = useState(false);
  const [celebrationEnabled, setCelebrationEnabled] = useState(true);
  const [resetTime, setResetTime] = useState<ResetTimeConfig>({ hour: 0, minute: 0, enabled: false });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('sedentary');
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Load celebration setting
    const celebration = await loadCelebrationEnabled();
    setCelebrationEnabled(celebration);

    // Load reset time
    const time = await loadResetTime();
    if (time) {
      setResetTime(time);
    } else {
      // Default to midnight
      setResetTime({ hour: 0, minute: 0, enabled: false });
    }

    // Load activity level from profile
    const profile = await loadProfile();
    if (profile) {
      setActivityLevel(profile.activityLevel || 'sedentary');
    }
  };

  const handleToggleCelebration = async (value: boolean) => {
    setCelebrationEnabled(value);
    await saveCelebrationEnabled(value);
  };

  const handleToggleResetTime = async (value: boolean) => {
    const newConfig = { ...resetTime, enabled: value };
    setResetTime(newConfig);
    await saveResetTime(newConfig);
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (selectedDate) {
      const newConfig = {
        hour: selectedDate.getHours(),
        minute: selectedDate.getMinutes(),
        enabled: resetTime.enabled,
      };
      setResetTime(newConfig);
      await saveResetTime(newConfig);
    }
  };

  const handleActivityLevelPress = () => {
    Alert.alert(
      'Activity Level',
      'Choose your activity level:',
      [
        {
          text: ACTIVITY_LEVEL_INFO.sedentary.label,
          onPress: () => updateActivityLevel('sedentary'),
        },
        {
          text: ACTIVITY_LEVEL_INFO.light.label,
          onPress: () => updateActivityLevel('light'),
        },
        {
          text: ACTIVITY_LEVEL_INFO.moderate.label,
          onPress: () => updateActivityLevel('moderate'),
        },
        {
          text: ACTIVITY_LEVEL_INFO.active.label,
          onPress: () => updateActivityLevel('active'),
        },
        {
          text: ACTIVITY_LEVEL_INFO.veryActive.label,
          onPress: () => updateActivityLevel('veryActive'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const updateActivityLevel = async (level: ActivityLevel) => {
    setActivityLevel(level);
    const profile = await loadProfile();
    if (profile) {
      profile.activityLevel = level;
      await saveProfile(profile);
    }
  };

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

  const handleManageSubscription = () => {
    setShowPaywall(true);
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const getSubscriptionStatusText = () => {
    if (isLoading) return 'Loading...';
    if (!subscriptionStatus) return 'No subscription';
    
    if (subscriptionStatus.isActive) {
      if (subscriptionStatus.isTrial) {
        return `Free Trial (${subscriptionStatus.trialDaysRemaining} days left)`;
      }
      return 'Active Subscription';
    }
    
    return 'No active subscription';
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <AppLogo />

          {/* Subscription Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleManageSubscription}>
              <Text style={styles.primaryButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
            <Text style={styles.subscriptionStatus}>{getSubscriptionStatusText()}</Text>
          </View>

          {/* Activity Level Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Level</Text>
            <TouchableOpacity style={styles.activityLevelButton} onPress={handleActivityLevelPress}>
              <Text style={styles.buttonText}>{ACTIVITY_LEVEL_INFO[activityLevel].label}</Text>
            </TouchableOpacity>
            <Text style={styles.activityLevelText}>
              {ACTIVITY_LEVEL_INFO[activityLevel].description}
            </Text>
          </View>

          {/* Celebration Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Celebration</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Show daily completion celebration</Text>
              <Switch
                value={celebrationEnabled}
                onValueChange={handleToggleCelebration}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
              />
            </View>
          </View>

          {/* Daily Reset Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Reset</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Custom reset time</Text>
              <Switch
                value={resetTime.enabled}
                onValueChange={handleToggleResetTime}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
              />
            </View>
            {resetTime.enabled && (
              <TouchableOpacity
                style={styles.row}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.rowLabel}>Reset time</Text>
                <Text style={styles.rowValue}>
                  {formatTime(resetTime.hour, resetTime.minute)}
                </Text>
              </TouchableOpacity>
            )}
            {showTimePicker && (
              <DateTimePicker
                value={new Date(0, 0, 0, resetTime.hour, resetTime.minute)}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </View>

          {/* Legal Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal</Text>
            <TouchableOpacity style={styles.linkButton} onPress={handlePrivacyPolicy}>
              <Text style={styles.linkText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>

          {/* Data Section */}
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

      {/* Paywall Modal */}
      <PaywallScreen
        visible={showPaywall}
        onDismiss={() => {
          setShowPaywall(false);
          refreshSubscriptionStatus();
        }}
        isTrialAvailable={subscriptionStatus?.isTrialAvailable || false}
        trialDaysRemaining={subscriptionStatus?.trialDaysRemaining}
        canDismiss={true}
      />
    </>
  );
}
