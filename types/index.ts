
export type Sex = 'male' | 'female';
export type Goal = 'lose' | 'maintain' | 'build';
export type SizeCategory = 'small' | 'medium' | 'large';
export type ActivityLevel = 'sedentary' | 'lightlyActive' | 'moderatelyActive' | 'veryActive' | 'extremelyActive';

export interface UserProfile {
  sex: Sex;
  currentWeight: number;
  goalWeight: number;
  goal: Goal;
  includeAlcohol: boolean;
  alcoholServings: number;
  sizeCategory: SizeCategory;
  activityLevel: ActivityLevel;
  targets: PortionTargets;
}

export interface PortionTargets {
  protein: number;
  veggies: number;
  fruit: number;
  healthyCarbs: number;
  fats: number;
  nuts: number;
  water: number;
  alcohol: number;
}

// Daily portions - simplified (no S/M/L serving sizes)
export interface DailyPortions {
  date: string; // YYYY-MM-DD format
  portions: PortionTargets;
  exercise?: boolean; // Track if exercise was completed
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD format
  weight: number; // in pounds
  timestamp: number; // Unix timestamp
}

export type FoodGroup = keyof PortionTargets;

export const FOOD_GROUPS: { key: FoodGroup; label: string; icon: string }[] = [
  { key: 'protein', label: 'Protein', icon: '🍗' },
  { key: 'veggies', label: 'Vegetables', icon: '🥦' },
  { key: 'fruit', label: 'Fruit', icon: '🍎' },
  { key: 'healthyCarbs', label: 'Healthy Carbs', icon: '🌾' },
  { key: 'fats', label: 'Fats', icon: '🥑' },
  { key: 'nuts', label: 'Nuts', icon: '🥜' },
  { key: 'water', label: 'Water', icon: '💧' },
  { key: 'alcohol', label: 'Alcohol', icon: '🍷' },
];

export const ACTIVITY_LEVELS: { key: ActivityLevel; label: string; description: string }[] = [
  { 
    key: 'sedentary', 
    label: 'Sedentary', 
    description: 'Little to no exercise' 
  },
  { 
    key: 'lightlyActive', 
    label: 'Lightly Active', 
    description: 'Light workouts 1-3x/week or ~6k-9k steps/day' 
  },
  { 
    key: 'moderatelyActive', 
    label: 'Moderately Active', 
    description: 'Workouts 3-5x/week or ~9k-12k steps/day' 
  },
  { 
    key: 'veryActive', 
    label: 'Very Active', 
    description: 'Hard training most days or ~12k-15k+ steps/day' 
  },
  { 
    key: 'extremelyActive', 
    label: 'Extremely Active', 
    description: 'Very high daily activity or double sessions' 
  },
];
