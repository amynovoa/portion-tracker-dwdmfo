
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Switch, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadResetTime, saveResetTime, ResetTimeConfig } from '@/utils/storage';
import { colors } from '@/styles/commonStyles';
import { useTranslation } from 'react-i18next';

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
    paddingTop: 20,
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
    flex: 1,
    flexShrink: 1,
    marginRight: 12,
  },
  pickerContainer: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
  },
  pickerLabel: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    fontWeight: '500',
  },
  currentTimeText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default function DailyResetScreen() {
  const { t, i18n } = useTranslation();
  const [resetTime, setResetTime] = useState(() => {
    const defaultTime = new Date();
    defaultTime.setHours(0, 0, 0, 0);
    return defaultTime;
  });
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
    console.log('iOS Time picker onChange:', { event, selectedDate });
    
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
    const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';
    return date.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('dailyReset.title'),
          headerBackTitle: t('settings.title'),
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('dailyReset.title')}</Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('dailyReset.customResetTime')}</Text>
          <Text style={styles.settingDescription}>
            {t('dailyReset.description')}
          </Text>
          
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{t('dailyReset.enableCustomTime')}</Text>
            <Switch
              value={customResetEnabled}
              onValueChange={handleToggleCustomReset}
              trackColor={{ false: '#2a2a2a', true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {customResetEnabled && (
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>{t('dailyReset.selectResetTime')}</Text>
              <DateTimePicker
                value={resetTime}
                mode="time"
                display="compact"
                onChange={handleTimeChange}
              />
              <Text style={styles.currentTimeText}>
                {t('dailyReset.currentResetTime', { time: formatTime(resetTime) })}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
