import type { CoachResponse, WorkoutBlock } from '../../types';
import { OUTCOME_LABEL, strongestAndWeakest, type CoachInput } from './types';

const CHALLENGE_FOR: Record<string, 'rope-rush' | 'reaction-rush' | 'agility-command'> = {
  stronger: 'rope-rush',
  fitter: 'rope-rush',
  faster: 'reaction-rush',
  champs: 'agility-command',
};

const AREA_TIP: Record<string, string> = {
  stronger: 'body-control and power practice',
  fitter: 'endurance and stamina practice',
  faster: 'speed and reaction practice',
  champs: 'goal-focused challenge practice',
};

/** Realistic deterministic coach — full demo works with zero API keys. */
export function deterministicCoach(input: CoachInput, lastImprovement = 0): CoachResponse {
  const { child, scores, attempts, streakDays } = input;
  const { strongest, weakest } = strongestAndWeakest(scores);
  const last = attempts[attempts.length - 1];
  const lastLine = last
    ? ` Your last ${last.challengeId} scored ${last.score}/100.`
    : ' Every champion starts with a first rep.';
  const impLine = lastImprovement > 0 ? ` You improved ${lastImprovement}% on your own best — that is what progress looks like.` : '';

  const encouragement =
    `Great work, ${child.name}! ${OUTCOME_LABEL[strongest]} is your superpower right now (${scores[strongest]}/100).` +
    lastLine + impLine;

  const recommendation =
    `Your activity score suggests you could focus more on ${AREA_TIP[weakest]}. ` +
    `Two short sessions this week will move your ${OUTCOME_LABEL[weakest]} score fastest.`;

  const workout = deterministicWorkout(input, 10);
  return {
    encouragement,
    strongestArea: strongest,
    weakestArea: weakest,
    recommendation,
    nextChallenge: CHALLENGE_FOR[weakest],
    difficulty: scores[weakest] < 55 ? 'Level 2 — steady and consistent' : scores[weakest] < 75 ? 'Level 3 — push the pace' : 'Level 4 — chase a personal best',
    workout,
    source: 'deterministic',
  };
}

export function deterministicWorkout(input: CoachInput, minutes: number): WorkoutBlock[] {
  const { weakest } = strongestAndWeakest(input.scores);
  const focus = weakest === 'fitter'
    ? { label: 'Rope Rush', detail: '60-second Rope Rush x 2 with 30-second recovery between sets' }
    : weakest === 'faster'
      ? { label: 'Reaction Rush', detail: 'Reaction Rush full round, then one faster retry round' }
      : weakest === 'stronger'
        ? { label: 'Hang + Hold', detail: '3 x 20-second strong-hold practice with shake-outs between' }
        : { label: 'Agility Command', detail: 'Agility Command ladder: easy, medium, then full sequence' };
  const m = Math.max(6, Math.min(20, minutes));
  const warm = 2, cool = 2, focusMin = Math.max(2, m - 6), play = Math.max(1, m - warm - cool - focusMin);
  return [
    { label: 'Warm-up', minutes: warm, detail: 'Easy marching, arm circles and big smiles — get the engine warm' },
    { label: focus.label, minutes: focusMin, detail: focus.detail },
    { label: 'Free play mix', minutes: play, detail: 'One quick round of a different challenge to keep all four outcomes growing' },
    { label: 'Cool-down', minutes: cool, detail: 'Slow breathing and gentle stretches. Champions recover well' },
  ];
}
