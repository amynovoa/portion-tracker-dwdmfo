
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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { loadProfile, clearAllData, saveResetTime, loadResetTime } from '@/utils/storage';
import { loadCelebrationEnabled, saveCelebrationEnabled } from '@/utils/celebrationStorage';
import { UserProfile, ActivityLevel, ACTIVITY_LEVELS } from '@/types';
import AppLogo from '@/components/AppLogo';

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
});

export default function SettingsScreen() {
  const router = useRouter();
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
    // Open privacy policy URL
    Alert.alert('Privacy Policy', 'Opening privacy policy...');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <AppLogo />
        <Text style={commonStyles.title}>Settings</Text>

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
  );
}
