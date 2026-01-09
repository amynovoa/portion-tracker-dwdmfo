
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { saveResetTime, loadResetTime, ResetTimeConfig } from '@/utils/storage';

export default function SettingsScreen() {
  const theme = useTheme();
  const [resetTimeEnabled, setResetTimeEnabled] = useState(false);
  const [resetTime, setResetTime] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const config = await loadResetTime();
    setResetTimeEnabled(config.enabled);
    const date = new Date();
    date.setHours(config.hour, config.minute, 0, 0);
    setResetTime(date);
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
