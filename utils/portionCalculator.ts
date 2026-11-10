import { Sex, Goal, PortionTargets, SizeCategory, ActivityLevel } from '../types';
import { LBS_PER_KG, type WeightUnit } from './weightUnit';

export type CalculateTargetsOptions = {
  /** Unit of the `weight` argument. Cutoffs are always applied in pounds. */
  weightUnit?: WeightUnit;
  /**
   * Daily alcohol servings (0–n). Sets Alcohol_limit only — does NOT change food targets
   * (Amy Nov 2026 rules: grain/fat alcohol adjustments removed).
   */
  alcoholServings?: number;
};

/** Base food targets by sex × size (Sedentary/Light/Moderate; non–Build Muscle goals). */
type FoodBase = {
  protein: number;
  veggies: number;
  fruits: number;
  wholeGrains: number;
  nutsSeeds: number;
  fats: number;
  water: number;
};

const BASE_TARGETS: Record<'female' | 'male', Record<SizeCategory, FoodBase>> = {
  female: {
    small: { protein: 4, veggies: 4, fruits: 2, wholeGrains: 3, nutsSeeds: 1, fats: 2, water: 7 },
    medium: { protein: 5, veggies: 5, fruits: 3, wholeGrains: 4, nutsSeeds: 1, fats: 2, water: 8 },
    large: { protein: 6, veggies: 5, fruits: 3, wholeGrains: 5, nutsSeeds: 1, fats: 3, water: 10 },
  },
  male: {
    small: { protein: 5, veggies: 4, fruits: 2, wholeGrains: 4, nutsSeeds: 1, fats: 2, water: 8 },
    medium: { protein: 6, veggies: 5, fruits: 3, wholeGrains: 5, nutsSeeds: 1, fats: 2, water: 10 },
    large: { protein: 7, veggies: 5, fruits: 3, wholeGrains: 6, nutsSeeds: 1, fats: 3, water: 12 },
  },
};

const FOOD_MINIMUM = 1;

/** Convert a weight in the user's unit to pounds for size cutoffs. */
export function weightInPounds(weight: number, weightUnit: WeightUnit = 'lbs'): number {
  if (!Number.isFinite(weight)) return 0;
  return weightUnit === 'kg' ? weight * LBS_PER_KG : weight;
}

/**
 * Size cutoffs are defined in pounds (unchanged).
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

function sexKeyForBase(sex: Sex): 'female' | 'male' {
  return sex === 'female' ? 'female' : 'male';
}

function getBaseFoodTargets(sex: Sex, size: SizeCategory): FoodBase {
  return { ...BASE_TARGETS[sexKeyForBase(sex)][size] };
}

function enforceFoodMinimums(portions: PortionTargets): PortionTargets {
  return {
    ...portions,
    protein: Math.max(FOOD_MINIMUM, portions.protein),
    veggies: Math.max(FOOD_MINIMUM, portions.veggies),
    fruits: Math.max(FOOD_MINIMUM, portions.fruits),
    wholeGrains: Math.max(FOOD_MINIMUM, portions.wholeGrains),
    nutsSeeds: Math.max(FOOD_MINIMUM, portions.nutsSeeds),
    fats: Math.max(FOOD_MINIMUM, portions.fats),
    water: Math.max(FOOD_MINIMUM, portions.water),
  };
}

/**
 * Exercise targets — unchanged from pre–Nov 5 food rules (copied into Amy’s matrix).
 * Kept as the old baseline → size → goal → activity pipeline.
 */
export function calculateExerciseTarget(
  size: SizeCategory,
  goal: Goal,
  activityLevel: ActivityLevel
): number {
  let exercise = 3;

  if (size === 'small') {
    exercise = Math.max(2, exercise - 1);
  } else if (size === 'large') {
    exercise = Math.min(5, exercise + 1);
  }

  if (goal === 'lose') {
    exercise = Math.min(7, exercise + 1);
  } else if (goal === 'build') {
    exercise = Math.min(7, exercise + 2);
  }

  switch (activityLevel) {
    case 'sedentary':
      exercise = Math.max(2, exercise);
      break;
    case 'light':
      exercise = Math.max(3, exercise);
      break;
    case 'moderate':
      exercise = Math.max(4, exercise + 1);
      break;
    case 'active':
      exercise = Math.max(5, exercise + 2);
      break;
    case 'veryActive':
      exercise = Math.max(6, exercise + 3);
      break;
  }

  return exercise;
}

/** @deprecated Prefer getBaseFoodTargets via calculateRecommendedTargets. Kept for any legacy imports. */
export function getBaselinePortions(_sex: Sex, _goal: Goal): PortionTargets {
  return {
    protein: 4,
    veggies: 4,
    fruits: 2,
    wholeGrains: 3,
    nutsSeeds: 1,
    fats: 2,
    water: 7,
    exercise: 3,
    alcohol: 2,
  };
}

/** @deprecated Size is now baked into BASE_TARGETS. */
export function applySizeAdjustment(portions: PortionTargets, _size: SizeCategory): PortionTargets {
  return { ...portions };
}

/** @deprecated Activity food bonuses are applied inside calculateRecommendedTargets. */
export function applyActivityAdjustment(
  portions: PortionTargets,
  _activityLevel: ActivityLevel,
  _options?: { skipProteinBonus?: boolean }
): PortionTargets {
  return { ...portions };
}

/**
 * Alcohol no longer adjusts grains/fats (Amy Nov 2026).
 * Kept as a no-op so older call sites stay safe.
 */
export function applyAlcoholAdjustment(
  portions: PortionTargets,
  _alcoholServings: number
): PortionTargets {
  return { ...portions };
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

/**
 * Amy-approved rules (Nov 4/5 2026):
 * - Base by sex × size
 * - Active / Very Active OR Build Muscle: +1 protein and +1 grain (once, not twice)
 * - Lose Weight: +1 veggies, −1 fats (floor 1); does NOT apply on GLP-1
 * - GLP-1: base + 1 water; Active bonus still applies
 * - Alcohol servings do not change food targets
 * - Every food group minimum 1
 * - Exercise unchanged from prior app logic
 */
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
  const base = getBaseFoodTargets(sex, size);

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

  let protein = base.protein;
  let veggies = base.veggies;
  let fruits = base.fruits;
  let wholeGrains = base.wholeGrains;
  let nutsSeeds = base.nutsSeeds;
  let fats = base.fats;
  let water = base.water;

  const activeBonus =
    activityLevel === 'active' || activityLevel === 'veryActive' || goal === 'build';
  if (activeBonus) {
    protein += 1;
    wholeGrains += 1;
  }

  if (goal === 'lose') {
    veggies += 1;
    fats = Math.max(FOOD_MINIMUM, fats - 1);
  }

  if (goal === 'glp-1') {
    water += 1;
  }

  let portions: PortionTargets = {
    protein,
    veggies,
    fruits,
    wholeGrains,
    nutsSeeds,
    fats,
    water,
    exercise: calculateExerciseTarget(size, goal, activityLevel),
    // Alcohol_limit = chosen servings (0/1/2); does not change food targets.
    alcohol: Math.max(0, alcoholServings),
  };

  portions = enforceFoodMinimums(portions);

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
