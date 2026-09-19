import type { Request, Response } from 'express';
import * as auth from '../services/auth.service';
import type { DemoPersona } from '../services/auth.service';

export async function signup(req: Request, res: Response) {
  const { name, email, password, dob, role } = req.body || {};
  if (!name || !email || !password) {
    res.status(400).json({ error: { message: 'name, email and password are required', code: 400 } });
    return;
  }
  try {
    const out = await auth.signup({
      name: String(name), email: String(email), password: String(password),
      dob: dob ? String(dob) : undefined, role,
    });
    res.status(201).json(out);
  } catch (e: any) {
    if (e?.code === 'GUARDIAN_REQUIRED') {
      res.status(403).json({ error: { message: e.message, code: 'GUARDIAN_REQUIRED' } });
      return;
    }
    throw e;
  }
}

/** Parent/guardian account creation (always allowed, used by the under-16 flow). */
export async function signupParent(req: Request, res: Response) {
  const { name, email, password, dob } = req.body || {};
  if (!name || !email || !password) {
    res.status(400).json({ error: { message: 'name, email and password are required', code: 400 } });
    return;
  }
  const out = await auth.signupParent(String(name), String(email), String(password), dob ? String(dob) : undefined);
  res.status(201).json(out);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: { message: 'email and password are required', code: 400 } });
    return;
  }
  const out = await auth.login(String(email), String(password));
  // Attach default view role + active profile for the session
  const store = (await import('../services/store/getStore')).getStore();
  let child = null;
  let progress = null;
  let viewRole = out.user.role === 'coach' ? 'coach' : out.user.role === 'parent' ? 'parent' : 'individual';
  if (out.user.role !== 'coach') {
    const owned = await store.listChildrenByParent(out.user.id);
    const mine = owned.find((c) => c.ownerUserId === out.user.id) || owned[0];
    if (mine) {
      const d = (await import('../services/challenge.service')).getChildDetail(mine.id);
      const full = await d;
      child = full.child;
      progress = full.progress;
      viewRole = full.child.kind === 'child' ? (out.user.role === 'parent' ? 'parent' : 'child') : 'individual';
    }
  }
  res.json({ ...out, child, progress, viewRole });
}

const PERSONAS: DemoPersona[] = ['child', 'teen', 'adult', 'parent', 'coach'];

export async function demo(req: Request, res: Response) {
  const persona = (req.body?.persona || 'child') as DemoPersona;
  if (!PERSONAS.includes(persona)) {
    res.status(400).json({ error: { message: 'unknown demo persona', code: 400 } });
    return;
  }
  res.json(await auth.demoLogin(persona));
}
