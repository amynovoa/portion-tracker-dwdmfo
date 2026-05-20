
import { TFunction } from 'i18next';
import { FoodGroup } from '../types';

interface FoodGroupInfo {
  benefit: string;
  avoid: string;
  examples: string;
  portionSize?: string;
}

export function getFoodGroupInfo(t: TFunction): Record<FoodGroup, FoodGroupInfo> {
  return {
    protein: {
      benefit: t('foodGroupInfo.protein.benefit'),
      avoid: t('foodGroupInfo.protein.avoid'),
      examples: t('foodGroupInfo.protein.examples'),
      portionSize: t('foodGroupInfo.protein.portionSize'),
    },
    veggies: {
      benefit: t('foodGroupInfo.veggies.benefit'),
      avoid: t('foodGroupInfo.veggies.avoid'),
      examples: t('foodGroupInfo.veggies.examples'),
      portionSize: t('foodGroupInfo.veggies.portionSize'),
    },
    fruits: {
      benefit: t('foodGroupInfo.fruits.benefit'),
      avoid: t('foodGroupInfo.fruits.avoid'),
      examples: t('foodGroupInfo.fruits.examples'),
      portionSize: t('foodGroupInfo.fruits.portionSize'),
    },
    wholeGrains: {
      benefit: t('foodGroupInfo.wholeGrains.benefit'),
      avoid: t('foodGroupInfo.wholeGrains.avoid'),
      examples: t('foodGroupInfo.wholeGrains.examples'),
      portionSize: t('foodGroupInfo.wholeGrains.portionSize'),
    },
    nutsSeeds: {
      benefit: t('foodGroupInfo.nutsSeeds.benefit'),
      avoid: t('foodGroupInfo.nutsSeeds.avoid'),
      examples: t('foodGroupInfo.nutsSeeds.examples'),
      portionSize: t('foodGroupInfo.nutsSeeds.portionSize'),
    },
    fats: {
      benefit: t('foodGroupInfo.fats.benefit'),
      avoid: t('foodGroupInfo.fats.avoid'),
      examples: t('foodGroupInfo.fats.examples'),
      portionSize: t('foodGroupInfo.fats.portionSize'),
    },
    water: {
      benefit: t('foodGroupInfo.water.benefit'),
      avoid: t('foodGroupInfo.water.avoid'),
      examples: t('foodGroupInfo.water.examples'),
      portionSize: t('foodGroupInfo.water.portionSize'),
    },
    exercise: {
      benefit: t('foodGroupInfo.exercise.benefit'),
      avoid: t('foodGroupInfo.exercise.avoid'),
      examples: t('foodGroupInfo.exercise.examples'),
      portionSize: t('foodGroupInfo.exercise.portionSize'),
    },
    alcohol: {
      benefit: t('foodGroupInfo.alcohol.benefit'),
      avoid: t('foodGroupInfo.alcohol.avoid'),
      examples: t('foodGroupInfo.alcohol.examples'),
      portionSize: t('foodGroupInfo.alcohol.portionSize'),
    },
  };
}

// Static export for backward compatibility
export const foodGroupInfo = getFoodGroupInfo((key: string) => key);
