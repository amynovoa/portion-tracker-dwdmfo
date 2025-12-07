
import { Sex, Goal, PortionTargets } from '../types';

// Weight brackets for each sex
interface WeightBracket {
  min: number;
  max: number;
}

// S/M/L portion unit values
interface ServingSizeUnits {
  S: number;
  M: number;
  L: number;
}

// Get weight bracket index (0, 1, or 2) based on sex and weight
function getWeightBracketIndex(sex: Sex, weight: number): number {
  if (sex === 'female') {
    if (weight < 150) return 0;
    if (weight <= 180) return 1;
    return 2;
  } else if (sex === 'male') {
    if (weight < 180) return 0;
    if (weight <= 220) return 1;
    return 2;
  } else {
    // prefer-not-to-say
    if (weight < 165) return 0;
    if (weight <= 200) return 1;
    return 2;
  }
}

// Get S/M/L portion units based on sex and weight
export function getServingSizeUnits(sex: Sex, weight: number): ServingSizeUnits {
  const bracketIndex = getWeightBracketIndex(sex, weight);

  if (sex === 'female') {
    const units: ServingSizeUnits[] = [
      { S: 1, M: 1.5, L: 2 },      // < 150 lbs
      { S: 1, M: 2, L: 2.5 },      // 150-180 lbs
      { S: 1.5, M: 2.5, L: 3 },    // > 180 lbs
    ];
    return units[bracketIndex];
  } else if (sex === 'male') {
    const units: ServingSizeUnits[] = [
      { S: 1.5, M: 2, L: 2.5 },    // < 180 lbs
      { S: 2, M: 2.5, L: 3 },      // 180-220 lbs
      { S: 2, M: 3, L: 3.5 },      // > 220 lbs
    ];
    return units[bracketIndex];
  } else {
    // prefer-not-to-say
    const units: ServingSizeUnits[] = [
      { S: 1.25, M: 1.75, L: 2.25 }, // < 165 lbs
      { S: 1.5, M: 2, L: 2.5 },      // 165-200 lbs
      { S: 1.75, M: 2.25, L: 3 },    // > 200 lbs
    ];
    return units[bracketIndex];
  }
}

// Convert serving size (S/M/L) to portion units
export function convertServingToPortionUnits(
  sex: Sex,
  weight: number,
  servingSize: 'S' | 'M' | 'L'
): number {
  const units = getServingSizeUnits(sex, weight);
  return units[servingSize];
}

