import type { CoachResponse, OutcomeKey, WorkoutBlock } from '../../types';

const AREAS: OutcomeKey[] = ['stronger', 'fitter', 'faster', 'champs'];
const CHALLENGES = ['rope-rush', 'reaction-rush', 'agility-command'];
const BANNED = /(diagnos|disease|disorder|injury|medical condition|treatment|prescrib|syndrome|therapy)/i;

function cleanText(v: unknown, fallback: string, max = 280): string {
  if (typeof v !== 'string' || !v.trim()) return fallback;
  let t = v.trim().slice(0, max);
  if (BANNED.test(t)) return fallback;
  return t;
}

/** Parse + validate LLM JSON. Returns null when invalid so caller can fall back. */
export function validateCoachJson(raw: string): Omit<CoachResponse, 'source'> | null {
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    const o = JSON.parse(raw.slice(start, end + 1)) as any;
    if (!AREAS.includes(o.strongestArea) || !AREAS.includes(o.weakestArea)) return null;
    if (!CHALLENGES.includes(o.nextChallenge)) return null;
    const workout: WorkoutBlock[] = Array.isArray(o.workout)
      ? o.workout.slice(0, 6).map((w: any) => ({
          label: cleanText(w?.label, 'Practice', 60),
          minutes: Math.min(15, Math.max(1, Number(w?.minutes) || 2)),
          detail: cleanText(w?.detail, 'A fun focused round.', 200),
        }))
      : [];
    if (!workout.length) return null;
    return {
      encouragement: cleanText(o.encouragement, 'Great effort! Keep showing up and the scores will follow.'),
      strongestArea: o.strongestArea,
      weakestArea: o.weakestArea,
      recommendation: cleanText(o.recommendation, 'Your activity score suggests mixing one extra endurance round this week.'),
      nextChallenge: o.nextChallenge,
      difficulty: cleanText(o.difficulty, 'Level 2 — steady and consistent', 120),
      workout,
    };
  } catch {
    return null;
  }
}

export function validateWorkoutJson(raw: string): WorkoutBlock[] | null {
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    const o = JSON.parse(raw.slice(start, end + 1)) as any;
    if (!Array.isArray(o.workout) || !o.workout.length) return null;
    return o.workout.slice(0, 6).map((w: any) => ({
      label: cleanText(w?.label, 'Practice', 60),
      minutes: Math.min(15, Math.max(1, Number(w?.minutes) || 2)),
      detail: cleanText(w?.detail, 'A fun focused round.', 200),
    }));
  } catch {
    return null;
  }
}
