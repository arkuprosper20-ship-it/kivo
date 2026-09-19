import type { Attempt, Child, CoachResponse, OutcomeKey, OutcomeScores, WorkoutBlock } from '../../types';
import { ageFromDob } from '../../utils/age';

export interface CoachInput {
  child: Child;
  scores: OutcomeScores;
  attempts: Attempt[];
  streakDays: number;
  level: number;
  lastResult?: { challengeId: string; score: number; improvement: number; isPersonalBest: boolean };
}

export const OUTCOME_LABEL: Record<OutcomeKey, string> = {
  stronger: 'STRONGER', fitter: 'FITTER', faster: 'FASTER', champs: 'CHAMPS',
};

export function strongestAndWeakest(scores: OutcomeScores): { strongest: OutcomeKey; weakest: OutcomeKey } {
  const entries = Object.entries(scores) as Array<[OutcomeKey, number]>;
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  return { strongest: sorted[0][0], weakest: sorted[sorted.length - 1][0] };
}

export const ageOf = (child: Child): number => ageFromDob(child.dob, child.age);
export const isAdultProfile = (child: Child): boolean => ageOf(child) >= 16;
