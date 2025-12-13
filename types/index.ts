
export type Sex = 'male' | 'female';
export type Goal = 'lose' | 'maintain' | 'build';
export type SizeCategory = 'small' | 'medium' | 'large';

export interface UserProfile {
  sex: Sex;
  currentWeight: number;
  goal: Goal;
  includeAlcohol: boolean;
  alcoholServings: number;
  sizeCategory: SizeCategory;
  targets: PortionTargets;
}

export interface PortionTargets {
  protein: number;
  veggies: number;
  fruit: number;
  healthyCarbs: number;
  fats: number;
  nuts: number;
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
  { key: 'alcohol', label: 'Alcohol', icon: '🍷' },
];
