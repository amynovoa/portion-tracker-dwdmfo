
import { Sex, Goal, PortionTargets, SizeCategory, ActivityLevel } from '../types';

// Size classification based on gender and weight
export function classifySize(sex: Sex, weight: number): SizeCategory {
  if (sex === 'female') {
    if (weight < 150) return 'small';
    if (weight < 190) return 'medium';
    return 'large';
  } else { // male
    if (weight < 170) return 'small';
    if (weight < 210) return 'medium';
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
        healthyCarbs: 3,
        fats: 2,
        nuts: 1,
        water: 8,
        alcohol: 0,
      };
    } else if (goal === 'maintain') {
      return {
        protein: 5,
        veggies: 4,
        fruit: 2,
        healthyCarbs: 3,
        fats: 2,
        nuts: 1,
        water: 8,
        alcohol: 0,
      };
    } else { // build
      return {
        protein: 6,
        veggies: 4,
        fruit: 2,
        healthyCarbs: 4,
        fats: 2,
        nuts: 1,
        water: 8,
        alcohol: 0,
      };
    }
  } else { // male
    if (goal === 'lose') {
      return {
        protein: 5,
        veggies: 4,
        fruit: 2,
        healthyCarbs: 3,
        fats: 2,
        nuts: 1,
        water: 8,
        alcohol: 0,
      };
    } else if (goal === 'maintain') {
      return {
        protein: 6,
        veggies: 4,
        fruit: 2,
        healthyCarbs: 3,
        fats: 2,
        nuts: 1,
        water: 8,
        alcohol: 0,
      };
    } else { // build
      return {
        protein: 7,
        veggies: 4,
        fruit: 2,
        healthyCarbs: 4,
        fats: 2,
        nuts: 1,
        water: 8,
        alcohol: 0,
      };
    }
  }
}

// Apply size adjustment (affects Healthy Carbs and Water)
function applySizeAdjustment(portions: PortionTargets, size: SizeCategory): PortionTargets {
  const adjusted = { ...portions };
  
  if (size === 'small') {
    adjusted.healthyCarbs = Math.max(0, adjusted.healthyCarbs - 1);
    adjusted.water = 7;
  } else if (size === 'large') {
    adjusted.healthyCarbs = adjusted.healthyCarbs + 1;
    adjusted.water = 10;
  }
  
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
  
  adjusted.alcohol = alcoholServings;
  
  const drinksToAdjustFor = Math.min(2, alcoholServings);
  
  console.log('Alcohol adjustment - Drinks to adjust for:', drinksToAdjustFor);
  console.log('Initial portions:', { 
    healthyCarbs: adjusted.healthyCarbs, 
    fats: adjusted.fats, 
    nuts: adjusted.nuts 
  });
  
  if (drinksToAdjustFor === 2) {
    if (adjusted.healthyCarbs > 0) {
      adjusted.healthyCarbs -= 1;
      console.log('Reduced Healthy Carbs by 1');
    }
    
    if (adjusted.fats > 0) {
      adjusted.fats -= 1;
      console.log('Reduced Fats by 1');
    }
    
    console.log('Nuts remain unchanged');
  } else if (drinksToAdjustFor === 1) {
    if (adjusted.healthyCarbs > 0) {
      adjusted.healthyCarbs -= 1;
      console.log('Reduced Healthy Carbs by 1 (for 1 drink)');
    }
  }
  
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

// Apply activity level adjustment (AFTER base portions are calculated)
// This is the adjustment layer that increases daily targets for active users
// UPDATED LOGIC: Revised adjustments to fuel activity without over-carbing
export function applyActivityAdjustment(
  portions: PortionTargets,
  activityLevel: ActivityLevel,
  goal?: Goal
): PortionTargets {
  const adjusted = { ...portions };
  
  console.log('Applying activity adjustment for level:', activityLevel);
  console.log('Base portions before activity adjustment:', adjusted);
  
  switch (activityLevel) {
    case 'sedentary':
      // No adjustment
      console.log('Sedentary: No adjustment');
      break;
      
    case 'lightlyActive':
      // Add 1 Healthy Carb
      adjusted.healthyCarbs += 1;
      console.log('Lightly Active: +1 Healthy Carb');
      break;
      
    case 'moderatelyActive':
      // Add 1 Healthy Carb (UPDATED from +2)
      adjusted.healthyCarbs += 1;
      console.log('Moderately Active: +1 Healthy Carb');
      break;
      
    case 'veryActive':
      // Add 2 Healthy Carbs and 1 Protein (UPDATED from +3 carbs)
      adjusted.healthyCarbs += 2;
      adjusted.protein += 1;
      console.log('Very Active: +2 Healthy Carbs, +1 Protein');
      break;
      
    case 'extremelyActive':
      // Add 3 Healthy Carbs and 1 Protein (UPDATED from +4 carbs)
      adjusted.healthyCarbs += 3;
      adjusted.protein += 1;
      console.log('Extremely Active: +3 Healthy Carbs, +1 Protein');
      break;
  }
  
  // Goal-based protein priority check
  // If Goal = Build AND Activity Level = Very Active or Extremely Active,
  // protein is already prioritized (covered by adjustments above)
  if (goal === 'build' && (activityLevel === 'veryActive' || activityLevel === 'extremelyActive')) {
    console.log('Build goal + high activity: Protein priority ensured');
  }
  
  console.log('Final portions after activity adjustment:', adjusted);
  
  return adjusted;
}

// Calculate recommended targets based on all profile inputs
export function calculateRecommendedTargets(
  sex: Sex,
  weight: number,
  goal: Goal,
  includeAlcohol: boolean,
  alcoholServings: number,
  activityLevel: ActivityLevel = 'sedentary'
): { targets: PortionTargets; sizeCategory: SizeCategory } {
  // Step 1: Determine size category
  const sizeCategory = classifySize(sex, weight);
  
  // Step 2: Get baseline portions for Medium size
  let portions = getBaselinePortions(sex, goal);
  
  // Step 3: Apply size adjustment (affects Healthy Carbs and Water)
  portions = applySizeAdjustment(portions, sizeCategory);
  
  // Step 4: Apply alcohol adjustment
  portions = applyAlcoholAdjustment(portions, includeAlcohol, alcoholServings);
  
  // Step 5: Apply activity level adjustment (AFTER all base calculations)
  portions = applyActivityAdjustment(portions, activityLevel, goal);
  
  console.log('Calculated targets:', {
    sex,
    weight,
    goal,
    sizeCategory,
    includeAlcohol,
    alcoholServings,
    activityLevel,
    finalPortions: portions,
  });
  
  return { targets: portions, sizeCategory };
}

// Check if weight loss guardrail should be shown
export function shouldShowWeightLossGuardrail(
  goal: Goal,
  activityLevel: ActivityLevel
): boolean {
  return goal === 'lose' && activityLevel !== 'sedentary';
}

// Get the weight loss guardrail message (UPDATED - shorter, simpler)
export function getWeightLossGuardrailMessage(): string {
  return "Fuel matters when you're active.\nOn training days, it's okay to use your extra Healthy Carb portions.";
}
