import { Router } from 'express';
import { asyncRoute } from './helpers';
import * as auth from '../controllers/auth.controller';
import * as children from '../controllers/children.controller';
import * as challenges from '../controllers/challenges.controller';
import * as ai from '../controllers/ai.controller';
import * as demo from '../controllers/demo.controller';
import * as coach from '../controllers/coach.controller';
import { attachUser, requireAuth } from '../middleware/auth';

export function buildRouter(): Router {
  const r = Router();

  r.get('/health', (_req, res) => res.json({ ok: true, service: 'kivo-backend', time: new Date().toISOString() }));

  // auth (public)
  r.post('/auth/signup', asyncRoute(auth.signup));
  r.post('/auth/signup-parent', asyncRoute(auth.signupParent));
  r.post('/auth/login', asyncRoute(auth.login));
  r.post('/auth/demo', asyncRoute(auth.demo));

  // catalogue (public)
  r.get('/challenges', asyncRoute(challenges.listChallenges));
  r.get('/challenges/:id', asyncRoute(challenges.getChallenge));

  // everything below accepts optional auth context
  r.use(attachUser);

  r.post('/challenges/:id/complete', asyncRoute(challenges.complete));
  r.post('/scores/calculate', asyncRoute(challenges.preview));

  r.get('/children', requireAuth, asyncRoute(children.listChildren));
  r.post('/children', asyncRoute(children.createChild));
  r.get('/children/:id', asyncRoute(children.getChild));
  r.put('/children/:id', asyncRoute(children.updateChild));
  r.get('/children/:id/progress', asyncRoute(children.getProgress));
  r.put('/children/:id/progress', asyncRoute(children.setProgress));
  r.get('/children/:id/history', asyncRoute(children.getHistory));
  r.get('/children/:id/achievements', asyncRoute(children.getAchievements));

  r.post('/ai/coach', asyncRoute(ai.coach));
  r.post('/ai/workout', asyncRoute(ai.workout));

  // coach ecosystem (permission-checked inside controllers)
  r.get('/coach/athletes', asyncRoute(coach.getAthletes));
  r.post('/coach/grant', asyncRoute(coach.grantAccess));
  r.post('/coach/assign', asyncRoute(coach.assign));

  r.post('/demo/reset', asyncRoute(demo.resetDemo));

  return r;
}
