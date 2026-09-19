import type { Request, Response } from 'express';
import { getStore } from '../services/store/getStore';

export async function resetDemo(_req: Request, res: Response) {
  const store = getStore();
  if (store.kind !== 'memory') {
    res.status(400).json({ error: { message: 'Demo reset is only available with the in-memory store', code: 400 } });
    return;
  }
  await store.resetDemo();
  const child = await store.getChild('c_aarav');
  const progress = await store.getProgress('c_aarav');
  res.json({ ok: true, child, progress });
}
