
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 12,
  },
  timeButton: {
    ...buttonStyles.secondary,
    paddingVertical: 12,
  },
  timeButtonText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default function DailyResetScreen() {
  const [resetTime, setResetTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const config = await loadResetTime();
    if (config.enabled) {
      const time = new Date();
      time.setHours(config.hour, config.minute, 0, 0);
      setResetTime(time);
    }
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      setResetTime(selectedDate);
      const config: ResetTimeConfig = {
        enabled: true,
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Reset</Text>
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Reset Time</Text>
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.timeButtonText}>{formatTime(resetTime)}</Text>
        </TouchableOpacity>

        {(showPicker || Platform.OS === 'ios') && (
          <DateTimePicker
            value={resetTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}
      </View>
    </View>
  );
}
