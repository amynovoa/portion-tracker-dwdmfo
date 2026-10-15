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
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import StepsErrorBoundary from '@/components/StepsErrorBoundary';
import {
  DEFAULT_STEP_GOAL,
  MAX_STEP_GOAL,
  MIN_STEP_GOAL,
  STEP_GOAL_STEP,
  loadStepGoal,
  loadStepsConnected,
  saveStepGoal,
  saveStepsConnected,
} from '@/utils/stepsStorage';
import { formatDisplayDate } from '@/utils/dateUtils';
import {
  getStepsAvailability,
  openHealthConnectInstall,
  readRecentDailySteps,
  readTodayStepCount,
  requestStepsAccess,
  revokeStepsAccess,
  type DailyStepCount,
  type StepsAvailability,
} from '@/utils/stepsHealth';

function StepsSettingsContent() {
  const { t, i18n } = useTranslation();
  const [connected, setConnected] = useState(false);
  const [localGoal, setLocalGoal] = useState(DEFAULT_STEP_GOAL);
  const [todaySteps, setTodaySteps] = useState<number | null>(null);
  const [history, setHistory] = useState<DailyStepCount[]>([]);
  const [busy, setBusy] = useState(false);
  const [availability, setAvailability] = useState<StepsAvailability>('unavailable');
  const [checking, setChecking] = useState(true);
  const alertedRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const isConnected = await loadStepsConnected();
      const stepGoal = await loadStepGoal();
      setConnected(isConnected);
      setLocalGoal(stepGoal);

      const avail = getStepsAvailability();
      setAvailability(avail);

      if (!isConnected) {
        setTodaySteps(null);
        setHistory([]);
        return;
      }
      if (avail !== 'ready') {
        setTodaySteps(null);
        setHistory([]);
        return;
      }
      const [count, recent] = await Promise.all([
        readTodayStepCount(),
        readRecentDailySteps(14),
      ]);
      setTodaySteps(count);
      setHistory(recent);
    } catch (error) {
      console.error('[steps] settings refresh failed:', error);
      setAvailability('unavailable');
      setTodaySteps(null);
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await refresh();
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  useEffect(() => {
    if (!connected || checking) {
      alertedRef.current = null;
      return;
    }
    if (availability === 'unavailable' && alertedRef.current !== 'unavailable') {
      alertedRef.current = 'unavailable';
      const message =
        Platform.OS === 'ios' ? t('steps.unavailableIos') : t('steps.unavailableAndroid');
      if (Platform.OS === 'android') {
        Alert.alert(t('steps.title'), message, [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('steps.installHealthConnect'), onPress: () => openHealthConnectInstall() },
        ]);
      } else {
        Alert.alert(t('steps.title'), message, [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('steps.openSettings'), onPress: () => Linking.openSettings() },
        ]);
      }
    }
  }, [connected, availability, checking, t]);

  const handleToggle = async (value: boolean) => {
    if (busy || checking) return;

    if (!value) {
      setBusy(true);
      try {
        await revokeStepsAccess();
        await saveStepsConnected(false);
        setConnected(false);
        setTodaySteps(null);
        setHistory([]);
      } catch (error) {
        console.error('[steps] disconnect failed:', error);
      } finally {
        setBusy(false);
      }
      return;
    }

    const avail = getStepsAvailability();
    setAvailability(avail);
    if (avail !== 'ready') {
      const message =
        avail === 'missing_module'
          ? Platform.OS === 'ios'
            ? t('steps.missingModuleIos')
            : t('steps.missingModuleAndroid')
          : Platform.OS === 'ios'
            ? t('steps.unavailableIos')
            : t('steps.unavailableAndroid');
      if (Platform.OS === 'android' && avail !== 'missing_module') {
        Alert.alert(t('steps.title'), message, [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('steps.installHealthConnect'), onPress: () => openHealthConnectInstall() },
        ]);
      } else {
        Alert.alert(t('steps.title'), message, [
          { text: t('common.cancel'), style: 'cancel' },
          ...(avail === 'missing_module'
            ? []
            : [{ text: t('steps.openSettings'), onPress: () => Linking.openSettings() }]),
        ]);
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
      setConnected(true);
      const [count, recent] = await Promise.all([
        readTodayStepCount(),
        readRecentDailySteps(14),
      ]);
      setTodaySteps(count);
      setHistory(recent);
      if (count === null) {
        Alert.alert(t('steps.title'), t('steps.readFailed'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('steps.openSettings'), onPress: () => Linking.openSettings() },
        ]);
      }
    } catch (error) {
      console.error('[steps] connect failed:', error);
      Alert.alert(t('common.error'), t('steps.connectError'));
      try {
        await saveStepsConnected(false);
        setConnected(false);
      } catch {
        // ignore
      }
    } finally {
      setBusy(false);
    }
  };

  const adjustGoal = useCallback(async (delta: number) => {
    try {
      const next = Math.min(MAX_STEP_GOAL, Math.max(MIN_STEP_GOAL, localGoal + delta));
      setLocalGoal(next);
      await saveStepGoal(next);
    } catch (error) {
      console.error('[steps] save goal failed:', error);
    }
  }, [localGoal]);

  const locale = i18n.language?.startsWith('es') ? 'es' : 'en';
  const goalLabel = localGoal.toLocaleString(locale);
  const sourceLabel = Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect';
  const unavailableMessage =
    availability === 'missing_module'
      ? Platform.OS === 'ios'
        ? t('steps.missingModuleIos')
        : t('steps.missingModuleAndroid')
      : Platform.OS === 'ios'
        ? t('steps.unavailableIos')
        : t('steps.unavailableAndroid');

  let statusDescription = unavailableMessage;
  if (checking) {
    statusDescription = t('common.loading');
  } else if (availability === 'ready') {
    statusDescription = t('steps.connectHelp', { source: sourceLabel });
  }

  const switchDisabled = checking || busy || (availability !== 'ready' && !connected);

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

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('steps.title')}</Text>
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
            {busy || checking ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Switch
                value={connected}
                onValueChange={handleToggle}
                disabled={switchDisabled}
                trackColor={{ false: colors.textSecondary, true: colors.primary }}
                thumbColor="#fff"
              />
            )}
          </View>
          {!checking && availability !== 'ready' && Platform.OS === 'android' && (
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

        {connected && history.length > 0 && (
          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>{t('steps.history')}</Text>
            {history.map((row, index) => (
              <View
                key={row.date}
                style={[styles.historyRow, index === 0 && styles.historyRowFirst]}
              >
                <Text style={styles.historyDate}>
                  {formatDisplayDate(row.date, i18n.language)}
                </Text>
                <Text style={styles.historySteps}>
                  {row.steps.toLocaleString(locale)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function StepsSettingsScreen() {
  return (
    <StepsErrorBoundary
      title="Steps unavailable"
      message="Something went wrong opening Steps. Go back to Settings and try again. The rest of the app should still work."
    >
      <StepsSettingsContent />
    </StepsErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
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
  },
  goalButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
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
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  historyRowFirst: {
    borderTopWidth: 0,
    marginTop: 8,
    paddingTop: 8,
  },
  historyDate: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  historySteps: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});
