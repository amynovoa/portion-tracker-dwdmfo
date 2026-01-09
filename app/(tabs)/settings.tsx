
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Linking, Alert, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { loadProfile, saveProfile, clearAllData, loadResetTime, saveResetTime, ResetTimeConfig } from '@/utils/storage';
import { loadCelebrationEnabled, saveCelebrationEnabled } from '@/utils/celebrationStorage';
import { ActivityLevel, ACTIVITY_LEVELS, ACTIVITY_LEVEL_INFO } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chevron: {
    marginLeft: 8,
  },
  activityLevelList: {
    marginTop: 8,
  },
  activityLevelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  activityLevelSelected: {
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  activityLevelText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  activityLevelDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timePickerContainer: {
    marginTop: 8,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  resetButton: {
    ...buttonStyles.secondary,
    marginTop: 8,
  },
  resetButtonText: {
    ...buttonStyles.secondaryText,
    color: colors.error,
  },
});

export default function SettingsScreen() {
  const router = useRouter();
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [showActivityLevels, setShowActivityLevels] = useState(false);
  const [celebrationEnabled, setCelebrationEnabled] = useState(true);
  const [customResetEnabled, setCustomResetEnabled] = useState(false);
  const [resetTime, setResetTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const profile = await loadProfile();
    if (profile) {
      setActivityLevel(profile.activityLevel || 'moderate');
    }

    const celebrationSetting = await loadCelebrationEnabled();
    setCelebrationEnabled(celebrationSetting);

    const resetConfig = await loadResetTime();
    if (resetConfig) {
      setCustomResetEnabled(resetConfig.enabled);
      const time = new Date();
      time.setHours(resetConfig.hour, resetConfig.minute);
      setResetTime(time);
    }
  };

  const updateActivityLevel = async (level: ActivityLevel) => {
    const profile = await loadProfile();
    if (profile) {
      profile.activityLevel = level;
      await saveProfile(profile);
      setActivityLevel(level);
      setShowActivityLevels(false);
    }
  };

  const handleToggleCelebration = async (value: boolean) => {
    await saveCelebrationEnabled(value);
    setCelebrationEnabled(value);
  };

  const handleToggleResetTime = async (value: boolean) => {
    setCustomResetEnabled(value);
    await saveResetTime({
      enabled: value,
      hour: resetTime.getHours(),
      minute: resetTime.getMinutes(),
    });
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedDate) {
      setResetTime(selectedDate);
      await saveResetTime({
        enabled: customResetEnabled,
        hour: selectedDate.getHours(),
        minute: selectedDate.getMinutes(),
      });
    }
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://www.portiontrack.com/privacy-policy');
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset App Data',
      'This will delete all your data including profile, portions, and weight entries. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Success', 'App data has been reset');
            router.replace('/(tabs)/profile');
          },
        },
      ]
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.iconContainer}>
              <IconSymbol 
                ios_icon_name="star.fill" 
                android_material_icon_name="star" 
                size={18} 
                color={colors.primary} 
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Manage Subscription</Text>
              <Text style={styles.settingValue}>View plans & billing</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={20} 
              color={colors.textSecondary} 
              style={styles.chevron} 
            />
          </TouchableOpacity>
        </View>

        {/* Activity Level Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Level</Text>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowActivityLevels(!showActivityLevels)}
          >
            <View style={styles.iconContainer}>
              <IconSymbol 
                ios_icon_name="figure.walk" 
                android_material_icon_name="directions-walk" 
                size={18} 
                color={colors.primary} 
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Activity Level</Text>
              <Text style={styles.settingValue}>{ACTIVITY_LEVEL_INFO[activityLevel].label}</Text>
            </View>
            <IconSymbol 
              ios_icon_name={showActivityLevels ? "chevron.up" : "chevron.down"} 
              android_material_icon_name={showActivityLevels ? "expand-less" : "expand-more"} 
              size={20} 
              color={colors.textSecondary} 
              style={styles.chevron} 
            />
          </TouchableOpacity>
          
          {showActivityLevels && (
            <View style={styles.activityLevelList}>
              {ACTIVITY_LEVELS.map((level, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.activityLevelOption,
                    activityLevel === level && styles.activityLevelSelected,
                  ]}
                  onPress={() => updateActivityLevel(level)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activityLevelText}>
                      {ACTIVITY_LEVEL_INFO[level].label}
                    </Text>
                    <Text style={styles.activityLevelDescription}>
                      {ACTIVITY_LEVEL_INFO[level].description}
                    </Text>
                  </View>
                  {activityLevel === level && (
                    <IconSymbol 
                      ios_icon_name="checkmark.circle.fill" 
                      android_material_icon_name="check-circle" 
                      size={24} 
                      color={colors.primary} 
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Celebration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingItem}>
            <View style={styles.iconContainer}>
              <IconSymbol 
                ios_icon_name="party.popper.fill" 
                android_material_icon_name="celebration" 
                size={18} 
                color={colors.primary} 
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Celebration</Text>
              <Text style={styles.settingValue}>Show daily completion celebration</Text>
            </View>
            <Switch
              value={celebrationEnabled}
              onValueChange={handleToggleCelebration}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>

        {/* Daily Reset Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Reset</Text>
          <View style={styles.settingItem}>
            <View style={styles.iconContainer}>
              <IconSymbol 
                ios_icon_name="clock.fill" 
                android_material_icon_name="schedule" 
                size={18} 
                color={colors.primary} 
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Custom Reset Time</Text>
              <Text style={styles.settingValue}>
                {customResetEnabled ? formatTime(resetTime) : 'Midnight (default)'}
              </Text>
            </View>
            <Switch
              value={customResetEnabled}
              onValueChange={handleToggleResetTime}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          {showTimePicker && customResetEnabled && (
            <View style={styles.timePickerContainer}>
              <DateTimePicker
                value={resetTime}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
            </View>
          )}

          {customResetEnabled && !showTimePicker && (
            <TouchableOpacity 
              style={[styles.settingItem, { marginTop: 8 }]}
              onPress={() => setShowTimePicker(true)}
            >
              <View style={styles.iconContainer}>
                <IconSymbol 
                  ios_icon_name="pencil" 
                  android_material_icon_name="edit" 
                  size={18} 
                  color={colors.primary} 
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Change Reset Time</Text>
              </View>
              <IconSymbol 
                ios_icon_name="chevron.right" 
                android_material_icon_name="chevron-right" 
                size={20} 
                color={colors.textSecondary} 
                style={styles.chevron} 
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Privacy Policy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
            <View style={styles.iconContainer}>
              <IconSymbol 
                ios_icon_name="doc.text.fill" 
                android_material_icon_name="description" 
                size={18} 
                color={colors.primary} 
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
            </View>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron-right" 
              size={20} 
              color={colors.textSecondary} 
              style={styles.chevron} 
            />
          </TouchableOpacity>
        </View>

        {/* Reset App Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity style={styles.resetButton} onPress={handleResetApp}>
            <Text style={styles.resetButtonText}>Reset App Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
