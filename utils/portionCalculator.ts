
import { Sex, Goal, PortionTargets } from '../types';

// Size classification based on weight only (same for all sexes)
export type SizeCategory = 'S' | 'M' | 'L';

export function classifySize(weight: number): SizeCategory {
  if (weight < 150) return 'S';
  if (weight <= 200) return 'M';
  return 'L';
}

// Get daily portions based on sex, size, and goal
// These tables are used exactly as specified - no modifiers applied
export function getPortionTargets(sex: Sex, size: SizeCategory, goal: Goal): PortionTargets {
  // For "prefer-not-to-say", use Female tables
  const effectiveSex = sex === 'prefer-not-to-say' ? 'female' : sex;
  
  if (effectiveSex === 'female') {
    if (size === 'S') {
      if (goal === 'lose') {
        return {
          protein: 4,
          veggies: 6,
          fruit: 1,
          wholeGrains: 1,
          fats: 1,
          nutsSeeds: 0,
          dairy: 1,
          water: 8,
          alcohol: 0,
        };
      } else if (goal === 'maintain') {
        return {
          protein: 4,
          veggies: 5,
          fruit: 2,
          wholeGrains: 3,
          fats: 2,
          nutsSeeds: 1,
          dairy: 1,
          water: 8,
          alcohol: 0,
        };
      } else { // build
        return {
          protein: 5,
          veggies: 5,
          fruit: 2,
          wholeGrains: 3,
          fats: 1,
          nutsSeeds: 1,
          dairy: 2,
          water: 8,
          alcohol: 0,
        };
      }
    } else if (size === 'M') {
      if (goal === 'lose') {
        return {
          protein: 4,
          veggies: 6,
          fruit: 1,
          wholeGrains: 2,
          fats: 1,
          nutsSeeds: 1,
          dairy: 1,
          water: 8,
          alcohol: 0,
        };
      } else if (goal === 'maintain') {
        return {
          protein: 4,
          veggies: 5,
          fruit: 2,
          wholeGrains: 3,
          fats: 2,
          nutsSeeds: 1,
          dairy: 1,
          water: 8,
          alcohol: 0,
        };
      } else { // build
        return {
          protein: 5,
          veggies: 5,
          fruit: 2,
          wholeGrains: 3,
          fats: 1,
          nutsSeeds: 1,
          dairy: 2,
          water: 8,
          alcohol: 0,
        };
      }
    } else { // size === 'L'
      if (goal === 'lose') {
        return {
          protein: 5,
          veggies: 6,
          fruit: 1,
          wholeGrains: 2,
          fats: 1,
          nutsSeeds: 1,
          dairy: 1,
          water: 10,
          alcohol: 0,
        };
      } else if (goal === 'maintain') {
        return {
          protein: 5,
          veggies: 6,
          fruit: 2,
          wholeGrains: 3,
          water: 10,
          fats: 2,
          nutsSeeds: 1,
          dairy: 1,
          alcohol: 0,
        };
      } else { // build
        return {
          protein: 6,
          veggies: 6,
          fruit: 2,
          wholeGrains: 3,
          fats: 1,
          nutsSeeds: 1,
          dairy: 2,
          water: 10,
          alcohol: 0,
        };
      }
    }
  } else { // male
    if (size === 'S') {
      if (goal === 'lose') {
        return {
          protein: 5,
          veggies: 5,
          fruit: 1,
          wholeGrains: 1,
          fats: 1,
          nutsSeeds: 0,
          dairy: 1,
          water: 8,
          alcohol: 0,
        };
      } else if (goal === 'maintain') {
        return {
          protein: 5,
          veggies: 5,
          fruit: 2,
          wholeGrains: 3,
          fats: 2,
          nutsSeeds: 1,
          dairy: 1,
          water: 8,
          alcohol: 0,
        };
      } else { // build
        return {
          protein: 5,
          veggies: 5,
          fruit: 2,
          wholeGrains: 3,
          fats: 2,
          nutsSeeds: 1,
          dairy: 2,
          water: 8,
          alcohol: 0,
        };
      }
    } else if (size === 'M') {
      if (goal === 'lose') {
        return {
          protein: 5,
          veggies: 5,
          fruit: 1,
          wholeGrains: 2,
          fats: 1,
          nutsSeeds: 1,
          dairy: 1,
          water: 10,
          alcohol: 0,
        };
      } else if (goal === 'maintain') {
        return {
          protein: 5,
          veggies: 5,
          fruit: 2,
          wholeGrains: 3,
          fats: 2,
          nutsSeeds: 1,
          dairy: 1,
          water: 10,
          alcohol: 0,
        };
      } else { // build
        return {
          protein: 6,
          veggies: 5,
          fruit: 2,
          wholeGrains: 3,
          fats: 2,
          nutsSeeds: 1,
          dairy: 2,
          water: 10,
          alcohol: 0,
        };
      }
    } else { // size === 'L'
      if (goal === 'lose') {
        return {
          protein: 5,
          veggies: 6,
          fruit: 1,
          wholeGrains: 2,
          fats: 1,
          nutsSeeds: 1,
          dairy: 1,
          water: 10,
          alcohol: 0,
        };
      } else if (goal === 'maintain') {
        return {
          protein: 6,
          veggies: 6,
          fruit: 2,
          wholeGrains: 3,
          fats: 2,
          nutsSeeds: 1,
          dairy: 2,
          water: 10,
          alcohol: 0,
        };
      } else { // build
        return {
          protein: 6,
          veggies: 6,
          fruit: 3,
          wholeGrains: 4,
          fats: 3,
          nutsSeeds: 1,
          dairy: 2,
          water: 10,
          alcohol: 0,
        };
      }
    }
  }
}

// Calculate recommended targets based on sex, weight, and goal
export function calculateRecommendedTargets(
  sex: Sex,
  weight: number,
  goal: Goal
): PortionTargets {
  const size = classifySize(weight);
  const targets = getPortionTargets(sex, size, goal);
  
  console.log('Calculated targets:', {
    sex,
    weight,
    size,
    goal,
    targets,
  });
  
  return targets;
}
