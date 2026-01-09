
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Switch,
  Platform,
  Linking,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { loadProfile, clearAllData, saveResetTime, loadResetTime, saveProfile } from '@/utils/storage';
import { loadCelebrationEnabled, saveCelebrationEnabled } from '@/utils/celebrationStorage';
import { UserProfile, ActivityLevel, ACTIVITY_LEVEL_INFO } from '@/types';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import AppLogo from '@/components/AppLogo';
import PaywallScreen from '@/components/PaywallScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  settingValue: {
    fontSize: 16,
    color: colors.textSecondary,
    marginRight: 8,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  timeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  linkButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  linkText: {
    fontSize: 16,
    color: colors.primary,
  },
  dangerButton: {
    ...buttonStyles.secondary,
    backgroundColor: '#ff3b30',
    marginTop: 20,
  },
  dangerButtonText: {
    ...buttonStyles.secondaryText,
    color: '#fff',
  },
  subscriptionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  subscriptionStatus: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  subscriptionButton: {
    ...buttonStyles.primary,
    marginTop: 8,
  },
  activityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default function SettingsScreen() {
  const router = useRouter();
  const { isSubscribed, subscriptionStatus, showPaywall, paywallVisible, hidePaywall } = useSubscription();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [celebrationEnabled, setCelebrationEnabled] = useState(true);
  const [resetTime, setResetTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [resetEnabled, setResetEnabled] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const loadedProfile = await loadProfile();
    setProfile(loadedProfile);

    const celebration = await loadCelebrationEnabled();
    setCelebrationEnabled(celebration);

    const savedResetTime = await loadResetTime();
    if (savedResetTime) {
      const time = new Date();
      time.setHours(savedResetTime.hour, savedResetTime.minute, 0, 0);
      setResetTime(time);
      setResetEnabled(savedResetTime.enabled);
    }
  };

  const handleCelebrationToggle = async (value: boolean) => {
    setCelebrationEnabled(value);
    await saveCelebrationEnabled(value);
  };

  const handleResetToggle = async (value: boolean) => {
    setResetEnabled(value);
    await saveResetTime({
      hour: resetTime.getHours(),
      minute: resetTime.getMinutes(),
      enabled: value,
    });
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setResetTime(selectedDate);
      await saveResetTime({
        hour: selectedDate.getHours(),
        minute: selectedDate.getMinutes(),
        enabled: resetEnabled,
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleActivityLevelPress = () => {
    if (!profile) {
      Alert.alert('Error', 'Please set up your profile first.');
      return;
    }

    // Show activity level picker
    Alert.alert(
      'Select Activity Level',
      'Choose your typical daily activity level',
      [
        {
          text: 'Sedentary',
          onPress: () => handleActivityLevelChange('sedentary'),
        },
        {
          text: 'Light',
          onPress: () => handleActivityLevelChange('light'),
        },
        {
          text: 'Moderate',
          onPress: () => handleActivityLevelChange('moderate'),
        },
        {
          text: 'Active',
          onPress: () => handleActivityLevelChange('active'),
        },
        {
          text: 'Very Active',
          onPress: () => handleActivityLevelChange('veryActive'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleActivityLevelChange = async (newLevel: ActivityLevel) => {
    if (!profile) return;

    // Recalculate portion targets with new activity level
    const newTargets = calculateRecommendedTargets(
      profile.sex,
      profile.currentWeight,
      profile.goal,
      profile.includeAlcohol,
      profile.alcoholServings,
      newLevel
    );

    // Update profile with new activity level and targets
    const updatedProfile: UserProfile = {
      ...profile,
      activityLevel: newLevel,
      targets: newTargets,
    };

    await saveProfile(updatedProfile);
    setProfile(updatedProfile);

    Alert.alert(
      'Activity Level Updated',
      `Your daily portion targets have been recalculated for ${ACTIVITY_LEVEL_INFO[newLevel].label} activity level.`,
      [
        {
          text: 'View Profile',
          onPress: () => router.push('/(tabs)/profile'),
        },
        {
          text: 'OK',
        },
      ]
    );
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your data including profile, daily portions, and history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Success', 'All data has been reset.');
            router.replace('/(tabs)/profile');
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://portiontrack.com/privacy-policy');
  };

  const getSubscriptionStatusText = () => {
    if (subscriptionStatus === 'ACTIVE') {
      return 'Active Subscription';
    } else if (subscriptionStatus === 'INACTIVE') {
      return 'No Active Subscription';
    }
    return 'Checking subscription...';
  };

  const formatActivityLevel = (level: ActivityLevel) => {
    return ACTIVITY_LEVEL_INFO[level].label;
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <AppLogo />
          <Text style={commonStyles.title}>Settings</Text>

          {/* Subscription Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <View style={styles.subscriptionCard}>
              <Text style={styles.subscriptionStatus}>
                {getSubscriptionStatusText()}
              </Text>
              {!isSubscribed && (
                <TouchableOpacity
                  style={styles.subscriptionButton}
                  onPress={showPaywall}
                >
                  <Text style={buttonStyles.primaryText}>Subscribe Now</Text>
                </TouchableOpacity>
              )}
              {isSubscribed && (
                <Text style={styles.settingLabel}>
                  Thank you for your support!
                </Text>
              )}
            </View>
          </View>

          {/* Activity Level Section */}
          {profile && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activity Level</Text>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={handleActivityLevelPress}
              >
                <Text style={styles.settingLabel}>Current Activity Level</Text>
                <Text style={styles.settingValue}>
                  {formatActivityLevel(profile.activityLevel)}
                </Text>
                <TouchableOpacity
                  style={styles.activityButton}
                  onPress={handleActivityLevelPress}
                >
                  <Text style={styles.activityButtonText}>Change</Text>
                </TouchableOpacity>
              </TouchableOpacity>
              <Text style={[styles.settingLabel, { fontSize: 14, color: colors.textSecondary, marginTop: 8 }]}>
                {ACTIVITY_LEVEL_INFO[profile.activityLevel].description}
              </Text>
            </View>
          )}

          {/* Celebration Toggle */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Daily Celebration</Text>
              <Switch
                value={celebrationEnabled}
                onValueChange={handleCelebrationToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>

          {/* Daily Reset Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Reset</Text>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Enable Custom Reset Time</Text>
              <Switch
                value={resetEnabled}
                onValueChange={handleResetToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
            {resetEnabled && (
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Reset Time</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.timeButtonText}>{formatTime(resetTime)}</Text>
                </TouchableOpacity>
              </View>
            )}
            {showTimePicker && (
              <DateTimePicker
                value={resetTime}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </View>

          {/* Links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal</Text>
            <TouchableOpacity style={styles.linkButton} onPress={openPrivacyPolicy}>
              <Text style={styles.linkText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>

          {/* Reset Data */}
          <TouchableOpacity style={styles.dangerButton} onPress={handleResetData}>
            <Text style={styles.dangerButtonText}>Reset All Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Paywall Modal */}
      <PaywallScreen
        visible={paywallVisible}
        onDismiss={hidePaywall}
        canDismiss={true}
      />
    </>
  );
}
