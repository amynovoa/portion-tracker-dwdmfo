
import { useSubscription } from '@/contexts/SubscriptionContext';
import React, { useState, useEffect } from 'react';
import { loadCelebrationEnabled, saveCelebrationEnabled } from '@/utils/celebrationStorage';
import PaywallScreen from '@/components/PaywallScreen';
import { UserProfile, ActivityLevel, ACTIVITY_LEVEL_INFO } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { loadProfile, clearAllData, saveResetTime, loadResetTime, saveProfile } from '@/utils/storage';
import { useRouter } from 'expo-router';
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import { IconSymbol } from '@/components/IconSymbol';
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
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';

interface ResetTimeConfig {
  hour: number;
  minute: number;
  enabled: boolean;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 12,
  },
  headerIcon: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.text,
  },
  settingsList: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingIcon: {
    width: 32,
    marginRight: 16,
    fontSize: 24,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  chevron: {
    fontSize: 24,
    color: colors.textSecondary,
  },
});

export default function SettingsScreen() {
  const [celebrationEnabled, setCelebrationEnabled] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [resetTime, setResetTime] = useState<Date>(new Date());
  const [resetEnabled, setResetEnabled] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const { isSubscribed } = useSubscription();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const savedProfile = await loadProfile();
    setProfile(savedProfile);

    const savedCelebration = await loadCelebrationEnabled();
    setCelebrationEnabled(savedCelebration);

    const savedResetTime = await loadResetTime();
    if (savedResetTime) {
      const date = new Date();
      date.setHours(savedResetTime.hour, savedResetTime.minute, 0, 0);
      setResetTime(date);
      setResetEnabled(savedResetTime.enabled);
    }
  };

  const handleCelebrationToggle = async (value: boolean) => {
    setCelebrationEnabled(value);
    await saveCelebrationEnabled(value);
  };

  const handleResetToggle = async (value: boolean) => {
    setResetEnabled(value);
    const config: ResetTimeConfig = {
      hour: resetTime.getHours(),
      minute: resetTime.getMinutes(),
      enabled: value,
    };
    await saveResetTime(config);
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setResetTime(selectedDate);
      const config: ResetTimeConfig = {
        hour: selectedDate.getHours(),
        minute: selectedDate.getMinutes(),
        enabled: resetEnabled,
      };
      await saveResetTime(config);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleActivityLevelPress = () => {
    if (!profile) return;

    const options = [
      'Sedentary (little or no exercise)',
      'Lightly Active (1-3 days/week)',
      'Moderately Active (3-5 days/week)',
      'Very Active (6-7 days/week)',
      'Extremely Active (physical job or 2x/day training)',
      'Cancel',
    ];

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 5,
      },
      (buttonIndex) => {
        if (buttonIndex < 5) {
          const levels: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'very', 'extreme'];
          handleActivityLevelChange(levels[buttonIndex]);
        }
      }
    );
  };

  const handleActivityLevelChange = async (newLevel: ActivityLevel) => {
    if (!profile) return;

    const updatedProfile = { ...profile, activityLevel: newLevel };
    const newTargets = calculateRecommendedTargets(
      profile.sex,
      profile.currentWeight,
      profile.goal,
      profile.includeAlcohol,
      profile.alcoholServings,
      newLevel
    );
    updatedProfile.portionTargets = newTargets;

    await saveProfile(updatedProfile);
    setProfile(updatedProfile);

    Alert.alert(
      'Activity Level Updated',
      'Your portion targets have been recalculated based on your new activity level.'
    );
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your data including profile, tracking history, and weight entries. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Success', 'All data has been reset.');
            router.replace('/(tabs)/(home)');
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
  };

  const getSubscriptionStatusText = (): string => {
    return isSubscribed ? 'Active' : 'Free';
  };

  const formatActivityLevel = (level: ActivityLevel): string => {
    const info = ACTIVITY_LEVEL_INFO[level];
    return info ? info.label : 'Not Set';
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🍎</Text>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <View style={styles.settingsList}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setPaywallVisible(true)}
          >
            <Text style={styles.settingIcon}>💳</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Subscription</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={24} 
              color={colors.textSecondary} 
              style={styles.chevron} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleActivityLevelPress}
          >
            <Text style={styles.settingIcon}>🏃</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Activity Level</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={24} 
              color={colors.textSecondary} 
              style={styles.chevron} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/celebration-settings')}
          >
            <Text style={styles.settingIcon}>🎉</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Celebration</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={24} 
              color={colors.textSecondary} 
              style={styles.chevron} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/daily-reset')}
          >
            <Text style={styles.settingIcon}>🕐</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Daily Reset</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={24} 
              color={colors.textSecondary} 
              style={styles.chevron} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={openPrivacyPolicy}
          >
            <Text style={styles.settingIcon}>🛡️</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={24} 
              color={colors.textSecondary} 
              style={styles.chevron} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleResetData}
          >
            <Text style={styles.settingIcon}>⚠️</Text>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Reset App Data</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={24} 
              color={colors.textSecondary} 
              style={styles.chevron} 
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <PaywallScreen
        visible={paywallVisible}
        onDismiss={() => setPaywallVisible(false)}
        canDismiss={true}
      />
    </View>
  );
}
