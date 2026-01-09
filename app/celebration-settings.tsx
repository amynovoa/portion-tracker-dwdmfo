
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Switch } from 'react-native';
import { loadCelebrationEnabled, saveCelebrationEnabled } from '@/utils/celebrationStorage';
import { colors } from '@/styles/commonStyles';

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    fontSize: 18,
    color: colors.text,
  },
});

export default function CelebrationSettingsScreen() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const celebrationEnabled = await loadCelebrationEnabled();
    setEnabled(celebrationEnabled);
  };

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    await saveCelebrationEnabled(value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Celebration</Text>
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Enable Celebrations</Text>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );
}
