
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
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  itemValue: {
    fontSize: 16,
    color: colors.textSecondary,
    marginRight: 8,
  },
  resetButton: {
    ...buttonStyles.secondary,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  resetButtonText: {
    ...buttonStyles.secondaryText,
  },
});

export default function SettingsScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [celebrationEnabled, setCelebrationEnabled] = useState(true);
  const [resetConfig, setResetConfig] = useState<ResetTimeConfig>({
    hour: 0,
    minute: 0,
    enabled: false,
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  const [showPaywall, setShowPaywall] = useState(false);

  const { isSubscribed } = useSubscription();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const savedProfile = await loadProfile();
    setProfile(savedProfile);

    const savedCelebration = await loadCelebrationEnabled();
    setCelebrationEnabled(savedCelebration);

    const savedResetConfig = await loadResetTime();
    setResetConfig(savedResetConfig);

    const date = new Date();
    date.setHours(savedResetConfig.hour, savedResetConfig.minute, 0, 0);
    setTempTime(date);
  }

  async function handleCelebrationToggle(value: boolean) {
    setCelebrationEnabled(value);
    await saveCelebrationEnabled(value);
  }

  async function handleResetToggle(value: boolean) {
    const newConfig = { ...resetConfig, enabled: value };
    setResetConfig(newConfig);
    await saveResetTime(newConfig);
  }

  function handleTimeChange(event: any, selectedDate?: Date) {
    if (selectedDate) {
      setTempTime(selectedDate);
      const newConfig = {
        ...resetConfig,
        hour: selectedDate.getHours(),
        minute: selectedDate.getMinutes(),
      };
      setResetConfig(newConfig);
      saveResetTime(newConfig);
    }
  }

  function formatTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  }

  function handleActivityLevelPress() {
    if (!profile) return;

    const options = [
      'Sedentary (little or no exercise)',
      'Lightly Active (1-3 days/week)',
      'Moderately Active (3-5 days/week)',
      'Very Active (6-7 days/week)',
      'Extra Active (2x per day)',
      'Cancel',
    ];

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 5,
      },
      (buttonIndex) => {
        if (buttonIndex < 5) {
          const levels: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'very', 'extra'];
          handleActivityLevelChange(levels[buttonIndex]);
        }
      }
    );
  }

  async function handleActivityLevelChange(newLevel: ActivityLevel) {
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
    updatedProfile.targets = newTargets;

    await saveProfile(updatedProfile);
    setProfile(updatedProfile);
  }

  function handleResetData() {
    Alert.alert(
      'Reset All Data',
      'This will delete all your data including profile, tracking history, and weight entries. This cannot be undone.',
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
  }

  function openPrivacyPolicy() {
    Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
  }

  function getSubscriptionStatusText(): string {
    return isSubscribed ? 'Active' : 'Free';
  }

  function formatActivityLevel(level: ActivityLevel): string {
    const info = ACTIVITY_LEVEL_INFO[level];
    return info ? info.label : 'Not Set';
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <TouchableOpacity style={styles.item} onPress={() => setShowPaywall(true)}>
          <Text style={styles.itemText}>Subscription Status</Text>
          <Text style={styles.itemValue}>{getSubscriptionStatusText()}</Text>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Level</Text>
        <TouchableOpacity style={styles.item} onPress={handleActivityLevelPress}>
          <Text style={styles.itemText}>Activity Level</Text>
          <Text style={styles.itemValue}>{profile ? formatActivityLevel(profile.activityLevel) : 'Loading...'}</Text>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Celebration</Text>
        <View style={styles.item}>
          <Text style={styles.itemText}>Daily Celebration</Text>
          <Switch value={celebrationEnabled} onValueChange={handleCelebrationToggle} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Reset</Text>
        <View style={styles.item}>
          <Text style={styles.itemText}>Custom Reset Time</Text>
          <Switch value={resetConfig.enabled} onValueChange={handleResetToggle} />
        </View>
        {resetConfig.enabled && (
          <TouchableOpacity style={styles.item} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.itemText}>Reset Time</Text>
            <Text style={styles.itemValue}>{formatTime(tempTime)}</Text>
            <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        {showTimePicker && (
          <DateTimePicker
            value={tempTime}
            mode="time"
            display="spinner"
            onChange={handleTimeChange}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <TouchableOpacity style={styles.item} onPress={openPrivacyPolicy}>
          <Text style={styles.itemText}>Privacy Policy</Text>
          <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={handleResetData}>
        <Text style={styles.resetButtonText}>Reset App Data</Text>
      </TouchableOpacity>

      <PaywallScreen visible={showPaywall} onDismiss={() => setShowPaywall(false)} canDismiss={true} />
    </ScrollView>
  );
}
