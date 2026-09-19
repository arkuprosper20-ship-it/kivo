import type { Attempt } from '../../types';

export type DifficultyVerdict = 'up' | 'same' | 'down';

/**
 * Adaptive difficulty: excellent + improving -> up; weak or declining -> down;
 * otherwise hold steady. Never blindly increases every attempt.
 */
export function evaluateDifficulty(attempts: Attempt[], challengeId: string): DifficultyVerdict {
  const list = attempts.filter((a) => a.challengeId === challengeId).slice(-3);
  if (list.length === 0) return 'same';
  const avg = list.reduce((s, a) => s + a.score, 0) / list.length;
  const trend = list.length >= 2 ? list[list.length - 1].score - list[0].score : 0;
  if ((avg >= 85 && trend >= 0) || trend >= 12) return 'up';
  if (avg <= 50 || trend <= -12) return 'down';
  return 'same';
}

export const DIFFICULTY_LABEL: Record<DifficultyVerdict, string> = {
  up: 'Level up — increase difficulty',
  same: 'Hold steady — consolidate',
  down: 'Ease off — recover and rebuild',
};
