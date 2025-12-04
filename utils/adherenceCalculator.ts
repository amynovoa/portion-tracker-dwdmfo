
import { DailyPortions, PortionTargets } from '../types';
import { getTodayString, getWeekStart, getMonthStart, formatDate } from './dateUtils';

export function calculateDailyAdherence(
  completed: PortionTargets,
  targets: PortionTargets
): number {
  let totalCompleted = 0;
  let totalTarget = 0;

  Object.keys(targets).forEach((key) => {
    const foodGroup = key as keyof PortionTargets;
    totalCompleted += completed[foodGroup];
    totalTarget += targets[foodGroup];
  });

  if (totalTarget === 0) return 0;
  return Math.round((totalCompleted / totalTarget) * 100);
}

export function calculateWeeklyAdherence(
  dailyRecords: DailyPortions[],
  targets: PortionTargets
): number {
  const today = new Date();
  const weekStart = getWeekStart(today);
  const weekStartStr = formatDate(weekStart);

  const weekRecords = dailyRecords.filter(
    (record) => record.date >= weekStartStr
  );

  if (weekRecords.length === 0) return 0;

  let totalCompleted = 0;
  let totalTarget = 0;

  weekRecords.forEach((record) => {
    Object.keys(targets).forEach((key) => {
      const foodGroup = key as keyof PortionTargets;
      totalCompleted += record.portions[foodGroup];
      totalTarget += targets[foodGroup];
    });
  });

  if (totalTarget === 0) return 0;
  return Math.round((totalCompleted / totalTarget) * 100);
}

export function calculateMonthlyAdherence(
  dailyRecords: DailyPortions[],
  targets: PortionTargets
): number {
  const today = new Date();
  const monthStart = getMonthStart(today);
  const monthStartStr = formatDate(monthStart);

  const monthRecords = dailyRecords.filter(
    (record) => record.date >= monthStartStr
  );

  if (monthRecords.length === 0) return 0;

  let totalCompleted = 0;
  let totalTarget = 0;

  monthRecords.forEach((record) => {
    Object.keys(targets).forEach((key) => {
      const foodGroup = key as keyof PortionTargets;
      totalCompleted += record.portions[foodGroup];
      totalTarget += targets[foodGroup];
    });
  });

  if (totalTarget === 0) return 0;
  return Math.round((totalCompleted / totalTarget) * 100);
}
