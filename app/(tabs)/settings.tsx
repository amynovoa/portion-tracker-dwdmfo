
import { clearAllData, saveResetTime, loadResetTime, ResetTimeConfig, loadProfile, saveProfile } from '@/utils/storage';
import { formatResetTime } from '@/utils/dailyReset';
import { ActivityLevel, ACTIVITY_LEVELS } from '@/types';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import PaywallScreen from '@/components/PaywallScreen';
import AppLogo from '@/components/AppLogo';
import { saveCelebrationEnabled, loadCelebrationEnabled } from '@/utils/celebrationStorage';
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Alert, Modal, Switch, Platform, Linking } from 'react-native';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SettingsScreen() {
  const { hasActiveSubscription, isTrialActive, trialDaysRemaining } = useSubscription();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [celebrationEnabled, setCelebrationEnabled] = useState(true);
  const [resetEnabled, setResetEnabled] = useState(false);
  const [resetTime, setResetTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [showPaywall, setShowPaywall] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadCelebrationSettings();
    loadResetSettings();
    loadActivityLevel();
  }, []);

  const loadCelebrationSettings = async () => {
    const enabled = await loadCelebrationEnabled();
    setCelebrationEnabled(enabled);
  };

  const loadActivityLevel = async () => {
    const profile = await loadProfile();
    if (profile?.activityLevel) {
      setActivityLevel(profile.activityLevel);
    }
  };

  const loadResetSettings = async () => {
    const config = await loadResetTime();
    if (config) {
      setResetEnabled(config.enabled);
      const [hours, minutes] = config.time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      setResetTime(date);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleToggleCelebration = async (enabled: boolean) => {
    setCelebrationEnabled(enabled);
    await saveCelebrationEnabled(enabled);
  };

  const handleToggleReset = async (enabled: boolean) => {
    setResetEnabled(enabled);
    const hours = resetTime.getHours().toString().padStart(2, '0');
    const minutes = resetTime.getMinutes().toString().padStart(2, '0');
    await saveResetTime({ enabled, time: `${hours}:${minutes}` });
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      setResetTime(selectedDate);
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      saveResetTime({ enabled: resetEnabled, time: `${hours}:${minutes}` });
    }
  };

  const handleShowTimePicker = () => {
    setShowTimePicker(true);
  };

  const handleDoneTimePicker = () => {
    setShowTimePicker(false);
  };

  const handleUpdateActivityLevel = async (newLevel: ActivityLevel) => {
    setActivityLevel(newLevel);
    const profile = await loadProfile();
    if (profile) {
      const updatedProfile = { ...profile, activityLevel: newLevel };
      await saveProfile(updatedProfile);
      
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
      
      Alert.alert(
        'Activity Level Updated',
        'Your portion targets have been recalculated based on your new activity level.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all your data including profile, tracking history, and weight entries. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel', onPress: cancelReset },
        { text: 'Reset', style: 'destructive', onPress: confirmReset },
      ]
    );
  };

  const confirmReset = async () => {
    await clearAllData();
    Alert.alert('Data Cleared', 'All app data has been reset.', [
      { text: 'OK', onPress: () => router.replace('/profile') }
    ]);
  };

  const cancelReset = () => {
    // User cancelled
  };

  const getActivityLevelLabel = (level: ActivityLevel): string => {
    const activityLevel = ACTIVITY_LEVELS.find(a => a.value === level);
    return activityLevel ? activityLevel.label : 'Moderate';
  };

  const handleManageSubscription = () => {
    if (hasActiveSubscription || isTrialActive) {
      const url = Platform.select({
        ios: 'https://apps.apple.com/account/subscriptions',
        android: 'https://play.google.com/store/account/subscriptions',
        default: 'https://apps.apple.com/account/subscriptions',
      });
      Linking.openURL(url);
    } else {
      setShowPaywall(true);
    }
  };

  const handlePaywallDismiss = () => {
    setShowPaywall(false);
  };

  const getSubscriptionStatusText = () => {
    if (isTrialActive) {
      return `Free Trial (${trialDaysRemaining} days remaining)`;
    }
    if (hasActiveSubscription) {
      return 'Active Subscription';
    }
    return 'No Active Subscription';
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <AppLogo size={32} />
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('subscription')}
          >
            <View style={styles.sectionHeaderLeft}>
              <IconSymbol ios_icon_name="creditcard" android_material_icon_name="credit-card" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Subscription</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
              style={{
                transform: [{ rotate: expandedSection === 'subscription' ? '90deg' : '0deg' }],
              }}
            />
          </TouchableOpacity>

          {expandedSection === 'subscription' && (
            <View style={styles.sectionContent}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Status</Text>
                <Text style={styles.settingValue}>{getSubscriptionStatusText()}</Text>
              </View>
              <TouchableOpacity
                style={[buttonStyles.primary, { marginTop: 12 }]}
                onPress={handleManageSubscription}
              >
                <Text style={buttonStyles.primaryText}>
                  {hasActiveSubscription || isTrialActive ? 'Manage Subscription' : 'Subscribe'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Activity Level Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('activity')}
          >
            <View style={styles.sectionHeaderLeft}>
              <IconSymbol ios_icon_name="figure.run" android_material_icon_name="directions-run" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Activity Level</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
              style={{
                transform: [{ rotate: expandedSection === 'activity' ? '90deg' : '0deg' }],
              }}
            />
          </TouchableOpacity>

          {expandedSection === 'activity' && (
            <View style={styles.sectionContent}>
              <Text style={styles.sectionDescription}>
                Your activity level affects your portion targets. Update this if your exercise routine changes.
              </Text>
              {ACTIVITY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.activityOption,
                    activityLevel === level.value && styles.activityOptionSelected,
                  ]}
                  onPress={() => handleUpdateActivityLevel(level.value)}
                >
                  <View style={styles.activityOptionContent}>
                    <Text
                      style={[
                        styles.activityOptionLabel,
                        activityLevel === level.value && styles.activityOptionLabelSelected,
                      ]}
                    >
                      {level.label}
                    </Text>
                    <Text
                      style={[
                        styles.activityOptionDescription,
                        activityLevel === level.value && styles.activityOptionDescriptionSelected,
                      ]}
                    >
                      {level.description}
                    </Text>
                  </View>
                  {activityLevel === level.value && (
                    <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Celebration Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('celebration')}
          >
            <View style={styles.sectionHeaderLeft}>
              <IconSymbol ios_icon_name="party.popper" android_material_icon_name="celebration" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Celebration</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
              style={{
                transform: [{ rotate: expandedSection === 'celebration' ? '90deg' : '0deg' }],
              }}
            />
          </TouchableOpacity>

          {expandedSection === 'celebration' && (
            <View style={styles.sectionContent}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Show daily celebration</Text>
                <Switch
                  value={celebrationEnabled}
                  onValueChange={handleToggleCelebration}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={celebrationEnabled ? colors.primary : colors.textSecondary}
                />
              </View>
              <Text style={styles.settingDescription}>
                Display a celebration message when you complete all your daily targets
              </Text>
            </View>
          )}
        </View>

        {/* Daily Reset Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('reset')}
          >
            <View style={styles.sectionHeaderLeft}>
              <IconSymbol ios_icon_name="clock" android_material_icon_name="schedule" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Daily Reset</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
              style={{
                transform: [{ rotate: expandedSection === 'reset' ? '90deg' : '0deg' }],
              }}
            />
          </TouchableOpacity>

          {expandedSection === 'reset' && (
            <View style={styles.sectionContent}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Custom reset time</Text>
                <Switch
                  value={resetEnabled}
                  onValueChange={handleToggleReset}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={resetEnabled ? colors.primary : colors.textSecondary}
                />
              </View>
              <Text style={styles.settingDescription}>
                {resetEnabled
                  ? 'Your daily tracking resets at your chosen time'
                  : 'Your daily tracking resets at midnight'}
              </Text>

              {resetEnabled && (
                <View style={styles.timePickerContainer}>
                  <Text style={styles.timeLabel}>Reset Time:</Text>
                  {Platform.OS === 'ios' ? (
                    <>
                      <TouchableOpacity
                        style={styles.timeButton}
                        onPress={handleShowTimePicker}
                      >
                        <Text style={styles.timeButtonText}>
                          {formatResetTime(resetTime)}
                        </Text>
                      </TouchableOpacity>
                      {showTimePicker && (
                        <Modal
                          transparent
                          animationType="slide"
                          visible={showTimePicker}
                          onRequestClose={handleDoneTimePicker}
                        >
                          <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                              <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={handleDoneTimePicker}>
                                  <Text style={styles.modalDoneButton}>Done</Text>
                                </TouchableOpacity>
                              </View>
                              <DateTimePicker
                                value={resetTime}
                                mode="time"
                                display="spinner"
                                onChange={handleTimeChange}
                                style={styles.timePicker}
                              />
                            </View>
                          </View>
                        </Modal>
                      )}
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.timeButton}
                        onPress={handleShowTimePicker}
                      >
                        <Text style={styles.timeButtonText}>
                          {formatResetTime(resetTime)}
                        </Text>
                      </TouchableOpacity>
                      {showTimePicker && (
                        <DateTimePicker
                          value={resetTime}
                          mode="time"
                          display="default"
                          onChange={handleTimeChange}
                        />
                      )}
                    </>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Privacy Policy Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => Linking.openURL('https://portiontrack.com/privacy-policy')}
          >
            <View style={styles.sectionHeaderLeft}>
              <IconSymbol ios_icon_name="lock.shield" android_material_icon_name="security" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Privacy Policy</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Reset App Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('danger')}
          >
            <View style={styles.sectionHeaderLeft}>
              <IconSymbol ios_icon_name="exclamationmark.triangle" android_material_icon_name="warning" size={20} color={colors.error} />
              <Text style={[styles.sectionTitle, { color: colors.error }]}>Danger Zone</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.textSecondary}
              style={{
                transform: [{ rotate: expandedSection === 'danger' ? '90deg' : '0deg' }],
              }}
            />
          </TouchableOpacity>

          {expandedSection === 'danger' && (
            <View style={styles.sectionContent}>
              <Text style={styles.settingDescription}>
                This will permanently delete all your data. This action cannot be undone.
              </Text>
              <TouchableOpacity
                style={[buttonStyles.primary, styles.dangerButton]}
                onPress={handleResetApp}
              >
                <Text style={buttonStyles.primaryText}>Reset All Data</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <PaywallScreen
        visible={showPaywall}
        onDismiss={handlePaywallDismiss}
        isTrialAvailable={!isTrialActive && !hasActiveSubscription}
        trialDaysRemaining={trialDaysRemaining}
        canDismiss={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
    ...commonStyles.shadow,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
  },
  settingValue: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  activityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  activityOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  activityOptionContent: {
    flex: 1,
  },
  activityOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  activityOptionLabelSelected: {
    color: colors.primary,
  },
  activityOptionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  activityOptionDescriptionSelected: {
    color: colors.primary,
  },
  timePickerContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  timeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  timeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timePicker: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalDoneButton: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
  },
  dangerButton: {
    backgroundColor: colors.error,
    marginTop: 12,
  },
});
