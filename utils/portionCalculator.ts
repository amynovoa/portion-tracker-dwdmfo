
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

// Apply alcohol adjustment with specific rule:
// For 2 drinks: reduce Healthy Carbs by 1 and Fats by 1, Nuts remain unchanged
// Only adjust for a maximum of 2 drinks (if user selects more, we don't adjust more)
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
  
  // Set alcohol servings (user can select any number)
  adjusted.alcohol = alcoholServings;
  
  // Only adjust portions for a maximum of 2 drinks
  // If user selects more than 2, we still only adjust for 2
  const drinksToAdjustFor = Math.min(2, alcoholServings);
  
  console.log('Alcohol adjustment - Drinks to adjust for:', drinksToAdjustFor);
  console.log('Initial portions:', { 
    healthyCarbs: adjusted.healthyCarbs, 
    fats: adjusted.fats, 
    nuts: adjusted.nuts 
  });
  
  // For 2 drinks: reduce Healthy Carbs by 1 and Fats by 1
  // Nuts remain unchanged
  if (drinksToAdjustFor === 2) {
    // Reduce Healthy Carbs by 1 (but not below 0)
    if (adjusted.healthyCarbs > 0) {
      adjusted.healthyCarbs -= 1;
      console.log('Reduced Healthy Carbs by 1');
    }
    
    // Reduce Fats by 1 (but not below 0)
    if (adjusted.fats > 0) {
      adjusted.fats -= 1;
      console.log('Reduced Fats by 1');
    }
    
    // Nuts remain unchanged
    console.log('Nuts remain unchanged');
  } else if (drinksToAdjustFor === 1) {
    // For 1 drink: only reduce Healthy Carbs by 1
    if (adjusted.healthyCarbs > 0) {
      adjusted.healthyCarbs -= 1;
      console.log('Reduced Healthy Carbs by 1 (for 1 drink)');
    }
  }
  // For 0 drinks or if drinksToAdjustFor is somehow different, no adjustment
  
  console.log('Final portions after alcohol adjustment:', { 
    healthyCarbs: adjusted.healthyCarbs, 
    fats: adjusted.fats, 
    nuts: adjusted.nuts 
  });
  
  if (alcoholServings > 2) {
    console.log(`Note: User selected ${alcoholServings} drinks, but only adjusted portions for 2 drinks (max)`);
  }
  
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
  
  // Step 4: Apply alcohol adjustment with new rule
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
