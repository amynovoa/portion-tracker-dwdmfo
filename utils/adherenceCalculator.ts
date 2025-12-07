
import { PortionTargets, DailyPortions, DailyPortionsWithServings, FoodGroup } from '../types';
import { getTodayString, getWeekStartDate, getMonthStartDate } from './dateUtils';

// Calculate total portion units from serving entries
function calculateTotalPortionUnits(servings: any[]): number {
  if (!servings || servings.length === 0) return 0;
  return servings.reduce((sum, serving) => sum + (serving.portionUnits || 0), 0);
}

// Calculate adherence for a single day using new serving-based system
export function calculateDailyAdherenceWithServings(
  dailyServings: DailyPortionsWithServings,
  targets: PortionTargets
): number {
  let totalCompleted = 0;
  let totalTarget = 0;

  const foodGroups: FoodGroup[] = [
    'protein',
    'veggies',
    'fruit',
    'wholeGrains',
    'legumes',
    'nutsSeeds',
    'fats',
    'dairy',
    'alcohol',
  ];

  foodGroups.forEach((group) => {
    const target = targets[group];
    totalTarget += target;

    if (group === 'water') {
      // Water is still tracked as simple count
      totalCompleted += Math.min(dailyServings.servings.water || 0, target);
    } else {
      // Calculate total portion units for this food group
      const servingsList = dailyServings.servings[group] || [];
      const portionUnits = calculateTotalPortionUnits(servingsList);
      totalCompleted += Math.min(portionUnits, target);
    }
  });

  // Add water separately
  totalTarget += targets.water;
  totalCompleted += Math.min(dailyServings.servings.water || 0, targets.water);

  if (totalTarget === 0) return 0;
  return Math.round((totalCompleted / totalTarget) * 100);
}

// Legacy: Calculate adherence for a single day (old system)
export function calculateDailyAdherence(
  portions: PortionTargets,
  targets: PortionTargets
): number {
  let totalCompleted = 0;
  let totalTarget = 0;

  const foodGroups: (keyof PortionTargets)[] = [
    'protein',
    'veggies',
    'fruit',
    'wholeGrains',
    'legumes',
    'nutsSeeds',
    'fats',
    'dairy',
    'water',
    'alcohol',
  ];

  foodGroups.forEach((group) => {
    const target = targets[group];
    const completed = portions[group];
    totalTarget += target;
    totalCompleted += Math.min(completed, target);
  });

  if (totalTarget === 0) return 0;
  return Math.round((totalCompleted / totalTarget) * 100);
}

// Calculate weekly adherence using new serving-based system
export function calculateWeeklyAdherenceWithServings(
  allRecords: DailyPortionsWithServings[],
  targets: PortionTargets
): number {
  const weekStart = getWeekStartDate();
  const weekRecords = allRecords.filter((record) => record.date >= weekStart);

  if (weekRecords.length === 0) return 0;

  const totalAdherence = weekRecords.reduce((sum, record) => {
    return sum + calculateDailyAdherenceWithServings(record, targets);
  }, 0);

  return Math.round(totalAdherence / weekRecords.length);
}

// Legacy: Calculate weekly adherence (old system)
export function calculateWeeklyAdherence(
  allRecords: DailyPortions[],
  targets: PortionTargets
): number {
  const weekStart = getWeekStartDate();
  const weekRecords = allRecords.filter((record) => record.date >= weekStart);

  if (weekRecords.length === 0) return 0;

  const totalAdherence = weekRecords.reduce((sum, record) => {
    return sum + calculateDailyAdherence(record.portions, targets);
  }, 0);

  return Math.round(totalAdherence / weekRecords.length);
}

// Calculate monthly adherence using new serving-based system
export function calculateMonthlyAdherenceWithServings(
  allRecords: DailyPortionsWithServings[],
  targets: PortionTargets
): number {
  const monthStart = getMonthStartDate();
  const monthRecords = allRecords.filter((record) => record.date >= monthStart);

  if (monthRecords.length === 0) return 0;

  const totalAdherence = monthRecords.reduce((sum, record) => {
    return sum + calculateDailyAdherenceWithServings(record, targets);
  }, 0);

  return Math.round(totalAdherence / monthRecords.length);
}

// Legacy: Calculate monthly adherence (old system)
export function calculateMonthlyAdherence(
  allRecords: DailyPortions[],
  targets: PortionTargets
): number {
  const monthStart = getMonthStartDate();
  const monthRecords = allRecords.filter((record) => record.date >= monthStart);

  if (monthRecords.length === 0) return 0;

  const totalAdherence = monthRecords.reduce((sum, record) => {
    return sum + calculateDailyAdherence(record.portions, targets);
  }, 0);

  return Math.round(totalAdherence / monthRecords.length);
}
