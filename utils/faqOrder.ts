import type { Goal } from '@/types';

/** Default FAQ order (q1–q15). GLP-1 users see q14 + q15 first. */
export const DEFAULT_FAQ_KEYS = [
  'q1',
  'q2',
  'q3',
  'q4',
  'q5',
  'q6',
  'q7',
  'q8',
  'q9',
  'q10',
  'q11',
  'q12',
  'q13',
  'q14',
  'q15',
] as const;

export function getFaqKeysForGoal(goal?: Goal | null): readonly string[] {
  if (goal === 'glp-1') {
    return ['q14', 'q15', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q13'];
  }
  return DEFAULT_FAQ_KEYS;
}
