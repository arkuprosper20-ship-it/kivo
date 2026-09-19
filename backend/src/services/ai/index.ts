import { useLlm } from '../../config';
import type { CoachResponse, WorkoutBlock } from '../../types';
import { deterministicCoach, deterministicWorkout } from './deterministic';
import { chatJson } from './llmProvider';
import { buildCoachPrompt, buildWorkoutPrompt } from './promptBuilder';
import type { CoachInput } from './types';
import { validateCoachJson, validateWorkoutJson } from './validation';

/** Child performance -> prompt -> LLM -> validated recommendation. Falls back deterministically. */
export async function getCoachAdvice(input: CoachInput): Promise<CoachResponse> {
  const fallback = () => deterministicCoach(input, input.lastResult?.improvement || 0);
  if (!useLlm) return fallback();
  try {
    const raw = await chatJson('You are KIVO Coach. Respond with ONLY valid JSON.', buildCoachPrompt(input));
    const parsed = validateCoachJson(raw);
    if (!parsed) return fallback();
    return { ...parsed, source: 'llm' };
  } catch {
    return fallback();
  }
}

export async function getWorkoutPlan(input: CoachInput, minutes: number): Promise<{ workout: WorkoutBlock[]; source: 'llm' | 'deterministic' }> {
  if (!useLlm) return { workout: deterministicWorkout(input, minutes), source: 'deterministic' };
  try {
    const raw = await chatJson('You are KIVO Coach. Respond with ONLY valid JSON.', buildWorkoutPrompt(input, minutes));
    const parsed = validateWorkoutJson(raw);
    if (!parsed) throw new Error('invalid workout json');
    return { workout: parsed, source: 'llm' };
  } catch {
    return { workout: deterministicWorkout(input, minutes), source: 'deterministic' };
  }
}
