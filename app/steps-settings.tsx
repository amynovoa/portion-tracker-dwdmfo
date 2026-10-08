import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { useStepsToday } from '@/hooks/useStepsToday';
import {
  DEFAULT_STEP_GOAL,
  MAX_STEP_GOAL,
  MIN_STEP_GOAL,
  STEP_GOAL_STEP,
  saveStepGoal,
  saveStepsConnected,
} from '@/utils/stepsStorage';
import {
  getStepsAvailability,
  openHealthConnectInstall,
  readTodayStepCount,
  requestStepsAccess,
  revokeStepsAccess,
} from '@/utils/stepsHealth';

export default function StepsSettingsScreen() {
  const { t, i18n } = useTranslation();
  const { connected, goal, steps, status, refresh } = useStepsToday();
  const [localGoal, setLocalGoal] = useState(DEFAULT_STEP_GOAL);
  const [busy, setBusy] = useState(false);
  const alertedRef = useRef<string | null>(null);
  const availability = getStepsAvailability();

  // Keep local goal in sync with storage after refresh
  useEffect(() => {
    setLocalGoal(goal);
  }, [goal]);

  // One-time guidance when connected but Health cannot serve steps
  useEffect(() => {
    if (!connected) {
      alertedRef.current = null;
      return;
    }
    if (status === 'unavailable' && alertedRef.current !== 'unavailable') {
      alertedRef.current = 'unavailable';
      if (Platform.OS === 'android') {
        Alert.alert(t('steps.title'), t('steps.unavailable'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('steps.installHealthConnect'), onPress: () => openHealthConnectInstall() },
        ]);
      } else {
        Alert.alert(t('steps.title'), t('steps.unavailable'));
      }
    }
    if (status === 'read_failed' && alertedRef.current !== 'read_failed') {
      alertedRef.current = 'read_failed';
      Alert.alert(t('steps.title'), t('steps.readFailed'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('steps.openSettings'), onPress: () => Linking.openSettings() },
        {
          text: t('steps.disconnect'),
          style: 'destructive',
          onPress: async () => {
            await revokeStepsAccess();
            await saveStepsConnected(false);
            await refresh();
          },
        },
      ]);
    }
  }, [connected, status, t, refresh]);

  const handleToggle = async (value: boolean) => {
    if (busy) return;
    if (!value) {
      setBusy(true);
      await revokeStepsAccess();
      await saveStepsConnected(false);
      await refresh();
      setBusy(false);
      return;
    }

    if (availability !== 'ready') {
      if (Platform.OS === 'android') {
        Alert.alert(t('steps.title'), t('steps.unavailable'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('steps.installHealthConnect'), onPress: () => openHealthConnectInstall() },
        ]);
      } else {
        Alert.alert(t('steps.title'), t('steps.unavailable'));
      }
      return;
    }

    setBusy(true);
    try {
      const granted = await requestStepsAccess();
      if (!granted) {
        Alert.alert(t('steps.title'), t('steps.permissionDenied'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('steps.openSettings'), onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      await saveStepsConnected(true);
      const count = await readTodayStepCount();
      if (count === null) {
        Alert.alert(t('steps.title'), t('steps.readFailed'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('steps.openSettings'), onPress: () => Linking.openSettings() },
        ]);
      }
      await refresh();
    } catch (error) {
      console.error('[steps] connect failed:', error);
      Alert.alert(t('common.error'), t('steps.connectError'));
    } finally {
      setBusy(false);
    }
  };

  const adjustGoal = useCallback(
    async (delta: number) => {
      const next = Math.min(MAX_STEP_GOAL, Math.max(MIN_STEP_GOAL, localGoal + delta));
      setLocalGoal(next);
      await saveStepGoal(next);
      await refresh();
    },
    [localGoal, refresh]
  );

  const locale = i18n.language?.startsWith('es') ? 'es' : 'en';
  const goalLabel = localGoal.toLocaleString(locale);
  const sourceLabel = Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect';
  const todaySteps = steps;

  let statusDescription = t('steps.unavailable');
  if (availability === 'ready') {
    statusDescription = t('steps.connectHelp', { source: sourceLabel });
  }
  if (connected && status === 'read_failed') {
    statusDescription = t('steps.readFailed');
  } else if (connected && status === 'unavailable') {
    statusDescription = t('steps.unavailable');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('steps.title'),
          headerBackTitle: t('settings.title'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🚶 {t('steps.title')}</Text>
          <Text style={styles.headerDescription}>{t('steps.headerDescription')}</Text>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.settingLabel}>
                {connected ? t('steps.connected') : t('steps.notConnected')}
              </Text>
              <Text style={styles.settingDescription}>{statusDescription}</Text>
            </View>
            {busy ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Switch
                value={connected}
                onValueChange={handleToggle}
                disabled={availability !== 'ready' && !connected}
                trackColor={{ false: colors.textSecondary, true: colors.primary }}
                thumbColor="#fff"
              />
            )}
          </View>
          {availability !== 'ready' && Platform.OS === 'android' && (
            <TouchableOpacity style={styles.linkButton} onPress={() => openHealthConnectInstall()}>
              <Text style={styles.linkButtonText}>{t('steps.installHealthConnect')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.settingCard}>
          <Text style={styles.settingLabel}>{t('steps.goal')}</Text>
          <View style={styles.goalRow}>
            <TouchableOpacity style={styles.goalButton} onPress={() => adjustGoal(-STEP_GOAL_STEP)}>
              <Text style={styles.goalButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.goalValue}>{goalLabel}</Text>
            <TouchableOpacity style={styles.goalButton} onPress={() => adjustGoal(STEP_GOAL_STEP)}>
              <Text style={styles.goalButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {connected && todaySteps !== null && (
          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>{t('steps.today')}</Text>
            <Text style={styles.todayValue}>{todaySteps.toLocaleString(locale)}</Text>
          </View>
        )}

        <Text style={styles.privacyNote}>{t('steps.privacyNote')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  headerDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  settingCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  linkButton: {
    marginTop: 14,
  },
  linkButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
  },
  goalButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalButtonText: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: '600',
    lineHeight: 28,
  },
  goalValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    minWidth: 100,
    textAlign: 'center',
  },
  todayValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 8,
  },
  privacyNote: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },
});
