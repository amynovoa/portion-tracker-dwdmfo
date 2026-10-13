import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AdherenceCard from '@/components/AdherenceCard';
import StepsErrorBoundary from '@/components/StepsErrorBoundary';
import { colors } from '@/styles/commonStyles';
import { getTodayString } from '@/utils/dateUtils';
import { loadStepGoal, loadStepsConnected } from '@/utils/stepsStorage';
import { getStepsAvailability, readTodayStepCount } from '@/utils/stepsHealth';

type Props = {
  selectedDate?: string;
};

function StepsTodayCardInner({ selectedDate }: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const isToday = !selectedDate || selectedDate === getTodayString();
  const [connected, setConnected] = useState(false);
  const [goal, setGoal] = useState(8000);
  const [steps, setSteps] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!isToday) {
        setConnected(false);
        setSteps(null);
        return;
      }

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

          const count = await readTodayStepCount();
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
    }, [isToday])
  );

  if (!isToday) return null;

  // Connected: show progress on Exercise (main place Amy wants to see it)
  if (connected) {
    const count = steps ?? 0;
    const percentage = goal > 0 ? Math.max(0, Math.min(100, Math.round((count / goal) * 100))) : 0;
    const locale = i18n.language?.startsWith('es') ? 'es' : 'en';

    return (
      <AdherenceCard
        title={t('steps.today')}
        percentage={percentage}
        subtitle={t('steps.ofGoal', {
          steps: count.toLocaleString(locale),
          goal: goal.toLocaleString(locale),
        })}
      />
    );
  }

  // Not connected: still show under Exercise with a clear CTA into Settings → Steps
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
