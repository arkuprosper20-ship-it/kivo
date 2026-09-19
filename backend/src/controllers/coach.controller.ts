import type { Request, Response } from 'express';
import { getChildDetail } from '../services/challenge.service';
import { kivoScore, levelFromXp } from '../services/scoring';
import { getStore } from '../services/store/getStore';
import { ageFromDob } from '../utils/age';

export async function getAthletes(req: Request, res: Response) {
  const store = getStore();
  const coachId = String(req.query.coachId || '');
  if (!coachId) { res.status(400).json({ error: { message: 'coachId is required', code: 400 } }); return; }
  const coach = await store.getUserById(coachId);
  if (!coach || coach.role !== 'coach') {
    res.status(403).json({ error: { message: 'Coach access required', code: 403 } });
    return;
  }
  const ids = await store.listAthleteIds(coachId);
  const athletes = [];
  for (const id of ids) {
    try {
      const d = await getChildDetail(id);
      athletes.push({
        profile: d.child,
        age: ageFromDob(d.child.dob, d.child.age),
        kivoScore: d.kivoScore,
        progress: d.progress,
        level: d.level,
        xpTotal: d.xpTotal,
        streakDays: d.streak.currentDays,
        totalAttempts: d.recentAttempts.length,
        badges: d.badges.length,
      });
    } catch { /* skip missing */ }
  }
  const assignments = await store.listAssignments(coachId);
  res.json({ athletes, assignments });
}

export async function grantAccess(req: Request, res: Response) {
  const store = getStore();
  const { coachId, profileId } = req.body || {};
  if (!coachId || !profileId) {
    res.status(400).json({ error: { message: 'coachId and profileId are required', code: 400 } });
    return;
  }
  await store.grantCoachAccess(String(coachId), String(profileId));
  res.json({ ok: true });
}

export async function assign(req: Request, res: Response) {
  const store = getStore();
  const { coachId, profileId, challengeId, note } = req.body || {};
  if (!coachId || !profileId || !challengeId) {
    res.status(400).json({ error: { message: 'coachId, profileId and challengeId are required', code: 400 } });
    return;
  }
  const challenge = await store.getChallenge(String(challengeId));
  if (!challenge) { res.status(404).json({ error: { message: 'Challenge not found', code: 404 } }); return; }
  const a = await store.assignChallenge({
    coachId: String(coachId), profileId: String(profileId),
    challengeId: String(challengeId), note: String(note || '').slice(0, 200),
    createdAt: new Date().toISOString(),
  });
  res.status(201).json({ assignment: a });
}

export { kivoScore };
