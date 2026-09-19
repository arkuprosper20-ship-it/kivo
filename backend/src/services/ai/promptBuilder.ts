import type { Attempt } from '../../types';
import { ageOf, isAdultProfile, type CoachInput } from './types';

function recentSummary(attempts: Attempt[]): string {
  return attempts.slice(-6).map((a) => {
    const raw = a.raw as Record<string, number>;
    const metric =
      a.challengeId === 'rope-rush' ? `${raw.jumps} jumps` :
      a.challengeId === 'reaction-rush' ? `${((raw.avgMs || 0) / 1000).toFixed(2)}s avg` :
      a.challengeId === 'power-pulse' ? `${raw.reps} reps` :
      a.challengeId === 'endurance-quest' ? `${raw.steps} steps` :
      a.challengeId === 'balance-master' ? `${raw.avgErrorMs}ms err` :
      `${raw.seconds}s`;
    return `- ${a.challengeId} score ${a.score} (${metric}, acc ${raw.accuracy ?? 'n/a'}%)`;
  }).join('\n');
}

/** Builds the LLM prompt. Coaching language only — never medical. Age-adaptive tone. */
export function buildCoachPrompt(input: CoachInput): string {
  const { child, scores, attempts, streakDays, level, lastResult } = input;
  const age = ageOf(child);
  const adult = isAdultProfile(child);
  return [
    adult
      ? 'You are KIVO Coach, a performance-oriented athletics coach for an adult athlete.'
      : 'You are KIVO Coach, an encouraging youth athletics coach for kids aged 5-16.',
    'STRICT RULES:',
    '- Use coaching language about activity and practice. NEVER diagnose, assess health, or make medical claims.',
    adult
      ? '- Performance tone: metrics, progression, consistency, recovery. No childish language.'
      : '- Child-safe: fun, skills, confidence, consistency. No unsafe intensity, no weight/body-image talk.',
    '- Keep every text field under 280 characters.',
    '- "reason" must explain WHY this plan fits their data (cite 2-3 numbers).',
    '- Respond with ONLY valid JSON matching this schema:',
    '{"encouragement":string,"strongestArea":"stronger|fitter|faster|champs","weakestArea":"stronger|fitter|faster|champs","recommendation":string,"nextChallenge":"rope-rush|reaction-rush|agility-command|power-pulse|endurance-quest|balance-master","difficulty":string,"workout":[{"label":string,"minutes":number,"detail":string}],"reason":string}',
    '',
    `Athlete: ${child.name}, age ${age}, goals: ${(child.goals || []).join(', ') || 'overall development'}.`,
    `Outcome scores: STRONGER ${scores.stronger}, FITTER ${scores.fitter}, FASTER ${scores.faster}, CHAMPS ${scores.champs}.`,
    `Streak: ${streakDays} days. Level: ${level}.`,
    lastResult ? `Latest result: ${lastResult.challengeId} score ${lastResult.score}, improvement ${lastResult.improvement}%, personal best: ${lastResult.isPersonalBest}.` : 'No session completed yet today.',
    'Recent history:',
    recentSummary(attempts) || '- none yet',
  ].join('\n');
}

export function buildWorkoutPrompt(input: CoachInput, minutes: number): string {
  const adult = isAdultProfile(input.child);
  return [
    adult ? 'You are KIVO Coach planning an adult training session.' : 'You are KIVO Coach planning a short kids workout session.',
    'RULES: activity coaching only, no medical claims. JSON ONLY:',
    '{"workout":[{"label":string,"minutes":number,"detail":string}]}',
    `Athlete ${input.child.name} age ${ageOf(input.child)}, goals ${(input.child.goals || []).join(', ') || 'overall'}. Scores: STRONGER ${input.scores.stronger}, FITTER ${input.scores.fitter}, FASTER ${input.scores.faster}, CHAMPS ${input.scores.champs}.`,
    `Total session length: ${minutes} minutes. Emphasize the weakest outcome with more minutes.`,
  ].join('\n');
}