// Get baseline daily portions before goal modifiers
export function getBaselinePortions(sex: Sex, weight: number): PortionTargets {
  const bracketIndex = getWeightBracketIndex(sex, weight);

  if (sex === 'female') {
    const baselines: PortionTargets[] = [
      {
        // < 150 lbs
        protein: 3,
        veggies: 4,
        fruit: 2,
        wholeGrains: 2,
        legumes: 1,
        fats: 2,
        nutsSeeds: 1,
        dairy: 0, // 0-1, using lower end
        water: 8, // Water is tracked separately, not using S/M/L
        alcohol: 0, // 0-1, using lower end
      },
      {
        // 150-180 lbs
        protein: 4,
        veggies: 5,
        fruit: 2,
        wholeGrains: 3,
        legumes: 1,
        fats: 2,
        nutsSeeds: 1,
        dairy: 1,
        water: 8,
        alcohol: 0, // 0-1, using lower end
      },
      {
        // > 180 lbs
        protein: 5,
        veggies: 6,
        fruit: 3,
        wholeGrains: 3,
        legumes: 2,
        fats: 3,
        nutsSeeds: 1,
        dairy: 1, // 1-2, using lower end
        water: 10,
        alcohol: 0, // 0-2, using lower end
      },
    ];
    return baselines[bracketIndex];
  } else if (sex === 'male') {
    const baselines: PortionTargets[] = [
      {
        // < 180 lbs
        protein: 4,
        veggies: 4,
        fruit: 2,
        wholeGrains: 3,
        legumes: 1,
        fats: 2,
        nutsSeeds: 1,
        dairy: 1,
        water: 8,
        alcohol: 0, // 0-1, using lower end
      },
      {
        // 180-220 lbs
        protein: 5,
        veggies: 5,
        fruit: 3,
        wholeGrains: 3,
        legumes: 2,
        fats: 3,
        nutsSeeds: 1,
        dairy: 1, // 1-2, using lower end
        water: 10,
        alcohol: 0, // 0-2, using lower end
      },
      {
        // > 220 lbs
        protein: 6,
        veggies: 6,
        fruit: 3,
        wholeGrains: 4,
        legumes: 2,
        fats: 3,
        nutsSeeds: 1,
        dairy: 2,
        water: 10,
        alcohol: 0, // 0-2, using lower end
      },
    ];
    return baselines[bracketIndex];
  } else {
    // prefer-not-to-say
    const baselines: PortionTargets[] = [
      {
        // < 165 lbs
        protein: 3.5,
        veggies: 4,
        fruit: 2,
        wholeGrains: 2,
        legumes: 1,
        fats: 2,
        nutsSeeds: 1,
        dairy: 1,
        water: 8,
        alcohol: 0, // 0-1, using lower end
      },
      {
        // 165-200 lbs
        protein: 4,
        veggies: 5,
        fruit: 2, // 2-3, using lower end
        wholeGrains: 3,
        legumes: 1, // 1-2, using lower end
        fats: 2,
        nutsSeeds: 1,
        dairy: 1,
        water: 8,
        alcohol: 0, // 0-1, using lower end
      },
      {
        // > 200 lbs
        protein: 5,
        veggies: 6,
        fruit: 3,
        wholeGrains: 3,
        legumes: 2,
        fats: 3,
        nutsSeeds: 1,
        dairy: 1, // 1-2, using lower end
        water: 10,
        alcohol: 0, // 0-2, using lower end
      },
    ];
    return baselines[bracketIndex];
  }
}

// Apply goal modifiers to baseline portions
export function applyGoalModifiers(
  baseTargets: PortionTargets,
  goal: Goal
): PortionTargets {
  const targets = { ...baseTargets };

  switch (goal) {
    case 'lose':
      // Protein: no change
      // Vegetables: +1
      targets.veggies += 1;
      // Fruits: -1 (but never below 1)
      targets.fruit = Math.max(1, targets.fruit - 1);
      // Whole grains: -1 (never below 0)
      targets.wholeGrains = Math.max(0, targets.wholeGrains - 1);
      // Fats: -1 (never below 1)
      targets.fats = Math.max(1, targets.fats - 1);
      // Legumes: no change
      // Nuts/Seeds: no change
      // Dairy: if above 1, cap at 1
      if (targets.dairy > 1) {
        targets.dairy = 1;
      }
      // Alcohol: keep within existing range (no increase)
      break;

    case 'maintain':
      // No changes
      break;

    case 'build':
      // Protein: +1 portion
      targets.protein += 1;
      // Whole grains: +1 portion
      targets.wholeGrains += 1;
      // Fruits: no change
      // Vegetables: no change
      // Fats: no change
      // Legumes: optional +1 (leaving as is for now)
      // Dairy: +1 portion, but cap total at 2
      targets.dairy = Math.min(2, targets.dairy + 1);
      // Alcohol: keep within existing baseline range (no increase)
      break;
  }

  return targets;
}

// Calculate recommended targets based on sex, weight, and goal
export function calculateRecommendedTargets(
  sex: Sex,
  weight: number,
  goal: Goal
): PortionTargets {
  const baseline = getBaselinePortions(sex, weight);
  const targets = applyGoalModifiers(baseline, goal);
  
  console.log('Calculated targets:', {
    sex,
    weight,
    goal,
    baseline,
    targets,
  });
  
  return targets;
}

// Legacy function for backward compatibility (no longer used with new system)
export function calculateSizeCategory(sex: Sex, weight: number): 'small' | 'medium' | 'large' {
  if (sex === 'female') {
    if (weight < 150) return 'small';
    if (weight < 190) return 'medium';
    return 'large';
  } else {
    if (weight < 170) return 'small';
    if (weight < 210) return 'medium';
    return 'large';
  }
}
