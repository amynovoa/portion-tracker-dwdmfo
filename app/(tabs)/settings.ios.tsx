
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { saveResetTime, loadResetTime, ResetTimeConfig } from '@/utils/storage';
import { saveCelebrationEnabled, loadCelebrationEnabled } from '@/utils/celebrationStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [resetTimeEnabled, setResetTimeEnabled] = useState(false);
  const [resetTime, setResetTime] = useState(new Date());
  const [celebrationEnabled, setCelebrationEnabled] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const config = await loadResetTime();
    setResetTimeEnabled(config.enabled);
    const date = new Date();
    date.setHours(config.hour, config.minute, 0, 0);
    setResetTime(date);

    const celebrationSetting = await loadCelebrationEnabled();
    setCelebrationEnabled(celebrationSetting);
  }

  async function handleResetToggle(value: boolean) {
    setResetTimeEnabled(value);
    const config: ResetTimeConfig = {
      hour: resetTime.getHours(),
      minute: resetTime.getMinutes(),
      enabled: value,
    };
    await saveResetTime(config);
  }

  async function handleTimeChange(event: any, selectedDate?: Date) {
    if (selectedDate) {
      setResetTime(selectedDate);
      const config: ResetTimeConfig = {
        hour: selectedDate.getHours(),
        minute: selectedDate.getMinutes(),
        enabled: resetTimeEnabled,
      };
      await saveResetTime(config);
    }
  }

  async function handleCelebrationToggle(value: boolean) {
    setCelebrationEnabled(value);
    await saveCelebrationEnabled(value);
  }

  function handleActivityLevel() {
    router.push('/activity-level');
  }

  function handlePrivacyPolicy() {
    Linking.openURL('https://www.portiontracker.app/privacy');
  }

  function handleResetAppData() {
    Alert.alert(
      'Reset App Data',
      'This will delete all your data including profile, daily tracking, weight entries, and settings. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'All app data has been reset. Please restart the app.');
            } catch (error) {
              console.error('Error resetting app data:', error);
              Alert.alert('Error', 'Failed to reset app data. Please try again.');
            }
          },
        },
      ]
    );
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Preferences Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Preferences</Text>
        
        <GlassView style={styles.section} glassEffectStyle="regular">
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="party.popper.fill" android_material_icon_name="celebration" size={20} color={theme.dark ? '#98989D' : '#666'} />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Daily Celebrations</Text>
            </View>
            <Switch
              value={celebrationEnabled}
              onValueChange={handleCelebrationToggle}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRow} onPress={handleActivityLevel}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="figure.run" android_material_icon_name="directions-run" size={20} color={theme.dark ? '#98989D' : '#666'} />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Activity Level</Text>
            </View>
            <View style={styles.settingRight}>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={16} color={theme.dark ? '#98989D' : '#666'} />
            </View>
          </TouchableOpacity>
        </GlassView>

        {/* Daily Reset Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Daily Reset</Text>
        
        <GlassView style={styles.section} glassEffectStyle="regular">
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="schedule" size={20} color={theme.dark ? '#98989D' : '#666'} />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Custom Reset Time</Text>
            </View>
            <Switch
              value={resetTimeEnabled}
              onValueChange={handleResetToggle}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {resetTimeEnabled && (
            <>
              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <IconSymbol ios_icon_name="clock" android_material_icon_name="access-time" size={20} color={theme.dark ? '#98989D' : '#666'} />
                  <Text style={[styles.settingText, { color: theme.colors.text }]}>Reset Time</Text>
                </View>
                <View style={styles.settingRight}>
                  <Text style={[styles.valueText, { color: theme.dark ? '#98989D' : '#666' }]}>
                    {formatTime(resetTime)}
                  </Text>
                  <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={16} color={theme.dark ? '#98989D' : '#666'} />
                </View>
              </View>
              <DateTimePicker
                value={resetTime}
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={handleTimeChange}
                style={styles.timePicker}
              />
            </>
          )}
        </GlassView>

        {/* About Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>About</Text>
        
        <GlassView style={styles.section} glassEffectStyle="regular">
          <TouchableOpacity style={styles.settingRow} onPress={handlePrivacyPolicy}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="hand.raised.fill" android_material_icon_name="privacy-tip" size={20} color={theme.dark ? '#98989D' : '#666'} />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>Privacy Policy</Text>
            </View>
            <View style={styles.settingRight}>
              <IconSymbol ios_icon_name="arrow.up.right" android_material_icon_name="open-in-new" size={16} color={theme.dark ? '#98989D' : '#666'} />
            </View>
          </TouchableOpacity>
        </GlassView>

        {/* Danger Zone Section */}
        <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>Danger Zone</Text>
        
        <GlassView style={styles.section} glassEffectStyle="regular">
          <TouchableOpacity style={styles.settingRow} onPress={handleResetAppData}>
            <View style={styles.settingLeft}>
              <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={20} color="#FF3B30" />
              <Text style={[styles.settingText, { color: '#FF3B30' }]}>Reset App Data</Text>
            </View>
            <View style={styles.settingRight}>
              <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron-right" size={16} color={theme.dark ? '#98989D' : '#666'} />
            </View>
          </TouchableOpacity>
        </GlassView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingText: {
    fontSize: 16,
  },
  valueText: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 8,
  },
  timePicker: {
    marginTop: 8,
  },
});
