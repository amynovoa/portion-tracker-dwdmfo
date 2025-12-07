
export type Sex = 'male' | 'female' | 'prefer-not-to-say';
export type Goal = 'lose' | 'maintain' | 'build';
export type SizeCategory = 'small' | 'medium' | 'large';

export interface UserProfile {
  sex: Sex;
  currentWeight: number;
  goalWeight: number;
  goal: Goal;
  targets: PortionTargets;
}

export interface PortionTargets {
  protein: number;
  veggies: number;
  fruit: number;
  wholeGrains: number;
  legumes: number;
  nutsSeeds: number;
  fats: number;
  dairy: number;
  water: number;
  alcohol: number;
}

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
  { key: 'veggies', label: 'Veggies', icon: '🥦' },
  { key: 'fruit', label: 'Fruit', icon: '🍎' },
  { key: 'wholeGrains', label: 'Whole Grains', icon: '🌾' },
  { key: 'legumes', label: 'Legumes', icon: '🫘' },
  { key: 'nutsSeeds', label: 'Nuts & Seeds', icon: '🥜' },
  { key: 'fats', label: 'Fats', icon: '🥑' },
  { key: 'dairy', label: 'Dairy', icon: '🥛' },
  { key: 'water', label: 'Water', icon: '💧' },
  { key: 'alcohol', label: 'Alcohol', icon: '🍷' },
];
