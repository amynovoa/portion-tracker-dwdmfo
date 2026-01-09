
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, Switch, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { loadResetTime, saveResetTime, ResetTimeConfig } from '@/utils/storage';
import { colors, commonStyles } from '@/styles/commonStyles';
import AppLogo from '@/components/AppLogo';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  timePickerContainer: {
    marginTop: 10,
  },
});

export default function SettingsScreen() {
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [resetTime, setResetTime] = useState(new Date());

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const config = await loadResetTime();
    if (config) {
      setUseCustomTime(config.enabled);
      const date = new Date();
      date.setHours(config.hour, config.minute, 0, 0);
      setResetTime(date);
    } else {
      // Default to midnight if no config exists
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      setResetTime(date);
    }
  }

  async function handleToggleCustomTime(value: boolean) {
    setUseCustomTime(value);
    await saveResetTime({
      enabled: value,
      hour: resetTime.getHours(),
      minute: resetTime.getMinutes(),
    });
  }

  async function handleTimeChange(event: any, selectedDate?: Date) {
    if (selectedDate) {
      setResetTime(selectedDate);
      await saveResetTime({
        enabled: useCustomTime,
        hour: selectedDate.getHours(),
        minute: selectedDate.getMinutes(),
      });
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
    <View style={styles.container}>
      <AppLogo />
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Reset</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Custom Reset Time</Text>
            <Switch
              value={useCustomTime}
              onValueChange={handleToggleCustomTime}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          
          <Text style={styles.description}>
            {useCustomTime
              ? `Your daily portions will reset at ${formatTime(resetTime)} each day.`
              : 'Your daily portions will reset at midnight each day.'}
          </Text>

          {useCustomTime && (
            <View style={styles.timePickerContainer}>
              <DateTimePicker
                value={resetTime}
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={handleTimeChange}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
