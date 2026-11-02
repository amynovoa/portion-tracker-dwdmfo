import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityLevel, Goal, PortionTargets, Sex, UserProfile } from '@/types';
import {
  calculateRecommendedTargets,
  classifySize,
  foodTargetsEqual,
  weightInPounds,
} from '@/utils/portionCalculator';
import { WeightUnit } from '@/utils/weightUnit';

const KG_CORRECTION_OFFERED_KEY = '@portion_tracker_kg_size_correction_offered';

export async function loadKgCorrectionOffered(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KG_CORRECTION_OFFERED_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function saveKgCorrectionOffered(offered = true): Promise<void> {
  try {
    await AsyncStorage.setItem(KG_CORRECTION_OFFERED_KEY, offered ? 'true' : 'false');
  } catch (error) {
    console.warn('[targetsRecalc] Failed to save kg correction flag:', error);
  }
}

export type RecalcTrigger =
  | 'goal'
  | 'activity'
  | 'size'
  | 'kg-correction'
  | 'alcohol'
  | null;

export type RecalcDecision = {
  shouldPrompt: boolean;
  trigger: RecalcTrigger;
  proposed: PortionTargets;
  current: PortionTargets | null;
};

/**
 * Decide whether to prompt Accept / Keep when profile inputs change
 * or when a one-time kg size-band correction is needed.
 */
export function evaluateTargetsRecalc(args: {
  existing: UserProfile | null;
  sex: Sex;
  weight: number;
  goal: Goal;
  activityLevel: ActivityLevel;
  alcoholServings: number;
  weightUnit: WeightUnit;
  kgCorrectionAlreadyOffered: boolean;
}): RecalcDecision {
  const {
    existing,
    sex,
    weight,
    goal,
    activityLevel,
    alcoholServings,
    weightUnit,
    kgCorrectionAlreadyOffered,
  } = args;

  const proposed = calculateRecommendedTargets(sex, weight, goal, activityLevel, {
    weightUnit,
    alcoholServings,
  });
  // Setup Targets always forces these after calculate
  proposed.exercise = 0;
  proposed.alcohol = alcoholServings;

  if (!existing?.portionTargets) {
    return { shouldPrompt: false, trigger: null, proposed, current: null };
  }

  const current = existing.portionTargets;
  if (foodTargetsEqual(proposed, current)) {
    return { shouldPrompt: false, trigger: null, proposed, current };
  }

  const prevPounds = weightInPounds(existing.currentWeight, weightUnit);
  const nextPounds = weightInPounds(weight, weightUnit);
  const prevSize = classifySize(existing.sex, prevPounds);
  const nextSize = classifySize(sex, nextPounds);

  if (existing.goal !== goal) {
    return { shouldPrompt: true, trigger: 'goal', proposed, current };
  }
  if ((existing.activityLevel || 'sedentary') !== activityLevel) {
    return { shouldPrompt: true, trigger: 'activity', proposed, current };
  }
  if (prevSize !== nextSize) {
    return { shouldPrompt: true, trigger: 'size', proposed, current };
  }

  const prevAlcohol = existing.alcoholServings ?? existing.portionTargets.alcohol ?? 0;
  if (prevAlcohol !== alcoholServings) {
    return { shouldPrompt: true, trigger: 'alcohol', proposed, current };
  }

  // One-time: kg users who were sized with raw kg (treated as lbs) get a correction offer
  if (weightUnit === 'kg' && !kgCorrectionAlreadyOffered) {
    const wrongSize = classifySize(sex, weight); // raw kg misread as lbs
    const rightSize = classifySize(sex, nextPounds);
    if (wrongSize !== rightSize) {
      return { shouldPrompt: true, trigger: 'kg-correction', proposed, current };
    }
  }

  return { shouldPrompt: false, trigger: null, proposed, current };
}

/** One-time kg sizing correction for an already-saved profile (Profile tab). */
export function evaluateKgCorrectionForProfile(
  profile: UserProfile,
  weightUnit: WeightUnit,
  kgCorrectionAlreadyOffered: boolean
): RecalcDecision {
  return evaluateTargetsRecalc({
    existing: profile,
    sex: profile.sex,
    weight: profile.currentWeight,
    goal: profile.goal,
    activityLevel: profile.activityLevel || 'sedentary',
    alcoholServings: profile.alcoholServings ?? profile.portionTargets?.alcohol ?? 0,
    weightUnit,
    kgCorrectionAlreadyOffered,
  });
}
