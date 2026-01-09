
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles } from '@/styles/commonStyles';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadCelebrationEnabled, saveCelebrationEnabled } from '@/utils/celebrationStorage';
import { loadResetTime } from '@/utils/storage';
import PaywallScreen from '@/components/PaywallScreen';
import AppLogo from '@/components/AppLogo';

export default function SettingsScreen() {
  const [celebrationEnabled, setCelebrationEnabled] = useState(true);
  const [resetTime, setResetTime] = useState('12:00 AM');
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const celebration = await loadCelebrationEnabled();
    setCelebrationEnabled(celebration);

    const time = await loadResetTime();
    if (time) {
      setResetTime(formatResetTime(time.hour, time.minute));
    }
  };

  const formatResetTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const handleCelebrationToggle = async (value: boolean) => {
    setCelebrationEnabled(value);
    await saveCelebrationEnabled(value);
  };

  const handleSubscription = () => {
    setShowPaywall(true);
  };

  const handleDailyReset = () => {
    Alert.alert(
      'Daily Reset Time',
      `Current reset time: ${resetTime}\n\nThis feature allows you to customize when your daily portions reset.`,
      [{ text: 'OK' }]
    );
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://yourapp.com/privacy');
  };

  const handleResetAppData = () => {
    Alert.alert(
      'Reset App Data',
      'Are you sure you want to reset all app data? This will delete your profile, tracking history, and all settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Success', 'All app data has been reset. Please restart the app.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <AppLogo size={40} />
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.settingsContainer}>
          {/* Subscription */}
          <TouchableOpacity style={styles.settingRow} onPress={handleSubscription}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="credit-card" size={24} color={colors.primary} />
              <Text style={styles.settingLabel}>Subscription</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Celebration */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="celebration" size={24} color={colors.primary} />
              <Text style={styles.settingLabel}>Celebration</Text>
            </View>
            <Switch
              value={celebrationEnabled}
              onValueChange={handleCelebrationToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {/* Daily Reset */}
          <TouchableOpacity style={styles.settingRow} onPress={handleDailyReset}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="access-time" size={24} color={colors.primary} />
              <Text style={styles.settingLabel}>Daily Reset</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Privacy Policy */}
          <TouchableOpacity style={styles.settingRow} onPress={handlePrivacyPolicy}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="shield" size={24} color={colors.primary} />
              <Text style={styles.settingLabel}>Privacy Policy</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Reset App Data */}
          <TouchableOpacity style={styles.settingRow} onPress={handleResetAppData}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="warning" size={24} color={colors.error} />
              <Text style={[styles.settingLabel, { color: colors.error }]}>Reset App Data</Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 12,
  },
  settingsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
});
