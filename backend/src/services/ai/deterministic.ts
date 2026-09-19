import type { CoachResponse, WorkoutBlock } from '../../types';
import { intensityFor } from '../../utils/age';
import { OUTCOME_LABEL, ageOf, isAdultProfile, strongestAndWeakest, type CoachInput } from './types';

const CHALLENGE_FOR: Record<string, 'rope-rush' | 'reaction-rush' | 'agility-command' | 'power-pulse' | 'endurance-quest' | 'balance-master'> = {
  stronger: 'power-pulse',
  fitter: 'endurance-quest',
  faster: 'reaction-rush',
  champs: 'balance-master',
};

const AREA_TIP: Record<string, string> = {
  stronger: 'power and body-control practice',
  fitter: 'endurance and stamina practice',
  faster: 'speed and reaction practice',
  champs: 'goal-focused challenge practice',
};

/** Realistic deterministic coach — full demo works with zero API keys. Age-adaptive. */
export function deterministicCoach(input: CoachInput, lastImprovement = 0): CoachResponse {
  const { child, scores, attempts, streakDays } = input;
  const age = ageOf(child);
  const adult = isAdultProfile(child);
  const { strongest, weakest } = strongestAndWeakest(scores);
  const goals = (child.goals || []).filter(Boolean);
  const last = attempts[attempts.length - 1];
  const weekCount = attempts.filter((a) => Date.now() - new Date(a.createdAt).getTime() < 7 * 86400000).length;

  const encouragement = adult
    ? `Solid work, ${child.name}. Your ${OUTCOME_LABEL[strongest]} is at ${scores[strongest]}/100${last ? `, and your last session scored ${last.score}/100` : ''}.${lastImprovement > 0 ? ` That's a ${lastImprovement}% lift on your own baseline.` : ''}`
    : `Great work, ${child.name}! ${OUTCOME_LABEL[strongest]} is your superpower right now (${scores[strongest]}/100).` +
      (last ? ` Your last try scored ${last.score}/100.` : ' Every champion starts with a first rep.') +
      (lastImprovement > 0 ? ` You improved ${lastImprovement}% on your own best — that is what progress looks like.` : '');

  const recommendation = adult
    ? `Your activity data points to ${AREA_TIP[weakest]} as the highest-leverage focus. Two focused sessions this week will move ${OUTCOME_LABEL[weakest]} fastest while holding your strengths.`
    : `Your activity score suggests you could focus more on ${AREA_TIP[weakest]}. ` +
      `Two short, fun sessions this week will move your ${OUTCOME_LABEL[weakest]} score fastest.`;

  const reason =
    `WHY THIS PLAN? Your ${OUTCOME_LABEL[strongest]} score is ${scores[strongest]} (highest), ` +
    `while ${OUTCOME_LABEL[weakest]} is ${scores[weakest]} (lowest) — a ${scores[strongest] - scores[weakest]}-point gap. ` +
    `Recent activity: ${weekCount} challenge${weekCount === 1 ? '' : 's'} this week, ${streakDays}-day streak. ` +
    (goals.length ? `Your goal${goals.length > 1 ? 's' : ''} (${goals.join(', ')}) align with prioritizing ${OUTCOME_LABEL[weakest]}. ` : '') +
    `KIVO recommends building ${OUTCOME_LABEL[weakest]} while maintaining ${OUTCOME_LABEL[strongest]} progression.`;

  const workout = deterministicWorkout(input, 10);
  return {
    encouragement,
    strongestArea: strongest,
    weakestArea: weakest,
    recommendation,
    nextChallenge: CHALLENGE_FOR[weakest],
    difficulty: scores[weakest] < 55 ? 'Level 2 — steady and consistent' : scores[weakest] < 75 ? 'Level 3 — push the pace' : 'Level 4 — chase a personal best',
    workout,
    reason,
    source: 'deterministic',
  };
}

const FOCUS_FOR: Record<string, { label: string; detail: string }> = {
  stronger: { label: 'Power Pulse', detail: 'Power Pulse rounds with full recovery between sets' },
  fitter: { label: 'Endurance Quest', detail: 'Endurance Quest rhythm rounds with short recovery' },
  faster: { label: 'Reaction Rush', detail: 'Reaction Rush full round, then one faster retry round' },
  champs: { label: 'Balance Master', detail: 'Balance Master ladder: easy holds, then target-time holds' },
};

export function deterministicWorkout(input: CoachInput, minutes: number): WorkoutBlock[] {
  const age = ageOf(input.child);
  const adult = isAdultProfile(input.child);
  const { weakest } = strongestAndWeakest(input.scores);
  const focus = FOCUS_FOR[weakest];
  const scaled = Math.max(6, Math.min(20, Math.round(minutes * intensityFor(age))));
  const warm = 2, cool = 2;
  const focusMin = Math.max(2, scaled - 6);
  const play = Math.max(1, scaled - warm - cool - focusMin);
  const coolDetail = adult
    ? 'Easy movement and steady breathing to close the session'
    : 'Slow breathing and gentle stretches. Champions recover well';
  return [
    { label: 'Warm-up', minutes: warm, detail: adult ? 'Progressive warm-up: easy movement into faster strides' : 'Easy marching, arm circles and big smiles — get the engine warm' },
    { label: focus.label, minutes: focusMin, detail: focus.detail },
    { label: adult ? 'Complementary work' : 'Free play mix', minutes: play, detail: 'One quick round of a different challenge to keep all four outcomes growing' },
    { label: 'Cool-down', minutes: cool, detail: coolDetail },
  ];
}
