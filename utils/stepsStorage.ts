import AsyncStorage from '@react-native-async-storage/async-storage';

const CONNECTED_KEY = '@portion_tracker_steps_connected';
const GOAL_KEY = '@portion_tracker_steps_goal';

export const DEFAULT_STEP_GOAL = 8000;
export const MIN_STEP_GOAL = 1000;
export const MAX_STEP_GOAL = 30000;
export const STEP_GOAL_STEP = 500;

export async function loadStepsConnected(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(CONNECTED_KEY);
    return data === 'true';
  } catch (error) {
    console.error('[steps] Error loading connected flag:', error);
    return false;
  }
}

export async function saveStepsConnected(connected: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(CONNECTED_KEY, connected ? 'true' : 'false');
    console.log('[steps] Connected flag saved:', connected);
  } catch (error) {
    console.error('[steps] Error saving connected flag:', error);
  }
}

export async function loadStepGoal(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(GOAL_KEY);
    if (!data) return DEFAULT_STEP_GOAL;
    const parsed = parseInt(data, 10);
    if (!Number.isFinite(parsed)) return DEFAULT_STEP_GOAL;
    return Math.min(MAX_STEP_GOAL, Math.max(MIN_STEP_GOAL, parsed));
  } catch (error) {
    console.error('[steps] Error loading step goal:', error);
    return DEFAULT_STEP_GOAL;
  }
}

export async function saveStepGoal(goal: number): Promise<void> {
  try {
    const clamped = Math.min(MAX_STEP_GOAL, Math.max(MIN_STEP_GOAL, goal));
    await AsyncStorage.setItem(GOAL_KEY, String(clamped));
    console.log('[steps] Goal saved:', clamped);
  } catch (error) {
    console.error('[steps] Error saving step goal:', error);
  }
}
