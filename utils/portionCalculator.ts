
import { Sex, Goal, SizeCategory, PortionTargets } from '../types';

export function calculateSizeCategory(sex: Sex, weight: number): SizeCategory {
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

export function getBaseTargets(size: SizeCategory): PortionTargets {
  const baseTargets = {
    small: {
      protein: 2,
      veggies: 3,
      fruit: 2,
      wholeGrains: 1,
      legumes: 1,
      nutsSeeds: 1,
      fats: 1,
      dairy: 1,
      water: 7,
      alcohol: 0,
    },
    medium: {
      protein: 3,
      veggies: 4,
      fruit: 2,
      wholeGrains: 2,
      legumes: 2,
      nutsSeeds: 2,
      fats: 2,
      dairy: 2,
      water: 8,
      alcohol: 0,
    },
    large: {
      protein: 4,
      veggies: 5,
      fruit: 3,
      wholeGrains: 3,
      legumes: 3,
      nutsSeeds: 2,
      fats: 3,
      dairy: 2,
      water: 10,
      alcohol: 0,
    },
  };

  return baseTargets[size];
}

export function applyGoalModifiers(
  baseTargets: PortionTargets,
  goal: Goal
): PortionTargets {
  const targets = { ...baseTargets };

  switch (goal) {
    case 'lose':
      // Reduce whole grains and fats by 1 (not below 0)
      targets.wholeGrains = Math.max(0, targets.wholeGrains - 1);
      targets.fats = Math.max(0, targets.fats - 1);
      // Optionally increase veggies by 1
      targets.veggies += 1;
      break;

    case 'build':
      // Increase protein by 1 (up to max 6)
      targets.protein = Math.min(6, targets.protein + 1);
      // Optionally increase nuts & seeds by 1
      targets.nutsSeeds += 1;
      break;

    case 'maintain':
      // No changes
      break;
  }

  return targets;
}

export function calculateRecommendedTargets(
  sex: Sex,
  weight: number,
  goal: Goal
): PortionTargets {
  const size = calculateSizeCategory(sex, weight);
  const baseTargets = getBaseTargets(size);
  const targets = applyGoalModifiers(baseTargets, goal);
  
  // Alcohol defaults to 0, users can adjust it in the targets section if they want
  return targets;
}
