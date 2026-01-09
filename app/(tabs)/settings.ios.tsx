
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveResetTime, loadResetTime, ResetTimeConfig } from '@/utils/storage';
import { saveCelebrationEnabled, loadCelebrationEnabled } from '@/utils/celebrationStorage';
import React, { useState, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  ActionSheetIOS,
} from 'react-native';
import { colors, commonStyles } from '@/styles/commonStyles';
import { ActivityLevel, ACTIVITY_LEVELS } from '@/types';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: colors.background,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    marginLeft: 8,
  },
  timePickerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});

export default function SettingsScreen() {
  const router = useRouter();
  const [celebrationEnabled, setCelebrationEnabled] = useState(true);
  const [resetEnabled, setResetEnabled] = useState(false);
  const [resetTime, setResetTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const celebration = await loadCelebrationEnabled();
      setCelebrationEnabled(celebration);

      const resetConfig = await loadResetTime();
      setResetEnabled(resetConfig.enabled);
      if (resetConfig.time) {
        const [hours, minutes] = resetConfig.time.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        setResetTime(date);
      }

      const storedActivityLevel = await AsyncStorage.getItem('activityLevel');
      if (storedActivityLevel) {
        setActivityLevel(storedActivityLevel as ActivityLevel);
      }
    } catch (error) {
      console.error('Error loading settings data:', error);
    }
  }

  async function handleCelebrationToggle(value: boolean) {
    setCelebrationEnabled(value);
    await saveCelebrationEnabled(value);
  }

  async function handleResetToggle(value: boolean) {
    setResetEnabled(value);
    const hours = resetTime.getHours().toString().padStart(2, '0');
    const minutes = resetTime.getMinutes().toString().padStart(2, '0');
    await saveResetTime({
      enabled: value,
      time: `${hours}:${minutes}`,
    });
  }

  async function handleTimeChange(event: any, selectedDate?: Date) {
    if (selectedDate) {
      setResetTime(selectedDate);
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      await saveResetTime({
        enabled: resetEnabled,
        time: `${hours}:${minutes}`,
      });
    }
  }

  function handleActivityLevel() {
    const options = [
      'Sedentary (little or no exercise)',
      'Lightly Active (1-3 days/week)',
      'Moderately Active (3-5 days/week)',
      'Very Active (6-7 days/week)',
      'Extremely Active (athlete)',
      'Cancel',
    ];

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 5,
      },
      async (buttonIndex) => {
        if (buttonIndex < 5) {
          const levels: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'very', 'extreme'];
          const selected = levels[buttonIndex];
          setActivityLevel(selected);
          await AsyncStorage.setItem('activityLevel', selected);
          
          // Reload profile to recalculate targets
          Alert.alert(
            'Activity Level Updated',
            'Your portion targets have been recalculated. Please review them in your Profile.',
            [{ text: 'OK' }]
          );
        }
      }
    );
  }

  function handlePrivacyPolicy() {
    Linking.openURL('https://portiontrack.com/privacy-policy');
  }

  async function handleResetAppData() {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your data including profile, tracking history, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/');
          },
        },
      ]
    );
  }

  function formatTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  }

  function formatActivityLevel(level: ActivityLevel): string {
    const labels = {
      sedentary: 'Sedentary',
      light: 'Lightly Active',
      moderate: 'Moderately Active',
      very: 'Very Active',
      extreme: 'Extremely Active',
    };
    return labels[level];
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconSymbol 
          ios_icon_name="apple.fill" 
          android_material_icon_name="settings" 
          size={32} 
          color={colors.primary} 
          style={styles.headerIcon} 
        />
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.settingItem} onPress={() => {}}>
          <IconSymbol 
            ios_icon_name="creditcard.fill" 
            android_material_icon_name="credit-card" 
            size={24} 
            color={colors.primary} 
            style={styles.settingIcon} 
          />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Subscription</Text>
          </View>
          <IconSymbol 
            ios_icon_name="chevron.right" 
            android_material_icon_name="chevron-right" 
            size={20} 
            color={colors.textSecondary} 
            style={styles.chevron} 
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleActivityLevel}>
          <IconSymbol 
            ios_icon_name="figure.run" 
            android_material_icon_name="directions-run" 
            size={24} 
            color={colors.primary} 
            style={styles.settingIcon} 
          />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Activity Level</Text>
            <Text style={styles.settingSubtitle}>{formatActivityLevel(activityLevel)}</Text>
          </View>
          <IconSymbol 
            ios_icon_name="chevron.right" 
            android_material_icon_name="chevron-right" 
            size={20} 
            color={colors.textSecondary} 
            style={styles.chevron} 
          />
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <IconSymbol 
            ios_icon_name="party.popper.fill" 
            android_material_icon_name="celebration" 
            size={24} 
            color={colors.primary} 
            style={styles.settingIcon} 
          />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Celebration</Text>
            <Text style={styles.settingSubtitle}>Show celebration when daily goals are met</Text>
          </View>
          <Switch
            value={celebrationEnabled}
            onValueChange={handleCelebrationToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <TouchableOpacity 
          style={styles.settingItem} 
          onPress={() => setShowTimePicker(!showTimePicker)}
        >
          <IconSymbol 
            ios_icon_name="clock.fill" 
            android_material_icon_name="schedule" 
            size={24} 
            color={colors.primary} 
            style={styles.settingIcon} 
          />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Daily Reset</Text>
            <Text style={styles.settingSubtitle}>
              {resetEnabled ? `Resets at ${formatTime(resetTime)}` : 'Resets at midnight'}
            </Text>
          </View>
          <IconSymbol 
            ios_icon_name="chevron.right" 
            android_material_icon_name="chevron-right" 
            size={20} 
            color={colors.textSecondary} 
            style={styles.chevron} 
          />
        </TouchableOpacity>

        {showTimePicker && (
          <View style={styles.timePickerContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ flex: 1, fontSize: 16, color: colors.text }}>Enable Custom Reset Time</Text>
              <Switch
                value={resetEnabled}
                onValueChange={handleResetToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
            {resetEnabled && (
              <DateTimePicker
                value={resetTime}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                style={{ height: 120 }}
              />
            )}
          </View>
        )}

        <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
          <IconSymbol 
            ios_icon_name="lock.shield.fill" 
            android_material_icon_name="privacy-tip" 
            size={24} 
            color={colors.primary} 
            style={styles.settingIcon} 
          />
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Privacy Policy</Text>
          </View>
          <IconSymbol 
            ios_icon_name="chevron.right" 
            android_material_icon_name="chevron-right" 
            size={20} 
            color={colors.textSecondary} 
            style={styles.chevron} 
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleResetAppData}>
          <IconSymbol 
            ios_icon_name="exclamationmark.triangle.fill" 
            android_material_icon_name="warning" 
            size={24} 
            color="#FF3B30" 
            style={styles.settingIcon} 
          />
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: '#FF3B30' }]}>Reset App Data</Text>
          </View>
          <IconSymbol 
            ios_icon_name="chevron.right" 
            android_material_icon_name="chevron-right" 
            size={20} 
            color={colors.textSecondary} 
            style={styles.chevron} 
          />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
