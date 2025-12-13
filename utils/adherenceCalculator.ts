
import { PortionTargets, DailyPortions, FoodGroup } from '../types';
import { getTodayString, getWeekStartDate, getMonthStartDate, formatDate } from './dateUtils';

// Calculate adherence for a single day
export function calculateDailyAdherence(
  portions: PortionTargets,
  targets: PortionTargets
): number {
  try {
    // Validate inputs
    if (!portions || !targets || typeof portions !== 'object' || typeof targets !== 'object') {
      console.log('Daily adherence: Invalid input data', { portions, targets });
      return 0;
    }

    let totalCompleted = 0;
    let totalTarget = 0;

    const foodGroups: (keyof PortionTargets)[] = [
      'protein',
      'veggies',
      'fruit',
      'healthyCarbs',
      'fats',
      'nuts',
      'alcohol',
    ];

    foodGroups.forEach((group) => {
      const target = targets[group] || 0;
      const completed = portions[group] || 0;
      
      // Validate that values are numbers
      if (typeof target === 'number' && typeof completed === 'number' && !isNaN(target) && !isNaN(completed)) {
        totalTarget += target;
        totalCompleted += Math.min(completed, target);
      }
    });

    // Guard against division by zero
    if (totalTarget === 0 || isNaN(totalTarget) || isNaN(totalCompleted)) {
      console.log('Daily adherence: Invalid totals', { totalTarget, totalCompleted });
      return 0;
    }

    const percentage = Math.round((totalCompleted / totalTarget) * 100);
    console.log('Daily adherence calculated:', { totalCompleted, totalTarget, percentage });
    return percentage;
  } catch (error) {
    console.error('Error in calculateDailyAdherence:', error);
    return 0;
  }
}

// Calculate weekly adherence
export function calculateWeeklyAdherence(
  allRecords: DailyPortions[],
  targets: PortionTargets
): number {
  try {
    // Validate inputs
    if (!Array.isArray(allRecords) || !targets || typeof targets !== 'object') {
      console.log('Weekly adherence: Invalid input data');
      return 0;
    }

    const weekStart = getWeekStartDate();
    console.log('Week start date:', weekStart);
    
    // Filter records for this week
    const weekRecords = allRecords.filter((record) => {
      if (!record || !record.date || typeof record.date !== 'string') {
        console.log('Invalid record found:', record);
        return false;
      }
      return record.date >= weekStart;
    });

    console.log('Week records found:', weekRecords.length);

    if (weekRecords.length === 0) {
      console.log('No records for this week');
      return 0;
    }

    let totalAdherence = 0;
    let validRecords = 0;

    weekRecords.forEach((record) => {
      if (record && record.portions && targets) {
        const adherence = calculateDailyAdherence(record.portions, targets);
        if (!isNaN(adherence) && isFinite(adherence)) {
          totalAdherence += adherence;
          validRecords++;
        }
      }
    });

    if (validRecords === 0) {
      console.log('No valid records for weekly calculation');
      return 0;
    }

    const weeklyPercentage = Math.round(totalAdherence / validRecords);
    console.log('Weekly adherence:', { totalAdherence, validRecords, weeklyPercentage });
    return weeklyPercentage;
  } catch (error) {
    console.error('Error calculating weekly adherence:', error);
    return 0;
  }
}

// Calculate monthly adherence
export function calculateMonthlyAdherence(
  allRecords: DailyPortions[],
  targets: PortionTargets
): number {
  try {
    // Validate inputs
    if (!Array.isArray(allRecords) || !targets || typeof targets !== 'object') {
      console.log('Monthly adherence: Invalid input data');
      return 0;
    }

    const monthStart = getMonthStartDate();
    console.log('Month start date:', monthStart);
    
    // Filter records for this month
    const monthRecords = allRecords.filter((record) => {
      if (!record || !record.date || typeof record.date !== 'string') {
        console.log('Invalid record found:', record);
        return false;
      }
      return record.date >= monthStart;
    });

    console.log('Month records found:', monthRecords.length);

    if (monthRecords.length === 0) {
      console.log('No records for this month');
      return 0;
    }

    let totalAdherence = 0;
    let validRecords = 0;

    monthRecords.forEach((record) => {
      if (record && record.portions && targets) {
        const adherence = calculateDailyAdherence(record.portions, targets);
        if (!isNaN(adherence) && isFinite(adherence)) {
          totalAdherence += adherence;
          validRecords++;
        }
      }
    });

    if (validRecords === 0) {
      console.log('No valid records for monthly calculation');
      return 0;
    }

    const monthlyPercentage = Math.round(totalAdherence / validRecords);
    console.log('Monthly adherence:', { totalAdherence, validRecords, monthlyPercentage });
    return monthlyPercentage;
  } catch (error) {
    console.error('Error calculating monthly adherence:', error);
    return 0;
  }
}
