
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Alert, Modal, Switch, Platform, Linking } from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useRouter } from 'expo-router';
import AppLogo from '@/components/AppLogo';
import { clearAllData, saveResetTime, loadResetTime, ResetTimeConfig, loadProfile, saveProfile } from '@/utils/storage';
import { saveCelebrationEnabled, loadCelebrationEnabled } from '@/utils/celebrationStorage';
import { formatResetTime } from '@/utils/dailyReset';
import { ActivityLevel, ACTIVITY_LEVELS } from '@/types';
import { calculateRecommendedTargets } from '@/utils/portionCalculator';
import DateTimePicker from '@react-native-community/datetimepicker';
import { IconSymbol } from '@/components/IconSymbol';
import { useSubscription } from '@/contexts/SubscriptionContext';
import PaywallScreen from '@/components/PaywallScreen';

export default function SettingsScreen() {
  const router = useRouter();
  const { subscriptionStatus, refreshSubscriptionStatus } = useSubscription();
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [currentActivityLevel, setCurrentActivityLevel] = useState<ActivityLevel>('sedentary');
  const [celebrationEnabled, setCelebrationEnabled] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    subscription: false,
    profile: false,
    activityLevel: false,
    celebrations: false,
    dailyReset: false,
    dataStorage: false,
    about: false,
    resetApp: false,
  });
  
  const [resetEnabled, setResetEnabled] = useState(true);
  const [resetHour, setResetHour] = useState(0);
  const [resetMinute, setResetMinute] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    loadResetSettings();
    loadActivityLevel();
    loadCelebrationSettings();
  }, []);

  const loadCelebrationSettings = async () => {
    try {
      const enabled = await loadCelebrationEnabled();
      setCelebrationEnabled(enabled);
    } catch (error) {
      console.error('Error loading celebration settings:', error);
    }
  };

  const loadActivityLevel = async () => {
    try {
      const profile = await loadProfile();
      if (profile && profile.activityLevel) {
        setCurrentActivityLevel(profile.activityLevel);
      }
    } catch (error) {
      console.error('Error loading activity level:', error);
    }
  };

  const loadResetSettings = async () => {
    try {
      const config = await loadResetTime();
      if (config) {
        setResetEnabled(config.enabled);
        setResetHour(config.hour);
        setResetMinute(config.minute);
        
        const date = new Date();
        date.setHours(config.hour, config.minute, 0, 0);
        setTempDate(date);
      } else {
        const defaultConfig: ResetTimeConfig = {
          hour: 0,
          minute: 0,
          enabled: true,
        };
        await saveResetTime(defaultConfig);
      }
    } catch (error) {
      console.error('Error loading reset settings:', error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleToggleCelebration = async (enabled: boolean) => {
    setCelebrationEnabled(enabled);
    
    try {
      await saveCelebrationEnabled(enabled);
      console.log('Celebration setting saved:', enabled);
    } catch (error) {
      console.error('Error saving celebration setting:', error);
      Alert.alert('Error', 'Failed to save celebration setting.');
    }
  };

  const handleToggleReset = async (enabled: boolean) => {
    setResetEnabled(enabled);
    
    const config: ResetTimeConfig = {
      hour: resetHour,
      minute: resetMinute,
      enabled,
    };
    
    try {
      await saveResetTime(config);
      console.log('Reset time config saved:', config);
    } catch (error) {
      console.error('Error saving reset time:', error);
      Alert.alert('Error', 'Failed to save reset time setting.');
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    console.log('Time picker event:', event.type, selectedDate);
    
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (event.type === 'dismissed') {
      if (Platform.OS === 'ios') {
        setShowTimePicker(false);
      }
      return;
    }
    
    if (selectedDate) {
      setTempDate(selectedDate);
      
      if (Platform.OS === 'android' || event.type === 'set') {
        const hours = selectedDate.getHours();
        const minutes = selectedDate.getMinutes();
        
        console.log('Setting new time:', hours, minutes);
        
        setResetHour(hours);
        setResetMinute(minutes);
        
        const config: ResetTimeConfig = {
          hour: hours,
          minute: minutes,
          enabled: resetEnabled,
        };
        
        saveResetTime(config).then(() => {
          console.log('Time saved successfully');
        }).catch(error => {
          console.error('Error saving reset time:', error);
          Alert.alert('Error', 'Failed to save reset time.');
        });
      }
    }
  };

  const handleShowTimePicker = () => {
    console.log('Opening time picker with current time:', resetHour, resetMinute);
    const date = new Date();
    date.setHours(resetHour, resetMinute, 0, 0);
    setTempDate(date);
    setShowTimePicker(true);
  };

  const handleDoneTimePicker = () => {
    console.log('Done button pressed, saving time:', tempDate.getHours(), tempDate.getMinutes());
    const hours = tempDate.getHours();
    const minutes = tempDate.getMinutes();
    
    setResetHour(hours);
    setResetMinute(minutes);
    
    const config: ResetTimeConfig = {
      hour: hours,
      minute: minutes,
      enabled: resetEnabled,
    };
    
    saveResetTime(config).then(() => {
      console.log('Time saved successfully');
      setShowTimePicker(false);
    }).catch(error => {
      console.error('Error saving reset time:', error);
      Alert.alert('Error', 'Failed to save reset time.');
      setShowTimePicker(false);
    });
  };

  const handleUpdateActivityLevel = async (newLevel: ActivityLevel) => {
    try {
      const profile = await loadProfile();
      if (!profile) {
        Alert.alert('Error', 'No profile found. Please set up your profile first.');
        return;
      }

      const result = calculateRecommendedTargets(
        profile.sex,
        profile.currentWeight,
        profile.goal,
        profile.includeAlcohol,
        profile.alcoholServings,
        newLevel
      );

      profile.activityLevel = newLevel;
      profile.targets = result.targets;

      await saveProfile(profile);
      setCurrentActivityLevel(newLevel);
      setShowActivityModal(false);

      Alert.alert(
        'Activity Level Updated',
        'Your portion targets have been adjusted based on your new activity level.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error updating activity level:', error);
      Alert.alert('Error', 'Failed to update activity level.');
    }
  };

  const handleResetApp = () => {
    console.log('Reset app button pressed');
    setShowResetModal(true);
  };

  const confirmReset = async () => {
    try {
      console.log('User confirmed reset, starting process...');
      setIsResetting(true);
      
      await clearAllData();
      console.log('All data cleared successfully');
      
      setShowResetModal(false);
      setIsResetting(false);
      
      setTimeout(() => {
        console.log('Navigating to profile screen');
        router.replace('/(tabs)/profile');
      }, 100);
      
    } catch (error) {
      console.error('Error resetting app:', error);
      setIsResetting(false);
      setShowResetModal(false);
      Alert.alert('Error', 'Failed to reset app data. Please try again.');
    }
  };

  const cancelReset = () => {
    console.log('Reset cancelled');
    setShowResetModal(false);
  };

  const getActivityLevelLabel = (level: ActivityLevel): string => {
    const found = ACTIVITY_LEVELS.find(a => a.key === level);
    return found ? found.label : 'Sedentary';
  };

  const handleManageSubscription = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else if (Platform.OS === 'android') {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  };

  const handlePaywallDismiss = async () => {
    setShowPaywall(false);
    await refreshSubscriptionStatus();
  };

  const getSubscriptionStatusText = (): string => {
    if (!subscriptionStatus) return 'Loading...';
    if (subscriptionStatus.isTestFlight) return 'TestFlight - Full Access';
    if (subscriptionStatus.isInTrial) return `Free Trial (${subscriptionStatus.trialDaysRemaining} days left)`;
    if (subscriptionStatus.isSubscribed) return 'Active Subscription';
    return 'No Active Subscription';
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <AppLogo size={60} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your preferences</Text>
        </View>

        <View style={styles.collapsibleSection}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('subscription')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionHeaderIcon}>💳</Text>
              <Text style={styles.sectionHeaderTitle}>Subscription</Text>
            </View>
            <IconSymbol
              ios_icon_name={expandedSections.subscription ? "chevron.up" : "chevron.down"}
              android_material_icon_name={expandedSections.subscription ? "expand_less" : "expand_more"}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          
          {expandedSections.subscription && (
            <View style={styles.sectionContent}>
              <Text style={styles.sectionDescription}>
                Manage your Portion Track subscription
              </Text>
              
              <View style={styles.subscriptionStatusBox}>
                <Text style={styles.subscriptionStatusLabel}>Status:</Text>
                <Text style={styles.subscriptionStatusValue}>
                  {getSubscriptionStatusText()}
                </Text>
              </View>

              {!subscriptionStatus?.isTestFlight && !subscriptionStatus?.isSubscribed && (
                <TouchableOpacity
                  style={[buttonStyles.primary, styles.button]}
                  onPress={() => setShowPaywall(true)}
                >
                  <Text style={commonStyles.buttonText}>
                    {subscriptionStatus?.isInTrial ? 'View Plans' : 'Start Free Trial'}
                  </Text>
                </TouchableOpacity>
              )}

              {subscriptionStatus?.isSubscribed && !subscriptionStatus?.isTestFlight && (
                <TouchableOpacity
                  style={[buttonStyles.outline, styles.button]}
                  onPress={handleManageSubscription}
                >
                  <Text style={commonStyles.buttonTextOutline}>Manage Subscription</Text>
                </TouchableOpacity>
              )}

              {subscriptionStatus?.isTestFlight && (
                <View style={styles.testFlightNote}>
                  <Text style={styles.testFlightNoteText}>
                    🧪 You&apos;re using a TestFlight build with full access enabled for testing.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.collapsibleSection}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('profile')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionHeaderIcon}>👤</Text>
              <Text style={styles.sectionHeaderTitle}>Profile</Text>
            </View>
            <IconSymbol
              ios_icon_name={expandedSections.profile ? "chevron.up" : "chevron.down"}
              android_material_icon_name={expandedSections.profile ? "expand_less" : "expand_more"}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          
          {expandedSections.profile && (
            <View style={styles.sectionContent}>
              <Text style={styles.sectionDescription}>
                Update your personal information and portion targets
              </Text>
              <TouchableOpacity
                style={[buttonStyles.outline, styles.button]}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Text style={commonStyles.buttonTextOutline}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.collapsibleSection}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('activityLevel')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionHeaderIcon}>🏃</Text>
              <Text style={styles.sectionHeaderTitle}>Activity Level</Text>
            </View>
            <IconSymbol
              ios_icon_name={expandedSections.activityLevel ? "chevron.up" : "chevron.down"}
              android_material_icon_name={expandedSections.activityLevel ? "expand_less" : "expand_more"}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          
          {expandedSections.activityLevel && (
            <View style={styles.sectionContent}>
              <Text style={styles.sectionDescription}>
                Your current activity level affects your daily portion targets
              </Text>
              <View style={styles.currentActivityBox}>
                <Text style={styles.currentActivityLabel}>Current Level:</Text>
                <Text style={styles.currentActivityValue}>
                  {getActivityLevelLabel(currentActivityLevel)}
                </Text>
              </View>
              <TouchableOpacity
                style={[buttonStyles.outline, styles.button]}
                onPress={() => setShowActivityModal(true)}
              >
                <Text style={commonStyles.buttonTextOutline}>Change Activity Level</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.collapsibleSection}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('celebrations')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionHeaderIcon}>⭐</Text>
              <Text style={styles.sectionHeaderTitle}>Celebrations</Text>
            </View>
            <IconSymbol
              ios_icon_name={expandedSections.celebrations ? "chevron.up" : "chevron.down"}
              android_material_icon_name={expandedSections.celebrations ? "expand_less" : "expand_more"}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          
          {expandedSections.celebrations && (
            <View style={styles.sectionContent}>
              <Text style={styles.sectionDescription}>
                Get a gentle celebration when you complete your daily tracking goals
              </Text>
              
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Daily completion celebration</Text>
                <Switch
                  value={celebrationEnabled}
                  onValueChange={handleToggleCelebration}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.card}
                />
              </View>

              <Text style={styles.celebrationHelperText}>
                When enabled, you&apos;ll see a calm, minimal celebration when you log 100% of your daily portion targets. This appears once per day and can be dismissed with a tap.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.collapsibleSection}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('dailyReset')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionHeaderIcon}>⏰</Text>
              <Text style={styles.sectionHeaderTitle} numberOfLines={1}>Daily Reset Time</Text>
            </View>
            <View style={styles.chevronContainer}>
              <IconSymbol
                ios_icon_name={expandedSections.dailyReset ? "chevron.up" : "chevron.down"}
                android_material_icon_name={expandedSections.dailyReset ? "expand_less" : "expand_more"}
                size={24}
                color={colors.text}
              />
            </View>
          </TouchableOpacity>
          
          {expandedSections.dailyReset && (
            <View style={styles.sectionContent}>
              <Text style={styles.sectionDescription}>
                Automatically clear your daily tracking at a specific time each day. Your history will be preserved.
              </Text>
              
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Customize daily reset</Text>
                <Switch
                  value={resetEnabled}
                  onValueChange={handleToggleReset}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.card}
                />
              </View>

              {resetEnabled && (
                <View style={styles.timePickerSection}>
                  <Text style={styles.timeLabel}>Reset time:</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={handleShowTimePicker}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.timeButtonText}>
                      {formatResetTime(resetHour, resetMinute)}
                    </Text>
                    <Text style={styles.timeButtonIcon}>🕐</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.timeHelperText}>
                    Your daily portions will reset to zero at this time, and today&apos;s data will be saved to history.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.collapsibleSection}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('dataStorage')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionHeaderIcon}>📱</Text>
              <Text style={styles.sectionHeaderTitle}>Data Storage</Text>
            </View>
            <IconSymbol
              ios_icon_name={expandedSections.dataStorage ? "chevron.up" : "chevron.down"}
              android_material_icon_name={expandedSections.dataStorage ? "expand_less" : "expand_more"}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          
          {expandedSections.dataStorage && (
            <View style={styles.sectionContent}>
              <Text style={styles.dataStorageText}>
                All your data is stored locally on this device only. This means:
              </Text>
              <View style={styles.dataStorageList}>
                <Text style={styles.dataStorageListItem}>• Your profile, portions, and weight entries are private and secure</Text>
                <Text style={styles.dataStorageListItem}>• No account or internet connection required</Text>
                <Text style={styles.dataStorageListItem}>• Your data will not sync across multiple devices</Text>
                <Text style={styles.dataStorageListItem}>• If you delete the app or switch devices, your data will be lost</Text>
              </View>
              <Text style={styles.dataStorageNote}>
                💡 Tip: If you use Portion Tracker on multiple devices, each device will have its own separate tracking data.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.collapsibleSection}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('about')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionHeaderIcon}>ℹ️</Text>
              <Text style={styles.sectionHeaderTitle}>About</Text>
            </View>
            <IconSymbol
              ios_icon_name={expandedSections.about ? "chevron.up" : "chevron.down"}
              android_material_icon_name={expandedSections.about ? "expand_less" : "expand_more"}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          
          {expandedSections.about && (
            <View style={styles.sectionContent}>
              <Text style={styles.aboutText}>
                Portion Track helps you build healthy, sustainable eating habits by tracking daily portions from key food groups—without calorie counting or rigid rules. Designed by a certified integrative health coach, Portion Track focuses on flexibility, real-life eating, and long-term success that fits you.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.collapsibleSection}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('resetApp')}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionHeaderIcon}>🔄</Text>
              <Text style={styles.sectionHeaderTitle}>Reset App Data</Text>
            </View>
            <IconSymbol
              ios_icon_name={expandedSections.resetApp ? "chevron.up" : "chevron.down"}
              android_material_icon_name={expandedSections.resetApp ? "expand_less" : "expand_more"}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          
          {expandedSections.resetApp && (
            <View style={styles.sectionContent}>
              <Text style={styles.resetDescription}>
                Need a fresh start? You can reset the app and clear all your data.
              </Text>
              <TouchableOpacity
                style={[buttonStyles.outline, styles.resetButton]}
                onPress={handleResetApp}
              >
                <Text style={styles.resetButtonText}>Clear All Data</Text>
              </TouchableOpacity>
              <Text style={styles.resetWarning}>
                Note: This will permanently delete all your data including profile, portion history, and weight entries.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <PaywallScreen
        visible={showPaywall}
        onDismiss={handlePaywallDismiss}
        isTrialAvailable={subscriptionStatus?.isInTrial === false && (subscriptionStatus?.trialDaysRemaining || 0) > 0}
        trialDaysRemaining={subscriptionStatus?.trialDaysRemaining || 7}
        canDismiss={true}
      />

      {showTimePicker && (
        Platform.OS === 'ios' ? (
          <Modal
            visible={showTimePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowTimePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.timePickerModal}>
                <View style={styles.timePickerHeader}>
                  <Text style={styles.timePickerTitle}>Select Reset Time</Text>
                </View>
                <DateTimePicker
                  value={tempDate}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  style={styles.timePicker}
                />
                <TouchableOpacity
                  style={[buttonStyles.primary, styles.timePickerButton]}
                  onPress={handleDoneTimePicker}
                >
                  <Text style={commonStyles.buttonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={tempDate}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )
      )}

      <Modal
        visible={showActivityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActivityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.activityModalContent}>
            <Text style={styles.activityModalTitle}>Select Activity Level</Text>
            <Text style={styles.activityModalSubtitle}>
              Your portion targets will be adjusted automatically
            </Text>
            
            <ScrollView style={styles.activityLevelList} showsVerticalScrollIndicator={false}>
              {ACTIVITY_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.key}
                  style={[
                    styles.activityLevelOption,
                    currentActivityLevel === level.key && styles.activityLevelOptionActive
                  ]}
                  onPress={() => handleUpdateActivityLevel(level.key)}
                >
                  <Text style={[
                    styles.activityLevelOptionLabel,
                    currentActivityLevel === level.key && styles.activityLevelOptionLabelActive
                  ]}>
                    {level.label}
                  </Text>
                  <Text style={[
                    styles.activityLevelOptionDescription,
                    currentActivityLevel === level.key && styles.activityLevelOptionDescriptionActive
                  ]}>
                    {level.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[buttonStyles.outline, styles.activityModalButton]}
              onPress={() => setShowActivityModal(false)}
            >
              <Text style={commonStyles.buttonTextOutline}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showResetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelReset}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start Fresh?</Text>
            <Text style={styles.modalMessage}>
              This will clear all your app data and return you to the setup screen.
            </Text>
            <Text style={styles.modalSubtitle}>
              The following will be deleted:
            </Text>
            <View style={styles.modalList}>
              <Text style={styles.modalListItem}>• Your profile and portion targets</Text>
              <Text style={styles.modalListItem}>• All portion tracking history</Text>
              <Text style={styles.modalListItem}>• All weight entries</Text>
              <Text style={styles.modalListItem}>• Reminder settings</Text>
            </View>
            <Text style={styles.modalNote}>
              This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[buttonStyles.outline, styles.modalButton]}
                onPress={cancelReset}
                disabled={isResetting}
              >
                <Text style={commonStyles.buttonTextOutline}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, styles.modalButton]}
                onPress={confirmReset}
                disabled={isResetting}
              >
                <Text style={commonStyles.buttonText}>
                  {isResetting ? 'Clearing...' : 'Clear Data'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 48,
    paddingBottom: 200,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  collapsibleSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  sectionHeaderIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  chevronContainer: {
    marginLeft: 8,
    flexShrink: 0,
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
    lineHeight: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  currentActivityBox: {
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  currentActivityLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  currentActivityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  button: {
    marginVertical: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  celebrationHelperText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: 12,
  },
  timePickerSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.highlight,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  timeButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  timeButtonIcon: {
    fontSize: 24,
  },
  timeHelperText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  dataStorageText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
    marginTop: 8,
  },
  dataStorageList: {
    marginBottom: 16,
    paddingLeft: 4,
  },
  dataStorageListItem: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 4,
  },
  dataStorageNote: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  aboutText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
    marginTop: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  resetDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  resetButton: {
    borderColor: colors.textSecondary,
    marginVertical: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  resetWarning: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 8,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.25)',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  modalList: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  modalListItem: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  modalNote: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
  },
  timePickerModal: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.25)',
    elevation: 5,
  },
  timePickerHeader: {
    marginBottom: 16,
  },
  timePickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  timePicker: {
    width: '100%',
    marginBottom: 16,
  },
  timePickerButton: {
    marginTop: 8,
  },
  activityModalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 450,
    maxHeight: '80%',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.25)',
    elevation: 5,
  },
  activityModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  activityModalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  activityLevelList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  activityLevelOption: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginBottom: 10,
  },
  activityLevelOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  activityLevelOptionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  activityLevelOptionLabelActive: {
    color: colors.primary,
  },
  activityLevelOptionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  activityLevelOptionDescriptionActive: {
    color: colors.primary,
    fontWeight: '500',
  },
  activityModalButton: {
    marginTop: 8,
  },
  subscriptionStatusBox: {
    backgroundColor: colors.highlight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  subscriptionStatusLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  subscriptionStatusValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  testFlightNote: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  testFlightNoteText: {
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
});
