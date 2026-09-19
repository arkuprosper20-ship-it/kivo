import type { OutcomeScores } from '../../types';

const clamp100 = (v: number) => Math.min(100, Math.max(0, Math.round(v)));

/**
 * Unified KIVO outcome update. Completing a challenge nudges its primary
 * outcome most, related outcomes a little, and CHAMPS always grows
 * (challenges = measurable goals). Demo journey 62/58/71/40 -> ~69/73/81/61.
 */
export function updateOutcomes(
  prev: OutcomeScores,
  challengeId: string,
  score: number,
): OutcomeScores {
  const primary = Math.min(9, Math.max(4, Math.round(score / 11))); // ~7-8 for score ~85
  const next = { ...prev };
  const bump = (k: keyof OutcomeScores, v: number) => { next[k] = clamp100(next[k] + v); };

  if (challengeId === 'rope-rush') {
    bump('fitter', primary); bump('champs', 3); bump('stronger', 2); bump('faster', 2);
  } else if (challengeId === 'reaction-rush') {
    bump('faster', primary); bump('champs', 3); bump('fitter', 2); bump('stronger', 1);
  } else if (challengeId === 'agility-command') {
    bump('champs', primary); bump('faster', 2); bump('fitter', 2); bump('stronger', 1);
  } else if (challengeId === 'power-pulse') {
    bump('stronger', primary); bump('champs', 3); bump('fitter', 2); bump('faster', 1);
  } else if (challengeId === 'endurance-quest') {
    bump('fitter', primary); bump('champs', 3); bump('stronger', 2); bump('faster', 1);
  } else if (challengeId === 'balance-master') {
    bump('champs', primary); bump('stronger', 2); bump('fitter', 1); bump('faster', 1);
  } else {
    bump('champs', 2);
  }
  return next;
}

/** Average of the four outcomes — the headline KIVO score. */
export function kivoScore(s: OutcomeScores): number {
  return Math.round((s.stronger + s.fitter + s.faster + s.champs) / 4);
}
