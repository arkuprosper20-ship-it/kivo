import type { NextFunction, Request, Response } from 'express';

/** 404 + error serializer: { error: { message, code } }. Never leaks stacks. */
export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: { message: 'Not found', code: 404 } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = Number(err?.status) || 500;
  res.status(status).json({ error: { message: err?.message || 'Something went wrong', code: status } });
}
