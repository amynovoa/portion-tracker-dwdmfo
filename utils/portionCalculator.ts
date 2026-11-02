import { Sex, Goal, PortionTargets, SizeCategory, ActivityLevel } from '../types';
import { LBS_PER_KG, type WeightUnit } from './weightUnit';

export type CalculateTargetsOptions = {
  /** Unit of the `weight` argument. Cutoffs are always applied in pounds. */
  weightUnit?: WeightUnit;
  /** Daily alcohol servings (0–n). Drives grain/fat reductions after goal + activity. */
  alcoholServings?: number;
};

/** Convert a weight in the user's unit to pounds for size cutoffs. */
export function weightInPounds(weight: number, weightUnit: WeightUnit = 'lbs'): number {
  if (!Number.isFinite(weight)) return 0;
  return weightUnit === 'kg' ? weight * LBS_PER_KG : weight;
}

/**
 * Size cutoffs are defined in pounds.
 * Callers must pass pounds (use `weightInPounds` when the stored unit may be kg).
 */
export function classifySize(sex: Sex, weightPounds: number): SizeCategory {
  if (sex === 'female') {
    if (weightPounds < 150) return 'small';
    if (weightPounds < 190) return 'medium';
    return 'large';
  }
  // male or prefer-not-to-say
  if (weightPounds < 170) return 'small';
  if (weightPounds < 210) return 'medium';
  return 'large';
}

export function getBaselinePortions(_sex: Sex, _goal: Goal): PortionTargets {
  return {
    protein: 3,
    veggies: 4,
    fruits: 2,
    wholeGrains: 2,
    nutsSeeds: 1,
    fats: 2,
    water: 8,
    exercise: 3,
    alcohol: 2,
  };
}

export function applySizeAdjustment(portions: PortionTargets, size: SizeCategory): PortionTargets {
  const adjusted = { ...portions };

  if (size === 'small') {
    adjusted.protein = Math.max(2, adjusted.protein - 1);
    adjusted.veggies = Math.max(3, adjusted.veggies - 1);
    adjusted.fruits = Math.max(2, adjusted.fruits);
    adjusted.wholeGrains = Math.max(1, adjusted.wholeGrains - 1);
    adjusted.nutsSeeds = 1;
    adjusted.fats = Math.max(1, adjusted.fats - 1);
    adjusted.water = Math.max(7, adjusted.water - 1);
    adjusted.exercise = Math.max(2, adjusted.exercise - 1);
  } else if (size === 'large') {
    adjusted.protein = Math.min(5, adjusted.protein + 1);
    adjusted.veggies = Math.min(6, adjusted.veggies + 1);
    adjusted.fruits = Math.min(4, adjusted.fruits + 1);
    adjusted.wholeGrains = Math.min(4, adjusted.wholeGrains + 1);
    adjusted.nutsSeeds = 1;
    adjusted.fats = Math.min(3, adjusted.fats + 1);
    adjusted.water = Math.min(12, adjusted.water + 2);
    adjusted.exercise = Math.min(5, adjusted.exercise + 1);
  }

  return adjusted;
}

export function applyActivityAdjustment(
  portions: PortionTargets,
  activityLevel: ActivityLevel,
  options?: { skipProteinBonus?: boolean }
): PortionTargets {
  const adjusted = { ...portions };
  const skipProtein = !!options?.skipProteinBonus;

  switch (activityLevel) {
    case 'sedentary':
      adjusted.exercise = Math.max(2, adjusted.exercise);
      break;
    case 'light':
      if (!skipProtein) adjusted.protein = Math.min(6, adjusted.protein + 1);
      adjusted.wholeGrains = Math.min(4, adjusted.wholeGrains + 1);
      adjusted.exercise = Math.max(3, adjusted.exercise);
      break;
    case 'moderate':
      if (!skipProtein) adjusted.protein = Math.min(6, adjusted.protein + 1);
      adjusted.wholeGrains = Math.min(5, adjusted.wholeGrains + 1);
      adjusted.exercise = Math.max(4, adjusted.exercise + 1);
      break;
    case 'active':
      if (!skipProtein) adjusted.protein = Math.min(6, adjusted.protein + 2);
      adjusted.wholeGrains = Math.min(6, adjusted.wholeGrains + 2);
      adjusted.exercise = Math.max(5, adjusted.exercise + 2);
      break;
    case 'veryActive':
      if (!skipProtein) adjusted.protein = Math.min(7, adjusted.protein + 2);
      adjusted.wholeGrains = Math.min(7, adjusted.wholeGrains + 3);
      adjusted.nutsSeeds = 1;
      adjusted.exercise = Math.max(6, adjusted.exercise + 3);
      break;
  }

  return adjusted;
}

