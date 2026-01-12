
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, Switch, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { loadResetTime, saveResetTime, ResetTimeConfig } from '@/utils/storage';
import { colors, buttonStyles } from '@/styles/commonStyles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
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
    paddingVertical: 16,
    marginTop: 8,
    backgroundColor: colors.primary,
  },
  timeButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  timeButtonSubtext: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default function DailyResetScreen() {
  const [resetTime, setResetTime] = useState(() => {
    const defaultTime = new Date();
    defaultTime.setHours(0, 0, 0, 0);
    return defaultTime;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [customResetEnabled, setCustomResetEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const config = await loadResetTime();
      console.log('Loaded reset time config:', config);
      setCustomResetEnabled(config.enabled);
      
      const time = new Date();
      time.setHours(config.hour, config.minute, 0, 0);
      setResetTime(time);
      console.log('Set reset time to:', time.toLocaleTimeString());
    } catch (error) {
      console.error('Error loading reset time:', error);
    }
  };

  const handleToggleCustomReset = async (value: boolean) => {
    console.log('Toggle custom reset:', value);
    setCustomResetEnabled(value);
    const config: ResetTimeConfig = {
      enabled: value,
      hour: resetTime.getHours(),
      minute: resetTime.getMinutes(),
    };
    await saveResetTime(config);
    console.log('Saved reset time config:', config);
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    console.log('Android Time picker onChange:', { event, selectedDate });
    
    // On Android, the picker is a modal dialog, so we always hide it after interaction
    setShowPicker(false);

    // If user selected a time (didn't cancel)
    if (selectedDate) {
      console.log('New time selected:', selectedDate.toLocaleTimeString());
      setResetTime(selectedDate);
      const config: ResetTimeConfig = {
        enabled: customResetEnabled,
        hour: selectedDate.getHours(),
        minute: selectedDate.getMinutes(),
      };
      await saveResetTime(config);
      console.log('Saved new time:', config);
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
    console.log('Time button pressed, showing Android time picker');
    setShowPicker(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Reset</Text>
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Custom Reset Time</Text>
        <Text style={styles.settingDescription}>
          By default, your daily portions reset at midnight (12:00 AM). Enable this to choose a custom reset time.
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
              <Text style={styles.timeButtonSubtext}>Tap to change time</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {showPicker && (
        <DateTimePicker
          value={resetTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </ScrollView>
  );
}
