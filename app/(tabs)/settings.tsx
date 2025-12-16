
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Alert, Modal, Switch, Platform } from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useRouter } from 'expo-router';
import AppLogo from '@/components/AppLogo';
import { clearAllData, saveResetTime, loadResetTime, ResetTimeConfig } from '@/utils/storage';
import { formatResetTime } from '@/utils/dailyReset';
import DateTimePicker from '@react-native-community/datetimepicker';
import { IconSymbol } from '@/components/IconSymbol';

export default function SettingsScreen() {
  const router = useRouter();
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    profile: false,
    dailyReset: false,
    dataStorage: false,
    about: false,
    resetApp: false,
  });
  
  // Daily reset time settings
  const [resetEnabled, setResetEnabled] = useState(true);
  const [resetHour, setResetHour] = useState(0);
  const [resetMinute, setResetMinute] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    loadResetSettings();
  }, []);

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

        {/* Profile Section */}
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

        {/* Daily Reset Time Section */}
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

        {/* Data Storage Section */}
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

        {/* About Section */}
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

        {/* Reset App Section */}
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

      {/* Time Picker Modal */}
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

      {/* Reset Confirmation Modal */}
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
    paddingBottom: 120,
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
    height: 20,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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
});
