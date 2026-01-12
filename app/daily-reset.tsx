
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { loadResetTime, saveResetTime, ResetTimeConfig } from '@/utils/storage';
import { colors, buttonStyles } from '@/styles/commonStyles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  settingRow: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  settingLabel: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 12,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 16,
    color: colors.text,
  },
  timeButton: {
    ...buttonStyles.secondary,
    paddingVertical: 12,
    marginTop: 8,
  },
  timeButtonText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  pickerContainer: {
    marginTop: 16,
  },
});

export default function DailyResetScreen() {
  const [resetTime, setResetTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [customResetEnabled, setCustomResetEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const config = await loadResetTime();
    setCustomResetEnabled(config.enabled);
    if (config.enabled) {
      const time = new Date();
      time.setHours(config.hour, config.minute, 0, 0);
      setResetTime(time);
    }
  };

  const handleToggleCustomReset = async (value: boolean) => {
    setCustomResetEnabled(value);
    const config: ResetTimeConfig = {
      enabled: value,
      hour: resetTime.getHours(),
      minute: resetTime.getMinutes(),
    };
    await saveResetTime(config);
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    // On Android, hide the picker after selection
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    // If user selected a time (didn't cancel)
    if (selectedDate) {
      setResetTime(selectedDate);
      const config: ResetTimeConfig = {
        enabled: customResetEnabled,
        hour: selectedDate.getHours(),
        minute: selectedDate.getMinutes(),
      };
      await saveResetTime(config);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleTimeButtonPress = () => {
    if (customResetEnabled) {
      setShowPicker(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Reset</Text>
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Custom Reset Time</Text>
        <Text style={styles.settingDescription}>
          By default, your daily portions reset at midnight. Enable this to choose a custom reset time.
        </Text>
        
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Enable Custom Time</Text>
          <Switch
            value={customResetEnabled}
            onValueChange={handleToggleCustomReset}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {customResetEnabled && (
          <>
            <Text style={styles.settingLabel}>Reset Time</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={handleTimeButtonPress}
            >
              <Text style={styles.timeButtonText}>{formatTime(resetTime)}</Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={resetTime}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                />
              </View>
            )}

            {Platform.OS === 'android' && showPicker && (
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
    </View>
  );
}
