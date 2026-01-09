
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, commonStyles } from '@/styles/commonStyles';
import PaywallScreen from '@/components/PaywallScreen';
import { loadCelebrationEnabled, saveCelebrationEnabled } from '@/utils/celebrationStorage';
import { loadResetTime, saveResetTime } from '@/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

export default function SettingsScreen() {
  const [showPaywall, setShowPaywall] = useState(false);
  const [celebrationEnabled, setCelebrationEnabled] = useState(true);
  const [resetHour, setResetHour] = useState(0);
  const [resetMinute, setResetMinute] = useState(0);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const enabled = await loadCelebrationEnabled();
    setCelebrationEnabled(enabled);

    const resetTime = await loadResetTime();
    if (resetTime) {
      setResetHour(resetTime.hour);
      setResetMinute(resetTime.minute);
    }
  };

  const handleCelebrationToggle = async (value: boolean) => {
    setCelebrationEnabled(value);
    await saveCelebrationEnabled(value);
  };

  const handleResetTimeChange = async () => {
    await saveResetTime({ hour: resetHour, minute: resetMinute });
    Alert.alert('Success', 'Daily reset time updated');
  };

  const handleResetAllData = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to delete all your data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Success', 'All data has been deleted. Please restart the app.');
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    // TODO: Open privacy policy URL
    Alert.alert('Privacy Policy', 'Opening privacy policy...');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowPaywall(true)}
          >
            <View style={styles.settingLeft}>
              <MaterialIcons name="star" size={24} color={colors.primary} />
              <Text style={styles.settingText}>Manage Subscription</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="celebration" size={24} color={colors.primary} />
              <Text style={styles.settingText}>Daily Completion Celebration</Text>
            </View>
            <Switch
              value={celebrationEnabled}
              onValueChange={handleCelebrationToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={styles.settingColumn}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="schedule" size={24} color={colors.primary} />
              <Text style={styles.settingText}>Daily Reset Time</Text>
            </View>
            <View style={styles.timePickerContainer}>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={resetHour}
                  onValueChange={(value) => setResetHour(value)}
                  style={styles.picker}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <Picker.Item key={i} label={`${i}`.padStart(2, '0')} value={i} />
                  ))}
                </Picker>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={resetMinute}
                  onValueChange={(value) => setResetMinute(value)}
                  style={styles.picker}
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <Picker.Item key={i} label={`${i}`.padStart(2, '0')} value={i} />
                  ))}
                </Picker>
              </View>
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleResetTimeChange}
            >
              <Text style={styles.saveButtonText}>Save Reset Time</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={openPrivacyPolicy}
          >
            <View style={styles.settingLeft}>
              <MaterialIcons name="privacy-tip" size={24} color={colors.primary} />
              <Text style={styles.settingText}>Privacy Policy</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleResetAllData}
          >
            <View style={styles.settingLeft}>
              <MaterialIcons name="delete-forever" size={24} color="#ff4444" />
              <Text style={[styles.settingText, { color: '#ff4444' }]}>Reset All Data</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <PaywallScreen
        visible={showPaywall}
        onDismiss={() => setShowPaywall(false)}
        canDismiss={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingColumn: {
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  pickerWrapper: {
    flex: 1,
    maxWidth: 100,
  },
  picker: {
    height: 120,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginHorizontal: 8,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