/**
 * FAQ rule: 1st alcohol serving → whole grains −1; 2nd → fats −1.
 * Never below 1. Does not touch protein or veggies. Extra servings beyond 2 have no further effect.
 */
export function applyAlcoholAdjustment(
  portions: PortionTargets,
  alcoholServings: number
): PortionTargets {
  const adjusted = { ...portions };
  const servings = Math.max(0, Math.floor(Number(alcoholServings) || 0));
  if (servings >= 1) {
    adjusted.wholeGrains = Math.max(1, adjusted.wholeGrains - 1);
  }
  if (servings >= 2) {
    adjusted.fats = Math.max(1, adjusted.fats - 1);
  }
  return adjusted;
}

/** Compare food/water targets that the calculator owns (ignore exercise/alcohol UI values). */
export function foodTargetsEqual(a: PortionTargets, b: PortionTargets): boolean {
  return (
    a.protein === b.protein &&
    a.veggies === b.veggies &&
    a.fruits === b.fruits &&
    a.wholeGrains === b.wholeGrains &&
    a.nutsSeeds === b.nutsSeeds &&
    a.fats === b.fats &&
    a.water === b.water
  );
}

export function calculateRecommendedTargets(
  sex: Sex,
  weight: number,
  goal: Goal,
  activityLevel: ActivityLevel = 'sedentary',
  options: CalculateTargetsOptions = {}
): PortionTargets {
  const weightUnit = options.weightUnit ?? 'lbs';
  const alcoholServings = options.alcoholServings ?? 0;
  const pounds = weightInPounds(weight, weightUnit);
  const size = classifySize(sex, pounds);

  console.log('Calculating recommended targets for:', {
    sex,
    weight,
    weightUnit,
    pounds,
    size,
    goal,
    activityLevel,
    alcoholServings,
  });

  let portions = getBaselinePortions(sex, goal);
  portions = applySizeAdjustment(portions, size);

  // Goal-specific adjustments
  if (goal === 'lose') {
    portions.wholeGrains = Math.max(0, portions.wholeGrains - 1);
    portions.fats = Math.max(0, portions.fats - 1);
    portions.veggies = Math.min(6, portions.veggies + 1);
    portions.exercise = Math.min(7, portions.exercise + 1);
  } else if (goal === 'build') {
    portions.protein = Math.min(6, portions.protein + 1);
    portions.nutsSeeds = 1;
    portions.fats = Math.min(4, portions.fats + 1);
    portions.exercise = Math.min(7, portions.exercise + 2);
  } else if (goal === 'glp-1') {
    // Maintain pipeline + protein +1 (cap 5). Activity protein bonus is skipped below.
    portions.protein = Math.min(5, portions.protein + 1);
  }
  // maintain / eat-healthier / have-more-energy: no extra goal food changes

  portions = applyActivityAdjustment(portions, activityLevel, {
    skipProteinBonus: goal === 'glp-1',
  });

  portions = applyAlcoholAdjustment(portions, alcoholServings);

  // Protein floor after all calculator adjustments (manual edits can still go lower later)
  portions.protein = Math.max(3, portions.protein);

  portions.nutsSeeds = 1;

  console.log('Final recommended portions:', portions);
  return portions;
}

export function shouldShowWeightLossGuardrail(goal: Goal, activityLevel: ActivityLevel): boolean {
  return goal === 'lose' && activityLevel === 'sedentary';
}

export function getWeightLossGuardrailMessage(): string {
  return `For sustainable weight loss, we recommend adding some physical activity to your routine. Even light movement (like walking) can make a big difference in your results and overall health.

Would you like to update your activity level?`;
}
