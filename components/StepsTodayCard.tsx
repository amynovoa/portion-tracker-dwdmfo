import React from 'react';
import { useTranslation } from 'react-i18next';
import AdherenceCard from '@/components/AdherenceCard';
import { useStepsToday } from '@/hooks/useStepsToday';
import { getTodayString } from '@/utils/dateUtils';

type Props = {
  /** Only show today’s steps when the Exercise day selector is on today. */
  selectedDate?: string;
};

export default function StepsTodayCard({ selectedDate }: Props) {
  const { t, i18n } = useTranslation();
  const isToday = !selectedDate || selectedDate === getTodayString();
  const { connected, goal, steps } = useStepsToday({ enabled: isToday });

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
