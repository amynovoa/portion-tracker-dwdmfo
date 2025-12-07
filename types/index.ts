
export type Sex = 'male' | 'female' | 'prefer-not-to-say';
export type Goal = 'lose' | 'maintain' | 'build';
export type SizeCategory = 'small' | 'medium' | 'large';
export type ServingSize = 'S' | 'M' | 'L';

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

// New: Individual serving entry with size
export interface ServingEntry {
  size: ServingSize;
  portionUnits: number; // Calculated based on user's sex/weight
  timestamp: number;
}

// New: Daily portions with serving entries
export interface DailyPortionsWithServings {
  date: string; // YYYY-MM-DD format
  servings: {
    protein: ServingEntry[];
    veggies: ServingEntry[];
    fruit: ServingEntry[];
    wholeGrains: ServingEntry[];
    legumes: ServingEntry[];
    nutsSeeds: ServingEntry[];
    fats: ServingEntry[];
    dairy: ServingEntry[];
    water: number; // Water is still just a count (not S/M/L)
    alcohol: ServingEntry[];
  };
}

// Legacy format for backward compatibility
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
