import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AdherenceCard from '@/components/AdherenceCard';
import StepsErrorBoundary from '@/components/StepsErrorBoundary';
import { getTodayString } from '@/utils/dateUtils';
import { loadStepGoal, loadStepsConnected } from '@/utils/stepsStorage';
import { getStepsAvailability, readTodayStepCount } from '@/utils/stepsHealth';

type Props = {
  selectedDate?: string;
};

function StepsTodayCardInner({ selectedDate }: Props) {
  const { t, i18n } = useTranslation();
  const isToday = !selectedDate || selectedDate === getTodayString();
  const [connected, setConnected] = useState(false);
  const [goal, setGoal] = useState(8000);
  const [steps, setSteps] = useState<number | null>(null);

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
          const isConnected = await loadStepsConnected();
          if (!active) return;
          if (!isConnected) {
            setConnected(false);
            setSteps(null);
            return;
          }
          // Only touch Health APIs after the user has connected in Settings.
          if (getStepsAvailability() !== 'ready') {
            setConnected(false);
            setSteps(null);
            return;
          }
          const stepGoal = await loadStepGoal();
          const count = await readTodayStepCount();
          if (!active) return;
          setConnected(true);
          setGoal(stepGoal);
          setSteps(count);
        } catch (error) {
          console.warn('[steps] StepsTodayCard refresh failed:', error);
          if (!active) return;
          setConnected(false);
          setSteps(null);
        }
      })();

      return () => {
        active = false;
      };
    }, [isToday])
  );

  if (!isToday || !connected) return null;

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

export default function StepsTodayCard(props: Props) {
  return (
    <StepsErrorBoundary>
      <StepsTodayCardInner {...props} />
    </StepsErrorBoundary>
  );
}
