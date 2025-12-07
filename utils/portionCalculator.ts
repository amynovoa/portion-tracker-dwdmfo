
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
          wholeGrains: 1, // Updated from 2 to 1
          legumes: 1,
          fats: 1,
          nutsSeeds: 0, // Updated from 1 to 0 (0-1 range, using lower bound)
          dairy: 1,
          water: 8,
          alcohol: 0, // 0 (or 1 only if Nuts & Seeds = 0)
        };
      } else if (goal === 'maintain') {
        return {
          protein: 4,
          veggies: 5,
          fruit: 2,
          wholeGrains: 3,
          legumes: 1,
          fats: 2,
          nutsSeeds: 1,
          dairy: 1, // 1-2 range
          water: 8,
          alcohol: 0, // 0-1 range
        };
      } else { // build
        return {
          protein: 5,
          veggies: 5,
          fruit: 2,
          wholeGrains: 3,
          legumes: 1,
          fats: 1,
          nutsSeeds: 1,
          dairy: 2,
          water: 8,
          alcohol: 0, // 0-1 range
        };
      }
    } else if (size === 'M') {
      if (goal === 'lose') {
        return {
          protein: 4,
          veggies: 6,
          fruit: 1,
          wholeGrains: 2,
          legumes: 1,
          fats: 1,
          nutsSeeds: 1,
          dairy: 1,
          water: 8,
          alcohol: 0, // 0-1 range
        };
      } else if (goal === 'maintain') {
        return {
          protein: 4,
          veggies: 5,
          fruit: 2,
          wholeGrains: 3,
          legumes: 1,
          fats: 2,
          nutsSeeds: 1,
          dairy: 1, // 1-2 range
          water: 8,
          alcohol: 0, // 0-1 range
        };
      } else { // build
        return {
          protein: 5,
          veggies: 5,
          fruit: 2,
          wholeGrains: 3,
          legumes: 1,
          fats: 1,
          nutsSeeds: 1,
          dairy: 2,
          water: 8,
          alcohol: 0, // 0-1 range
        };
      }
    } else { // size === 'L'
      if (goal === 'lose') {
        return {
          protein: 5,
          veggies: 6,
          fruit: 1,
          wholeGrains: 2,
          legumes: 1,
          fats: 1, // 1-2 range, using lower bound
          nutsSeeds: 1,
          dairy: 1,
          water: 10,
          alcohol: 0, // 0-1 range
        };
      } else if (goal === 'maintain') {
        return {
          protein: 5,
          veggies: 6,
          fruit: 2,
          wholeGrains: 3,
          legumes: 1, // 1-2 range
          water: 10,
          fats: 2,
          nutsSeeds: 1,
          dairy: 1, // 1-2 range
          alcohol: 0, // 0-2 range
        };
      } else { // build
        return {
          protein: 6,
          veggies: 6,
          fruit: 2,
          wholeGrains: 3, // 3-4 range
          legumes: 1, // 1-2 range
          fats: 1, // 1-2 range
          nutsSeeds: 1,
          dairy: 2,
          water: 10,
          alcohol: 0, // 0-2 range
        };
      }
    }
  } else { // male
    if (size === 'S') {
      if (goal === 'lose') {
        return {
          protein: 5, // Updated from 4 to 5
          veggies: 5,
          fruit: 1, // 1-2 range, using lower bound
          wholeGrains: 1, // Updated from 2 to 1
          legumes: 1,
          fats: 1,
          nutsSeeds: 0, // Updated from 1 to 0 (0-1 range, using lower bound)
          dairy: 1,
          water: 8,
          alcohol: 0, // Updated from 0-1 to 0
        };
      } else if (goal === 'maintain') {
        return {
          protein: 5,
          veggies: 5,
          fruit: 2,
          wholeGrains: 3,
          legumes: 1,
          fats: 2,
          nutsSeeds: 1,
          dairy: 1, // 1-2 range
          water: 8,
          alcohol: 0, // 0-1 range
        };
      } else { // build
        return {
          protein: 5, // 5-6 range
          veggies: 5,
          fruit: 2, // 2-3 range
          wholeGrains: 3,
          legumes: 1, // 1-2 range
          fats: 2,
          nutsSeeds: 1,
          dairy: 2,
          water: 8,
          alcohol: 0, // 0-1 range
        };
      }
    } else if (size === 'M') {
      if (goal === 'lose') {
        return {
          protein: 5,
          veggies: 5,
          fruit: 1, // 1-2 range, using lower bound
          wholeGrains: 2, // Updated to use exact value 2
          legumes: 1,
          fats: 1,
          nutsSeeds: 1,
          dairy: 1,
          water: 10,
          alcohol: 0, // 0-1 range
        };
      } else if (goal === 'maintain') {
        return {
          protein: 5,
          veggies: 5,
          fruit: 2, // 2-3 range
          wholeGrains: 3,
          legumes: 1, // 1-2 range
          fats: 2, // 2-3 range
          nutsSeeds: 1,
          dairy: 1, // 1-2 range
          water: 10,
          alcohol: 0, // 0-2 range
        };
      } else { // build
        return {
          protein: 6,
          veggies: 5, // 5-6 range
          fruit: 2, // 2-3 range
          wholeGrains: 3, // 3-4 range
          legumes: 2,
          fats: 2, // 2-3 range
          nutsSeeds: 1,
          dairy: 2,
          water: 10,
          alcohol: 0, // 0-2 range
        };
      }
    } else { // size === 'L'
      if (goal === 'lose') {
        return {
          protein: 5, // 5-6 range, using lower bound
          veggies: 6, // Updated from 5 to 6
          fruit: 1, // 1-2 range, using lower bound
          wholeGrains: 2, // Updated to exact value 2
          legumes: 1, // 1-2 range, using lower bound
          fats: 1, // 1-2 range, using lower bound
          nutsSeeds: 1,
          dairy: 1, // Updated from 1-2 range to 1
          water: 10,
          alcohol: 0, // 0-2 range
        };
      } else if (goal === 'maintain') {
        return {
          protein: 6,
          veggies: 6,
          fruit: 2, // 2-3 range
          wholeGrains: 3, // 3-4 range
          legumes: 2,
          fats: 2, // 2-3 range
          nutsSeeds: 1,
          dairy: 2,
          water: 10,
          alcohol: 0, // 0-2 range
        };
      } else { // build
        return {
          protein: 6, // 6-7 range
          veggies: 6,
          fruit: 3,
          wholeGrains: 4,
          legumes: 2,
          fats: 3,
          nutsSeeds: 1,
          dairy: 2,
          water: 10,
          alcohol: 0, // 0-2 range
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
