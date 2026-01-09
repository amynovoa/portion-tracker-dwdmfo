
import AppLogo from '@/components/AppLogo';
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import { clearAllData, saveResetTime, loadResetTime, ResetTimeConfig, loadProfile, saveProfile } from '@/utils/storage';
import { saveCelebrationEnabled, loadCelebrationEnabled } from '@/utils/celebrationStorage';
import PaywallScreen from '@/components/PaywallScreen';
import { formatResetTime } from '@/utils/dailyReset';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { ActivityLevel, ACTIVITY_LEVELS, ACTIVITY_LEVEL_INFO } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Alert, Modal, Switch, Platform, Linking } from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
  },
  settingValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  activityLevelContainer: {
    marginTop: 8,
  },
  activityButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: 8,
  },
  activityButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  activityButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  activityButtonDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resetButton: {
    ...buttonStyles.secondary,
    marginTop: 16,
  },
  resetButtonText: {
    ...buttonStyles.secondaryText,
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: colors.error,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalButtonTextConfirm: {
    color: '#fff',
  },
  subscriptionSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  subscriptionStatus: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  subscriptionButton: {
    ...buttonStyles.primary,
  },
  subscriptionButtonText: {
    ...buttonStyles.primaryText,
  },
});

export default function SettingsScreen() {
  const router = useRouter();
  const [celebrationEnabled, setCelebrationEnabled] = useState(true);
  const [resetEnabled, setResetEnabled] = useState(false);
  const [resetTime, setResetTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    celebration: false,
    reset: false,
    activity: false,
  });
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [showPaywall, setShowPaywall] = useState(false);
  const { isSubscribed, isTrialAvailable, trialDaysRemaining } = useSubscription();

  useEffect(() => {
    loadCelebrationSettings();
    loadActivityLevel();
    loadResetSettings();
  }, []);

  async function loadCelebrationSettings() {
    const enabled = await loadCelebrationEnabled();
    setCelebrationEnabled(enabled);
  }

  async function loadActivityLevel() {
    const profile = await loadProfile();
    if (profile && profile.activityLevel) {
      // Ensure activityLevel is a string
      const level = typeof profile.activityLevel === 'string' ? profile.activityLevel : 'moderate';
      setActivityLevel(level as ActivityLevel);
    }
  }

  async function loadResetSettings() {
    const config = await loadResetTime();
    if (config) {
      setResetEnabled(config.enabled);
      const [hours, minutes] = config.time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      setResetTime(date);
    }
  }

  function toggleSection(section: string) {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  async function handleToggleCelebration(enabled: boolean) {
    setCelebrationEnabled(enabled);
    await saveCelebrationEnabled(enabled);
  }

  async function handleToggleReset(enabled: boolean) {
    setResetEnabled(enabled);
    const hours = resetTime.getHours().toString().padStart(2, '0');
    const minutes = resetTime.getMinutes().toString().padStart(2, '0');
    await saveResetTime({
      enabled,
      time: `${hours}:${minutes}`,
    });
  }

  function handleTimeChange(event: any) {
    if (event.type === 'set' && event.nativeEvent?.timestamp) {
      const selectedDate = new Date(event.nativeEvent.timestamp);
      setResetTime(selectedDate);
      
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      saveResetTime({
        enabled: resetEnabled,
        time: `${hours}:${minutes}`,
      });
    }
    
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
  }

  function handleShowTimePicker() {
    setShowTimePicker(true);
  }

  function handleDoneTimePicker() {
    setShowTimePicker(false);
  }

  async function handleUpdateActivityLevel(newLevel: ActivityLevel) {
    setActivityLevel(newLevel);
    
    const profile = await loadProfile();
    if (profile) {
      const updatedTargets = calculateRecommendedTargets(
        profile.sex,
        profile.currentWeight,
        profile.goal,
        profile.includeAlcohol,
        profile.alcoholServings,
        newLevel
      );
      
      const updatedProfile = {
        ...profile,
        activityLevel: newLevel,
        targets: updatedTargets,
      };
      
      await saveProfile(updatedProfile);
      Alert.alert('Activity Level Updated', 'Your daily portion targets have been recalculated.');
    }
  }

  function handleResetApp() {
    setShowResetModal(true);
  }

  async function confirmReset() {
    await clearAllData();
    setShowResetModal(false);
    Alert.alert('Reset Complete', 'All app data has been cleared. Please restart the app.');
  }

  function cancelReset() {
    setShowResetModal(false);
  }

  function getActivityLevelLabel(level: ActivityLevel): string {
    return ACTIVITY_LEVEL_INFO[level]?.label || level;
  }

  function handleManageSubscription() {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else if (Platform.OS === 'android') {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  }

  function handlePaywallDismiss() {
    setShowPaywall(false);
  }

  function getSubscriptionStatusText(): string {
    if (isSubscribed) {
      return 'You have an active subscription';
    } else if (isTrialAvailable) {
      return `${trialDaysRemaining} days left in your trial`;
    } else {
      return 'No active subscription';
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <AppLogo size={40} />
        </View>

        <Text style={styles.title}>Settings</Text>

        {/* Subscription Section */}
        <View style={styles.subscriptionSection}>
          <Text style={styles.subscriptionTitle}>Subscription</Text>
          <Text style={styles.subscriptionStatus}>{getSubscriptionStatusText()}</Text>
          {isSubscribed ? (
            <TouchableOpacity style={styles.subscriptionButton} onPress={handleManageSubscription}>
              <Text style={styles.subscriptionButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.subscriptionButton} onPress={() => setShowPaywall(true)}>
              <Text style={styles.subscriptionButtonText}>
                {isTrialAvailable ? 'Start Free Trial' : 'Subscribe Now'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Activity Level Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('activity')}
          >
            <Text style={styles.sectionTitle}>Activity Level</Text>
            <IconSymbol
              ios_icon_name={expandedSections.activity ? 'chevron.up' : 'chevron.down'}
              android_material_icon_name={expandedSections.activity ? 'arrow-upward' : 'arrow-downward'}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
          {expandedSections.activity && (
            <View style={styles.sectionContent}>
              <Text style={styles.settingLabel}>
                Current: {getActivityLevelLabel(activityLevel)}
              </Text>
              <View style={styles.activityLevelContainer}>
                {ACTIVITY_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.activityButton,
                      activityLevel === level && styles.activityButtonSelected,
                    ]}
                    onPress={() => handleUpdateActivityLevel(level)}
                  >
                    <Text style={styles.activityButtonLabel}>
                      {ACTIVITY_LEVEL_INFO[level].label}
                    </Text>
                    <Text style={styles.activityButtonDescription}>
                      {ACTIVITY_LEVEL_INFO[level].description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Celebration Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('celebration')}
          >
            <Text style={styles.sectionTitle}>Celebrations</Text>
            <IconSymbol
              ios_icon_name={expandedSections.celebration ? 'chevron.up' : 'chevron.down'}
              android_material_icon_name={expandedSections.celebration ? 'arrow-upward' : 'arrow-downward'}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
          {expandedSections.celebration && (
            <View style={styles.sectionContent}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Daily Completion Celebration</Text>
                <Switch
                  value={celebrationEnabled}
                  onValueChange={handleToggleCelebration}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>
            </View>
          )}
        </View>

        {/* Daily Reset Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('reset')}
          >
            <Text style={styles.sectionTitle}>Daily Reset</Text>
            <IconSymbol
              ios_icon_name={expandedSections.reset ? 'chevron.up' : 'chevron.down'}
              android_material_icon_name={expandedSections.reset ? 'arrow-upward' : 'arrow-downward'}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
          {expandedSections.reset && (
            <View style={styles.sectionContent}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Custom Reset Time</Text>
                <Switch
                  value={resetEnabled}
                  onValueChange={handleToggleReset}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                />
              </View>
              {resetEnabled && (
                <View style={[styles.settingRow, styles.settingRowLast]}>
                  <Text style={styles.settingLabel}>Reset Time</Text>
                  <TouchableOpacity onPress={handleShowTimePicker}>
                    <Text style={styles.settingValue}>{formatResetTime(resetTime)}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Reset App Data */}
        <TouchableOpacity style={styles.resetButton} onPress={handleResetApp}>
          <Text style={styles.resetButtonText}>Reset All App Data</Text>
        </TouchableOpacity>
      </View>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <Modal
          visible={showTimePicker}
          transparent
          animationType="fade"
          onRequestClose={handleDoneTimePicker}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={resetTime}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={buttonStyles.primary} onPress={handleDoneTimePicker}>
                  <Text style={buttonStyles.primaryText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Reset Confirmation Modal */}
      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={cancelReset}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset All Data?</Text>
            <Text style={styles.modalMessage}>
              This will permanently delete all your profile data, portion tracking history, and weight entries. This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={cancelReset}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmReset}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>
                  Reset
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Paywall */}
      <PaywallScreen
        visible={showPaywall}
        onDismiss={handlePaywallDismiss}
        isTrialAvailable={isTrialAvailable}
        trialDaysRemaining={trialDaysRemaining}
        canDismiss={true}
      />
    </ScrollView>
  );
}
