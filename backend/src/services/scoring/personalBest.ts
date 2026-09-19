import type { Attempt } from '../../types';

/** True when score beats the child's own best for that challenge. */
export function isPersonalBest(attempts: Attempt[], challengeId: string, score: number): boolean {
  const best = attempts
    .filter((a) => a.challengeId === challengeId)
    .reduce((m, a) => Math.max(m, a.score), 0);
  return score > best;
}

export function bestAttempt(attempts: Attempt[], challengeId: string): Attempt | null {
  const list = attempts.filter((a) => a.challengeId === challengeId);
  if (!list.length) return null;
  return list.reduce((b, a) => (a.score > b.score ? a : b));
}
