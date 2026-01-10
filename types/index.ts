
export type Sex = 'male' | 'female' | 'prefer-not-to-say';
export type Goal = 'lose' | 'maintain' | 'build';
export type SizeCategory = 'small' | 'medium' | 'large';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';

export interface UserProfile {
  sex: Sex;
  currentWeight: number;
  goalWeight?: number;
  goal: Goal;
  includeAlcohol?: boolean;
  alcoholServings?: number;
  activityLevel?: ActivityLevel;
  portionTargets: PortionTargets;
}

export interface PortionTargets {
  wholeGrains: number;
  protein: number;
  veggies: number;
  fruits: number;
  water: number;
  nutsSeeds: number;
  fats: number;
  exercise: number;
  alcohol: number;
}

// Daily portions - simplified (no S/M/L serving sizes)
export interface DailyPortions {
  date: string; // YYYY-MM-DD format
  portions: PortionTargets;
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
  { key: 'fruits', label: 'Fruit', icon: '🍎' },
  { key: 'wholeGrains', label: 'Whole Grains', icon: '🌾' },
  { key: 'nutsSeeds', label: 'Nuts & Seeds', icon: '🥜' },
  { key: 'fats', label: 'Fats', icon: '🥑' },
  { key: 'water', label: 'Water', icon: '💧' },
  { key: 'exercise', label: 'Exercise', icon: '💪' },
  { key: 'alcohol', label: 'Alcohol', icon: '🍷' },
];

// Activity levels with full details for display
export const ACTIVITY_LEVELS: Array<{ value: ActivityLevel; label: string; description: string }> = [
  {
    value: 'sedentary',
    label: 'Sedentary',
    description: 'Little to no exercise',
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Light workouts 1-3x/week or ~6k-9k steps/day',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Workouts 3-5x/week or ~9k-12k steps/day',
  },
  {
    value: 'active',
    label: 'Active',
    description: 'Hard training most days or ~12k-15k+ steps/day',
  },
  {
    value: 'veryActive',
    label: 'Very Active',
    description: 'Very high daily activity or double sessions',
  },
];
