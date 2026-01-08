
export type Sex = 'male' | 'female' | 'prefer_not_to_say';
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
  activityLevel: ActivityLevel;
  dailyTargets: PortionTargets;
}

export interface PortionTargets {
  protein: number;
  veggies: number;
  fruit: number;
  wholeGrains: number;
  legumes: number;
  nutsSeeds: number;
  fats: number;
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
  { key: 'wholeGrains', label: 'Whole Grains', icon: '🌾' },
  { key: 'legumes', label: 'Legumes', icon: '🫘' },
  { key: 'nutsSeeds', label: 'Nuts & Seeds', icon: '🥜' },
  { key: 'fats', label: 'Fats', icon: '🥑' },
  { key: 'water', label: 'Water', icon: '💧' },
  { key: 'alcohol', label: 'Alcohol', icon: '🍷' },
];

// Activity levels as simple array of strings for easy mapping
export const ACTIVITY_LEVELS: ActivityLevel[] = [
  'sedentary',
  'lightlyActive',
  'moderatelyActive',
  'veryActive',
  'extremelyActive',
];

// Activity level details for display
export const ACTIVITY_LEVEL_INFO: Record<ActivityLevel, { label: string; description: string }> = {
  sedentary: {
    label: 'Sedentary',
    description: 'Little to no exercise',
  },
  lightlyActive: {
    label: 'Lightly Active',
    description: 'Light workouts 1-3x/week or ~6k-9k steps/day',
  },
  moderatelyActive: {
    label: 'Moderately Active',
    description: 'Workouts 3-5x/week or ~9k-12k steps/day',
  },
  veryActive: {
    label: 'Very Active',
    description: 'Hard training most days or ~12k-15k+ steps/day',
  },
  extremelyActive: {
    label: 'Extremely Active',
    description: 'Very high daily activity or double sessions',
  },
};
