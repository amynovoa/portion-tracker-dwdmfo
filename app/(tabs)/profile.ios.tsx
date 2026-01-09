
import React, { useState } from 'react';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { loadProfile, saveProfile, loadResetTime, saveResetTime } from '@/utils/storage';
import { loadCelebrationEnabled, saveCelebrationEnabled } from '@/utils/celebrationStorage';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Alert, Switch } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PaywallScreen from '@/components/PaywallScreen';
import { Picker } from '@react-native-picker/picker';

export default function SettingsScreen() {
  const router = useRouter();
  const [celebrationEnabled, setCelebrationEnabled] = useState(true);
  const [resetHour, setResetHour] = useState(0);
  const [paywallVisible, setPaywallVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    const enabled = await loadCelebrationEnabled();
    setCelebrationEnabled(enabled);

    const resetConfig = await loadResetTime();
    if (resetConfig) {
      setResetHour(resetConfig.hour);
    }
  };

  const handleCelebrationToggle = async (value: boolean) => {
    setCelebrationEnabled(value);
    await saveCelebrationEnabled(value);
  };

  const handleResetHourChange = async (hour: number) => {
    setResetHour(hour);
    await saveResetTime({ hour, minute: 0 });
  };

  const handleResetAppData = () => {
    Alert.alert(
      'Reset App Data',
      'Are you sure you want to reset all app data? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/welcome');
          },
        },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy content will be displayed here.');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Settings</Text>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setPaywallVisible(true)}
          >
            <Text style={styles.settingLabel}>Subscriptions</Text>
            <Text style={styles.settingValue}>›</Text>
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Celebration</Text>
            <Switch
              value={celebrationEnabled}
              onValueChange={handleCelebrationToggle}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Daily Reset</Text>
            <Picker
              selectedValue={resetHour}
              onValueChange={handleResetHourChange}
              style={styles.picker}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <Picker.Item
                  key={i}
                  label={`${i.toString().padStart(2, '0')}:00`}
                  value={i}
                />
              ))}
            </Picker>
          </View>

          <TouchableOpacity style={styles.settingRow} onPress={handlePrivacyPolicy}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Text style={styles.settingValue}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={handleResetAppData}>
            <Text style={[styles.settingLabel, styles.dangerText]}>Reset App Data</Text>
            <Text style={styles.settingValue}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <PaywallScreen
        visible={paywallVisible}
        onDismiss={() => setPaywallVisible(false)}
        canDismiss={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
  },
  settingValue: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  dangerText: {
    color: '#FF3B30',
  },
  picker: {
    width: 120,
  },
});
