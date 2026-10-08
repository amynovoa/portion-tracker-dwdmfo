import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getTodayString } from '@/utils/dateUtils';
import { DEFAULT_STEP_GOAL, loadStepGoal, loadStepsConnected } from '@/utils/stepsStorage';
import { getStepsAvailability, readTodayStepCount } from '@/utils/stepsHealth';

export type StepsReadStatus = 'idle' | 'ok' | 'unavailable' | 'read_failed';

export type StepsTodayState = {
  connected: boolean;
  goal: number;
  steps: number | null;
  status: StepsReadStatus;
  calendarDay: string;
  refresh: () => Promise<void>;
};

/**
 * Loads today’s steps when connected. Refreshes on screen focus, app foreground,
 * and when the local calendar day rolls over (midnight).
 */
export function useStepsToday(options?: { enabled?: boolean }): StepsTodayState {
  const enabled = options?.enabled !== false;
  const [connected, setConnected] = useState(false);
  const [goal, setGoal] = useState(DEFAULT_STEP_GOAL);
  const [steps, setSteps] = useState<number | null>(null);
  const [status, setStatus] = useState<StepsReadStatus>('idle');
  const [calendarDay, setCalendarDay] = useState(getTodayString());
  const activeRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    const day = getTodayString();
    setCalendarDay(day);

    const isConnected = await loadStepsConnected();
    const stepGoal = await loadStepGoal();
    if (!activeRef.current) return;

    setConnected(isConnected);
    setGoal(stepGoal);

    if (!isConnected) {
      setSteps(null);
      setStatus('idle');
      return;
    }

    if (getStepsAvailability() !== 'ready') {
      setSteps(null);
      setStatus('unavailable');
      return;
    }

    const count = await readTodayStepCount();
    if (!activeRef.current) return;

    if (count === null) {
      setSteps(null);
      setStatus('read_failed');
      return;
    }

    setSteps(count);
    setStatus('ok');
  }, [enabled]);

  useFocusEffect(
    useCallback(() => {
      activeRef.current = true;
      if (enabled) {
        refresh();
      }
      return () => {
        activeRef.current = false;
      };
    }, [enabled, refresh])
  );

  useEffect(() => {
    if (!enabled) return;

    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        refresh();
      }
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [enabled, refresh]);

  // Midnight / day rollover while the screen stays mounted
  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(() => {
      const day = getTodayString();
      if (day !== calendarDay) {
        console.log('[steps] Calendar day changed — refreshing');
        refresh();
      }
    }, 60_000);

    return () => clearInterval(id);
  }, [enabled, calendarDay, refresh]);

  return { connected, goal, steps, status, calendarDay, refresh };
}
