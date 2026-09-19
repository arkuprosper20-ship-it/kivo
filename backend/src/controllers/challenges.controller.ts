import type { Request, Response } from 'express';
import { completeChallenge } from '../services/challenge.service';
import { calculateScore } from '../services/scoring';
import { getStore } from '../services/store/getStore';

export async function listChallenges(_req: Request, res: Response) {
  res.json({ challenges: await getStore().listChallenges() });
}

export async function getChallenge(req: Request, res: Response) {
  const c = await getStore().getChallenge(req.params.id);
  if (!c) { res.status(404).json({ error: { message: 'Challenge not found', code: 404 } }); return; }
  res.json({ challenge: c });
}

export async function complete(req: Request, res: Response) {
  const { childId, raw } = req.body || {};
  if (!childId || !raw || typeof raw !== 'object') {
    res.status(400).json({ error: { message: 'childId and raw performance are required', code: 400 } });
    return;
  }
  const result = await completeChallenge(String(childId), req.params.id, raw as Record<string, number>);
  res.status(201).json(result);
}

export async function preview(req: Request, res: Response) {
  const { challengeId, raw } = req.body || {};
  if (!challengeId || !raw) {
    res.status(400).json({ error: { message: 'challengeId and raw are required', code: 400 } });
    return;
  }
  res.json({ score: calculateScore(String(challengeId), raw as Record<string, number>) });
}
