import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AdherenceCard from '@/components/AdherenceCard';
import StepsErrorBoundary from '@/components/StepsErrorBoundary';
import { colors } from '@/styles/commonStyles';
import { formatDisplayDate, getTodayString } from '@/utils/dateUtils';
import { loadStepGoal, loadStepsConnected } from '@/utils/stepsStorage';
import { getStepsAvailability, readStepCountForDate } from '@/utils/stepsHealth';

type Props = {
  selectedDate?: string;
};

function StepsTodayCardInner({ selectedDate }: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const dateKey = selectedDate || getTodayString();
  const isToday = dateKey === getTodayString();
  const [connected, setConnected] = useState(false);
  const [goal, setGoal] = useState(8000);
  const [steps, setSteps] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const availability = getStepsAvailability();
          const isConnected = await loadStepsConnected();
          const stepGoal = await loadStepGoal();
          if (!active) return;

          setReady(availability === 'ready');
          setGoal(stepGoal);

          if (!isConnected || availability !== 'ready') {
            setConnected(false);
            setSteps(null);
            return;
          }

          const count = await readStepCountForDate(dateKey);
          if (!active) return;
          setConnected(true);
          setSteps(count);
        } catch (error) {
          console.warn('[steps] StepsTodayCard refresh failed:', error);
          if (!active) return;
          setConnected(false);
          setSteps(null);
          setReady(false);
        }
      })();

      return () => {
        active = false;
      };
    }, [dateKey])
  );

  // Connected: show progress for the selected Exercise date (today or history)
  if (connected) {
    const count = steps ?? 0;
    const percentage = goal > 0 ? Math.max(0, Math.min(100, Math.round((count / goal) * 100))) : 0;
    const locale = i18n.language?.startsWith('es') ? 'es' : 'en';
    const title = isToday
      ? t('steps.today')
      : t('steps.forDate', { date: formatDisplayDate(dateKey, i18n.language) });

    return (
      <AdherenceCard
        title={title}
        percentage={percentage}
        subtitle={t('steps.ofGoal', {
          steps: count.toLocaleString(locale),
          goal: goal.toLocaleString(locale),
        })}
      />
    );
  }

  // Not connected: CTA only on today (past days stay quiet until connected)
  if (!isToday) return null;

  return (
    <TouchableOpacity
      style={styles.ctaCard}
      activeOpacity={0.85}
      onPress={() => router.push('/steps-settings')}
    >
      <Text style={styles.ctaTitle}>{t('steps.exerciseCtaTitle')}</Text>
      <Text style={styles.ctaBody}>
        {ready ? t('steps.exerciseCtaReady') : t('steps.exerciseCtaSetup')}
      </Text>
      <Text style={styles.ctaAction}>{t('steps.exerciseCtaAction')}</Text>
    </TouchableOpacity>
  );
}

export default function StepsTodayCard(props: Props) {
  return (
    <StepsErrorBoundary>
      <StepsTodayCardInner {...props} />
    </StepsErrorBoundary>
  );
}

const styles = StyleSheet.create({
  ctaCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    elevation: 1,
  },
  ctaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  ctaBody: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  ctaAction: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
