import type { Attempt } from '../../types';
import type { CoachInput } from './types';

function recentSummary(attempts: Attempt[]): string {
  return attempts.slice(-6).map((a) => {
    const raw = a.raw as Record<string, number>;
    const metric =
      a.challengeId === 'rope-rush' ? `${raw.jumps} jumps` :
      a.challengeId === 'reaction-rush' ? `${((raw.avgMs || 0) / 1000).toFixed(2)}s avg` :
      `${raw.seconds}s`;
    return `- ${a.challengeId} score ${a.score} (${metric}, acc ${raw.accuracy ?? 'n/a'}%)`;
  }).join('\n');
}

/** Builds the LLM prompt. Coaching language only — never medical. */
export function buildCoachPrompt(input: CoachInput): string {
  const { child, scores, attempts, streakDays, level, lastResult } = input;
  return [
    'You are KIVO Coach, an encouraging youth athletics coach for kids aged 5-16.',
    'STRICT RULES:',
    '- Use coaching language about activity and practice. NEVER diagnose, assess health, or make medical claims.',
    '- Say things like "your activity score suggests focusing more on endurance".',
    '- Keep every text field under 280 characters. Be warm, specific, and fun.',
    '- Respond with ONLY valid JSON matching this schema:',
    '{"encouragement":string,"strongestArea":"stronger|fitter|faster|champs","weakestArea":"stronger|fitter|faster|champs","recommendation":string,"nextChallenge":"rope-rush|reaction-rush|agility-command","difficulty":string,"workout":[{"label":string,"minutes":number,"detail":string}]}',
    '',
    `Child: ${child.name}, age ${child.age}, height ${child.height}cm, level ${child.fitnessLevel}.`,
    `Outcome scores: STRONGER ${scores.stronger}, FITTER ${scores.fitter}, FASTER ${scores.faster}, CHAMPS ${scores.champs}.`,
    `Streak: ${streakDays} days. Level: ${level}.`,
    lastResult ? `Latest result: ${lastResult.challengeId} score ${lastResult.score}, improvement ${lastResult.improvement}%, personal best: ${lastResult.isPersonalBest}.` : 'No session completed yet today.',
    'Recent history:',
    recentSummary(attempts) || '- none yet',
  ].join('\n');
}

export function buildWorkoutPrompt(input: CoachInput, minutes: number): string {
  return [
    'You are KIVO Coach planning a short kids workout session.',
    'RULES: activity coaching only, no medical claims. JSON ONLY:',
    '{"workout":[{"label":string,"minutes":number,"detail":string}]}',
    `Child ${input.child.name} age ${input.child.age}. Scores: STRONGER ${input.scores.stronger}, FITTER ${input.scores.fitter}, FASTER ${input.scores.faster}, CHAMPS ${input.scores.champs}.`,
    `Total session length: ${minutes} minutes. Emphasize the weakest outcome with more minutes.`,
  ].join('\n');
}
