
import { Sex, Goal, PortionTargets, SizeCategory, ActivityLevel } from '../types';

export function classifySize(sex: Sex, weight: number): SizeCategory {
  if (sex === 'female') {
    if (weight < 150) return 'small';
    if (weight < 190) return 'medium';
    return 'large';
  } else {
    // male or prefer-not-to-say
    if (weight < 170) return 'small';
    if (weight < 210) return 'medium';
    return 'large';
  }
}

export function getBaselinePortions(sex: Sex, goal: Goal): PortionTargets {
  // Start with baseline portions for a medium-sized person
  const baseline: PortionTargets = {
    protein: 3,
    veggies: 4,
    fruits: 2,
    wholeGrains: 2,
    nutsSeeds: 2,
    fats: 2,
    water: 8,
  };

  return baseline;
}

export function applySizeAdjustment(portions: PortionTargets, size: SizeCategory): PortionTargets {
  const adjusted = { ...portions };

  if (size === 'small') {
    adjusted.protein = Math.max(2, adjusted.protein - 1);
    adjusted.veggies = Math.max(3, adjusted.veggies - 1);
    adjusted.fruits = Math.max(2, adjusted.fruits);
    adjusted.wholeGrains = Math.max(1, adjusted.wholeGrains - 1);
    adjusted.nutsSeeds = Math.max(1, adjusted.nutsSeeds - 1);
    adjusted.fats = Math.max(1, adjusted.fats - 1);
    adjusted.water = Math.max(7, adjusted.water - 1);
  } else if (size === 'large') {
    adjusted.protein = Math.min(5, adjusted.protein + 1);
    adjusted.veggies = Math.min(6, adjusted.veggies + 1);
    adjusted.fruits = Math.min(4, adjusted.fruits + 1);
    adjusted.wholeGrains = Math.min(4, adjusted.wholeGrains + 1);
    adjusted.nutsSeeds = Math.min(3, adjusted.nutsSeeds + 1);
    adjusted.fats = Math.min(3, adjusted.fats + 1);
    adjusted.water = Math.min(12, adjusted.water + 2);
  }

  return adjusted;
}

export function applyActivityAdjustment(
  portions: PortionTargets,
  activityLevel: ActivityLevel
): PortionTargets {
  const adjusted = { ...portions };

  switch (activityLevel) {
    case 'sedentary':
      // No adjustment needed
      break;
    case 'light':
      adjusted.protein = Math.min(6, adjusted.protein + 1);
      adjusted.wholeGrains = Math.min(4, adjusted.wholeGrains + 1);
      break;
    case 'moderate':
      adjusted.protein = Math.min(6, adjusted.protein + 1);
      adjusted.wholeGrains = Math.min(5, adjusted.wholeGrains + 1);
      break;
    case 'active':
      adjusted.protein = Math.min(6, adjusted.protein + 2);
      adjusted.wholeGrains = Math.min(6, adjusted.wholeGrains + 2);
      break;
    case 'veryActive':
      adjusted.protein = Math.min(7, adjusted.protein + 2);
      adjusted.wholeGrains = Math.min(7, adjusted.wholeGrains + 3);
      adjusted.nutsSeeds = Math.min(4, adjusted.nutsSeeds + 1);
      break;
  }

  return adjusted;
}

export function calculateRecommendedTargets(
  sex: Sex,
  weight: number,
  goal: Goal,
  activityLevel: ActivityLevel = 'sedentary'
): PortionTargets {
  const size = classifySize(sex, weight);
  let portions = getBaselinePortions(sex, goal);

  // Apply size adjustment
  portions = applySizeAdjustment(portions, size);

  // Apply goal-specific adjustments
  if (goal === 'lose') {
    portions.wholeGrains = Math.max(0, portions.wholeGrains - 1);
    portions.fats = Math.max(0, portions.fats - 1);
    portions.veggies = Math.min(6, portions.veggies + 1);
  } else if (goal === 'build') {
    portions.protein = Math.min(6, portions.protein + 1);
    portions.nutsSeeds = Math.min(4, portions.nutsSeeds + 1);
    portions.fats = Math.min(4, portions.fats + 1);
  }

  // Apply activity level adjustment
  portions = applyActivityAdjustment(portions, activityLevel);

  return portions;
}

export function shouldShowWeightLossGuardrail(goal: Goal, activityLevel: ActivityLevel): boolean {
  return goal === 'lose' && activityLevel === 'sedentary';
}

export function getWeightLossGuardrailMessage(): string {
  return `For sustainable weight loss, we recommend adding some physical activity to your routine. Even light movement (like walking) can make a big difference in your results and overall health.

Would you like to update your activity level?`;
}
