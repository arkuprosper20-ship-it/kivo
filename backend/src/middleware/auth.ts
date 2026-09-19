import type { NextFunction, Request, Response } from 'express';
import { userIdForToken } from '../services/auth.service';
import { getStore } from '../services/store/getStore';

export interface AuthedRequest extends Request {
  userId?: string;
}

/** Optional auth: attaches userId when a valid Bearer token is present. */
export async function attachUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
    const userId = userIdForToken(token);
    if (userId) {
      const user = await getStore().getUserById(userId);
      if (user) req.userId = userId;
    }
    next();
  } catch {
    next();
  }
}

/** Requires a valid Bearer token. */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    res.status(401).json({ error: { message: 'Authentication required', code: 401 } });
    return;
  }
  next();
}
