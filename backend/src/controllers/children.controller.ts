import type { Request, Response } from 'express';
import { getChildDetail } from '../services/challenge.service';
import { badgeProgress } from '../services/gamification.service';
import { kivoScore, levelFromXp } from '../services/scoring';
import { getStore } from '../services/store/getStore';
import { ageFromDob } from '../utils/age';

const clamp100 = (v: unknown) => Math.min(100, Math.max(0, Math.round(Number(v) || 0)));

export async function listChildren(req: Request, res: Response) {
  const store = getStore();
  const parentId = String(req.query.parentId || (req as any).userId || '');
  if (!parentId) { res.status(400).json({ error: { message: 'parentId is required', code: 400 } }); return; }
  res.json({ children: await store.listChildrenByParent(parentId) });
}

export async function createChild(req: Request, res: Response) {
  const store = getStore();
  const { parentId, name, age, dob, height, fitnessLevel, favoriteActivities, goals, avatarColor, kind, ownerUserId } = req.body || {};
  if (!parentId || !name) {
    res.status(400).json({ error: { message: 'parentId and name are required', code: 400 } });
    return;
  }
  const resolvedAge = dob ? ageFromDob(String(dob), Number(age) || 10) : Math.min(99, Math.max(5, Number(age) || 10));
  const profileKind = kind === 'individual' ? 'individual' : 'child';
  if (profileKind === 'child' && (resolvedAge < 5 || resolvedAge > 15)) {
    res.status(400).json({ error: { message: 'Child profiles are for ages 5–15 (date of birth drives this)', code: 400 } });
    return;
  }
  const child = await store.createChild({
    parentId: String(parentId),
    ownerUserId: ownerUserId ? String(ownerUserId) : undefined,
    kind: profileKind,
    name: String(name).slice(0, 40),
    age: resolvedAge,
    dob: dob ? String(dob).slice(0, 10) : undefined,
    height: Number(height) || 120,
    fitnessLevel: String(fitnessLevel || 'Beginner').slice(0, 24),
    favoriteActivities: Array.isArray(favoriteActivities) ? favoriteActivities.map(String).slice(0, 5) : [],
    goals: Array.isArray(goals) ? goals.map(String).slice(0, 6) : [],
    avatarColor: String(avatarColor || '#2563EB'),
  });
  res.status(201).json({ child });
}

export async function getChild(req: Request, res: Response) {
  res.json(await getChildDetail(req.params.id));
}

export async function updateChild(req: Request, res: Response) {
  const store = getStore();
  const patch: any = {};
  const b = req.body || {};
  if (b.name) patch.name = String(b.name).slice(0, 40);
  if (b.age) patch.age = Math.min(99, Math.max(5, Number(b.age)));
  if (b.height) patch.height = Number(b.height);
  if (b.fitnessLevel) patch.fitnessLevel = String(b.fitnessLevel).slice(0, 24);
  if (Array.isArray(b.favoriteActivities)) patch.favoriteActivities = b.favoriteActivities.map(String).slice(0, 5);
  if (Array.isArray(b.goals)) patch.goals = b.goals.map(String).slice(0, 6);
  const child = await store.updateChild(req.params.id, patch);
  if (!child) { res.status(404).json({ error: { message: 'Child not found', code: 404 } }); return; }
  res.json({ child });
}

export async function getProgress(req: Request, res: Response) {
  const store = getStore();
  const id = req.params.id;
  const detail = await getChildDetail(id);
  const attempts = await store.listAttempts(id);
  const weekAgo = Date.now() - 7 * 86400000;
  const week = attempts.filter((a) => new Date(a.createdAt).getTime() >= weekAgo);
  res.json({
    scores: detail.progress,
    baseline: detail.baseline,
    changes: detail.changes,
    kivoScore: detail.kivoScore,
    streak: detail.streak,
    xpTotal: detail.xpTotal,
    level: detail.level,
    weeklyActivityMin: week.length * 8,
    challengesCompleted: week.length,
    personalRecords: attempts.filter((a) => a.isPersonalBest).length,
    history7d: week,
  });
}

export async function setProgress(req: Request, res: Response) {
  const store = getStore();
  const b = req.body || {};
  const scores = {
    stronger: clamp100(b.stronger), fitter: clamp100(b.fitter),
    faster: clamp100(b.faster), champs: clamp100(b.champs),
  };
  res.json({ scores: await store.setProgress(req.params.id, scores) });
}

export async function getHistory(req: Request, res: Response) {
  const store = getStore();
  const category = String(req.query.category || '').toUpperCase();
  let attempts = await store.listAttempts(req.params.id);
  if (category) {
    const challenges = await store.listChallenges();
    const ids = new Set(challenges.filter((c) => c.category === category).map((c) => c.id));
    attempts = attempts.filter((a) => ids.has(a.challengeId));
  }
  res.json({ attempts: attempts.slice().reverse() });
}

export async function getAchievements(req: Request, res: Response) {
  const detail = await getChildDetail(req.params.id);
  const store = getStore();
  const attempts = await store.listAttempts(req.params.id);
  res.json({
    badges: detail.badges,
    badgeProgress: await badgeProgress(store, req.params.id),
    xpTotal: detail.xpTotal,
    level: detail.level,
    levelProgress: detail.levelProgress,
    streak: detail.streak,
    personalBests: detail.personalBests,
    personalRecords: attempts.filter((a) => a.isPersonalBest).length,
    totalChallenges: attempts.length,
  });
}

export { kivoScore, levelFromXp };
