import type { Request, Response } from 'express';
import { getCoachAdvice, getWorkoutPlan } from '../services/ai';
import { levelFromXp } from '../services/scoring';
import { getStore } from '../services/store/getStore';
import type { CoachInput } from '../services/ai/types';

async function buildInput(childId: string, lastResult?: CoachInput['lastResult']): Promise<CoachInput> {
  const store = getStore();
  const child = await store.getChild(childId);
  if (!child) throw Object.assign(new Error('Child not found'), { status: 404 });
  const [scores, attempts, streak, xp] = await Promise.all([
    store.getProgress(childId), store.listAttempts(childId), store.getStreak(childId), store.getXp(childId),
  ]);
  return { child, scores, attempts, streakDays: streak.currentDays, level: levelFromXp(xp), lastResult };
}

export async function coach(req: Request, res: Response) {
  const { childId, lastResult } = req.body || {};
  if (!childId) { res.status(400).json({ error: { message: 'childId is required', code: 400 } }); return; }
  const input = await buildInput(String(childId), lastResult);
  res.json(await getCoachAdvice(input));
}

export async function workout(req: Request, res: Response) {
  const { childId, minutes } = req.body || {};
  if (!childId) { res.status(400).json({ error: { message: 'childId is required', code: 400 } }); return; }
  const input = await buildInput(String(childId));
  res.json(await getWorkoutPlan(input, Math.max(6, Math.min(20, Number(minutes) || 10))));
}
