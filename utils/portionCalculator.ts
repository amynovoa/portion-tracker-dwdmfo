
import { Sex, Goal, PortionTargets, SizeCategory } from '../types';

// Size classification based on gender and weight
export function classifySize(sex: Sex, weight: number): SizeCategory {
  if (sex === 'female') {
    if (weight <= 150) return 'small';
    if (weight <= 190) return 'medium';
    return 'large';
  } else { // male
    if (weight <= 170) return 'small';
    if (weight <= 210) return 'medium';
    return 'large';
  }
}

// Get baseline daily portions based on sex and goal (for Medium size)
function getBaselinePortions(sex: Sex, goal: Goal): PortionTargets {
  if (sex === 'female') {
    if (goal === 'lose') {
      return {
        protein: 4,
        veggies: 4,
        fruit: 2,
        healthyCarbs: 2,
        fats: 2,
        nuts: 1,
        alcohol: 0,
      };
    } else if (goal === 'maintain') {
      return {
        protein: 5,
        veggies: 4,
        fruit: 2,
        healthyCarbs: 2,
        fats: 2,
        nuts: 1,
        alcohol: 0,
      };
    } else { // build
      return {
        protein: 6,
        veggies: 4,
        fruit: 2,
        healthyCarbs: 3,
        fats: 2,
        nuts: 1,
        alcohol: 0,
      };
    }
  } else { // male
    if (goal === 'lose') {
      return {
        protein: 5,
        veggies: 4,
        fruit: 2,
        healthyCarbs: 2,
        fats: 2,
        nuts: 1,
        alcohol: 0,
      };
    } else if (goal === 'maintain') {
      return {
        protein: 6,
        veggies: 4,
        fruit: 2,
        healthyCarbs: 2,
        fats: 2,
        nuts: 1,
        alcohol: 0,
      };
    } else { // build
      return {
        protein: 7,
        veggies: 4,
        fruit: 2,
        healthyCarbs: 3,
        fats: 2,
        nuts: 1,
        alcohol: 0,
      };
    }
  }
}

// Apply size adjustment (only affects Healthy Carbs)
function applySizeAdjustment(portions: PortionTargets, size: SizeCategory): PortionTargets {
  const adjusted = { ...portions };
  
  if (size === 'small') {
    adjusted.healthyCarbs = Math.max(0, adjusted.healthyCarbs - 1);
  } else if (size === 'large') {
    adjusted.healthyCarbs = adjusted.healthyCarbs + 1;
  }
  // medium: no change
  
  return adjusted;
}

// Apply alcohol adjustment (only affects Healthy Carbs)
function applyAlcoholAdjustment(
  portions: PortionTargets,
  includeAlcohol: boolean,
  alcoholServings: number
): PortionTargets {
  const adjusted = { ...portions };
  
  if (!includeAlcohol) {
    adjusted.alcohol = 0;
    return adjusted;
  }
  
  // Set alcohol servings
  adjusted.alcohol = alcoholServings;
  
  // Reduce Healthy Carbs by up to 3 servings
  const carbReduction = Math.min(3, alcoholServings);
  adjusted.healthyCarbs = Math.max(0, adjusted.healthyCarbs - carbReduction);
  
  return adjusted;
}

// Calculate recommended targets based on all profile inputs
export function calculateRecommendedTargets(
  sex: Sex,
  weight: number,
  goal: Goal,
  includeAlcohol: boolean,
  alcoholServings: number
): { targets: PortionTargets; sizeCategory: SizeCategory } {
  // Step 1: Determine size category
  const sizeCategory = classifySize(sex, weight);
  
  // Step 2: Get baseline portions for Medium size
  let portions = getBaselinePortions(sex, goal);
  
  // Step 3: Apply size adjustment
  portions = applySizeAdjustment(portions, sizeCategory);
  
  // Step 4: Apply alcohol adjustment
  portions = applyAlcoholAdjustment(portions, includeAlcohol, alcoholServings);
  
  console.log('Calculated targets:', {
    sex,
    weight,
    goal,
    sizeCategory,
    includeAlcohol,
    alcoholServings,
    finalPortions: portions,
  });
  
  return { targets: portions, sizeCategory };
}
