
import { PortionTargets, DailyPortions } from '../types';
import { getTodayString, getWeekStartDate, getMonthStartDate } from './dateUtils';

export function calculateDailyAdherence(
  completed: PortionTargets,
  targets: PortionTargets
): number {
  let totalTarget = 0;
  let totalCompleted = 0;

  // Calculate adherence based on target portions
  // If user completes more than target, count it as 100% for that food group
  Object.keys(targets).forEach((key) => {
    const foodGroup = key as keyof PortionTargets;
    const target = targets[foodGroup];
    const done = completed[foodGroup];

    totalTarget += target;
    // Cap completed at target for adherence calculation
    totalCompleted += Math.min(done, target);
  });

  if (totalTarget === 0) return 0;
  return Math.round((totalCompleted / totalTarget) * 100);
}

export function calculateWeeklyAdherence(
  allRecords: DailyPortions[],
  targets: PortionTargets
): number {
  const weekStart = getWeekStartDate();
  const weekRecords = allRecords.filter((record) => record.date >= weekStart);

  if (weekRecords.length === 0) return 0;

  let totalTarget = 0;
  let totalCompleted = 0;

  weekRecords.forEach((record) => {
    Object.keys(targets).forEach((key) => {
      const foodGroup = key as keyof PortionTargets;
      const target = targets[foodGroup];
      const done = record.portions[foodGroup];

      totalTarget += target;
      // Cap completed at target for adherence calculation
      totalCompleted += Math.min(done, target);
    });
  });

  if (totalTarget === 0) return 0;
  return Math.round((totalCompleted / totalTarget) * 100);
}

export function calculateMonthlyAdherence(
  allRecords: DailyPortions[],
  targets: PortionTargets
): number {
  const monthStart = getMonthStartDate();
  const monthRecords = allRecords.filter((record) => record.date >= monthStart);

  if (monthRecords.length === 0) return 0;

  let totalTarget = 0;
  let totalCompleted = 0;

  monthRecords.forEach((record) => {
    Object.keys(targets).forEach((key) => {
      const foodGroup = key as keyof PortionTargets;
      const target = targets[foodGroup];
      const done = record.portions[foodGroup];

      totalTarget += target;
      // Cap completed at target for adherence calculation
      totalCompleted += Math.min(done, target);
    });
  });

  if (totalTarget === 0) return 0;
  return Math.round((totalCompleted / totalTarget) * 100);
}
