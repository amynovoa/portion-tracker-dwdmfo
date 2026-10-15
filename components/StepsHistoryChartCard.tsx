import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import StepsChart from '@/components/StepsChart';
import StepsErrorBoundary from '@/components/StepsErrorBoundary';
import { colors } from '@/styles/commonStyles';
import { loadStepGoal, loadStepsConnected } from '@/utils/stepsStorage';
import { getStepsAvailability, readRecentDailySteps } from '@/utils/stepsHealth';

const CHART_DAYS = 14;

function StepsHistoryChartCardInner() {
  const { t } = useTranslation();
  const [connected, setConnected] = useState(false);
  const [goal, setGoal] = useState(8000);
  const [dailyTotals, setDailyTotals] = useState<{ date: string; steps: number }[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const availability = getStepsAvailability();
          const isConnected = await loadStepsConnected();
          const stepGoal = await loadStepGoal();
          if (!active) return;

          setGoal(stepGoal);

          if (!isConnected || availability !== 'ready') {
            setConnected(false);
            setDailyTotals([]);
            return;
          }

          const recent = await readRecentDailySteps(CHART_DAYS);
          if (!active) return;
          // Chart wants oldest → newest
          setConnected(true);
          setDailyTotals(
            [...recent].reverse().map((row) => ({ date: row.date, steps: row.steps }))
          );
        } catch (error) {
          console.warn('[steps] StepsHistoryChartCard refresh failed:', error);
          if (!active) return;
          setConnected(false);
          setDailyTotals([]);
        }
      })();

      return () => {
        active = false;
      };
    }, [])
  );

  if (!connected) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('steps.overTime')}</Text>
      <View style={styles.chartCard}>
        <StepsChart dailyTotals={dailyTotals} goalSteps={goal} />
      </View>
    </View>
  );
}

export default function StepsHistoryChartCard() {
  return (
    <StepsErrorBoundary>
      <StepsHistoryChartCardInner />
    </StepsErrorBoundary>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  chartCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    overflow: 'hidden',
  },
});
