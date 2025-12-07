
import { Sex, Goal, PortionTargets } from '../types';

// Size classification based on weight only (same for all sexes)
export type SizeCategory = 'S' | 'M' | 'L';

export function classifySize(weight: number): SizeCategory {
  if (weight < 150) return 'S';
  if (weight <= 200) return 'M';
  return 'L';
}

// Get baseline daily portions before goal modifiers
export function getBaselinePortions(sex: Sex, size: SizeCategory): PortionTargets {
  if (sex === 'female') {
    if (size === 'S') {
      return {
        protein: 3,
        veggies: 4,
        fruit: 2,
        wholeGrains: 2,
        legumes: 1,
        fats: 2,
        nutsSeeds: 1,
        dairy: 1,
        water: 8,
        alcohol: 0, // 0-1 range, using lower end
      };
    } else if (size === 'M') {
      return {
        protein: 4,
        veggies: 5,
        fruit: 2,
        wholeGrains: 3,
        legumes: 1,
        fats: 2,
        nutsSeeds: 1,
        dairy: 1,
        water: 8,
        alcohol: 0, // 0-1 range, using lower end
      };
    } else { // size === 'L'
      return {
        protein: 5,
        veggies: 6,
        fruit: 3,
        wholeGrains: 3,
        legumes: 2,
        fats: 3,
        nutsSeeds: 1,
        dairy: 1, // 1-2 range, using lower end
        water: 10,
        alcohol: 0, // 0-2 range, using lower end
      };
    }
  } else if (sex === 'male') {
    if (size === 'S') {
      return {
        protein: 4,
        veggies: 4,
        fruit: 2,
        wholeGrains: 3,
        legumes: 1,
        fats: 2,
        nutsSeeds: 1,
        dairy: 1,
        water: 8,
        alcohol: 0, // 0-1 range, using lower end
      };
    } else if (size === 'M') {
      return {
        protein: 5,
        veggies: 5,
        fruit: 3,
        wholeGrains: 3,
        legumes: 2,
        fats: 3,
        nutsSeeds: 1,
        dairy: 1, // 1-2 range, using lower end
        water: 10,
        alcohol: 0, // 0-2 range, using lower end
      };
    } else { // size === 'L'
      return {
        protein: 6,
        veggies: 6,
        fruit: 3,
        wholeGrains: 4,
        legumes: 2,
        fats: 3,
        nutsSeeds: 1,
        dairy: 2,
        water: 10,
        alcohol: 0, // 0-2 range, using lower end
      };
    }
  } else { // prefer-not-to-say
    if (size === 'S') {
      return {
        protein: 3,
        veggies: 4,
        fruit: 2,
        wholeGrains: 2,
        legumes: 1,
        fats: 2,
        nutsSeeds: 1,
        dairy: 1,
        water: 8,
        alcohol: 0, // 0-1 range, using lower end
      };
    } else if (size === 'M') {
      return {
        protein: 4,
        veggies: 5,
        fruit: 2,
        wholeGrains: 3,
        legumes: 1,
        fats: 2,
        nutsSeeds: 1,
        dairy: 1,
        water: 8,
        alcohol: 0, // 0-1 range, using lower end
      };
    } else { // size === 'L'
      return {
        protein: 5,
        veggies: 6,
        fruit: 3,
        wholeGrains: 3,
        legumes: 2,
        fats: 3,
        nutsSeeds: 1,
        dairy: 1, // 1-2 range, using lower end
        water: 10,
        alcohol: 0, // 0-2 range, using lower end
      };
    }
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
      // Fruits: -1 (floor = 1)
      targets.fruit = Math.max(1, targets.fruit - 1);
      // Whole grains: -1 (floor = 0)
      targets.wholeGrains = Math.max(0, targets.wholeGrains - 1);
      // Fats: -1 (floor = 1)
      targets.fats = Math.max(1, targets.fats - 1);
      // Legumes: no change
      // Nuts/Seeds: no change
      // Dairy: if > 1, bring down to 1
      if (targets.dairy > 1) {
        targets.dairy = 1;
      }
      // Alcohol: keep within existing range (no increase)
      break;

    case 'maintain':
      // No changes
      break;

    case 'build':
      // Protein: +1
      targets.protein += 1;
      // Whole grains: +1
      targets.wholeGrains += 1;
      // Fruits: no change
      // Vegetables: no change
      // Fats: no change
      // Legumes: optional +1 (leaving as is for simplicity)
      // Dairy: +1, but cap total at 2
      targets.dairy = Math.min(2, targets.dairy + 1);
      // Alcohol: keep within existing range (no increase)
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
  const size = classifySize(weight);
  const baseline = getBaselinePortions(sex, size);
  const targets = applyGoalModifiers(baseline, goal);
  
  console.log('Calculated targets:', {
    sex,
    weight,
    size,
    goal,
    baseline,
    targets,
  });
  
  return targets;
}
