import type { Request, Response } from 'express';
import * as auth from '../services/auth.service';

export async function signup(req: Request, res: Response) {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password) {
    res.status(400).json({ error: { message: 'name, email and password are required', code: 400 } });
    return;
  }
  if (!['parent', 'child', 'coach'].includes(role || 'parent')) {
    res.status(400).json({ error: { message: 'invalid role', code: 400 } });
    return;
  }
  const out = await auth.signup(String(name), String(email), String(password), (role || 'parent') as any);
  res.status(201).json(out);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: { message: 'email and password are required', code: 400 } });
    return;
  }
  const out = await auth.login(String(email), String(password));
  res.json(out);
}

export async function demo(_req: Request, res: Response) {
  const out = await auth.demoLogin();
  res.json(out);
}
