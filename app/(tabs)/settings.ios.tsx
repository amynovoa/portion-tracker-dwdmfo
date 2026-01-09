
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
  ActionSheetIOS,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { loadProfile, clearAllData, saveResetTime, loadResetTime, saveProfile } from '@/utils/storage';
import { loadCelebrationEnabled, saveCelebrationEnabled } from '@/utils/celebrationStorage';
import { UserProfile, ActivityLevel, ACTIVITY_LEVEL_INFO } from '@/types';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import { IconSymbol } from '@/components/IconSymbol';
import PaywallScreen from '@/components/PaywallScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 34,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    fontSize: 17,
    color: colors.text,
    flex: 1,
  },
  settingValue: {
    fontSize: 17,
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
    fontSize: 17,
    fontWeight: '600',
  },
  linkButton: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  linkText: {
    fontSize: 17,
    color: colors.primary,
  },
  dangerButton: {
    ...buttonStyles.secondary,
    backgroundColor: '#ff3b30',
    marginTop: 20,
    marginBottom: 40,
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
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  subscriptionButton: {
    ...buttonStyles.primary,
    marginTop: 8,
  },
  activityButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  activityButtonText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '600',
  },
  activityDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  chevron: {
    marginLeft: 8,
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
    setShowTimePicker(Platform.OS === 'ios');
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

    // Use iOS Action Sheet for better native feel
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: 'Select Activity Level',
        message: 'Choose your typical daily activity level',
        options: [
          'Cancel',
          'Sedentary - Little to no exercise',
          'Light - Light workouts 1-3x/week',
          'Moderate - Workouts 3-5x/week',
          'Active - Hard training most days',
          'Very Active - Very high daily activity',
        ],
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        const activityLevels: ActivityLevel[] = [
          'sedentary',
          'light',
          'moderate',
          'active',
          'veryActive',
        ];
        
        if (buttonIndex > 0) {
          handleActivityLevelChange(activityLevels[buttonIndex - 1]);
        }
      }
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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.header}>Settings</Text>

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
                <Text style={styles.settingLabel}>Current Level</Text>
                <Text style={styles.settingValue}>
                  {formatActivityLevel(profile.activityLevel)}
                </Text>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="arrow-forward"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.chevron}
                />
              </TouchableOpacity>
              <Text style={styles.activityDescription}>
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
              <Text style={styles.settingLabel}>Custom Reset Time</Text>
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
                display="spinner"
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
