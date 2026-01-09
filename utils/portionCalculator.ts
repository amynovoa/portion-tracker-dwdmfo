
import { Sex, Goal, PortionTargets, SizeCategory, ActivityLevel } from '../types';

// Size classification based on gender and weight
export function classifySize(sex: Sex, weight: number): SizeCategory {
  if (sex === 'female') {
    if (weight < 150) return 'small';
    if (weight < 190) return 'medium';
    return 'large';
  } else { // male, prefer_not_to_say, or other
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
        wholeGrains: 3,
        legumes: 1,
        nutsSeeds: 1,
        fats: 2,
        water: 8,
        alcohol: 0,
      };
    } else if (goal === 'maintain') {
      return {
        protein: 5,
        veggies: 4,
        fruit: 2,
        wholeGrains: 3,
        legumes: 1,
        nutsSeeds: 1,
        fats: 2,
        water: 8,
        alcohol: 0,
      };
    } else { // build
      return {
        protein: 6,
        veggies: 4,
        fruit: 2,
        wholeGrains: 4,
        legumes: 2,
        nutsSeeds: 1,
        fats: 2,
        water: 8,
        alcohol: 0,
      };
    }
  } else { // male, prefer_not_to_say, or other
    if (goal === 'lose') {
      return {
        protein: 5,
        veggies: 4,
        fruit: 2,
        wholeGrains: 3,
        legumes: 1,
        nutsSeeds: 1,
        fats: 2,
        water: 8,
        alcohol: 0,
      };
    } else if (goal === 'maintain') {
      return {
        protein: 6,
        veggies: 4,
        fruit: 2,
        wholeGrains: 3,
        legumes: 2,
        nutsSeeds: 1,
        fats: 2,
        water: 8,
        alcohol: 0,
      };
    } else { // build
      return {
        protein: 7,
        veggies: 4,
        fruit: 2,
        wholeGrains: 4,
        legumes: 2,
        nutsSeeds: 1,
        fats: 2,
        water: 8,
        alcohol: 0,
      };
    }
  }
}

// Apply size adjustment (affects Whole Grains and Water)
function applySizeAdjustment(portions: PortionTargets, size: SizeCategory): PortionTargets {
  const adjusted = { ...portions };
  
  if (size === 'small') {
    adjusted.wholeGrains = Math.max(0, adjusted.wholeGrains - 1);
    adjusted.water = 7;
  } else if (size === 'large') {
    adjusted.wholeGrains = adjusted.wholeGrains + 1;
    adjusted.water = 10;
  }
  
  return adjusted;
}

// Apply alcohol adjustment with specific rule:
// For 2 drinks: reduce Whole Grains by 1 and Fats by 1
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
    wholeGrains: adjusted.wholeGrains, 
    fats: adjusted.fats, 
    nutsSeeds: adjusted.nutsSeeds 
  });
  
  if (drinksToAdjustFor === 2) {
    if (adjusted.wholeGrains > 0) {
      adjusted.wholeGrains -= 1;
      console.log('Reduced Whole Grains by 1');
    }
    
    if (adjusted.fats > 0) {
      adjusted.fats -= 1;
      console.log('Reduced Fats by 1');
    }
    
    console.log('Nuts & Seeds remain unchanged');
  } else if (drinksToAdjustFor === 1) {
    if (adjusted.wholeGrains > 0) {
      adjusted.wholeGrains -= 1;
      console.log('Reduced Whole Grains by 1 (for 1 drink)');
    }
  }
  
  console.log('Final portions after alcohol adjustment:', { 
    wholeGrains: adjusted.wholeGrains, 
    fats: adjusted.fats, 
    nutsSeeds: adjusted.nutsSeeds 
  });
  
  if (alcoholServings > 2) {
    console.log(`Note: User selected ${alcoholServings} drinks, but only adjusted portions for 2 drinks (max)`);
  }
  
  return adjusted;
}

// Apply activity level adjustment (AFTER base portions are calculated)
// This is the adjustment layer that increases daily targets for active users
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
      
    case 'light':
      // Add 1 Whole Grain
      adjusted.wholeGrains += 1;
      console.log('Light: +1 Whole Grain');
      break;
      
    case 'moderate':
      // Add 1 Whole Grain
      adjusted.wholeGrains += 1;
      console.log('Moderate: +1 Whole Grain');
      break;
      
    case 'active':
      // Add 2 Whole Grains and 1 Protein
      adjusted.wholeGrains += 2;
      adjusted.protein += 1;
      console.log('Active: +2 Whole Grains, +1 Protein');
      break;
      
    case 'veryActive':
      // Add 3 Whole Grains and 1 Protein
      adjusted.wholeGrains += 3;
      adjusted.protein += 1;
      console.log('Very Active: +3 Whole Grains, +1 Protein');
      break;
  }
  
  // Goal-based protein priority check
  if (goal === 'build' && (activityLevel === 'active' || activityLevel === 'veryActive')) {
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
): PortionTargets {
  // Step 1: Determine size category
  const sizeCategory = classifySize(sex, weight);
  
  // Step 2: Get baseline portions for Medium size
  let portions = getBaselinePortions(sex, goal);
  
  // Step 3: Apply size adjustment (affects Whole Grains and Water)
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
  
  return portions;
}

// Check if weight loss guardrail should be shown
export function shouldShowWeightLossGuardrail(
  goal: Goal,
  activityLevel: ActivityLevel
): boolean {
  return goal === 'lose' && activityLevel !== 'sedentary';
}

// Get the weight loss guardrail message
export function getWeightLossGuardrailMessage(): string {
  return "Fuel matters when you're active.\nOn training days, it's okay to use your extra Whole Grain portions.";
}
